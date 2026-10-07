/**
 * Motor de sugestão de reposição. As razões e os rótulos vão para a tela,
 * então são conferidos letra a letra — mesmo contrato de
 * `disponibilidade.test.ts`.
 *
 * `hoje` entra como literal, e não por `hoje()` de `datas.ts`: a suíte tem de
 * sobreviver à virada de `USAR_DATA_REAL`. Pelo mesmo motivo nenhum nome de
 * dia da semana é escrito à mão — sai de `diaDaSemanaDe`, porque o ano de um
 * dd/mm é inferido e o dia da semana muda com ele.
 */

import {
  blocosDaAulaFixa,
  candidatos,
  diasDoAluno,
  faixaDaHora,
  filtrar,
  horaDoAluno,
  horasLivres,
  MELHORES,
  melhores,
  motivosDaFalta,
  porSemana,
  type Candidata,
} from '../agenda';
import { diasEntre, somarDias } from '../datas';
import { diaDaSemanaDe, nomeDoDia, temBloco } from '../disponibilidade';
import type {
  Aluno,
  BlocoSemanal,
  DiaDaSemana,
  Disponibilidade,
  FaixaHoraria,
  Folga,
} from '../tipos';

const HOJE = '28/08';

/** O padrão desenhado em A5: 13 blocos. */
const PADRAO_A5: BlocoSemanal[] = [
  { dia: 'ter', faixa: 'manha' },
  { dia: 'qui', faixa: 'manha' },
  ...(['seg', 'ter', 'qua', 'qui', 'sex'] as const).map((dia) => ({
    dia,
    faixa: 'tarde' as const,
  })),
  ...(['seg', 'ter', 'qua', 'qui', 'sex'] as const).map((dia) => ({
    dia,
    faixa: 'fimTarde' as const,
  })),
  { dia: 'qua', faixa: 'noite' },
];

/** As duas folgas de `dados/semente.ts`. */
const FOLGAS: Folga[] = [
  { de: '07/09', ate: '07/09', motivo: 'feriado' },
  { de: '14/09', ate: '21/09', motivo: 'viagem' },
];

const DISPONIBILIDADE: Disponibilidade = {
  blocos: PADRAO_A5,
  sugereSabado: false,
  aceitaForaDosBlocos: false,
  folgas: FOLGAS,
};

const TODOS_OS_DIAS: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const TODAS_AS_FAIXAS: FaixaHoraria[] = ['manha', 'tarde', 'fimTarde', 'noite'];

/**
 * Agenda sem restrição nenhuma: todo bloco livre, sábado ligado, sem folga.
 * Cada teste de descarte parte dela e muda UMA coisa, para que a regra
 * testada seja a única que pode tirar a janela da lista.
 */
const ABERTA: Disponibilidade = {
  blocos: TODOS_OS_DIAS.flatMap((dia) => TODAS_AS_FAIXAS.map((faixa) => ({ dia, faixa }))),
  sugereSabado: true,
  aceitaForaDosBlocos: false,
  folgas: [],
};

const aluno: Aluno = {
  id: 'a',
  name: 'Aluno de teste',
  disciplina: 'Matemática',
  dia: 'quarta',
  hora: '17h',
  hoje: false,
  total: 8,
  usadas: 3,
  validade: '30/10',
  reposicoes: 0,
  pagamento: { status: 'pago' },
};

const com = (extra: Partial<Aluno>): Aluno => ({ ...aluno, ...extra });

/** 28/08 → 30/10: 3 dias de agosto, 30 de setembro, 30 de outubro. */
const ATE_A_VALIDADE = 63;

const datas = (lista: Candidata[]) => lista.map((c) => c.data);
const temJanela = (lista: Candidata[], b: BlocoSemanal) =>
  lista.some((c) => c.bloco.dia === b.dia && c.bloco.faixa === b.faixa);

// --- leitura do horário fixo ----------------------------------------------

