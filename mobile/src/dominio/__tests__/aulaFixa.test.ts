/**
 * A aula fixa estruturada (SCRUM-31). O texto que `rotuloDaAulaFixa` gera vai
 * para a lista e para a página do aluno, então é conferido letra a letra e
 * tem de bater com o que a semente já escreve.
 */

import { estadoInicial } from '../../dados/semente';
import {
  aulaFixaComHorarios,
  aulaFixaDe,
  horaNoDia,
  iniciosDaAula,
  inicioNoDia,
  lerAulaFixa,
  lerDias,
  lerHora,
  rotuloDaAulaFixa,
  SEM_HORARIO_FIXO,
  temAulaNoDia,
  temHorarioPorDia,
  trechosDaAulaFixa,
} from '../aulaFixa';
import type { AulaFixa, DiaDaSemana } from '../tipos';

const alunosDaSemente = () => estadoInicial().alunos;
const daSemente = (id: string) => {
  const a = alunosDaSemente().find((x) => x.id === id);
  if (!a) throw new Error(`aluno ${id} sumiu da semente`);
  return a;
};

describe('lerAulaFixa — os alunos da semente', () => {
  it('Marina: terça e quinta, 18h', () => {
    const mar = daSemente('mar');
    expect(lerAulaFixa(mar.dia, mar.hora)).toEqual({ dias: ['ter', 'qui'], hora: 18 });
  });

  it('Beatriz: sem horário fixo', () => {
    const bea = daSemente('bea');
    expect(lerAulaFixa(bea.dia, bea.hora)).toEqual({ dias: [], hora: null });
  });

  it('Valentin e Rafael: um dia só', () => {
    const val = daSemente('val');
    const raf = daSemente('raf');
    expect(lerAulaFixa(val.dia, val.hora)).toEqual({ dias: ['qua'], hora: 17 });
    expect(lerAulaFixa(raf.dia, raf.hora)).toEqual({ dias: ['seg'], hora: 19 });
  });

  it('ida e volta: o texto gerado é o mesmo que a semente escreve', () => {
    for (const a of alunosDaSemente()) {
      expect(rotuloDaAulaFixa(lerAulaFixa(a.dia, a.hora))).toEqual({ dia: a.dia, hora: a.hora });
    }
  });
});

describe('lerDias', () => {
  it('sai na ordem da semana, não na ordem do texto', () => {
    expect(lerDias('quinta e terça')).toEqual(['ter', 'qui']);
  });

  it('aceita sem acento e com maiúscula', () => {
    expect(lerDias('Terca')).toEqual(['ter']);
    expect(lerDias('SÁBADO')).toEqual(['sab']);
  });

  it('texto sem dia, ou ausente, não tem dia', () => {
    expect(lerDias(SEM_HORARIO_FIXO)).toEqual([]);
    expect(lerDias(undefined)).toEqual([]);
  });
});

describe('lerHora', () => {
  it('fica com a hora cheia', () => {
    expect(lerHora('18h')).toBe(18);
    expect(lerHora('18h30')).toBe(18);
    expect(lerHora('18:30')).toBe(18);
    expect(lerHora('8 h')).toBe(8);
  });

  it('aceita o número sozinho, que é o que o campo numérico da ficha manda', () => {
    expect(lerHora('18')).toBe(18);
  });

  it('acha a hora no meio do texto, como a leitura de antes', () => {
    expect(lerHora('às 18h')).toBe(18);
  });

  it('sem hora, ou hora que não existe no relógio, é null', () => {
    expect(lerHora('')).toBeNull();
    expect(lerHora('a combinar')).toBeNull();
    expect(lerHora('25h')).toBeNull();
    expect(lerHora(undefined)).toBeNull();
  });
});

describe('aulaFixaDe', () => {
  it('com a estrutura, vale a estrutura, mesmo com o texto dizendo outra coisa', () => {
    const a = { dia: 'segunda', hora: '9h', aulaFixa: { dias: ['ter' as const], hora: 18 } };
    expect(aulaFixaDe(a)).toEqual({ dias: ['ter'], hora: 18 });
  });

  it('sem a estrutura, lê o texto', () => {
    expect(aulaFixaDe({ dia: 'terça e quinta', hora: '18h' })).toEqual({
      dias: ['ter', 'qui'],
      hora: 18,
    });
    expect(aulaFixaDe({ dia: 'quarta', hora: '17h', aulaFixa: null })).toEqual({
      dias: ['qua'],
      hora: 17,
    });
  });

  it('põe os dias da estrutura na ordem da semana', () => {
    const a = { dia: '', hora: '', aulaFixa: { dias: ['qui' as const, 'ter' as const], hora: 18 } };
    expect(aulaFixaDe(a).dias).toEqual(['ter', 'qui']);
  });
});

