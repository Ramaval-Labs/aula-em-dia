/**
 * Conversor de fronteira (SCRUM-20).
 *
 * O teste que mais importa é a ida e volta: a semente vai ao banco e volta
 * como o mesmo `Persistido` que a store espera. "O mesmo" tem uma lista
 * curta de exceções, e cada uma está em `canonico` abaixo com o motivo — é a
 * lista das decisões da Parte 4 em docs/backend/PLANO-BACKEND.md. A segunda
 * volta, essa sim, tem de ser idêntica à primeira.
 */

import { formatarDdMm } from '../../dominio/datas';
import type { Aluno, Lancamento } from '../../dominio/tipos';
import { criadoEmDoBanco, EMAIL_DO_LOGIN, linhasDoPersistido } from '../__simulados__/linhas';
import {
  alunoDoBanco,
  alunoParaBanco,
  colunasDoAluno,
  dataDoBanco,
  dataParaBanco,
  estadoVazio,
  extratoParaBanco,
  montarPersistido,
  perfilDoBanco,
  perfilParaBanco,
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
          hoje: temAulaHoje(a.dia),
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
  it.each([
    ['quarta', 'quarta', QUARTA, true],
    ['quarta', 'quinta', QUINTA, false],
    ['terça e quinta', 'quinta', QUINTA, true],
    ['Quinta-feira', 'quinta', QUINTA, true],
    ['ter e qui', 'quinta', QUINTA, true],
    ['sem horário fixo', 'quarta', QUARTA, false],
    ['sábado', 'sábado', dia(2026, 10, 24), true],
  ])('"%s" numa %s → %s', (diaFixo, _nome, referencia, esperado) => {
    expect(temAulaHoje(diaFixo, referencia)).toBe(esperado);
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