describe('diasDoAluno', () => {
  it('lê dois dias num texto só', () => {
    expect(diasDoAluno(com({ dia: 'terça e quinta' }))).toEqual(['ter', 'qui']);
  });

  it('aceita terça sem acento', () => {
    expect(diasDoAluno(com({ dia: 'terca' }))).toEqual(['ter']);
  });

  it('lê um dia só', () => {
    expect(diasDoAluno(com({ dia: 'quarta' }))).toEqual(['qua']);
  });

  it('ignora maiúsculas', () => {
    expect(diasDoAluno(com({ dia: 'Sábado' }))).toEqual(['sab']);
  });

  it('texto vazio não tem dia', () => {
    expect(diasDoAluno(com({ dia: '' }))).toEqual([]);
  });

  it('não repete o dia quando o texto o cita duas vezes', () => {
    expect(diasDoAluno(com({ dia: 'quarta, e às vezes quarta' }))).toEqual(['qua']);
  });
});

describe('horaDoAluno', () => {
  it('lê "17h"', () => {
    expect(horaDoAluno(com({ hora: '17h' }))).toBe(17);
  });

  it('aceita espaço antes do h', () => {
    expect(horaDoAluno(com({ hora: '8 h' }))).toBe(8);
  });

  it('texto vazio não tem hora', () => {
    expect(horaDoAluno(com({ hora: '' }))).toBeNull();
  });
});

describe('faixaDaHora', () => {
  it('o início da faixa pertence a ela', () => {
    expect(faixaDaHora(8)).toBe('manha');
    expect(faixaDaHora(14)).toBe('tarde');
    expect(faixaDaHora(17)).toBe('fimTarde');
  });

  it('o meio da faixa pertence a ela', () => {
    expect(faixaDaHora(21)).toBe('noite');
  });

  it('o fim da faixa já não pertence a ela', () => {
    expect(faixaDaHora(22)).toBeNull();
  });

  // Lacuna do modelo, afirmada de propósito: FAIXAS vai de 8–12 e retoma em
  // 14–17, então o almoço não tem faixa. Aula fixa às 12h ou 13h não ocupa
  // bloco nenhum. Mudar isso é decisão de produto, não conserto de teste.
  it('12h e 13h não caem em faixa nenhuma', () => {
    expect(faixaDaHora(12)).toBeNull();
    expect(faixaDaHora(13)).toBeNull();
  });

  it('antes das 8h não há faixa', () => {
    expect(faixaDaHora(7)).toBeNull();
  });
});

describe('blocosDaAulaFixa', () => {
  it('um bloco por dia, na faixa da hora', () => {
    expect(blocosDaAulaFixa(com({ dia: 'terça e quinta', hora: '18h' }))).toEqual([
      { dia: 'ter', faixa: 'fimTarde' },
      { dia: 'qui', faixa: 'fimTarde' },
    ]);
  });

  it('aluno sem hora reconhecível não ocupa bloco', () => {
    expect(blocosDaAulaFixa(com({ hora: 'a combinar' }))).toEqual([]);
  });

  it('aula fixa no almoço não ocupa bloco', () => {
    expect(blocosDaAulaFixa(com({ hora: '12h' }))).toEqual([]);
  });
});

// --- descarte -------------------------------------------------------------

