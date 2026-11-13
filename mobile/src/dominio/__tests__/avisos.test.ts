/**
 * Os lembretes do professor (SCRUM-91). Cada `describe` é uma promessa da tela
 * de Avisos, com o número que a frase dela diz.
 *
 * `hoje` é literal, e o dia da semana sai de `diaDaSemanaDe`, como em
 * `agenda.test.ts`: o ano de um dd/mm é inferido, e o dia da semana muda com ele.
 */

import { estadoInicial } from '../../dados/semente';
import { lerAulaFixa } from '../aulaFixa';
import {
  aulasDaProximaHora,
  avisoDaAula,
  avisosDoDia,
  resumoDoDia,
  type AvisosDoDia,
} from '../avisos';
import { hoje as hojeReal, somarDias } from '../datas';
import { diaDaSemanaDe, DIAS } from '../disponibilidade';
import type { Aluno, DiaDaSemana, PreferenciasDeAviso } from '../tipos';

const HOJE = '28/08';
const DIA_DE_HOJE = diaDaSemanaDe(HOJE) as DiaDaSemana;
const OUTRO_DIA = DIAS.map((d) => d.chave).find((d) => d !== DIA_DE_HOJE) as DiaDaSemana;

const TUDO_LIGADO: PreferenciasDeAviso = {
  aulaDoDia: true,
  saldoBaixo: true,
  reposicaoPendente: true,
  pagamentoVencendo: true,
  antesDaAula: true,
};

const base: Aluno = {
  id: 'a',
  name: 'Bia Souza',
  disciplina: 'Inglês',
  dia: '',
  hora: '',
  aulaFixa: { dias: [DIA_DE_HOJE], hora: 18 },
  hoje: false,
  total: 8,
  usadas: 3,
  validade: '30/10',
  reposicoes: 0,
  pagamento: { status: 'pago' },
};

const com = (extra: Partial<Aluno>): Aluno => ({ ...base, ...extra });
const ids = (lista: { id: string }[]) => lista.map((a) => a.id);
const avisos = (alunos: Aluno[], prefs: Partial<PreferenciasDeAviso> = {}) =>
  avisosDoDia(alunos, { ...TUDO_LIGADO, ...prefs }, HOJE);

describe('aula do dia — "Aviso na manhã de cada aula"', () => {
  it('entra quem tem aula fixa no dia da semana de hoje', () => {
    const hojeTem = com({ id: 'hoje' });
    const outroDia = com({ id: 'outro', aulaFixa: { dias: [OUTRO_DIA], hora: 18 } });
    expect(ids(avisos([hojeTem, outroDia]).aulasDeHoje)).toEqual(['hoje']);
  });

  it('lê o horário do texto quando o aluno ainda não tem a estrutura', () => {
    const nome = DIAS.find((d) => d.chave === DIA_DE_HOJE)?.longo.toLowerCase() ?? '';
    const deTexto = com({ id: 'texto', aulaFixa: undefined, dia: nome, hora: '18h' });
    expect(ids(avisos([deTexto]).aulasDeHoje)).toEqual(['texto']);
  });

  it('arquivado e pausado não entram', () => {
    const arquivado = com({ id: 'arq', arquivado: true });
    const pausado = com({ id: 'pau', pausado: true });
    expect(avisos([arquivado, pausado]).aulasDeHoje).toEqual([]);
  });
});

describe('saldo baixo — "Quando restarem 2 aulas ou menos"', () => {
  it('2 aulas entra, 3 não', () => {
    const dois = com({ id: 'dois', total: 8, usadas: 6 });
    const tres = com({ id: 'tres', total: 8, usadas: 5 });
    expect(ids(avisos([dois, tres]).saldoBaixo)).toEqual(['dois']);
  });

  it('sem pacote não é saldo baixo, como na lista', () => {
    const semPacote = com({ id: 'sem', semPacote: true, total: 0, usadas: 0 });
    expect(avisos([semPacote]).saldoBaixo).toEqual([]);
  });
});

describe('reposição pendente — "Se ficar 3 dias sem horário escolhido"', () => {
  const pendente = (dias: number, extra: Partial<Aluno> = {}) =>
    com({ id: `p${dias}`, pendencia: { origem: somarDias(HOJE, -dias), dias }, ...extra });

  it('a partir de 3 dias entra; com 2 não', () => {
    expect(ids(avisos([pendente(2), pendente(3), pendente(9)]).reposicaoPendente)).toEqual([
      'p3',
      'p9',
    ]);
  });

  it('com reposição já marcada não entra', () => {
    const marcada = pendente(5, { agendada: { dia: 'Terça, 02/09', hora: '18h' } });
    expect(avisos([marcada]).reposicaoPendente).toEqual([]);
  });

  it('proposta enviada conta como horário escolhido; recusada volta a pendente', () => {
    const proposta = (status: 'enviada' | 'recusada') => ({
      janela: { dia: 'Terça, 02/09', hora: '18h' },
      enviadaEm: HOJE,
      status,
      alternativas: [],
    });
    const enviada = pendente(5, { id: 'enviada', proposta: proposta('enviada') });
    const recusada = pendente(5, { id: 'recusada', proposta: proposta('recusada') });
    expect(ids(avisos([enviada, recusada]).reposicaoPendente)).toEqual(['recusada']);
  });
});

