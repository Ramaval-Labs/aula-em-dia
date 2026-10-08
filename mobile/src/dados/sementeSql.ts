/**
 * Gerador de `supabase/seed.sql` (Parte 2 do backend).
 *
 * `gerarSeedSql()` é função pura e determinística: não lê relógio nem sorteia
 * nada, então o arquivo sai igual em qualquer dia e um teste consegue cobrar
 * que o `seed.sql` comitado está em dia com `data/seed.json`.
 *
 * As datas ficam relativas também no banco. `"hoje-12"` vira
 * `pg_temp.hoje() - 12`, e quem resolve é o Postgres, a cada `db reset`. A
 * gramática é a de `lerNotacao`, a mesma que o app usa: aqui só muda para
 * que cada deslocamento é traduzido.
 *
 * Quem executa é `scripts/gerar-seed-sql.mjs`, na raiz. As decisões estão em
 * docs/backend/PLANO-BACKEND.md, Parte 2.
 */

import { DIAS } from '../dominio/disponibilidade';
import type { Aluno, DiaDaSemana, Lancamento } from '../dominio/tipos';
import type { Database } from './banco';
import { lerNotacao, SEMENTE_NA_NOTACAO } from './semente';

type TipoDeLancamento = Database['public']['Enums']['tipo_lancamento'];

/** O professor de teste (SCRUM-50). SOMENTE banco local, nunca produção. */
export const PROFESSOR_DE_TESTE = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'professor@exemplo.test',
  senha: 'aulaemdia-local',
} as const;

/**
 * O id de cada aluno da semente no banco. O app ainda usa `val`, `raf`…;
 * o banco exige uuid, e este é o começo do mapa de ids da Parte 4.
 */
export const ID_DO_ALUNO: Record<string, string> = {
  val: '00000000-0000-4000-8000-000000000101',
  raf: '00000000-0000-4000-8000-000000000102',
  mar: '00000000-0000-4000-8000-000000000103',
  bea: '00000000-0000-4000-8000-000000000104',
};

/** O "hoje" do banco é o do Brasil: o contêiner roda em UTC e viraria o dia às 21h. */
export const FUSO = 'America/Sao_Paulo';

/**
 * Título → tipo, para lançamento que nasceu antes do banco (Parte 1,
 * decisão 1). Lançamento novo tira o tipo da `Mudanca`, não daqui.
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

// --- SQL, peça por peça ----------------------------------------------------

const texto = (v: string): string => `'${v.replace(/'/g, "''")}'`;
const textoOuNulo = (v?: string): string => (v ? texto(v) : 'null');
const numeroOuNulo = (v?: number): string => (v === undefined ? 'null' : String(v));

/** `pg_temp.hoje() - 12`, para coluna `date`. */
function hojeMais(dias: number): string {
  if (dias === 0) return 'pg_temp.hoje()';
  return `pg_temp.hoje() ${dias < 0 ? '-' : '+'} ${Math.abs(dias)}`;
}

/** Só o deslocamento de um valor que é uma data relativa; null se não for. */
function deslocamentoDe(valor: string): number | null {
  const partes = lerNotacao(valor);
  const unica = partes.length === 1 ? partes[0] : null;
  return unica && typeof unica !== 'string' && !unica.comDia ? unica.dias : null;
}

/**
 * Coluna `date`. Vazia, ausente e `'sem prazo'` viram `null`. Data absoluta
 * não é aceita: sem ano ela não é uma data, e a semente não tem nenhuma aqui.
 */
function data(valor: string | undefined, campo: string): string {
  if (!valor || valor === 'sem prazo') return 'null';
  const dias = deslocamentoDe(valor);
  if (dias === null) {
    throw new Error(`${campo}: "${valor}" não está na notação hoje±N e não tem como virar date.`);
  }
  return hojeMais(dias);
}

/** Texto que pode ter deslocamento no meio: `'Pago em ' || pg_temp.ddmm(-58) || ' · Pix'`. */
function textoComDatas(valor: string): string {
  const pedacos = lerNotacao(valor)
    .filter((parte) => parte !== '')
    .map((parte) => {
      if (typeof parte === 'string') return texto(parte);
      return parte.comDia ? `pg_temp.dia_e_data(${parte.dias})` : `pg_temp.ddmm(${parte.dias})`;
    });
  return pedacos.length > 0 ? pedacos.join(' || ') : "''";
}

