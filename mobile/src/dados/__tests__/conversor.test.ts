/**
 * Conversor de fronteira (SCRUM-20).
 *
 * O teste que mais importa é a ida e volta: a semente vai ao banco e volta
 * como o mesmo `Persistido` que a store espera. "O mesmo" tem uma lista
 * curta de exceções, e cada uma está em `canonico` abaixo com o motivo — é a
 * lista das decisões da Parte 4 em docs/backend/PLANO-BACKEND.md. A segunda
 * volta, essa sim, tem de ser idêntica à primeira.
 */

import { aulaFixaDe } from '../../dominio/aulaFixa';
import { formatarDdMm } from '../../dominio/datas';
import type { Aluno, Lancamento } from '../../dominio/tipos';
import { criadoEmDoBanco, EMAIL_DO_LOGIN, linhasDoPersistido } from '../__simulados__/linhas';
import {
  alunoDoBanco,
  alunoParaBanco,
  COLUNAS_DO_MOVIMENTO,
  colunasDoAluno,
  dataDoBanco,
  dataParaBanco,
  datasDoBanco,
  estadoVazio,
  extratoParaBanco,
  lancamentoDoMovimento,
  montarPersistido,
  perfilDoBanco,
  perfilParaBanco,
  propostaDoMovimento,
  temAulaHoje,
  tipoPorTitulo,
  type LinhaDoAluno,
  type LinhaDoProfessor,
} from '../conversor';
import type { Persistido } from '../repositorio';
import { estadoInicial } from '../semente';

const PROFESSOR = 'prof-a';

/** Datas fixas: o ano é o que o teste escolhe, não o do dia em que roda. */
const dia = (ano: number, mes: number, d: number) => new Date(ano, mes - 1, d);
const QUARTA = dia(2026, 10, 21);
const QUINTA = dia(2026, 10, 22);

const pelaFronteira = (p: Persistido): Persistido =>
  montarPersistido(linhasDoPersistido(p, PROFESSOR));

/** Tira o que é ausência dita de outro jeito: `undefined`, `null`, `false`, 0 e `''`. */
function semAusentes<T extends object>(o: T, chaves: (keyof T)[]): T {
  const saida = { ...o };
  for (const k of chaves) {
    const v = saida[k] as unknown;
    if (v === undefined || v === null || v === false || v === 0) delete saida[k];
  }
  return saida;
}

/**
 * O `Persistido` como o banco o devolve. Cada linha é uma equivalência que
 * a tela já trata igual, e que o banco escreve de um jeito só.
 */
function canonico(p: Persistido): Persistido {
  return {
    ...p,
    // O e-mail do perfil é o do login (Parte 2, decisão 4).
    perfil: { ...p.perfil, email: EMAIL_DO_LOGIN },
    alunos: p.alunos.map((a) => {
      const c = semAusentes<Aluno>(
        {
          ...a,
          // `hoje` é derivado do dia fixo: a semente o tem escrito à mão.
          hoje: temAulaHoje(a),
          // `criadoEm` é quando a linha nasceu no banco.
          criadoEm: criadoEmDoBanco(),
          // Sem pacote e sem data: o `''` de `criarAluno` (Parte 2, decisão 3).
          validade: a.validade ?? '',
        },
        [
          'telefone', 'email', 'validadeEstendida', 'semPacote', 'encerrado', 'valorPorAula',
          'pendencia', 'agendada', 'disponibilidade', 'pausado', 'lembretes', 'ultimoLembrete',
          'atrasosHistoricos', 'arquivado', 'proposta',
        ],
      );
      return c;
    }),
  };
}

describe('datas', () => {
  it('dd/mm vai com o ano inferido, e volta sem ele', () => {
    expect(dataParaBanco('30/10', QUARTA)).toBe('2026-10-30');
    expect(dataDoBanco('2026-10-30')).toBe('30/10');
  });

  it('a virada do ano: 05/01 visto do fim de dezembro é do ano seguinte', () => {
    expect(dataParaBanco('05/01', dia(2026, 12, 28))).toBe('2027-01-05');
    expect(dataParaBanco('20/12', dia(2027, 1, 3))).toBe('2026-12-20');
  });

  it("vazio, ausente e 'sem prazo' são sem data", () => {
    expect(dataParaBanco('', QUARTA)).toBeNull();
    expect(dataParaBanco(undefined, QUARTA)).toBeNull();
    expect(dataParaBanco('sem prazo', QUARTA)).toBeNull();
  });

  it('um texto que não é data lança, em vez de gravar null no lugar', () => {
    expect(() => dataParaBanco('amanhã', QUARTA)).toThrow('dd/mm');
    expect(() => dataParaBanco('31/04', QUARTA)).toThrow();
  });
});

