/**
 * Conversor de fronteira (Parte 4 do backend): app ↔ banco.
 *
 * O app guarda data em dd/mm, dinheiro em reais e o extrato como uma lista por
 * aluno; o banco guarda `date`, centavos e uma linha por lançamento. Este
 * arquivo traduz nos dois sentidos para as telas não mudarem. Quem usa é o
 * repositório do Supabase e a importação dos dados locais; o modo local nunca
 * passa por aqui.
 *
 * Tudo é função pura: o "hoje" entra por parâmetro, com o do app como padrão.
 * A tabela de regras é a da Parte 1 de docs/backend/PLANO-BACKEND.md, e o que
 * ela não cobria está nas decisões da Parte 4.
 */

import { formatarDdMm, hojeComoData, lerDdMm } from '../dominio/datas';
import { DIAS } from '../dominio/disponibilidade';
import type {
  Aluno,
  ConfigPacote,
  DiaDaSemana,
  Disponibilidade,
  Extratos,
  Lancamento,
  Pagamento,
  Perfil,
  Politicas,
  Proposta,
} from '../dominio/tipos';
import type { Database, Json, Tables, TablesInsert, TablesUpdate } from './banco';
import type { Persistido, PreferenciasDeAviso } from './repositorio';

export type TipoDeLancamento = Database['public']['Enums']['tipo_lancamento'];

export type LinhaDoProfessor = Tables<'professores'>;
export type LinhaDaPolitica = Tables<'politicas'>;
export type LinhaDaDisponibilidade = Tables<'disponibilidades'>;
export type LinhaDoAluno = Tables<'alunos'>;
export type LinhaDoLancamento = Tables<'lancamentos'>;
export type LinhaDaProposta = Tables<'propostas'>;

/** O que os seis `select` do `carregar()` devolvem. */
export interface Linhas {
  professor: LinhaDoProfessor;
  politicas: LinhaDaPolitica;
  disponibilidade: LinhaDaDisponibilidade;
  alunos: LinhaDoAluno[];
  lancamentos: LinhaDoLancamento[];
  propostas: LinhaDaProposta[];
}

// --- Datas --------------------------------------------------------------------

const ISO = /^(\d{4})-(\d{2})-(\d{2})/;
const UM_DIA = 24 * 60 * 60 * 1000;