function temNotacao(valor: unknown): boolean {
  if (typeof valor === 'string') return lerNotacao(valor).some((p) => typeof p !== 'string');
  if (Array.isArray(valor)) return valor.some(temNotacao);
  if (valor !== null && typeof valor === 'object') return Object.values(valor).some(temNotacao);
  return false;
}

/**
 * Coluna `jsonb`, com a mesma forma que o app guarda. O que não tem data vai
 * como literal; o que tem é montado, para o banco resolver o deslocamento.
 */
function json(valor: unknown): string {
  if (valor === undefined || valor === null) return 'null';
  if (!temNotacao(valor)) return `${texto(JSON.stringify(valor))}::jsonb`;
  if (typeof valor === 'string') return `to_jsonb(${textoComDatas(valor)})`;
  if (Array.isArray(valor)) return `jsonb_build_array(${valor.map(json).join(', ')})`;
  const pares = Object.entries(valor as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .map(([chave, v]) => `${texto(chave)}, ${v === null ? "'null'::jsonb" : json(v)}`);
  return `jsonb_build_object(${pares.join(', ')})`;
}

/** Uma linha de `values`, com o comentário de quem ela é. */
const linha = (rotulo: string, valores: string[]): string =>
  `  -- ${rotulo}\n  (${valores.join(', ')})`;

function idDoAluno(id: string): string {
  const uuid = ID_DO_ALUNO[id];
  if (!uuid) {
    throw new Error(`O aluno "${id}" da semente não tem uuid em ID_DO_ALUNO (sementeSql.ts).`);
  }
  return texto(uuid);
}

// --- As seções do arquivo --------------------------------------------------

const PROFESSOR = texto(PROFESSOR_DE_TESTE.id);

function cabecalho(): string {
  return `-- supabase/seed.sql — GERADO. Não edite à mão.
--
-- Fonte: data/seed.json (alunos, extratos e políticas) e
-- mobile/src/dados/semente.ts (perfil e disponibilidade).
-- Para regerar, na raiz do repositório: node scripts/gerar-seed-sql.mjs
--
-- SOMENTE banco local, nunca produção: cria um usuário de teste com senha
-- conhecida.
--
-- As datas são relativas, como na semente do app: "hoje-12" vira
-- pg_temp.hoje() - 12, e quem resolve é o banco, a cada \`db reset\`. Por isso
-- este arquivo não muda de um dia para o outro.
--
-- Pode rodar mais de uma vez: termina sempre no mesmo estado.`;
}

function funcoesDeData(): string {
  const ordemIso: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const nomes = ordemIso.map((chave) => {
    const dia = DIAS.find((d) => d.chave === chave);
    if (!dia) throw new Error(`Falta "${chave}" em DIAS (dominio/disponibilidade.ts).`);
    return texto(dia.longo);
  });

  return `-- Funções de sessão: existem só enquanto o seed roda.
create or replace function pg_temp.hoje() returns date language sql stable as
  $$ select (now() at time zone ${texto(FUSO)})::date $$;

-- "29/08", como o app escreve.
create or replace function pg_temp.ddmm(dias int) returns text language sql stable as
  $$ select to_char(pg_temp.hoje() + dias, 'DD/MM') $$;

-- "Sexta, 29/08": o nome do dia sai da data, nunca é escrito à mão.
create or replace function pg_temp.dia_e_data(dias int) returns text language sql stable as
  $$ select (array[${nomes.join(', ')}])
       [extract(isodow from pg_temp.hoje() + dias)::int] || ', ' || pg_temp.ddmm(dias) $$;

-- Meio-dia da data, menos a posição no extrato em segundos: o extrato do app é
-- uma lista do mais novo para o mais antigo, e no banco a ordem é criado_em desc.
create or replace function pg_temp.momento(dias int, posicao int) returns timestamptz
  language sql stable as
  $$ select ((pg_temp.hoje() + dias) + time '12:00') at time zone ${texto(FUSO)}
            - make_interval(secs => posicao) $$;`;
}

/** O bloco testado no SCRUM-50, sem mudar uma coluna. */
function usuarioDeTeste(): string {
  const email = texto(PROFESSOR_DE_TESTE.email);
  return `-- O professor de teste (SCRUM-50). Os quatro tokens vão como '' porque com
-- null o login devolve 500.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  ${PROFESSOR},
  'authenticated', 'authenticated',
  ${email},
  extensions.crypt(${texto(PROFESSOR_DE_TESTE.senha)}, extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}', '{}',
  now(), now(),
  '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) values (
  ${PROFESSOR},
  ${PROFESSOR},
  ${PROFESSOR},
  'email',
  jsonb_build_object(
    'sub',   ${PROFESSOR},
    'email', ${email},
    'email_verified', true
  ),
  now(), now(), now()
)
on conflict (provider_id, provider) do nothing;`;
}

/**
 * Perfil, políticas e disponibilidade. `do update` em vez de `do nothing`:
 * com o trigger da Parte 3, as três linhas já chegam criadas com os padrões.
 */
function professor(): string {
  const { perfil, politicas, disponibilidade } = SEMENTE_NA_NOTACAO;
  const disciplinas = `array[${perfil.disciplinas.map(texto).join(', ')}]::text[]`;

  return `-- O e-mail é o do login, não o de demonstração que o app mostra no perfil.
insert into public.professores (
  id, nome, iniciais, email, disciplinas, faixa_de_alunos, chave_pix, plano
) values (
  ${PROFESSOR}, ${texto(perfil.nome)}, ${texto(perfil.iniciais)}, ${texto(PROFESSOR_DE_TESTE.email)},
  ${disciplinas}, ${texto(perfil.faixaDeAlunos)}, ${textoOuNulo(perfil.chavePix)}, ${texto(perfil.plano)}
)
on conflict (id) do update set
  nome = excluded.nome,
  iniciais = excluded.iniciais,
  email = excluded.email,
  disciplinas = excluded.disciplinas,
  faixa_de_alunos = excluded.faixa_de_alunos,
  chave_pix = excluded.chave_pix,
  plano = excluded.plano;

insert into public.politicas (
  professor_id, aviso_horas, avisada_devolve, limite_reposicoes, validade_dias
) values (
  ${PROFESSOR}, ${politicas.avisoHoras}, ${politicas.avisadaDevolve}, ${politicas.limiteReposicoes}, ${politicas.validadeDias}
)
on conflict (professor_id) do update set
  aviso_horas = excluded.aviso_horas,
  avisada_devolve = excluded.avisada_devolve,
  limite_reposicoes = excluded.limite_reposicoes,
  validade_dias = excluded.validade_dias;

insert into public.disponibilidades (
  professor_id, blocos, aceita_fora_dos_blocos, sugere_sabado, folgas
) values (
  ${PROFESSOR},
  ${json(disponibilidade.blocos)},
  ${disponibilidade.aceitaForaDosBlocos}, ${disponibilidade.sugereSabado},
  ${json(disponibilidade.folgas)}
)
on conflict (professor_id) do update set
  blocos = excluded.blocos,
  aceita_fora_dos_blocos = excluded.aceita_fora_dos_blocos,
  sugere_sabado = excluded.sugere_sabado,
  folgas = excluded.folgas;`;
}

function alunos(lista: Aluno[]): string {
  const linhas = lista.map((a) => {
    const p = a.pagamento;
    return linha(a.id, [
      idDoAluno(a.id),
      PROFESSOR,
      texto(a.name),
      texto(a.disciplina),
      texto(a.dia),
      texto(a.hora),
      textoOuNulo(a.telefone),
      textoOuNulo(a.email),
      String(a.total),
      String(a.usadas),
      data(a.validade, `${a.id}.validade`),
      String(a.validadeEstendida ?? false),
      String(a.semPacote ?? false),
      data(a.encerrado, `${a.id}.encerrado`),
      // reais inteiros no app, centavos no banco
      numeroOuNulo(a.valorPorAula === undefined ? undefined : a.valorPorAula * 100),
      String(a.reposicoes),
      data(a.pendencia?.origem, `${a.id}.pendencia.origem`),
      json(a.agendada),
      json(a.disponibilidade),
      String(a.pausado ?? false),
      String(a.lembretes ?? 0),
      data(a.ultimoLembrete, `${a.id}.ultimoLembrete`),
      String(a.atrasosHistoricos ?? 0),
      texto(p.status),
      data(p.em, `${a.id}.pagamento.em`),
      textoOuNulo(p.meio),
      data(p.vence ?? p.venceu, `${a.id}.pagamento.vence`),
      String(a.arquivado ?? false),
    ]);
  });

  return `-- Apagar antes de inserir é o que deixa o arquivo rodar duas vezes: o
-- extrato não tem chave natural, e o delete leva junto lançamentos e propostas.
delete from public.alunos where professor_id = ${PROFESSOR};

-- Ficam de fora, por serem derivados: \`hoje\`, \`pendencia.dias\` e \`pagamento.dias\`.
insert into public.alunos (
  id, professor_id, nome, disciplina, dia, hora, telefone, email,
  total, usadas, validade, validade_estendida, sem_pacote, encerrado, valor_por_aula_centavos,
  reposicoes, pendencia_origem, agendada, disponibilidade,
  pausado, lembretes, ultimo_lembrete, atrasos_historicos,
  pagamento_status, pagamento_em, pagamento_meio, pagamento_vencimento,
  arquivado
) values
${linhas.join(',\n')};`;
}

function lancamentos(lista: Aluno[], extratos: Record<string, Lancamento[]>): string {
  const linhas: string[] = [];
  for (const a of lista) {
    let anterior = Infinity;
    (extratos[a.id] ?? []).forEach((l, posicao) => {
      const dias = deslocamentoDe(l.d);
      if (dias === null) {
        throw new Error(`extratos.${a.id}[${posicao}].d: "${l.d}" não está na notação hoje±N.`);
      }
      if (dias > anterior) {
        throw new Error(
          `extratos.${a.id}[${posicao}] é mais novo que o lançamento de cima: ` +
            'o extrato vai do mais novo para o mais antigo, e é essa a ordem que o banco reproduz.',
        );
      }
      anterior = dias;
      linhas.push(
        linha(`${a.id} · ${l.t}`, [
          idDoAluno(a.id),
          PROFESSOR,
          texto(tipoPorTitulo(l.t)),
          hojeMais(dias),
          texto(l.t),
          textoComDatas(l.s),
          String(l.delta),
          String(l.saldo),
          String(l.dinheiro ?? false),
          `pg_temp.momento(${dias}, ${posicao})`,
        ]),
      );
    });
  }
  if (linhas.length === 0) return '';

  return `insert into public.lancamentos (
  aluno_id, professor_id, tipo, data, titulo, subtitulo, delta, saldo_depois, dinheiro, criado_em
) values
${linhas.join(',\n')};`;
}

function propostas(lista: Aluno[]): string {
  const linhas = lista
    .filter((a) => a.proposta)
    .map((a) => {
      const p = a.proposta!;
      return linha(a.id, [
        idDoAluno(a.id),
        PROFESSOR,
        json(p.janela),
        json(p.alternativas),
        texto(p.status),
        data(p.enviadaEm, `${a.id}.proposta.enviadaEm`),
      ]);
    });
  if (linhas.length === 0) return '';

  return `-- No app a proposta mora dentro do aluno; no banco é uma tabela.
insert into public.propostas (
  aluno_id, professor_id, janela, alternativas, status, enviada_em
) values
${linhas.join(',\n')};`;
}

/** O `seed.sql` inteiro. */
export function gerarSeedSql(): string {
  const { alunos: lista, extratos } = SEMENTE_NA_NOTACAO;
  const secoes = [
    cabecalho(),
    funcoesDeData(),
    usuarioDeTeste(),
    professor(),
    alunos(lista),
    lancamentos(lista, extratos),
    propostas(lista),
  ];
  return `${secoes.filter(Boolean).join('\n\n')}\n`;
}