describe('pagamento vencendo — "Três dias antes do vencimento"', () => {
  const vence = (dias: number, status: 'aberto' | 'pago' = 'aberto') =>
    com({ id: `v${dias}${status}`, pagamento: { status, vence: somarDias(HOJE, dias) } });

  it('só quando faltam exatamente 3 dias, para avisar uma vez só', () => {
    expect(ids(avisos([vence(2), vence(3), vence(4)]).pagamentoVencendo)).toEqual(['v3aberto']);
  });

  it('pagamento já pago não entra', () => {
    expect(avisos([vence(3, 'pago')]).pagamentoVencendo).toEqual([]);
  });
});

describe('preferência desligada', () => {
  it('cada categoria desligada volta vazia', () => {
    const todos = [
      com({ id: 'x', total: 8, usadas: 7 }),
      com({ id: 'y', pendencia: { origem: somarDias(HOJE, -4), dias: 4 } }),
      com({ id: 'z', pagamento: { status: 'aberto', vence: somarDias(HOJE, 3) } }),
    ];
    const desligado = avisos(todos, {
      aulaDoDia: false,
      saldoBaixo: false,
      reposicaoPendente: false,
      pagamentoVencendo: false,
    });
    expect(desligado).toEqual({
      aulasDeHoje: [],
      saldoBaixo: [],
      reposicaoPendente: [],
      pagamentoVencendo: [],
    });
  });
});

describe('resumoDoDia', () => {
  const lista = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `${i}`, nome: 'X' }));
  const resumo = (a: number, s: number, r: number, p: number) =>
    resumoDoDia({
      aulasDeHoje: lista(a),
      saldoBaixo: lista(s),
      reposicaoPendente: lista(r),
      pagamentoVencendo: lista(p),
    } satisfies AvisosDoDia);

  it('junta as categorias numa frase só', () => {
    expect(resumo(2, 1, 1, 0)).toBe('Hoje: 2 aulas, 1 saldo baixo e 1 reposição sem horário.');
  });

  it('usa o plural de cada categoria', () => {
    expect(resumo(1, 2, 2, 2)).toBe(
      'Hoje: 1 aula, 2 saldos baixos, 2 reposições sem horário e 2 pagamentos vencendo.',
    );
  });

  it('uma categoria só, sem vírgula nem "e"', () => {
    expect(resumo(0, 0, 0, 1)).toBe('Hoje: 1 pagamento vencendo.');
  });

  it('sem nada para avisar, null: não há push', () => {
    expect(resumo(0, 0, 0, 0)).toBeNull();
  });
});

describe('antes da aula — "Uma hora antes de cada aula"', () => {
  const as = (hora: number, extra: Partial<Aluno> = {}) =>
    com({ id: `h${hora}`, aulaFixa: { dias: [DIA_DE_HOJE], hora }, ...extra });

  it('às 17h, entram as aulas de hoje das 18h', () => {
    const lista = aulasDaProximaHora([as(18), as(19)], TUDO_LIGADO, HOJE, 17);
    expect(lista).toEqual([{ id: 'h18', nome: 'Bia Souza', hora: 18 }]);
  });

  it('não entram: aula de outro dia, sem hora, arquivado, pausado', () => {
    const outroDia = com({ id: 'outro', aulaFixa: { dias: [OUTRO_DIA], hora: 18 } });
    const semHora = com({ id: 'semHora', aulaFixa: { dias: [DIA_DE_HOJE], hora: null } });
    const lista = [outroDia, semHora, as(18, { arquivado: true }), as(18, { pausado: true })];
    expect(aulasDaProximaHora(lista, TUDO_LIGADO, HOJE, 17)).toEqual([]);
  });

  it('dois alunos na mesma hora geram dois avisos', () => {
    const lista = [as(18, { id: 'um' }), as(18, { id: 'dois', name: 'Caio Lima' })];
    expect(ids(aulasDaProximaHora(lista, TUDO_LIGADO, HOJE, 17))).toEqual(['um', 'dois']);
  });

  it('desligado não avisa; ausente (preferência gravada antes) vale ligado', () => {
    const { antesDaAula: _, ...semAChave } = TUDO_LIGADO;
    expect(aulasDaProximaHora([as(18)], { ...TUDO_LIGADO, antesDaAula: false }, HOJE, 17)).toEqual(
      [],
    );
    expect(ids(aulasDaProximaHora([as(18)], semAChave, HOJE, 17))).toEqual(['h18']);
  });

  it('a frase usa o primeiro nome e a hora cheia', () => {
    expect(avisoDaAula({ nome: 'Bia Souza', hora: 18 })).toBe('Aula com Bia às 18h.');
  });
});

describe('a semente', () => {
  const alunos = estadoInicial().alunos;
  const hoje = hojeReal();
  const doDia = avisosDoDia(alunos, TUDO_LIGADO, hoje);

  it('o Rafael (saldo 2) é o saldo baixo', () => {
    expect(ids(doDia.saldoBaixo)).toEqual(['raf']);
  });

  it('a reposição do Rafael tem proposta enviada, então não é cobrada', () => {
    expect(doDia.reposicaoPendente).toEqual([]);
  });

  it('nenhum pagamento vence daqui a 3 dias', () => {
    expect(doDia.pagamentoVencendo).toEqual([]);
  });

  it('as aulas de hoje são as de quem tem aula fixa no dia da semana real', () => {
    const dia = diaDaSemanaDe(hoje);
    const esperado = alunos
      .filter((a) => !a.pausado && dia !== null && lerAulaFixa(a.dia, a.hora).dias.includes(dia))
      .map((a) => a.id);
    expect(ids(doDia.aulasDeHoje)).toEqual(esperado);
  });

  it('o resumo cita o saldo baixo', () => {
    expect(resumoDoDia(doDia)).toMatch(/1 saldo baixo/);
  });
});