describe('candidatos — descarte', () => {
  it('data dentro de folga não aparece', () => {
    const livre = candidatos(aluno, [aluno], ABERTA, HOJE);
    const comFolga = candidatos(aluno, [aluno], { ...ABERTA, folgas: FOLGAS }, HOJE);

    expect(datas(livre)).toEqual(expect.arrayContaining(['07/09', '14/09', '18/09', '21/09']));
    for (const data of ['07/09', '14/09', '18/09', '21/09']) {
      expect(datas(comFolga)).not.toContain(data);
    }
    expect(datas(comFolga)).toContain('22/09');
  });

  it('sábado só aparece quando o professor aceita sugerir sábado', () => {
    const ehSabado = (c: Candidata) => c.bloco.dia === 'sab';
    const sem = candidatos(aluno, [aluno], { ...ABERTA, sugereSabado: false }, HOJE);
    const comSabado = candidatos(aluno, [aluno], ABERTA, HOJE);

    expect(sem.some(ehSabado)).toBe(false);
    expect(comSabado.some(ehSabado)).toBe(true);
  });

  it('bloco fora da disponibilidade do professor sai quando ele não aceita', () => {
    const lista = candidatos(aluno, [aluno], DISPONIBILIDADE, HOJE);
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((c) => temBloco(PADRAO_A5, c.bloco))).toBe(true);

    const aceita = candidatos(aluno, [aluno], { ...DISPONIBILIDADE, aceitaForaDosBlocos: true }, HOJE);
    expect(aceita.some((c) => !temBloco(PADRAO_A5, c.bloco))).toBe(true);
  });

  it('bloco da aula fixa de outro aluno não aparece', () => {
    const outro = com({ id: 'b', dia: 'segunda', hora: '15h' });
    const segTarde: BlocoSemanal = { dia: 'seg', faixa: 'tarde' };

    expect(temJanela(candidatos(aluno, [aluno], ABERTA, HOJE), segTarde)).toBe(true);
    expect(temJanela(candidatos(aluno, [aluno, outro], ABERTA, HOJE), segTarde)).toBe(false);
  });

  it('a aula fixa do próprio aluno não ocupa o bloco dele', () => {
    const quaFimTarde: BlocoSemanal = { dia: 'qua', faixa: 'fimTarde' };
    expect(temJanela(candidatos(aluno, [aluno], ABERTA, HOJE), quaFimTarde)).toBe(true);
  });

  it('aluno arquivado não ocupa bloco nenhum', () => {
    const arquivado = com({ id: 'b', dia: 'segunda', hora: '15h', arquivado: true });
    const segTarde: BlocoSemanal = { dia: 'seg', faixa: 'tarde' };
    expect(temJanela(candidatos(aluno, [aluno, arquivado], ABERTA, HOJE), segTarde)).toBe(true);
  });

  it('aluno que declarou disponibilidade só recebe janela dentro dela', () => {
    const disp: BlocoSemanal[] = [
      { dia: 'ter', faixa: 'noite' },
      { dia: 'sex', faixa: 'manha' },
    ];
    const lista = candidatos(com({ disponibilidade: disp }), [aluno], ABERTA, HOJE);

    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((c) => temBloco(disp, c.bloco))).toBe(true);
  });

  it('pacote vencido não tem janela', () => {
    expect(candidatos(com({ validade: '20/08' }), [aluno], ABERTA, HOJE)).toEqual([]);
  });

  it('pacote que vence hoje não tem janela', () => {
    expect(candidatos(com({ validade: HOJE }), [aluno], ABERTA, HOJE)).toEqual([]);
  });
});

describe('candidatos — horizonte', () => {
  it('começa amanhã e chega ao dia da validade', () => {
    const lista = candidatos(com({ validade: '05/09' }), [aluno], ABERTA, HOJE);
    const dias = lista.map((c) => c.emDias);

    expect(Math.min(...dias)).toBe(1);
    expect(Math.max(...dias)).toBe(8);
    expect(datas(lista)).toContain('05/09');
    expect(datas(lista)).not.toContain(HOJE);
  });

  it('nunca passa de 60 dias, mesmo com validade mais longe', () => {
    const lista = candidatos(aluno, [aluno], ABERTA, HOJE);
    expect(ATE_A_VALIDADE).toBeGreaterThan(60);
    expect(Math.max(...lista.map((c) => c.emDias))).toBe(60);
  });

  it('sem validade, olha 30 dias à frente', () => {
    const lista = candidatos(com({ validade: '' }), [aluno], ABERTA, HOJE);
    expect(Math.max(...lista.map((c) => c.emDias))).toBe(30);
  });

  it('data e emDias andam juntas', () => {
    for (const c of candidatos(aluno, [aluno], ABERTA, HOJE)) {
      expect(c.data).toBe(somarDias(HOJE, c.emDias));
    }
  });
});

// --- pontuação ------------------------------------------------------------

/**
 * Os pesos de `candidatos()` em `agenda.ts`. Não são exportados; ficam aqui
 * com o mesmo nome do efeito, para que mudar um peso lá quebre um teste só.
 */
const BASE = 100;
const MESMO_HORARIO = 40;
const MARCOU_DISPONIVEL = 25;
const FORA_DO_HABITUAL = -30;

