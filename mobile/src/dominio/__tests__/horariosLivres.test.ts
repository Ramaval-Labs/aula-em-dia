/**
 * Horários livres (SCRUM-101): a disponibilidade em minutos, de 15 em 15, e a
 * aula fixa com minutos e duração. As strings vão para a tela, então são
 * conferidas letra a letra — mesmo contrato de `disponibilidade.test.ts`.
 */

import {
  aulaFixaDe,
  duracaoDaAula,
  inicioDaAula,
  lerAulaFixa,
  rotuloDaAulaFixa,
  trechosDaAulaFixa,
} from '../aulaFixa';
import {
  cabe,
  DURACAO_PADRAO,
  formatarDuracao,
  formatarHora,
  formatarIntervalo,
  horarioNoPasso,
  intervalosDe,
  juntarIntervalos,
  lerHorario,
  livreEm,
  minutosPorSemana,
  PASSO_MINUTOS,
  pintar,
  removerIntervalo,
  resumoDosHorarios,
  resumoDosMarcados,
  rotuloDoIntervalo,
  sobrepoe,
} from '../disponibilidade';
import type { Intervalo } from '../tipos';

const h = (hora: number, minuto = 0) => hora * 60 + minuto;

describe('as constantes', () => {
  it('o passo é de 15 minutos e a aula padrão tem 1h', () => {
    expect(PASSO_MINUTOS).toBe(15);
    expect(DURACAO_PADRAO).toBe(60);
  });
});

describe('formatarHora e formatarDuracao', () => {
  it('hora cheia sem minutos, quebrada com dois dígitos', () => {
    expect(formatarHora(h(14))).toBe('14h');
    expect(formatarHora(h(14, 30))).toBe('14h30');
    expect(formatarHora(h(8, 5))).toBe('8h05');
  });

  it('a duração fala em minutos até a primeira hora', () => {
    expect(formatarDuracao(45)).toBe('45 min');
    expect(formatarDuracao(60)).toBe('1h');
    expect(formatarDuracao(90)).toBe('1h30');
  });

  it('o intervalo e o rótulo da lista', () => {
    const i: Intervalo = { dia: 'seg', inicio: h(14, 30), fim: h(18) };
    expect(formatarIntervalo(i)).toBe('14h30–18h');
    expect(rotuloDoIntervalo(i)).toBe('Segunda · 14h30–18h');
  });
});

describe('lerHorario', () => {
  it.each([
    ['14:30', h(14, 30)],
    ['14h30', h(14, 30)],
    ['14h', h(14)],
    ['14', h(14)],
    ['às 18h', h(18)],
    ['8 h', h(8)],
  ])('"%s"', (texto, esperado) => {
    expect(lerHorario(texto)).toBe(esperado);
  });

  it('o que não existe no relógio é null', () => {
    expect(lerHorario('25h')).toBeNull();
    expect(lerHorario('14:75')).toBeNull();
    expect(lerHorario('')).toBeNull();
    expect(lerHorario(undefined)).toBeNull();
    expect(lerHorario('à tarde')).toBeNull();
  });

  it('o passo de 15 minutos', () => {
    expect(horarioNoPasso(h(14, 30))).toBe(true);
    expect(horarioNoPasso(h(14, 45))).toBe(true);
    expect(horarioNoPasso(h(14, 20))).toBe(false);
  });
});

describe('sobrepoe', () => {
  it('encostar não é sobrepor', () => {
    expect(sobrepoe(h(14), h(15), h(15), h(16))).toBe(false);
  });

  it('a aula das 14h30 com 1h bate com a das 15h e não com a das 15h30', () => {
    expect(sobrepoe(h(14, 30), h(15, 30), h(15), h(16))).toBe(true);
    expect(sobrepoe(h(14, 30), h(15, 30), h(15, 30), h(16, 30))).toBe(false);
  });
});