describe('temAulaHoje — o `hoje` que o banco não guarda', () => {
  // Sem `aulaFixa`, o domínio lê o texto (`lerAulaFixa`): é a linha de antes da 0009.
  it.each([
    ['quarta', 'quarta', QUARTA, true],
    ['quarta', 'quinta', QUINTA, false],
    ['terça e quinta', 'quinta', QUINTA, true],
    ['Quinta-feira', 'quinta', QUINTA, true],
    ['sem horário fixo', 'quarta', QUARTA, false],
    ['sábado', 'sábado', dia(2026, 10, 24), true],
  ])('"%s" numa %s → %s', (diaFixo, _nome, referencia, esperado) => {
    expect(temAulaHoje({ dia: diaFixo, hora: '' }, referencia)).toBe(esperado);
  });

  it('com a estrutura, vale ela, e não o texto', () => {
    const a = { dia: 'quarta', hora: '18h', aulaFixa: { dias: ['qui' as const], hora: 18 } };
    expect(temAulaHoje(a, QUINTA)).toBe(true);
    expect(temAulaHoje(a, QUARTA)).toBe(false);
  });
});

describe('a ida e volta: app → banco → app', () => {
  it('a semente volta como a store espera, com as equivalências da Parte 4', () => {
    const semente = estadoInicial();
    expect(pelaFronteira(semente)).toEqual(canonico(semente));
  });

  it('a segunda volta é idêntica à primeira: nada se perde nem muda no caminho', () => {
    const uma = pelaFronteira(estadoInicial());
    expect(pelaFronteira(uma)).toEqual(uma);
  });

  it('dinheiro vai em centavos e volta em reais', () => {
    const semente = estadoInicial();
    const linhas = linhasDoPersistido(semente, PROFESSOR);
    expect(linhas.alunos.find((a) => a.id === 'val')?.valor_por_aula_centavos).toBe(8000);
    expect(pelaFronteira(semente).alunos.find((a) => a.id === 'val')?.valorPorAula).toBe(80);
  });

  it('o extrato volta na mesma ordem, com tipo pelo título e nenhum legado', () => {
    const semente = estadoInicial();
    const linhas = linhasDoPersistido(semente, PROFESSOR);
    expect(linhas.lancamentos.filter((l) => l.tipo === 'legado')).toEqual([]);
    expect(pelaFronteira(semente).extratos).toEqual(semente.extratos);
  });

  it('a proposta aberta volta para dentro do aluno; a respondida não', () => {
    const semente = estadoInicial();
    const linhas = linhasDoPersistido(semente, PROFESSOR);
    const raf = semente.alunos.find((a) => a.id === 'raf');
    expect(montarPersistido(linhas).alunos.find((a) => a.id === 'raf')?.proposta).toEqual(
      raf?.proposta,
    );

    linhas.propostas = linhas.propostas.map((p) => ({ ...p, status: 'aceita' as const }));
    expect(montarPersistido(linhas).alunos.find((a) => a.id === 'raf')?.proposta).toBeUndefined();
  });

  it('pacote padrão e avisos vão e voltam; sem eles, ficam ausentes', () => {
    const e: Persistido = {
      ...estadoInicial(),
      pacotePadrao: { aulas: 4, valorPorAula: 90, validadeDias: 30, somarSaldo: true },
      preferenciasDeAviso: {
        aulaDoDia: false,
        saldoBaixo: true,
        reposicaoPendente: false,
        pagamentoVencendo: true,
      },
    };
    const volta = pelaFronteira(e);
    expect(volta.pacotePadrao).toEqual(e.pacotePadrao);
    expect(volta.preferenciasDeAviso).toEqual(e.preferenciasDeAviso);
    expect('pacotePadrao' in pelaFronteira(estadoInicial())).toBe(false);
  });

  it('um aluno sem extrato tem a lista vazia, como criarAluno deixa', () => {
    const e = estadoInicial();
    const extratos = { ...e.extratos };
    delete extratos.bea;
    expect(pelaFronteira({ ...e, extratos }).extratos.bea).toEqual([]);
  });
});

