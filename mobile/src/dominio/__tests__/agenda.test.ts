/**
 * Motor de sugestão de reposição. As razões e os rótulos vão para a tela,
 * então são conferidos letra a letra — mesmo contrato de
 * `disponibilidade.test.ts`.
 *
 * `hoje` entra como literal, e não por `hoje()` de `datas.ts`: a suíte tem de
 * sobreviver à virada de `USAR_DATA_REAL`. Pelo mesmo motivo nenhum nome de
 * dia da semana é escrito à mão — sai de `diaDaSemanaDe`, porque o ano de um
 * dd/mm é inferido e o dia da semana muda com ele.
 *
 * Desde o SCRUM-101 o motor conta em minutos, de 15 em 15. Em cada dia ele
 * devolve um começo por trecho livre contínuo, então os testes falam de
 * "começos de um dia da semana" e de "nenhuma janela toca este trecho".
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
  reposicaoMarcada,
  type Candidata,
} from '../agenda';
import { estadoInicial } from '../../dados/semente';
import { lerAulaFixa } from '../aulaFixa';
import { diasEntre, somarDias } from '../datas';
import {
  cabe,
  diaDaSemanaDe,
  intervalosDe,
  nomeDoDia,
  pintar,
  sobrepoe,
} from '../disponibilidade';
import type {
  Aluno,
  BlocoSemanal,
  DiaDaSemana,
  Disponibilidade,
  FaixaHoraria,
  Folga,
  Intervalo,
} from '../tipos';

const HOJE = '28/08';

/** 14h30 → 870 */
const h = (hora: number, minuto = 0) => hora * 60 + minuto;

/** O padrão desenhado em A5: 13 blocos, no formato antigo. */
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

/** O mesmo padrão em horários livres: o que `intervalosDe` faz dele. */
const PADRAO_LIVRE: Intervalo[] = intervalosDe(PADRAO_A5);

/** As duas folgas de `dados/semente.ts`. */
const FOLGAS: Folga[] = [
  { de: '07/09', ate: '07/09', motivo: 'feriado' },
  { de: '14/09', ate: '21/09', motivo: 'viagem' },
];

const DISPONIBILIDADE: Disponibilidade = {
  blocos: PADRAO_LIVRE,
  sugereSabado: false,
  aceitaForaDosBlocos: false,
  folgas: FOLGAS,
};

const TODOS_OS_DIAS: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const TODAS_AS_FAIXAS: FaixaHoraria[] = ['manha', 'tarde', 'fimTarde', 'noite'];

/**
 * Agenda sem restrição nenhuma: as quatro faixas de todo dia (8h–12h e
 * 14h–22h), sábado ligado, sem folga. Cada teste de descarte parte dela e
 * muda UMA coisa, para que a regra testada seja a única que pode tirar a
 * janela da lista.
 */