describe('intervalosDe', () => {
  it('lê o formato antigo como o intervalo da faixa', () => {
    expect(
      intervalosDe([
        { dia: 'seg', faixa: 'manha' },
        { dia: 'seg', faixa: 'noite' },
      ]),
    ).toEqual([
      { dia: 'seg', inicio: h(8), fim: h(12) },
      { dia: 'seg', inicio: h(20), fim: h(22) },
    ]);
  });

  it('junta faixas que se encostam', () => {
    expect(
      intervalosDe([
        { dia: 'ter', faixa: 'tarde' },
        { dia: 'ter', faixa: 'fimTarde' },
      ]),
    ).toEqual([{ dia: 'ter', inicio: h(14), fim: h(20) }]);
  });

  it('aceita os dois formatos na mesma lista', () => {
    expect(
      intervalosDe([
        { dia: 'qua', faixa: 'manha' },
        { dia: 'qua', inicio: h(12), fim: h(13) },
      ]),
    ).toEqual([{ dia: 'qua', inicio: h(8), fim: h(13) }]);
  });

  it('descarta o que não é horário válido', () => {
    expect(
      intervalosDe([
        null,
        'seg',
        { dia: 'xyz', inicio: h(8), fim: h(9) },
        { dia: 'seg', faixa: 'madrugada' },
        { dia: 'seg', inicio: h(8, 10), fim: h(9) },
        { dia: 'seg', inicio: h(10), fim: h(9) },
        { dia: 'seg', inicio: -15, fim: h(1) },
        { dia: 'seg', inicio: h(23), fim: 24 * 60 + 15 },
      ]),
    ).toEqual([]);
  });

  it('o que não é lista vira lista vazia', () => {
    expect(intervalosDe(undefined)).toEqual([]);
    expect(intervalosDe({ dia: 'seg' })).toEqual([]);
  });

  it('sai em ordem de dia e de hora', () => {
    expect(
      intervalosDe([
        { dia: 'sex', inicio: h(8), fim: h(9) },
        { dia: 'seg', inicio: h(15), fim: h(16) },
        { dia: 'seg', inicio: h(8), fim: h(9) },
      ]).map((i) => `${i.dia} ${i.inicio}`),
    ).toEqual(['seg 480', 'seg 900', 'sex 480']);
  });
});

describe('juntarIntervalos', () => {
  it('não muta a entrada', () => {
    const lista: Intervalo[] = [
      { dia: 'seg', inicio: h(8), fim: h(10) },
      { dia: 'seg', inicio: h(9), fim: h(11) },
    ];
    expect(juntarIntervalos(lista)).toEqual([{ dia: 'seg', inicio: h(8), fim: h(11) }]);
    expect(lista[0].fim).toBe(h(10));
  });

  it('dias diferentes não se juntam', () => {
    expect(
      juntarIntervalos([
        { dia: 'seg', inicio: h(8), fim: h(10) },
        { dia: 'ter', inicio: h(10), fim: h(11) },
      ]),
    ).toHaveLength(2);
  });
});

describe('pintar e removerIntervalo', () => {
  const base: Intervalo[] = [{ dia: 'seg', inicio: h(14), fim: h(18) }];

  it('pintar liga e junta com o vizinho', () => {
    expect(pintar(base, 'seg', h(18), h(19), true)).toEqual([
      { dia: 'seg', inicio: h(14), fim: h(19) },
    ]);
  });

  it('a ordem do arrasto não importa', () => {
    expect(pintar([], 'ter', h(16), h(14, 30), true)).toEqual([
      { dia: 'ter', inicio: h(14, 30), fim: h(16) },
    ]);
  });

  it('apagar no meio parte o intervalo em dois', () => {
    expect(pintar(base, 'seg', h(15), h(16), false)).toEqual([
      { dia: 'seg', inicio: h(14), fim: h(15) },
      { dia: 'seg', inicio: h(16), fim: h(18) },
    ]);
  });

  it('apagar tudo some com ele', () => {
    expect(pintar(base, 'seg', h(13), h(19), false)).toEqual([]);
  });

  it('arrasto de tamanho zero não muda nada', () => {
    expect(pintar(base, 'seg', h(9), h(9), true)).toEqual(base);
  });

  it('apagar outro dia não mexe neste', () => {
    expect(pintar(base, 'ter', h(14), h(18), false)).toEqual(base);
  });

  it('o × tira o intervalo inteiro', () => {
    expect(removerIntervalo(base, base[0])).toEqual([]);
    expect(removerIntervalo(base, { dia: 'seg', inicio: h(14), fim: h(15) })).toEqual(base);
  });
});