describe('aluno: os derivados saem do banco', () => {
  const linha = (extra: Partial<LinhaDoAluno>): LinhaDoAluno =>
    ({
      ...alunoParaBanco(
        {
          id: 'x',
          name: 'Ana',
          disciplina: 'Piano',
          dia: 'quarta',
          hora: '17h',
          hoje: false,
          total: 8,
          usadas: 2,
          validade: '30/11',
          reposicoes: 0,
          pagamento: { status: 'aberto', vence: '30/10' },
        },
        QUARTA,
      ),
      professor_id: PROFESSOR,
      criado_em: new Date(2026, 9, 1, 15).toISOString(),
      token_publico: 't',
      versao: 0,
      ...extra,
    }) as LinhaDoAluno;

  it('dias de pendência e de atraso são contados até hoje, não guardados', () => {
    const a = alunoDoBanco(
      linha({
        pendencia_origem: '2026-10-05',
        pagamento_status: 'atraso',
        pagamento_vencimento: '2026-10-09',
      }),
      undefined,
      QUARTA,
    );
    expect(a.pendencia).toEqual({ origem: '05/10', dias: 16 });
    expect(a.pagamento).toEqual({ status: 'atraso', venceu: '09/10', dias: 12 });
  });

  it('com pagamento em aberto, o vencimento é `vence`, sem dias', () => {
    expect(alunoDoBanco(linha({}), undefined, QUARTA).pagamento).toEqual({
      status: 'aberto',
      vence: '30/10',
    });
  });

  it("validade nula: '' sem pacote, 'sem prazo' com pacote", () => {
    expect(alunoDoBanco(linha({ validade: null, sem_pacote: true }), undefined, QUARTA).validade).toBe('');
    expect(alunoDoBanco(linha({ validade: null }), undefined, QUARTA).validade).toBe('sem prazo');
  });

  it('criadoEm é o dia do criado_em, no fuso do aparelho', () => {
    expect(alunoDoBanco(linha({}), undefined, QUARTA).criadoEm).toBe(
      formatarDdMm(new Date(2026, 9, 1, 15)),
    );
  });
});

describe('colunasDoAluno — o update grava só o que a ação mudou', () => {
  const aluno = estadoInicial().alunos[0];

  it('um campo, uma coluna', () => {
    expect(colunasDoAluno({ ...aluno, pausado: true }, ['pausado'])).toEqual({ pausado: true });
  });

  it('o pagamento são quatro colunas', () => {
    expect(Object.keys(colunasDoAluno(aluno, ['pagamento'])).sort()).toEqual([
      'pagamento_em',
      'pagamento_meio',
      'pagamento_status',
      'pagamento_vencimento',
    ]);
  });

  it('a pendência desfeita vira null, e o nome vai para a coluna nome', () => {
    expect(colunasDoAluno({ ...aluno, pendencia: null, name: 'Val' }, ['pendencia', 'name'])).toEqual(
      { pendencia_origem: null, nome: 'Val' },
    );
  });

  it('campo derivado ou de outra tabela não vira coluna', () => {
    expect(colunasDoAluno(aluno, ['hoje', 'id', 'proposta', 'criadoEm'])).toEqual({});
  });
});

describe('a aula fixa estruturada (SCRUM-89)', () => {
  const ANA: Aluno = {
    id: 'ana',
    name: 'Ana',
    disciplina: 'Piano',
    dia: 'terça e quinta',
    hora: '18h',
    hoje: false,
    total: 8,
    usadas: 2,
    validade: '30/11',
    reposicoes: 0,
    pagamento: { status: 'sem' },
  };
  /** O aluno ao banco e de volta, como numa carga em outro aparelho. */
  const ida = (a: Aluno, extra: Partial<LinhaDoAluno> = {}) => {
    const linha = {
      ...alunoParaBanco(a, QUARTA),
      professor_id: PROFESSOR,
      criado_em: new Date(2026, 9, 1, 15).toISOString(),
      token_publico: 't',
      versao: 0,
      ...extra,
    } as LinhaDoAluno;
    return { linha, volta: alunoDoBanco(linha, undefined, QUARTA) };
  };

  it('terça e quinta às 18h vai como jsonb e volta igual', () => {
    const { linha, volta } = ida({ ...ANA, aulaFixa: { dias: ['ter', 'qui'], hora: 18 } });
    expect(linha.aula_fixa).toEqual({ dias: ['ter', 'qui'], hora: 18 });
    expect(volta.aulaFixa).toEqual({ dias: ['ter', 'qui'], hora: 18 });
  });

  it('sem horário fixo também vai e volta: nenhum dia e sem hora', () => {
    const { volta } = ida({ ...ANA, aulaFixa: { dias: [], hora: null } });
    expect(volta.aulaFixa).toEqual({ dias: [], hora: null });
  });

  it('a linha antiga, com aula_fixa nula, abre igual a antes: o horário sai do texto', () => {
    const { linha, volta } = ida(ANA);
    expect(linha.aula_fixa).toBeNull();
    expect('aulaFixa' in volta).toBe(false);
    expect(aulaFixaDe(volta)).toEqual({ dias: ['ter', 'qui'], hora: 18 });
    expect(volta.hoje).toBe(false); // QUARTA
    expect(alunoDoBanco(linha, undefined, QUINTA).hoje).toBe(true);
  });

  it('o `hoje` sai da estrutura, mesmo quando o texto diz outra coisa', () => {
    const { linha } = ida({ ...ANA, dia: 'segunda', aulaFixa: { dias: ['qui'], hora: 18 } });
    expect(alunoDoBanco(linha, undefined, QUINTA).hoje).toBe(true);
  });

  it('o update da ficha grava a coluna aula_fixa', () => {
    expect(colunasDoAluno({ ...ANA, aulaFixa: { dias: ['seg'], hora: 9 } }, ['aulaFixa'])).toEqual({
      aula_fixa: { dias: ['seg'], hora: 9 },
    });
    expect(colunasDoAluno({ ...ANA, aulaFixa: null }, ['aulaFixa'])).toEqual({ aula_fixa: null });
  });
});