const RAZAO_MESMO_HORARIO = 'É o mesmo horário da aula fixa dele.';
const RAZAO_MARCOU = 'Ele marcou esse bloco como disponível.';
const RAZAO_FORA = 'Está fora dos seus blocos habituais.';
const razaoDoPrazo = (c: Candidata) =>
  `Acontece ${ATE_A_VALIDADE - c.emDias} dias antes do pacote vencer, em 30/10.`;

const noBloco = (lista: Candidata[], b: BlocoSemanal) =>
  lista.filter((c) => c.bloco.dia === b.dia && c.bloco.faixa === b.faixa);

const QUA_FIM_TARDE: BlocoSemanal = { dia: 'qua', faixa: 'fimTarde' };
const SEG_MANHA: BlocoSemanal = { dia: 'seg', faixa: 'manha' };

describe('candidatos — pontuação', () => {
  it('sem parcela nenhuma, vale mais quanto mais cedo', () => {
    const janelas = noBloco(candidatos(aluno, [aluno], ABERTA, HOJE), SEG_MANHA);
    expect(janelas.length).toBeGreaterThan(0);
    for (const c of janelas) {
      expect(c.pontos).toBe(BASE - c.emDias);
      expect(c.razoes).toEqual([razaoDoPrazo(c)]);
    }
  });

  it('o mesmo horário da aula fixa soma', () => {
    const janelas = noBloco(candidatos(aluno, [aluno], ABERTA, HOJE), QUA_FIM_TARDE);
    expect(janelas.length).toBeGreaterThan(0);
    for (const c of janelas) {
      expect(c.pontos).toBe(BASE - c.emDias + MESMO_HORARIO);
      expect(c.razoes).toEqual([RAZAO_MESMO_HORARIO, razaoDoPrazo(c)]);
    }
  });

  it('o bloco que o aluno marcou como disponível soma', () => {
    const lista = candidatos(com({ disponibilidade: [SEG_MANHA] }), [aluno], ABERTA, HOJE);
    expect(lista.length).toBeGreaterThan(0);
    for (const c of lista) {
      expect(c.pontos).toBe(BASE - c.emDias + MARCOU_DISPONIVEL);
      expect(c.razoes).toEqual([RAZAO_MARCOU, razaoDoPrazo(c)]);
    }
  });

  it('o bloco fora dos habituais do professor desconta', () => {
    const disp = { ...DISPONIBILIDADE, folgas: [], aceitaForaDosBlocos: true };
    const janelas = noBloco(candidatos(aluno, [aluno], disp, HOJE), SEG_MANHA);
    expect(temBloco(PADRAO_A5, SEG_MANHA)).toBe(false);
    expect(janelas.length).toBeGreaterThan(0);
    for (const c of janelas) {
      expect(c.pontos).toBe(BASE - c.emDias + FORA_DO_HABITUAL);
      expect(c.razoes).toEqual([RAZAO_FORA, razaoDoPrazo(c)]);
    }
  });

  // A tela mostra `razoes[0]` como o motivo da janela, então a ordem é contrato.
  it('com todas as parcelas, as razões saem nesta ordem', () => {
    const professor: Disponibilidade = {
      ...ABERTA,
      blocos: ABERTA.blocos.filter((b) => !(b.dia === 'qua' && b.faixa === 'fimTarde')),
      aceitaForaDosBlocos: true,
    };
    const lista = candidatos(com({ disponibilidade: [QUA_FIM_TARDE] }), [aluno], professor, HOJE);
    expect(lista.length).toBeGreaterThan(0);
    for (const c of lista) {
      expect(c.razoes).toEqual([RAZAO_MESMO_HORARIO, RAZAO_MARCOU, RAZAO_FORA, razaoDoPrazo(c)]);
      expect(c.pontos).toBe(
        BASE - c.emDias + MESMO_HORARIO + MARCOU_DISPONIVEL + FORA_DO_HABITUAL,
      );
    }
  });

  it('o motivo é a primeira razão', () => {
    for (const c of candidatos(aluno, [aluno], ABERTA, HOJE)) {
      expect(c.motivo).toBe(c.razoes[0]);
    }
  });

  it('a lista sai da maior pontuação para a menor', () => {
    const pontos = candidatos(aluno, [aluno], ABERTA, HOJE).map((c) => c.pontos);
    expect(pontos).toEqual([...pontos].sort((a, b) => b - a));
  });

  it('a aula fixa da próxima semana ganha da janela de amanhã', () => {
    const [primeira] = candidatos(aluno, [aluno], ABERTA, HOJE);
    expect(primeira.bloco).toEqual(QUA_FIM_TARDE);
  });

  it('nenhuma janela sai marcada como melhor', () => {
    expect(candidatos(aluno, [aluno], ABERTA, HOJE).some((c) => c.melhor)).toBe(false);
  });

  // Mesma regra de plural que o resto da copy segue ("1 bloco", "1 bloco
  // marcado"). Hoje sai "Acontece 1 dias antes". Registrado no SCRUM-32.
  it.failing('um dia antes do vencimento a razão fica no singular', () => {
    const lista = candidatos(com({ validade: '05/09' }), [aluno], ABERTA, HOJE);
    const vespera = lista.find((c) => c.data === '04/09');
    expect(vespera?.razoes).toContain('Acontece 1 dia antes do pacote vencer, em 05/09.');
  });
});