const ABERTA: Disponibilidade = {
  blocos: intervalosDe(
    TODOS_OS_DIAS.flatMap((dia) => TODAS_AS_FAIXAS.map((faixa) => ({ dia, faixa }))),
  ),
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
const doDia = (lista: Candidata[], dia: DiaDaSemana) =>
  lista.filter((c) => c.diaDaSemana === dia);
/** Os começos sugeridos num dia da semana, em ordem, sem repetir. */
const comecos = (lista: Candidata[], dia: DiaDaSemana) =>
  [...new Set(doDia(lista, dia).map((c) => c.inicio))].sort((a, b) => a - b);
const comecaEm = (lista: Candidata[], dia: DiaDaSemana, inicio: number) =>
  doDia(lista, dia).filter((c) => c.inicio === inicio);
/** Alguma janela daquele dia da semana encosta por dentro no trecho? */
const toca = (lista: Candidata[], dia: DiaDaSemana, de: number, ate: number) =>
  doDia(lista, dia).some((c) => sobrepoe(c.inicio, c.fim, de, ate));

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

describe('faixaDaHora (formato antigo)', () => {
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

  it('12h e 13h não caem em faixa nenhuma', () => {
    expect(faixaDaHora(12)).toBeNull();
    expect(faixaDaHora(13)).toBeNull();
  });

  it('antes das 8h não há faixa', () => {
    expect(faixaDaHora(7)).toBeNull();
  });
});

describe('blocosDaAulaFixa (formato antigo)', () => {
  it('um bloco por dia, na faixa da hora', () => {
    expect(blocosDaAulaFixa(com({ dia: 'terça e quinta', hora: '18h' }))).toEqual([
      { dia: 'ter', faixa: 'fimTarde' },
      { dia: 'qui', faixa: 'fimTarde' },
    ]);
  });

  it('aluno sem hora reconhecível não ocupa bloco', () => {
    expect(blocosDaAulaFixa(com({ hora: 'a combinar' }))).toEqual([]);
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
    const sem = candidatos(aluno, [aluno], { ...ABERTA, sugereSabado: false }, HOJE);
    const comSabado = candidatos(aluno, [aluno], ABERTA, HOJE);

    expect(doDia(sem, 'sab')).toHaveLength(0);
    expect(doDia(comSabado, 'sab').length).toBeGreaterThan(0);
  });

  it('horário fora da disponibilidade do professor sai quando ele não aceita', () => {
    const lista = candidatos(aluno, [aluno], DISPONIBILIDADE, HOJE);
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((c) => cabe(PADRAO_LIVRE, c.diaDaSemana, c.inicio, c.fim))).toBe(true);

    const aceita = candidatos(aluno, [aluno], { ...DISPONIBILIDADE, aceitaForaDosBlocos: true }, HOJE);
    expect(aceita.some((c) => !cabe(PADRAO_LIVRE, c.diaDaSemana, c.inicio, c.fim))).toBe(true);
  });

  it('a aula fixa de outro aluno ocupa do começo ao fim dela', () => {
    const outro = com({ id: 'b', dia: 'segunda', hora: '15h' });
    expect(comecos(candidatos(aluno, [aluno], ABERTA, HOJE), 'seg')).toEqual([h(8), h(17)]);

    const lista = candidatos(aluno, [aluno, outro], ABERTA, HOJE);
    expect(toca(lista, 'seg', h(15), h(16))).toBe(false);
    // a tarde de segunda vira dois trechos: 14h–15h e o que sobra das 16h
    expect(comecos(lista, 'seg')).toEqual([h(8), h(14), h(17)]);
  });

  // O exemplo do PO (24/11): a aula das 14h30 com 1h ocupa 14h30–15h30.
  it('a colisão é de trecho, não de hora cheia (SCRUM-101)', () => {
    const das15 = com({ hora: '', aulaFixa: { dias: ['qua'], hora: 15 } });
    const as1430 = com({ id: 'b', dia: '', hora: '', aulaFixa: { dias: ['seg'], hora: 14, minuto: 30 } });
    const as14 = com({ id: 'c', dia: '', hora: '', aulaFixa: { dias: ['seg'], hora: 14 } });

    const comA1430 = candidatos(das15, [das15, as1430], ABERTA, HOJE);
    expect(comecaEm(comA1430, 'seg', h(15))).toHaveLength(0);
    expect(comecaEm(comA1430, 'seg', h(15, 30)).length).toBeGreaterThan(0);
    expect(toca(comA1430, 'seg', h(14, 30), h(15, 30))).toBe(false);

    // a das 14h termina às 15h: aí as 15h ficam livres, coladas nela
    const comA14 = candidatos(das15, [das15, as14], ABERTA, HOJE);
    expect(comecaEm(comA14, 'seg', h(15)).length).toBeGreaterThan(0);
  });

  // SCRUM-84: no teste em produção, a Bia (aula fixa terça 18h) faltou e a
  // melhor sugestão foi a terça seguinte às 18h, a aula que ela já tem.
  it('a aula fixa do próprio aluno não vira janela (SCRUM-84)', () => {
    const bia = com({ dia: 'terça', hora: '18h' });
    const lista = candidatos(bia, [bia], ABERTA, HOJE);
    expect(toca(lista, 'ter', h(18), h(19))).toBe(false);
    // o resto da terça e a mesma hora nos outros dias continuam
    expect(comecaEm(lista, 'ter', h(8)).length).toBeGreaterThan(0);
    expect(comecaEm(lista, 'qui', h(18)).length).toBeGreaterThan(0);
  });

  it('com dois dias de aula fixa, os dois saem', () => {
    const duasVezes = com({ dia: 'terça e quinta', hora: '18h' });
    const lista = candidatos(duasVezes, [duasVezes], ABERTA, HOJE);
    expect(toca(lista, 'ter', h(18), h(19))).toBe(false);
    expect(toca(lista, 'qui', h(18), h(19))).toBe(false);
    expect(comecaEm(lista, 'seg', h(18)).length).toBeGreaterThan(0);
  });

  // SCRUM-31: a estrutura é a fonte. O texto é só o que a tela mostra.
  it('com a aula fixa estruturada, vale ela, e não o texto', () => {
    const estruturado = com({ dia: '', hora: '', aulaFixa: { dias: ['ter'], hora: 18 } });
    expect(toca(candidatos(estruturado, [estruturado], ABERTA, HOJE), 'ter', h(18), h(19))).toBe(false);

    const divergente = com({ dia: 'quarta', hora: '17h', aulaFixa: { dias: ['ter'], hora: 18 } });
    const outra = candidatos(divergente, [divergente], ABERTA, HOJE);
    expect(toca(outra, 'ter', h(18), h(19))).toBe(false);
    // a quarta está livre, e a hora de sempre é a da estrutura
    expect(comecaEm(outra, 'qua', h(18)).length).toBeGreaterThan(0);
  });

  it('a aula fixa estruturada de outro aluno ocupa o trecho dela', () => {
    const outro = com({ id: 'b', dia: '', hora: '', aulaFixa: { dias: ['seg'], hora: 15 } });
    expect(toca(candidatos(aluno, [aluno, outro], ABERTA, HOJE), 'seg', h(15), h(16))).toBe(false);
  });

  it('a duração do outro aluno conta: 90 min ocupam até 16h30', () => {
    const outro = com({ id: 'b', dia: '', hora: '', aulaFixa: { dias: ['seg'], hora: 15, duracao: 90 } });
    const lista = candidatos(aluno, [aluno, outro], ABERTA, HOJE);
    expect(toca(lista, 'seg', h(15), h(16, 30))).toBe(false);
  });

  it('estruturar a semente não muda nenhuma janela', () => {
    // a validade da semente é relativa à data real; aqui ela fica fixa, para
    // as janelas existirem com o HOJE literal da suíte
    const texto = estadoInicial().alunos.map((a) => ({ ...a, validade: '30/10' }));
    const estruturados = texto.map((a) => ({ ...a, aulaFixa: lerAulaFixa(a.dia, a.hora) }));
    expect(texto.length).toBeGreaterThan(0);
    for (let i = 0; i < texto.length; i += 1) {
      const antes = candidatos(texto[i], texto, DISPONIBILIDADE, HOJE);
      expect(antes.length).toBeGreaterThan(0);
      expect(candidatos(estruturados[i], estruturados, DISPONIBILIDADE, HOJE)).toEqual(antes);
    }
  });

  it('aluno sem hora reconhecível não perde trecho nenhum', () => {
    const semHora = com({ hora: '' });
    expect(comecos(candidatos(semHora, [semHora], ABERTA, HOJE), 'qua')).toEqual([h(8), h(14)]);
  });

  it('aluno arquivado não ocupa trecho nenhum', () => {
    const arquivado = com({ id: 'b', dia: 'segunda', hora: '15h', arquivado: true });
    expect(comecos(candidatos(aluno, [aluno, arquivado], ABERTA, HOJE), 'seg')).toEqual([
      h(8),
      h(17),
    ]);
  });

  // 03/09 e não a quarta 02/09: a quarta 17h é a aula fixa do `aluno`, que já
  // não vira janela (SCRUM-84).
  it('reposição marcada de outro aluno ocupa a data e o trecho dela (SCRUM-83)', () => {
    const livre = candidatos(aluno, [aluno], ABERTA, HOJE);
    const alvo = livre.find((c) => c.data === '03/09' && c.inicio === h(17));
    expect(alvo).toBeDefined();

    const outro = com({ id: 'b', dia: 'sem horário fixo', hora: '', agendada: { dia: alvo!.dia, hora: '17h' } });
    const lista = candidatos(aluno, [aluno, outro], ABERTA, HOJE);
    const em = (data: string) => lista.filter((c) => c.data === data);

    expect(em('03/09').some((c) => sobrepoe(c.inicio, c.fim, h(17), h(18)))).toBe(false);
    // Só aquela data: o mesmo horário na semana seguinte segue livre.
    expect(em('10/09').some((c) => c.inicio === h(17))).toBe(true);
    // E o resto do mesmo dia também.
    expect(em('03/09').some((c) => c.inicio === h(8))).toBe(true);
  });

  it('a reposição marcada do próprio aluno, ou de arquivado, não ocupa nada', () => {
    const livre = candidatos(aluno, [aluno], ABERTA, HOJE);
    const alvo = livre.find((c) => c.data === '03/09' && c.inicio === h(17))!;
    const agendada = { dia: alvo.dia, hora: '17h' };

    const proprio = com({ agendada });
    const arquivado = com({ id: 'b', dia: 'sem horário fixo', hora: '', agendada, arquivado: true });
    for (const todos of [[proprio], [aluno, arquivado]]) {
      const lista = candidatos(todos[0], todos, ABERTA, HOJE);
      expect(lista.some((c) => c.data === '03/09' && c.inicio === h(17))).toBe(true);
    }
  });

  it('aluno que declarou disponibilidade só recebe janela dentro dela', () => {
    const disp: Intervalo[] = [
      { dia: 'ter', inicio: h(20), fim: h(22) },
      { dia: 'sex', inicio: h(8), fim: h(12) },
    ];
    const lista = candidatos(com({ disponibilidade: disp }), [aluno], ABERTA, HOJE);

    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((c) => cabe(disp, c.diaDaSemana, c.inicio, c.fim))).toBe(true);
  });

  // O exemplo do PO (24/11): "tenho compromisso até as 14h, só posso às 14h30".
  it('quem só pode a partir das 14h30 recebe as 14h30 (SCRUM-101)', () => {
    const semHora = com({
      hora: '',
      disponibilidade: [{ dia: 'seg', inicio: h(14, 30), fim: h(18) }],
    });
    const lista = candidatos(semHora, [semHora], ABERTA, HOJE);
    expect(lista.length).toBeGreaterThan(0);
    expect(comecos(lista, 'seg')).toEqual([h(14, 30)]);
    expect(lista[0].hora).toBe('14h30');
  });

  it('a disponibilidade no formato antigo dá as mesmas janelas (regressão)', () => {
    const antigo = [
      { dia: 'ter', faixa: 'noite' },
      { dia: 'sex', faixa: 'manha' },
    ] as unknown as Intervalo[];
    const novo: Intervalo[] = [
      { dia: 'ter', inicio: h(20), fim: h(22) },
      { dia: 'sex', inicio: h(8), fim: h(12) },
    ];
    expect(candidatos(com({ disponibilidade: antigo }), [aluno], ABERTA, HOJE)).toEqual(
      candidatos(com({ disponibilidade: novo }), [aluno], ABERTA, HOJE),
    );

    const professorAntigo = { ...DISPONIBILIDADE, blocos: PADRAO_A5 as unknown as Intervalo[] };
    expect(candidatos(aluno, [aluno], professorAntigo, HOJE)).toEqual(
      candidatos(aluno, [aluno], DISPONIBILIDADE, HOJE),
    );
  });

  it('pacote vencido não tem janela', () => {
    expect(candidatos(com({ validade: '20/08' }), [aluno], ABERTA, HOJE)).toEqual([]);
  });

  it('pacote que vence hoje não tem janela', () => {
    expect(candidatos(com({ validade: HOJE }), [aluno], ABERTA, HOJE)).toEqual([]);
  });
});