describe('rotuloDaAulaFixa', () => {
  it('um, dois e três dias', () => {
    expect(rotuloDaAulaFixa({ dias: ['qua'], hora: 17 })).toEqual({ dia: 'quarta', hora: '17h' });
    expect(rotuloDaAulaFixa({ dias: ['ter', 'qui'], hora: 18 })).toEqual({
      dia: 'terça e quinta',
      hora: '18h',
    });
    expect(rotuloDaAulaFixa({ dias: ['seg', 'qua', 'sex'], hora: 8 })).toEqual({
      dia: 'segunda, quarta e sexta',
      hora: '8h',
    });
  });

  it('sem dia, grava o texto de sempre', () => {
    expect(rotuloDaAulaFixa({ dias: [], hora: null })).toEqual({ dia: SEM_HORARIO_FIXO, hora: '' });
  });

  it('com dia e sem hora, a hora fica vazia', () => {
    expect(rotuloDaAulaFixa({ dias: ['sab'], hora: null })).toEqual({ dia: 'sábado', hora: '' });
  });
});

describe('temAulaNoDia', () => {
  it('confere o dia na estrutura', () => {
    const af = { dias: ['ter' as const, 'qui' as const], hora: 18 };
    expect(temAulaNoDia(af, 'qui')).toBe(true);
    expect(temAulaNoDia(af, 'qua')).toBe(false);
  });
});

describe('horário por dia (SCRUM-101)', () => {
  // segunda 15h15 e quarta 17h30, como no pedido do PO
  const SEG = 15 * 60 + 15;
  const QUA = 17 * 60 + 30;
  const af = aulaFixaComHorarios(['qua', 'seg'], { seg: SEG, qua: QUA });

  it('o primeiro dia da semana dá a hora geral, e só o dia diferente vai para porDia', () => {
    expect(af).toEqual({ dias: ['seg', 'qua'], hora: 15, minuto: 15, porDia: { qua: QUA } });
  });

  it('todo dia no mesmo horário não grava porDia', () => {
    expect(aulaFixaComHorarios(['seg', 'qua'], { seg: SEG, qua: SEG })).toEqual({
      dias: ['seg', 'qua'],
      hora: 15,
      minuto: 15,
    });
  });

  it('dia sem começo fica no horário geral', () => {
    const parcial = aulaFixaComHorarios(['seg', 'qua'], { seg: SEG });
    expect(inicioNoDia(parcial, 'qua')).toBe(SEG);
  });

  it('sem dia ou sem começo nenhum, não há hora', () => {
    expect(aulaFixaComHorarios([], { seg: SEG })).toEqual({ dias: [], hora: null });
    expect(aulaFixaComHorarios(['seg'], {})).toEqual({ dias: ['seg'], hora: null });
  });

  it('a duração padrão não é gravada; outra é', () => {
    expect(aulaFixaComHorarios(['seg'], { seg: SEG }, 60).duracao).toBeUndefined();
    expect(aulaFixaComHorarios(['seg'], { seg: SEG }, 90).duracao).toBe(90);
  });

  it('cada dia tem o seu começo', () => {
    expect(inicioNoDia(af, 'seg')).toBe(SEG);
    expect(inicioNoDia(af, 'qua')).toBe(QUA);
    expect(temHorarioPorDia(af)).toBe(true);
    expect(iniciosDaAula(af)).toEqual([SEG, QUA]);
  });

  it('os trechos da semana usam o começo de cada dia e a mesma duração', () => {
    const aluno = { dia: '', hora: '', aulaFixa: { ...af, duracao: 90 } };
    expect(trechosDaAulaFixa(aluno)).toEqual([
      { dia: 'seg', inicio: SEG, fim: SEG + 90 },
      { dia: 'qua', inicio: QUA, fim: QUA + 90 },
    ]);
  });

  it('o rótulo acompanha os dias na mesma ordem', () => {
    expect(rotuloDaAulaFixa(af)).toEqual({ dia: 'segunda e quarta', hora: '15h15 e 17h30' });
  });

  it('horaNoDia devolve o horário daquele dia', () => {
    const aluno = { dia: '', hora: '', aulaFixa: af };
    expect(horaNoDia(aluno, 'seg')).toBe('15h15');
    expect(horaNoDia(aluno, 'qua')).toBe('17h30');
  });

  it('a leitura descarta o porDia inútil: dia fora da aula, igual ao geral ou fora do passo', () => {
    const lido = aulaFixaDe({
      dia: '',
      hora: '',
      aulaFixa: {
        dias: ['seg', 'qua'],
        hora: 15,
        minuto: 15,
        porDia: { seg: SEG, qua: QUA, sex: 600, ter: 1001 } as AulaFixa['porDia'],
      },
    });
    expect(lido.porDia).toEqual({ qua: QUA });
  });

  it('o aluno de antes, sem porDia, continua igual', () => {
    const antigo = { dias: ['ter', 'qui'] as DiaDaSemana[], hora: 18 };
    expect(temHorarioPorDia(antigo)).toBe(false);
    expect(rotuloDaAulaFixa(antigo)).toEqual({ dia: 'terça e quinta', hora: '18h' });
  });
});