describe('candidatos — o que a tela mostra', () => {
  it('o dia vem por extenso com a data', () => {
    for (const c of candidatos(aluno, [aluno], ABERTA, HOJE).slice(0, 10)) {
      const dia = diaDaSemanaDe(c.data) as DiaDaSemana;
      expect(c.dia).toBe(`${nomeDoDia(dia)}, ${c.data}`);
      expect(c.bloco.dia).toBe(dia);
    }
  });

  it('na faixa da aula fixa, sugere a hora de sempre', () => {
    const [c] = noBloco(candidatos(aluno, [aluno], ABERTA, HOJE), QUA_FIM_TARDE);
    expect(c.hora).toBe('17h');
  });

  it('em outra faixa, sugere o início dela', () => {
    const lista = candidatos(aluno, [aluno], ABERTA, HOJE);
    expect(noBloco(lista, SEG_MANHA)[0].hora).toBe('8h');
    expect(noBloco(lista, { dia: 'seg', faixa: 'tarde' })[0].hora).toBe('14h');
    expect(noBloco(lista, { dia: 'seg', faixa: 'noite' })[0].hora).toBe('20h');
  });

  it('aluno sem hora recebe o início da faixa', () => {
    const lista = candidatos(com({ hora: '' }), [aluno], ABERTA, HOJE);
    expect(noBloco(lista, { dia: 'qua', faixa: 'fimTarde' })[0].hora).toBe('17h');
    expect(noBloco(lista, SEG_MANHA)[0].hora).toBe('8h');
  });
});

// --- apresentação ---------------------------------------------------------

describe('melhores', () => {
  const lista = candidatos(aluno, [aluno], ABERTA, HOJE);

  it(`devolve as ${MELHORES} primeiras`, () => {
    expect(MELHORES).toBe(3);
    expect(melhores(lista).map((c) => c.data)).toEqual(lista.slice(0, 3).map((c) => c.data));
  });

  it('marca só a primeira como melhor', () => {
    expect(melhores(lista).map((c) => c.melhor)).toEqual([true, false, false]);
  });

  it('aceita outra quantidade', () => {
    expect(melhores(lista, 5)).toHaveLength(5);
  });

  it('não muta a entrada', () => {
    melhores(lista);
    expect(lista.some((c) => c.melhor)).toBe(false);
  });

  it('lista vazia devolve vazia', () => {
    expect(melhores([])).toEqual([]);
  });
});

describe('filtrar', () => {
  const lista = candidatos(aluno, [aluno], ABERTA, HOJE);

  it('fim de semana deixa só sábado e domingo', () => {
    const fds = filtrar(lista, 'fimDeSemana');
    expect(fds.length).toBeGreaterThan(0);
    expect(fds.every((c) => c.bloco.dia === 'sab' || c.bloco.dia === 'dom')).toBe(true);
    expect(fds).toHaveLength(
      lista.filter((c) => c.bloco.dia === 'sab' || c.bloco.dia === 'dom').length,
    );
  });

  it('os outros filtros devolvem a lista inteira', () => {
    expect(filtrar(lista, 'todos')).toBe(lista);
    expect(filtrar(lista, 'livres')).toBe(lista);
  });
});