describe('extrato que nasceu antes do banco', () => {
  const l = (d: string, t = 'Aula realizada'): Lancamento => ({ d, t, s: '', delta: -1, saldo: 1 });

  it('o ano de cada data sai do lançamento de cima: histórico longo não cai no futuro', () => {
    const linhas = extratoParaBanco(
      [l('20/10'), l('15/06'), l('10/02'), l('28/12'), l('28/12')],
      'x',
      PROFESSOR,
      dia(2026, 10, 23),
    );
    expect(linhas.map((x) => x.data)).toEqual([
      '2026-10-20',
      '2026-06-15',
      '2026-02-10',
      '2025-12-28',
      '2025-12-28',
    ]);
  });

  it('criado_em decresce com a posição, mesmo no mesmo dia', () => {
    const [a, b] = extratoParaBanco([l('20/10'), l('20/10')], 'x', PROFESSOR, QUARTA);
    expect(Date.parse(a.criado_em as string)).toBeGreaterThan(Date.parse(b.criado_em as string));
  });

  it('o tipo sai do título, e o que não casar é legado', () => {
    expect(tipoPorTitulo('Pacote de 8 aulas')).toBe('pacote');
    expect(tipoPorTitulo('Falta avisada')).toBe('falta_avisada');
    expect(tipoPorTitulo('Ajuste manual')).toBe('legado');
  });
});

describe('perfil', () => {
  const perfil = estadoInicial().perfil;

  it('o e-mail não vai no update: no banco ele é o do login', () => {
    expect(perfilParaBanco(perfil)).not.toHaveProperty('email');
  });

  it('faixa de alunos nula volta com o padrão, e a chave Pix vazia fica ausente', () => {
    const p = perfilDoBanco({
      id: PROFESSOR,
      email: EMAIL_DO_LOGIN,
      nome: '',
      iniciais: '',
      disciplinas: [],
      faixa_de_alunos: null,
      chave_pix: null,
      plano: 'gratuito',
      pacote_padrao: null,
      preferencias_aviso: null,
      onboarding_concluido: false,
      criado_em: new Date().toISOString(),
    } as LinhaDoProfessor);
    expect(p.faixaDeAlunos).toBe('1–5');
    expect(p).not.toHaveProperty('chavePix');
  });
});

describe('estadoVazio — a conta nova', () => {
  it('não tem aluno de demonstração', () => {
    expect(estadoVazio().alunos).toEqual([]);
    expect(estadoVazio().extratos).toEqual({});
  });

  it('a política é a padrão das colunas: 24h, devolve, 3 reposições, 60 dias', () => {
    expect(estadoVazio().politicas).toEqual({
      avisoHoras: 24,
      avisadaDevolve: true,
      limiteReposicoes: 3,
      validadeDias: 60,
    });
  });

  it('devolve um objeto novo a cada chamada', () => {
    expect(estadoVazio()).not.toBe(estadoVazio());
    expect(estadoVazio().alunos).not.toBe(estadoVazio().alunos);
  });
});