describe('cabe, livreEm e o resumo', () => {
  const lista: Intervalo[] = [
    { dia: 'seg', inicio: h(14, 30), fim: h(18) },
    { dia: 'qua', inicio: h(8), fim: h(12) },
  ];

  it('cabe só quando o trecho inteiro está dentro', () => {
    expect(cabe(lista, 'seg', h(14, 30), h(15, 30))).toBe(true);
    expect(cabe(lista, 'seg', h(14), h(15))).toBe(false);
    expect(cabe(lista, 'seg', h(17, 30), h(18, 30))).toBe(false);
    expect(cabe(lista, 'ter', h(14, 30), h(15, 30))).toBe(false);
  });

  it('livreEm é a célula da grade: o fim já não está livre', () => {
    expect(livreEm(lista, 'seg', h(14, 30))).toBe(true);
    expect(livreEm(lista, 'seg', h(17, 45))).toBe(true);
    expect(livreEm(lista, 'seg', h(18))).toBe(false);
    expect(livreEm(lista, 'seg', h(14, 15))).toBe(false);
  });

  it('o resumo do professor conta horários e horas', () => {
    expect(minutosPorSemana(lista)).toBe(210 + 240);
    expect(resumoDosHorarios(lista)).toBe('2 horários · 7h30 por semana');
    expect(resumoDosHorarios([lista[1]])).toBe('1 horário · 4h por semana');
    expect(resumoDosHorarios([])).toBe('Nenhum horário marcado');
  });

  it('o resumo do aluno conta os marcados', () => {
    expect(resumoDosMarcados(lista)).toBe('2 horários marcados');
    expect(resumoDosMarcados([lista[0]])).toBe('1 horário marcado');
  });
});

describe('a aula fixa com minutos e duração', () => {
  it('"18h30" guarda os minutos', () => {
    expect(lerAulaFixa('terça', '18h30')).toEqual({ dias: ['ter'], hora: 18, minuto: 30 });
    expect(lerAulaFixa('terça', '18:30')).toEqual({ dias: ['ter'], hora: 18, minuto: 30 });
  });

  it('a hora cheia não ganha minuto', () => {
    expect(lerAulaFixa('terça', '18h')).toEqual({ dias: ['ter'], hora: 18 });
  });

  it('a estrutura passa minuto e duração adiante', () => {
    expect(
      aulaFixaDe({ dia: '', hora: '', aulaFixa: { dias: ['qui', 'ter'], hora: 14, minuto: 30, duracao: 90 } }),
    ).toEqual({ dias: ['ter', 'qui'], hora: 14, minuto: 30, duracao: 90 });
  });

  it('o começo em minutos e a duração padrão', () => {
    expect(inicioDaAula({ dias: ['ter'], hora: 18, minuto: 30 })).toBe(h(18, 30));
    expect(inicioDaAula({ dias: ['ter'], hora: null })).toBeNull();
    expect(duracaoDaAula({ dias: ['ter'], hora: 18 })).toBe(60);
    expect(duracaoDaAula({ dias: ['ter'], hora: 18, duracao: 45 })).toBe(45);
  });

  it('os trechos da semana: um por dia, do começo ao fim', () => {
    expect(
      trechosDaAulaFixa({ dia: '', hora: '', aulaFixa: { dias: ['ter', 'qui'], hora: 18, minuto: 30, duracao: 90 } }),
    ).toEqual([
      { dia: 'ter', inicio: h(18, 30), fim: h(20) },
      { dia: 'qui', inicio: h(18, 30), fim: h(20) },
    ]);
    expect(trechosDaAulaFixa({ dia: 'terça', hora: '' })).toEqual([]);
  });

  it('o rótulo mostra os minutos', () => {
    expect(rotuloDaAulaFixa({ dias: ['ter'], hora: 18, minuto: 30 })).toEqual({
      dia: 'terça',
      hora: '18h30',
    });
    expect(rotuloDaAulaFixa({ dias: ['ter'], hora: 18 })).toEqual({ dia: 'terça', hora: '18h' });
  });
});