describe('candidatos — duração e trechos', () => {
  it('a janela dura o que a aula do aluno dura (1h por padrão)', () => {
    for (const c of candidatos(aluno, [aluno], ABERTA, HOJE)) {
      expect(c.fim - c.inicio).toBe(60);
    }
  });

  it('com 90 min, a janela inteira cabe na agenda', () => {
    const longa = com({ aulaFixa: { dias: ['qua'], hora: 17, duracao: 90 } });
    const lista = candidatos(longa, [longa], ABERTA, HOJE);
    expect(lista.length).toBeGreaterThan(0);
    for (const c of lista) {
      expect(c.fim - c.inicio).toBe(90);
      expect(cabe(ABERTA.blocos, c.diaDaSemana, c.inicio, c.fim)).toBe(true);
    }
    // a quarta 17h–18h30 é a aula dele
    expect(toca(lista, 'qua', h(17), h(18, 30))).toBe(false);
  });

  it('um começo por trecho livre: a manhã e a tarde', () => {
    const semHora = com({ hora: '' });
    expect(comecos(candidatos(semHora, [semHora], ABERTA, HOJE), 'seg')).toEqual([h(8), h(14)]);
  });

  it('no máximo três janelas no mesmo dia', () => {
    const outros = [9, 11, 15, 18, 20].map((hora, i) =>
      com({ id: `o${i}`, dia: '', hora: '', aulaFixa: { dias: ['seg'], hora } }),
    );
    const semHora = com({ hora: '' });
    const lista = candidatos(semHora, [semHora, ...outros], ABERTA, HOJE);
    const porData = new Map<string, number>();
    for (const c of lista) porData.set(c.data, (porData.get(c.data) ?? 0) + 1);
    expect(Math.max(...porData.values())).toBe(3);
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
const ENCAIXA = 10;
const FORA_DO_HABITUAL = -30;

const RAZAO_MESMO_HORARIO = 'No mesmo horário da aula dele.';
const RAZAO_MARCOU = 'Ele marcou esse horário como disponível.';
const RAZAO_ENCAIXA = 'Encaixa logo antes ou depois de outra aula.';
const RAZAO_FORA = 'Está fora dos seus horários habituais.';
const razaoDoPrazo = (c: Candidata) =>
  `Acontece ${ATE_A_VALIDADE - c.emDias} dias antes do pacote vencer, em 30/10.`;

describe('candidatos — pontuação', () => {
  it('sem parcela nenhuma, vale mais quanto mais cedo', () => {
    const janelas = comecaEm(candidatos(aluno, [aluno], ABERTA, HOJE), 'seg', h(8));
    expect(janelas.length).toBeGreaterThan(0);
    for (const c of janelas) {
      expect(c.pontos).toBe(BASE - c.emDias);
      expect(c.razoes).toEqual([razaoDoPrazo(c)]);
    }
  });

  it('a hora da aula fixa, em outro dia, soma', () => {
    const janelas = comecaEm(candidatos(aluno, [aluno], ABERTA, HOJE), 'seg', h(17));
    expect(janelas.length).toBeGreaterThan(0);
    for (const c of janelas) {
      expect(c.pontos).toBe(BASE - c.emDias + MESMO_HORARIO);
      expect(c.razoes).toEqual([RAZAO_MESMO_HORARIO, razaoDoPrazo(c)]);
    }
  });

  it('o horário que o aluno marcou como disponível soma', () => {
    const disp: Intervalo[] = [{ dia: 'seg', inicio: h(8), fim: h(12) }];
    const lista = candidatos(com({ disponibilidade: disp }), [aluno], ABERTA, HOJE);
    expect(lista.length).toBeGreaterThan(0);
    for (const c of lista) {
      expect(c.pontos).toBe(BASE - c.emDias + MARCOU_DISPONIVEL);
      expect(c.razoes).toEqual([RAZAO_MARCOU, razaoDoPrazo(c)]);
    }
  });

  it('colada em outra aula, soma', () => {
    const outro = com({ id: 'b', dia: 'segunda', hora: '15h' });
    const semHora = com({ hora: '' });
    const janelas = comecaEm(candidatos(semHora, [semHora, outro], ABERTA, HOJE), 'seg', h(14));
    expect(janelas.length).toBeGreaterThan(0);
    for (const c of janelas) {
      expect(c.pontos).toBe(BASE - c.emDias + ENCAIXA);
      expect(c.razoes).toEqual([RAZAO_ENCAIXA, razaoDoPrazo(c)]);
    }
  });

  it('o horário fora dos habituais do professor desconta', () => {
    const disp = { ...DISPONIBILIDADE, folgas: [], aceitaForaDosBlocos: true };
    const semHora = com({ hora: '' });
    const fora = candidatos(semHora, [semHora], disp, HOJE).filter(
      (c) => !cabe(PADRAO_LIVRE, c.diaDaSemana, c.inicio, c.fim),
    );
    expect(fora.length).toBeGreaterThan(0);
    for (const c of fora) {
      expect(c.pontos).toBe(BASE - c.emDias + FORA_DO_HABITUAL);
      expect(c.razoes).toEqual([RAZAO_FORA, razaoDoPrazo(c)]);
    }
  });

  it('dentro e fora do habitual são trechos diferentes', () => {
    const disp = { ...DISPONIBILIDADE, folgas: [], aceitaForaDosBlocos: true };
    const semHora = com({ hora: '' });
    // segunda: o habitual é 14h–20h; antes e depois dele, o dia é "fora"
    expect(comecos(candidatos(semHora, [semHora], disp, HOJE), 'seg')).toEqual([
      h(6),
      h(14),
      h(19, 15),
    ]);
  });

  // A tela mostra `razoes[0]` como o motivo da janela, então a ordem é contrato.
  it('com todas as parcelas, as razões saem nesta ordem', () => {
    const professor: Disponibilidade = {
      ...ABERTA,
      blocos: pintar(ABERTA.blocos, 'seg', h(17), h(20), false),
      aceitaForaDosBlocos: true,
    };
    const disp: Intervalo[] = [{ dia: 'seg', inicio: h(17), fim: h(20) }];
    const lista = candidatos(com({ disponibilidade: disp }), [aluno], professor, HOJE);
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

  it('a hora da aula fixa, em outro dia, vem antes das outras', () => {
    const [primeira] = candidatos(aluno, [aluno], ABERTA, HOJE);
    expect(primeira.inicio).toBe(h(17));
    expect(primeira.diaDaSemana).not.toBe('qua');
    expect(primeira.razoes[0]).toBe(RAZAO_MESMO_HORARIO);
  });

  it('nenhuma janela sai marcada como melhor', () => {
    expect(candidatos(aluno, [aluno], ABERTA, HOJE).some((c) => c.melhor)).toBe(false);
  });

  // Mesma regra de plural que o resto da copy segue. Corrigido no SCRUM-64.
  it('um dia antes do vencimento a razão fica no singular', () => {
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
      expect(c.diaDaSemana).toBe(dia);
    }
  });

  it('no trecho da aula fixa, sugere a hora de sempre', () => {
    const [c] = comecaEm(candidatos(aluno, [aluno], ABERTA, HOJE), 'seg', h(17));
    expect(c.hora).toBe('17h');
  });

  it('em outro trecho, sugere o começo dele', () => {
    const semHora = com({ hora: '' });
    const lista = candidatos(semHora, [semHora], ABERTA, HOJE);
    expect(comecaEm(lista, 'seg', h(8))[0].hora).toBe('8h');
    expect(comecaEm(lista, 'seg', h(14))[0].hora).toBe('14h');
  });

  it('a hora sai com os minutos', () => {
    const quebrado = com({ aulaFixa: { dias: ['qua'], hora: 14, minuto: 30 } });
    const [c] = comecaEm(candidatos(quebrado, [quebrado], ABERTA, HOJE), 'seg', h(14, 30));
    expect(c.hora).toBe('14h30');
    expect(c.razoes[0]).toBe(RAZAO_MESMO_HORARIO);
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
  const ehFimDeSemana = (c: Candidata) => c.diaDaSemana === 'sab' || c.diaDaSemana === 'dom';

  it('fim de semana deixa só sábado e domingo', () => {
    const fds = filtrar(lista, 'fimDeSemana');
    expect(fds.length).toBeGreaterThan(0);
    expect(fds.every(ehFimDeSemana)).toBe(true);
    expect(fds).toHaveLength(lista.filter(ehFimDeSemana).length);
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
      const ordem = g.janelas.map((c) => c.emDias * 10000 + c.inicio);
      expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
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
      'Seus 7 horários livres batem com aula fixa de outro aluno.',
      'Ele ainda não informou quando pode repor.',
    ]);
  });

  it('um horário só fica no singular', () => {
    const um = { ...DISPONIBILIDADE, blocos: [{ dia: 'seg' as const, inicio: h(14), fim: h(18) }] };
    expect(motivosDaFalta(aluno, [aluno], um, HOJE)[1]).toBe(
      'Seu horário livre bate com aula fixa de outro aluno.',
    );
  });

  it('professor sem horário marcado', () => {
    const razoes = motivosDaFalta(aluno, [aluno], { ...DISPONIBILIDADE, blocos: [] }, HOJE);
    expect(razoes[1]).toBe('Você ainda não marcou nenhum horário na sua disponibilidade.');
  });

  it('aluno com disponibilidade que não cruza', () => {
    const razoes = motivosDaFalta(
      com({ disponibilidade: [{ dia: 'sab', inicio: h(20), fim: h(22) }] }),
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

  // Mesmo plural da razão de prazo (era "daqui a 1 dias", corrigido no SCRUM-64).
  it('um dia antes do vencimento fica no singular', () => {
    const razoes = motivosDaFalta(com({ validade: '29/08' }), [aluno], DISPONIBILIDADE, HOJE);
    expect(razoes[0]).toBe('O pacote vence em 29/08, daqui a 1 dia.');
  });
});

describe('horasLivres', () => {
  it('soma a duração real dos horários', () => {
    expect(horasLivres(PADRAO_LIVRE)).toBe(40);
  });

  it('lê o formato antigo do mesmo jeito', () => {
    expect(horasLivres(PADRAO_A5)).toBe(40);
  });

  it('conta a meia hora', () => {
    expect(horasLivres([{ dia: 'seg', inicio: h(14, 30), fim: h(18) }])).toBe(3.5);
  });

  it('sem horário, zero hora', () => {
    expect(horasLivres([])).toBe(0);
  });
});

describe('reposicaoMarcada', () => {
  it('lê a data do fim do rótulo e o trecho da hora', () => {
    expect(reposicaoMarcada(com({ agendada: { dia: 'Terça, 10/11', hora: '17h' } }))).toEqual({
      data: '10/11',
      inicio: h(17),
      fim: h(18),
    });
  });

  it('lê os minutos e a duração do aluno', () => {
    const longa = com({
      aulaFixa: { dias: ['qua'], hora: 17, duracao: 90 },
      agendada: { dia: 'Terça, 10/11', hora: '17h30' },
    });
    expect(reposicaoMarcada(longa)).toEqual({ data: '10/11', inicio: h(17, 30), fim: h(19) });
  });

  it('sem reposição, ou com rótulo ou hora que não se lê, é null', () => {
    expect(reposicaoMarcada(aluno)).toBeNull();
    expect(reposicaoMarcada(com({ agendada: { dia: 'Sexta', hora: '17h' } }))).toBeNull();
    expect(reposicaoMarcada(com({ agendada: { dia: 'Sexta, 30/10', hora: 'à tarde' } }))).toBeNull();
  });
});

describe('candidatos — horário por dia (SCRUM-101)', () => {
  // segunda 15h15 e quarta 17h30: as duas aulas fixas ocupam a semana dos outros
  const porDia = com({
    id: 'b',
    aulaFixa: { dias: ['seg', 'qua'], hora: 15, minuto: 15, porDia: { qua: h(17, 30) } },
  });
  const semHora = com({ hora: '' });
  /** O professor livre só nesses trechos: cada um rende no máximo um começo. */
  const so = (blocos: Intervalo[]): Disponibilidade => ({
    blocos,
    sugereSabado: false,
    aceitaForaDosBlocos: false,
    folgas: [],
  });

  it('a aula da segunda ocupa 15h15–16h15 só na segunda', () => {
    const disp = so([
      { dia: 'seg', inicio: h(15, 15), fim: h(16, 15) },
      { dia: 'qua', inicio: h(15, 15), fim: h(16, 15) },
    ]);
    const lista = candidatos(semHora, [semHora, porDia], disp, HOJE);
    expect(comecos(lista, 'seg')).toEqual([]);
    expect(comecos(lista, 'qua')).toEqual([h(15, 15)]);
  });

  it('a aula da quarta ocupa 17h30–18h30 só na quarta', () => {
    const disp = so([
      { dia: 'seg', inicio: h(17, 30), fim: h(18, 30) },
      { dia: 'qua', inicio: h(17, 30), fim: h(18, 30) },
    ]);
    const lista = candidatos(semHora, [semHora, porDia], disp, HOJE);
    expect(comecos(lista, 'qua')).toEqual([]);
    expect(comecos(lista, 'seg')).toEqual([h(17, 30)]);
  });

  it('qualquer um dos começos do aluno conta como "o mesmo horário"', () => {
    const disp = so([
      { dia: 'ter', inicio: h(15, 15), fim: h(16, 15) },
      { dia: 'ter', inicio: h(17, 30), fim: h(18, 30) },
    ]);
    const lista = candidatos(porDia, [porDia], disp, HOJE);
    expect(comecos(lista, 'ter')).toEqual([h(15, 15), h(17, 30)]);
    for (const c of doDia(lista, 'ter')) expect(c.razoes).toContain(RAZAO_MESMO_HORARIO);
  });
});