describe('movimento (Parte 5): o que a RPC recebe', () => {
  // Sem os tipos do Node, como no teste do seed: o `fs` vem pelo jest, e a raiz
  // do repositório sai do caminho deste arquivo.
  const { readFileSync } = jest.requireActual('fs') as {
    readFileSync(arquivo: string, codificacao: 'utf8'): string;
  };
  const RAIZ = (expect.getState().testPath as string).split(/[\\/]/).slice(0, -5).join('/');
  const migracao = readFileSync(`${RAIZ}/supabase/migrations/0005_aplicar_movimento.sql`, 'utf8');

  it('as colunas do movimento são as do update da 0005, nem uma a mais, nem uma a menos', () => {
    const set = /update public\.alunos a set([\s\S]*?)from jsonb_populate_record/.exec(migracao)?.[1] ?? '';
    const colunas = [...set.matchAll(/^\s*(\w+)\s*=/gm)].map((m) => m[1]).filter((c) => c !== 'versao');
    expect([...colunas].sort()).toEqual([...COLUNAS_DO_MOVIMENTO].sort());
  });

  it('o lançamento vai com o tipo da ação e a data com ano', () => {
    expect(
      lancamentoDoMovimento({ d: '23/10', t: 'Aula realizada', s: 'Sexta, 17h', delta: -1, saldo: 3 }, 'aula', QUINTA),
    ).toEqual({
      tipo: 'aula',
      data: '2026-10-23',
      titulo: 'Aula realizada',
      subtitulo: 'Sexta, 17h',
      delta: -1,
      saldo_depois: 3,
      dinheiro: false,
    });
  });

  it("a proposta nova vai com status 'enviada', que é o que faz a RPC inserir", () => {
    expect(
      propostaDoMovimento(
        { janela: { dia: 'Sexta, 30/10', hora: '17h' }, enviadaEm: '22/10', status: 'enviada', alternativas: [] },
        QUINTA,
      ),
    ).toEqual({
      status: 'enviada',
      janela: { dia: 'Sexta, 30/10', hora: '17h' },
      alternativas: [],
      enviada_em: '2026-10-22',
    });
  });
});

describe('a data atravessa com o ano (SCRUM-83, P2-3 da revisão da Parte 6)', () => {
  // O caso do relatório: o banco tem datas a mais de meio ano de 04/11/2026.
  const HOJE = dia(2026, 11, 4);
  const LINHA = { pagamento_em: '2026-02-07', encerrado: '2026-04-18', validade: '2027-08-31' };
  const aluno: Aluno = {
    id: 'x',
    name: 'Ana',
    disciplina: 'Piano',
    dia: 'quarta',
    hora: '17h',
    hoje: false,
    total: 8,
    usadas: 2,
    validade: '31/08',
    encerrado: '18/04',
    reposicoes: 0,
    pagamento: { status: 'pago', em: '07/02', meio: 'Pix' },
  };

  it('sem as datas lidas, o ano é inferido de novo e erra: é o defeito', () => {
    const linha = alunoParaBanco(aluno, HOJE);
    expect([linha.pagamento_em, linha.encerrado, linha.validade]).toEqual([
      '2027-02-07',
      '2027-04-18',
      '2026-08-31',
    ]);
  });

  it('com as datas lidas, cada uma volta com o ano que tinha', () => {
    const linha = alunoParaBanco(aluno, HOJE, datasDoBanco(LINHA));
    expect([linha.pagamento_em, linha.encerrado, linha.validade]).toEqual([
      '2026-02-07',
      '2026-04-18',
      '2027-08-31',
    ]);
  });

  it('a data que mudou tem o ano inferido: quem muda é uma ação de hoje', () => {
    const pagoHoje = { ...aluno, pagamento: { status: 'pago' as const, em: '04/11', meio: 'Pix' as const } };
    expect(alunoParaBanco(pagoHoje, HOJE, datasDoBanco(LINHA)).pagamento_em).toBe('2026-11-04');
  });

  it('a data apagada vira null, mesmo havendo uma lida', () => {
    const semEncerrar = { ...aluno, encerrado: undefined };
    expect(alunoParaBanco(semEncerrar, HOJE, datasDoBanco(LINHA)).encerrado).toBeNull();
  });

  it('o update direto também mantém o ano', () => {
    expect(colunasDoAluno(aluno, ['pagamento'], HOJE, datasDoBanco(LINHA)).pagamento_em).toBe('2026-02-07');
  });

  it('datasDoBanco pega só as colunas de data, e o timestamp vira data', () => {
    expect(datasDoBanco({ ...LINHA, nome: 'Ana', pendencia_origem: null } as never)).toEqual({
      ...LINHA,
      pendencia_origem: null,
    });
    expect(
      alunoParaBanco(aluno, HOJE, { pagamento_em: '2026-02-07T00:00:00+00:00' }).pagamento_em,
    ).toBe('2026-02-07');
  });
});