const doisDigitos = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** Date local → `2026-10-30`, sem passar por UTC (que viraria o dia às 21h). */
function iso(d: Date): string {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

/** `2026-10-30` → Date local, à meia-noite. */
function deIso(valor: string): Date {
  const m = ISO.exec(valor);
  if (!m) throw new Error(`"${valor}" não é uma data do banco (aaaa-mm-dd).`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** `2026-10-30` → `30/10`. */
export function dataDoBanco(valor: string): string {
  return formatarDdMm(deIso(valor));
}

/**
 * `30/10` → `2026-10-30`. O ano é inferido por `lerDdMm` a partir de
 * `referencia`, como em todo o app (SCRUM-55). Vazio, ausente e `'sem prazo'`
 * são "sem data" e viram `null`; um texto que não é dd/mm lança, em vez de
 * gravar `null` em silêncio no lugar de uma data.
 */
export function dataParaBanco(
  ddmm: string | null | undefined,
  referencia: Date = hojeComoData(),
): string | null {
  if (!ddmm || ddmm === 'sem prazo') return null;
  const data = lerDdMm(ddmm, referencia);
  if (!data) throw new Error(`"${ddmm}" não é uma data dd/mm e não tem como ir para o banco.`);
  return iso(data);
}

/** Dias corridos de uma data do banco até `referencia`. Com o ano, sem inferir. */
function diasDesde(valor: string, referencia: Date): number {
  return Math.round((referencia.getTime() - deIso(valor).getTime()) / UM_DIA);
}

/**
 * As datas de um extrato, do mais novo para o mais antigo. O dd/mm não tem ano,
 * e inferir cada um a partir de hoje erra no histórico com mais de meio ano: um
 * lançamento de oito meses atrás cairia no ano que vem. Aqui o primeiro não
 * passa de hoje e cada um dos outros não passa do lançamento de cima, que é o
 * que a ordem do extrato garante.
 */
function datasDoExtrato(lancamentos: Lancamento[], referencia: Date): Date[] {
  const datas: Date[] = [];
  let teto = referencia;
  for (const l of lancamentos) {
    const data = lerDdMm(l.d, teto);
    if (!data) throw new Error(`"${l.d}" não é uma data dd/mm.`);
    if (data.getTime() > teto.getTime()) data.setFullYear(data.getFullYear() - 1);
    datas.push(data);
    teto = data;
  }
  return datas;
}

/**
 * `criado_em` de um lançamento que nasceu antes do banco: meio-dia da data,
 * menos a posição no extrato em segundos. O extrato do app vai do mais novo
 * para o mais antigo, e no banco a ordem é `criado_em desc` (Parte 2, decisão
 * 6): assim dois lançamentos do mesmo dia não trocam de lugar.
 */
function momentoDoLancamento(data: Date, posicao: number): string {
  const meioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12);
  return new Date(meioDia.getTime() - posicao * 1000).toISOString();
}

// --- Derivados ------------------------------------------------------------------

/** Chave do dia na ordem de `Date.getDay()`, que começa no domingo. */
const DIA_DO_GETDAY: DiaDaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const normalizar = (v: string): string =>
  v
    .toLowerCase()
    .normalize('NFD')
    .split('')
    .filter((c) => {
      const n = c.charCodeAt(0);
      return n < 0x0300 || n > 0x036f;
    })
    .join('');

/**
 * O `hoje` do aluno, que o banco não guarda. O dia fixo é texto livre
 * ("quarta", "terça e quinta", "sem horário fixo"): tem aula hoje quando uma
 * das palavras é o nome do dia de hoje ou a abreviação dele ("ter", "qui").
 */
export function temAulaHoje(dia: string, referencia: Date = hojeComoData()): boolean {
  const chave = DIA_DO_GETDAY[referencia.getDay()];
  const longo = DIAS.find((d) => d.chave === chave)?.longo ?? '';
  const palavras = normalizar(dia).split(/[^a-z]+/);
  return palavras.includes(normalizar(longo)) || palavras.includes(chave);
}

// --- Título → tipo --------------------------------------------------------------

/**
 * Título → tipo, para lançamento que nasceu antes do banco: a semente e o que
 * a importação traz do aparelho (Parte 1, decisão 1). Lançamento novo tira o
 * tipo da `Mudanca`, não daqui.
 */
const TIPO_POR_TITULO: Record<string, TipoDeLancamento> = {
  'Aula realizada': 'aula',
  'Falta avisada': 'falta_avisada',
  'Falta sem aviso': 'falta_sem_aviso',
  'Aula cancelada por você': 'cancelada_professor',
  'Reposição marcada': 'reposicao',
  'Reposição realizada': 'reposicao',
  'Pagamento recebido': 'pagamento',
  'Validade estendida': 'validade',
  'Proposta de reposição enviada': 'proposta',
};

export function tipoPorTitulo(titulo: string): TipoDeLancamento {
  if (/^Pacote de \d+ aulas$/.test(titulo)) return 'pacote';
  return TIPO_POR_TITULO[titulo] ?? 'legado';
}

// --- Banco → app ------------------------------------------------------------------

/**
 * O que o app escreve ausente quando é falso, zero ou nulo, o banco guarda com
 * o padrão da coluna. Na volta, o padrão vira ausência outra vez: é a forma
 * que a semente e as ações da store já usam.
 */
function pagamentoDoBanco(l: LinhaDoAluno, referencia: Date): Pagamento {
  const pagamento: Pagamento = { status: l.pagamento_status };
  if (l.pagamento_em) pagamento.em = dataDoBanco(l.pagamento_em);
  if (l.pagamento_meio) pagamento.meio = l.pagamento_meio;
  if (l.pagamento_vencimento) {
    // Uma coluna só no banco; no app, `venceu` é do atraso e `vence` do resto.
    if (l.pagamento_status === 'atraso') {
      pagamento.venceu = dataDoBanco(l.pagamento_vencimento);
      pagamento.dias = diasDesde(l.pagamento_vencimento, referencia);
    } else {
      pagamento.vence = dataDoBanco(l.pagamento_vencimento);
    }
  }
  return pagamento;
}

export function propostaDoBanco(p: LinhaDaProposta): Proposta {
  return {
    janela: p.janela as unknown as Proposta['janela'],
    enviadaEm: dataDoBanco(p.enviada_em),
    status: p.status,
    alternativas: p.alternativas as unknown as Proposta['alternativas'],
  };
}

export function alunoDoBanco(
  l: LinhaDoAluno,
  proposta: LinhaDaProposta | undefined,
  referencia: Date = hojeComoData(),
): Aluno {
  return {
    id: l.id,
    name: l.nome,
    disciplina: l.disciplina,
    dia: l.dia,
    hora: l.hora,
    hoje: temAulaHoje(l.dia, referencia),
    total: l.total,
    usadas: l.usadas,
    // Sem data no banco: sem pacote é o `''` de `criarAluno`; com pacote, é o
    // pacote sem validade (Parte 2, decisão 3).
    validade: l.validade ? dataDoBanco(l.validade) : l.sem_pacote ? '' : 'sem prazo',
    reposicoes: l.reposicoes,
    pagamento: pagamentoDoBanco(l, referencia),
    criadoEm: formatarDdMm(new Date(l.criado_em)),
    ...(l.telefone !== null ? { telefone: l.telefone } : {}),
    ...(l.email !== null ? { email: l.email } : {}),
    ...(l.validade_estendida ? { validadeEstendida: true } : {}),
    ...(l.sem_pacote ? { semPacote: true } : {}),
    ...(l.encerrado ? { encerrado: dataDoBanco(l.encerrado) } : {}),
    // centavos no banco, reais no app
    ...(l.valor_por_aula_centavos !== null ? { valorPorAula: l.valor_por_aula_centavos / 100 } : {}),
    ...(l.pendencia_origem
      ? {
          pendencia: {
            origem: dataDoBanco(l.pendencia_origem),
            dias: diasDesde(l.pendencia_origem, referencia),
          },
        }
      : {}),
    ...(l.agendada !== null ? { agendada: l.agendada as unknown as Aluno['agendada'] } : {}),
    ...(l.disponibilidade !== null
      ? { disponibilidade: l.disponibilidade as unknown as Aluno['disponibilidade'] }
      : {}),
    ...(l.pausado ? { pausado: true } : {}),
    ...(l.lembretes > 0 ? { lembretes: l.lembretes } : {}),
    ...(l.ultimo_lembrete ? { ultimoLembrete: dataDoBanco(l.ultimo_lembrete) } : {}),
    ...(l.atrasos_historicos > 0 ? { atrasosHistoricos: l.atrasos_historicos } : {}),
    ...(l.arquivado ? { arquivado: true } : {}),
    ...(proposta ? { proposta: propostaDoBanco(proposta) } : {}),
  };
}

export function lancamentoDoBanco(l: LinhaDoLancamento): Lancamento {
  return {
    d: dataDoBanco(l.data),
    t: l.titulo,
    s: l.subtitulo,
    delta: l.delta,
    saldo: l.saldo_depois,
    ...(l.dinheiro ? { dinheiro: true } : {}),
  };
}

export function perfilDoBanco(p: LinhaDoProfessor): Perfil {
  return {
    nome: p.nome,
    iniciais: p.iniciais,
    // O do login: é o que o trigger da Parte 3 grava.
    email: p.email,
    disciplinas: p.disciplinas,
    // A coluna aceita nulo; o tipo do app, não. É o mesmo padrão da semente.
    faixaDeAlunos: p.faixa_de_alunos ?? '1–5',
    plano: p.plano,
    ...(p.chave_pix ? { chavePix: p.chave_pix } : {}),
  };
}

export function politicasDoBanco(p: LinhaDaPolitica): Politicas {
  return {
    avisoHoras: p.aviso_horas,
    avisadaDevolve: p.avisada_devolve,
    limiteReposicoes: p.limite_reposicoes,
    validadeDias: p.validade_dias,
  };
}

export function disponibilidadeDoBanco(d: LinhaDaDisponibilidade): Disponibilidade {
  return {
    blocos: d.blocos as unknown as Disponibilidade['blocos'],
    aceitaForaDosBlocos: d.aceita_fora_dos_blocos,
    sugereSabado: d.sugere_sabado,
    folgas: d.folgas as unknown as Disponibilidade['folgas'],
  };
}

/** Do mais novo para o mais antigo, como o extrato do app. */
const maisNovoPrimeiro = (a: LinhaDoLancamento, b: LinhaDoLancamento): number =>
  Date.parse(b.criado_em) - Date.parse(a.criado_em);

/**
 * As seis consultas viram o `Persistido` que a store já espera. Só a proposta
 * aberta de cada aluno entra: no app ela mora dentro do aluno.
 */
export function montarPersistido(linhas: Linhas, referencia: Date = hojeComoData()): Persistido {
  const propostaDe = new Map(
    linhas.propostas.filter((p) => p.status === 'enviada').map((p) => [p.aluno_id, p]),
  );

  const extratos: Extratos = {};
  for (const a of linhas.alunos) extratos[a.id] = [];
  for (const l of [...linhas.lancamentos].sort(maisNovoPrimeiro)) {
    extratos[l.aluno_id]?.push(lancamentoDoBanco(l));
  }

  const { pacote_padrao, preferencias_aviso } = linhas.professor;
  return {
    alunos: linhas.alunos.map((a) => alunoDoBanco(a, propostaDe.get(a.id), referencia)),
    extratos,
    politicas: politicasDoBanco(linhas.politicas),
    perfil: perfilDoBanco(linhas.professor),
    disponibilidade: disponibilidadeDoBanco(linhas.disponibilidade),
    ...(pacote_padrao !== null ? { pacotePadrao: pacote_padrao as unknown as ConfigPacote } : {}),
    ...(preferencias_aviso !== null
      ? { preferenciasDeAviso: preferencias_aviso as unknown as PreferenciasDeAviso }
      : {}),
  };
}

// --- App → banco ------------------------------------------------------------------

const json = (valor: unknown): NonNullable<Json> => valor as NonNullable<Json>;

/** O aluno inteiro como linha. `professor_id` e `criado_em` ficam com o padrão do banco. */
export function alunoParaBanco(
  a: Aluno,
  referencia: Date = hojeComoData(),
): TablesInsert<'alunos'> & { id: string } {
  const p = a.pagamento;
  const data = (valor: string | undefined) => dataParaBanco(valor, referencia);
  return {
    id: a.id,
    nome: a.name,
    disciplina: a.disciplina,
    dia: a.dia,
    hora: a.hora,
    telefone: a.telefone ?? null,
    email: a.email ?? null,
    total: a.total,
    usadas: a.usadas,
    validade: data(a.validade),
    validade_estendida: a.validadeEstendida ?? false,
    sem_pacote: a.semPacote ?? false,
    encerrado: data(a.encerrado),
    // reais no app, centavos no banco
    valor_por_aula_centavos: a.valorPorAula === undefined ? null : Math.round(a.valorPorAula * 100),
    reposicoes: a.reposicoes,
    pendencia_origem: data(a.pendencia?.origem),
    agendada: a.agendada ? json(a.agendada) : null,
    disponibilidade: a.disponibilidade ? json(a.disponibilidade) : null,
    pausado: a.pausado ?? false,
    lembretes: a.lembretes ?? 0,
    ultimo_lembrete: data(a.ultimoLembrete),
    atrasos_historicos: a.atrasosHistoricos ?? 0,
    pagamento_status: p.status,
    pagamento_em: data(p.em),
    pagamento_meio: p.meio ?? null,
    pagamento_vencimento: data(p.vence ?? p.venceu),
    arquivado: a.arquivado ?? false,
  };
}

type ColunaDoAluno = keyof TablesUpdate<'alunos'>;

/**
 * Campo do app → colunas do banco, para o `update` gravar só o que a ação
 * mudou. `id` não muda, `hoje` é derivado, a proposta é outra tabela (Parte 5)
 * e `criadoEm` é do banco. O `Record` obriga a decidir aqui cada campo novo
 * do `Aluno`: sem a linha, o typecheck quebra.
 */
const COLUNAS_DO_CAMPO: Record<
  Exclude<keyof Aluno, 'id' | 'hoje' | 'proposta' | 'criadoEm'>,
  ColunaDoAluno[]
> = {
  name: ['nome'],
  disciplina: ['disciplina'],
  dia: ['dia'],
  hora: ['hora'],
  telefone: ['telefone'],
  email: ['email'],
  total: ['total'],
  usadas: ['usadas'],
  validade: ['validade'],
  validadeEstendida: ['validade_estendida'],
  semPacote: ['sem_pacote'],
  encerrado: ['encerrado'],
  valorPorAula: ['valor_por_aula_centavos'],
  reposicoes: ['reposicoes'],
  pendencia: ['pendencia_origem'],
  agendada: ['agendada'],
  disponibilidade: ['disponibilidade'],
  pausado: ['pausado'],
  lembretes: ['lembretes'],
  ultimoLembrete: ['ultimo_lembrete'],
  atrasosHistoricos: ['atrasos_historicos'],
  pagamento: ['pagamento_status', 'pagamento_em', 'pagamento_meio', 'pagamento_vencimento'],
  arquivado: ['arquivado'],
};

/** Só as colunas dos campos pedidos, com os valores do aluno como ficou. */
export function colunasDoAluno(
  a: Aluno,
  campos: readonly (keyof Aluno)[],
  referencia: Date = hojeComoData(),
): TablesUpdate<'alunos'> {
  const linha = alunoParaBanco(a, referencia) as Record<string, unknown>;
  const saida: Record<string, unknown> = {};
  for (const campo of campos) {
    const colunas = (COLUNAS_DO_CAMPO as Partial<Record<keyof Aluno, ColunaDoAluno[]>>)[campo];
    for (const coluna of colunas ?? []) saida[coluna] = linha[coluna];
  }
  return saida as TablesUpdate<'alunos'>;
}

// --- Movimento (Parte 5) ----------------------------------------------------------

/**
 * Os campos que um movimento (aula, falta, reposição, pagamento, pacote) pode
 * mudar no aluno, e que a RPC `aplicar_movimento` grava. O resto do aluno é
 * gravado direto (Parte 4). A lista tem de bater com o `update` da
 * `0005_aplicar_movimento.sql`, e um teste confere: campo novo aqui sem coluna
 * lá seria perdido em silêncio.
 */
export const CAMPOS_DO_MOVIMENTO = [
  'total',
  'usadas',
  'validade',
  'validadeEstendida',
  'semPacote',
  'encerrado',
  'valorPorAula',
  'reposicoes',
  'pendencia',
  'agendada',
  'pausado',
  'pagamento',
] as const satisfies readonly (keyof Aluno)[];

/** As colunas desses campos, na ordem de `COLUNAS_DO_CAMPO`. */
export const COLUNAS_DO_MOVIMENTO: readonly ColunaDoAluno[] = CAMPOS_DO_MOVIMENTO.flatMap(
  (campo) => COLUNAS_DO_CAMPO[campo],
);

/**
 * O lançamento para a RPC, com o tipo que a `Mudanca` diz (Parte 1, decisão
 * 1). Aluno e professor a RPC tira da linha do aluno, e `criado_em` é `now()`.
 */
export function lancamentoDoMovimento(
  l: Lancamento,
  tipo: TipoDeLancamento,
  referencia: Date = hojeComoData(),
): Json {
  return json({
    tipo,
    data: dataParaBanco(l.d, referencia),
    titulo: l.t,
    subtitulo: l.s,
    delta: l.delta,
    saldo_depois: l.saldo,
    dinheiro: l.dinheiro ?? false,
  });
}

/** Uma proposta nova para a RPC: `status: 'enviada'` é o que a faz inserir. */
export function propostaDoMovimento(p: Proposta, referencia: Date = hojeComoData()): Json {
  return json({
    status: 'enviada',
    janela: p.janela,
    alternativas: p.alternativas,
    enviada_em: dataParaBanco(p.enviadaEm, referencia),
  });
}

/**
 * O extrato de um aluno como linhas, para lançamento que nasceu antes do banco:
 * tipo pelo título, `criado_em` pela posição.
 */
export function extratoParaBanco(
  lancamentos: Lancamento[],
  alunoId: string,
  professorId: string,
  referencia: Date = hojeComoData(),
): TablesInsert<'lancamentos'>[] {
  const datas = datasDoExtrato(lancamentos, referencia);
  return lancamentos.map((l, posicao) => ({
    aluno_id: alunoId,
    professor_id: professorId,
    tipo: tipoPorTitulo(l.t),
    data: iso(datas[posicao]),
    titulo: l.t,
    subtitulo: l.s,
    delta: l.delta,
    saldo_depois: l.saldo,
    dinheiro: l.dinheiro ?? false,
    criado_em: momentoDoLancamento(datas[posicao], posicao),
  }));
}

export function propostaParaBanco(
  p: Proposta,
  alunoId: string,
  professorId: string,
  referencia: Date = hojeComoData(),
): TablesInsert<'propostas'> {
  return {
    aluno_id: alunoId,
    professor_id: professorId,
    janela: json(p.janela),
    alternativas: json(p.alternativas),
    status: p.status,
    enviada_em: dataParaBanco(p.enviadaEm, referencia) as string,
  };
}

/**
 * O perfil para o `update professores`. O e-mail não vai: no banco ele é o do
 * login, e trocar o e-mail é assunto do Supabase Auth.
 */
export function perfilParaBanco(p: Perfil): TablesUpdate<'professores'> {
  return {
    nome: p.nome,
    iniciais: p.iniciais,
    disciplinas: p.disciplinas,
    faixa_de_alunos: p.faixaDeAlunos,
    chave_pix: p.chavePix ?? null,
    plano: p.plano,
  };
}

export function politicasParaBanco(p: Politicas): TablesUpdate<'politicas'> {
  return {
    aviso_horas: p.avisoHoras,
    avisada_devolve: p.avisadaDevolve,
    limite_reposicoes: p.limiteReposicoes,
    validade_dias: p.validadeDias,
  };
}

export function disponibilidadeParaBanco(d: Disponibilidade): TablesUpdate<'disponibilidades'> {
  return {
    blocos: json(d.blocos),
    aceita_fora_dos_blocos: d.aceitaForaDosBlocos,
    sugere_sabado: d.sugereSabado,
    folgas: json(d.folgas),
  };
}

export const pacotePadraoParaBanco = (cfg: ConfigPacote): TablesUpdate<'professores'> => ({
  pacote_padrao: json(cfg),
});

export const preferenciasParaBanco = (p: PreferenciasDeAviso): TablesUpdate<'professores'> => ({
  preferencias_aviso: json(p),
});

// --- Conta nova -------------------------------------------------------------------

/**
 * O estado de quem acabou de criar a conta, com os padrões das colunas do
 * banco (0001 e o trigger da 0003). É o ponto de partida do modo supabase no
 * lugar da semente: o professor de verdade não pode ver os alunos de
 * demonstração como se fossem dele, nem gravá-los no banco.
 */
export function estadoVazio(): Persistido {
  return {
    alunos: [],
    extratos: {},
    politicas: { avisoHoras: 24, avisadaDevolve: true, limiteReposicoes: 3, validadeDias: 60 },
    perfil: {
      nome: '',
      iniciais: '',
      email: '',
      disciplinas: [],
      faixaDeAlunos: '1–5',
      plano: 'gratuito',
    },
    disponibilidade: { blocos: [], aceitaForaDosBlocos: false, sugereSabado: false, folgas: [] },
  };
}