describe('porSemana', () => {
  const lista = candidatos(aluno, [aluno], ABERTA, HOJE);
  const grupos = porSemana(lista);

  it('os rótulos saem em ordem', () => {
    expect(grupos.slice(0, 4).map((g) => g.rotulo)).toEqual([
      'Esta semana',
      'Semana que vem',
      'Em 2 semanas',
      'Em 3 semanas',
    ]);
  });

  // A "semana" é a janela de 7 dias a partir de amanhã, não a semana do
  // calendário. Se isso mudar, o rótulo "Esta semana" muda de sentido.
  it('agrupa de sete em sete dias a partir de amanhã', () => {
    expect(grupos[0].janelas.every((c) => c.emDias >= 1 && c.emDias <= 7)).toBe(true);
    expect(grupos[1].janelas.every((c) => c.emDias >= 8 && c.emDias <= 14)).toBe(true);
  });

  it('dentro do grupo, as janelas vão da mais cedo para a mais tarde', () => {
    for (const g of grupos) {
      const dias = g.janelas.map((c) => c.emDias);
      expect(dias).toEqual([...dias].sort((a, b) => a - b));
    }
  });

  it('não perde nem duplica janela', () => {
    expect(grupos.reduce((t, g) => t + g.janelas.length, 0)).toBe(lista.length);
  });

  it('semana sem janela não vira grupo vazio', () => {
    const soAmanhaENaOutra = lista.filter((c) => c.emDias === 1 || c.emDias === 15);
    expect(porSemana(soAmanhaENaOutra).map((g) => g.rotulo)).toEqual([
      'Esta semana',
      'Em 2 semanas',
    ]);
  });
});

describe('motivosDaFalta', () => {
  it('pacote em dia, agenda marcada, aluno sem disponibilidade', () => {
    expect(motivosDaFalta(aluno, [aluno], DISPONIBILIDADE, HOJE)).toEqual([
      `O pacote vence em 30/10, daqui a ${ATE_A_VALIDADE} dias.`,
      'Seus 13 blocos livres batem com aula fixa de outro aluno.',
      'Ele ainda não informou quando pode repor.',
    ]);
  });

  it('professor sem bloco marcado', () => {
    const razoes = motivosDaFalta(aluno, [aluno], { ...DISPONIBILIDADE, blocos: [] }, HOJE);
    expect(razoes[1]).toBe('Você ainda não marcou nenhum bloco na sua disponibilidade.');
  });

  it('aluno com disponibilidade que não cruza', () => {
    const razoes = motivosDaFalta(
      com({ disponibilidade: [{ dia: 'sab', faixa: 'noite' }] }),
      [aluno],
      DISPONIBILIDADE,
      HOJE,
    );
    expect(razoes[2]).toBe('A disponibilidade que ele informou não cruza com a sua.');
  });

  it('pacote vencido não fala de vencimento', () => {
    const razoes = motivosDaFalta(com({ validade: '20/08' }), [aluno], DISPONIBILIDADE, HOJE);
    expect(razoes).toHaveLength(2);
    expect(razoes.some((r) => r.startsWith('O pacote vence'))).toBe(false);
  });

  it('sem validade, não fala de vencimento', () => {
    const razoes = motivosDaFalta(com({ validade: '' }), [aluno], DISPONIBILIDADE, HOJE);
    expect(razoes).toHaveLength(2);
  });

  it('a conta de dias é a mesma de datas.ts', () => {
    expect(diasEntre(HOJE, '30/10')).toBe(ATE_A_VALIDADE);
  });

  // Mesmo plural da razão de prazo. Hoje sai "daqui a 1 dias".
  it.failing('um dia antes do vencimento fica no singular', () => {
    const razoes = motivosDaFalta(com({ validade: '29/08' }), [aluno], DISPONIBILIDADE, HOJE);
    expect(razoes[0]).toBe('O pacote vence em 29/08, daqui a 1 dia.');
  });
});

describe('horasLivres', () => {
  it('soma a duração real das faixas', () => {
    expect(horasLivres(PADRAO_A5)).toBe(40);
  });

  it('sem bloco, zero hora', () => {
    expect(horasLivres([])).toBe(0);
  });
});
