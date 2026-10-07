/**
 * Disponibilidade semanal. As strings vão para a tela, então são conferidas
 * letra a letra — mesmo contrato de `politica.test.ts`.
 */

import {
  alternarBloco,
  contarBlocos,
  diaDaSemanaDe,
  DIAS_DA_SEMANA,
  DIAS_UTEIS,
  duracaoDaFaixa,
  emFolga,
  FAIXAS_HORARIAS,
  horarioDaFaixa,
  horasPorSemana,
  intersecao,
  nomeDaFaixa,
  nomeDoDia,
  periodoDaFolga,
  resumo,
  resumoMarcados,
  temBloco,
} from '../disponibilidade';
import type { BlocoSemanal, Folga } from '../tipos';

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

describe('grade', () => {
  it('o professor vê seis dias, sem domingo', () => {
    expect(DIAS_DA_SEMANA).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sab']);
    expect(DIAS_DA_SEMANA).not.toContain('dom');
  });

  it('o aluno preenche de segunda a sexta', () => {
    expect(DIAS_UTEIS).toHaveLength(5);
  });

  it('são quatro faixas, na ordem do dia', () => {
    expect(FAIXAS_HORARIAS).toEqual(['manha', 'tarde', 'fimTarde', 'noite']);
  });

  it('cada faixa tem os dois rótulos do handoff', () => {
    expect(horarioDaFaixa('manha')).toBe('8–12');
    expect(nomeDaFaixa('manha')).toBe('manhã');
    expect(horarioDaFaixa('noite')).toBe('20–22');
  });

  it('a duração sai do intervalo desenhado', () => {
    expect(duracaoDaFaixa('manha')).toBe(4);
    expect(duracaoDaFaixa('tarde')).toBe(3);
    expect(duracaoDaFaixa('fimTarde')).toBe(3);
    expect(duracaoDaFaixa('noite')).toBe(2);
  });

  it('nomeia o dia por extenso', () => {
    expect(nomeDoDia('ter')).toBe('Terça');
    expect(nomeDoDia('sab')).toBe('Sábado');
  });
});

describe('alternarBloco', () => {
  const bloco: BlocoSemanal = { dia: 'qua', faixa: 'noite' };

  it('liga um bloco que não estava marcado', () => {
    expect(temBloco(alternarBloco([], bloco), bloco)).toBe(true);
  });

  it('desliga um bloco já marcado', () => {
    expect(temBloco(alternarBloco([bloco], bloco), bloco)).toBe(false);
  });

  it('não muta a entrada', () => {
    const antes: BlocoSemanal[] = [bloco];
    const copia = JSON.parse(JSON.stringify(antes));
    alternarBloco(antes, { dia: 'seg', faixa: 'manha' });
    expect(antes).toEqual(copia);
  });

  it('mexe só no bloco alvo', () => {
    const outro: BlocoSemanal = { dia: 'qua', faixa: 'tarde' };
    const depois = alternarBloco([bloco, outro], bloco);
    expect(depois).toEqual([outro]);
  });
});

describe('contagem e resumo', () => {
  it('o padrão de A5 tem 13 blocos', () => {
    expect(contarBlocos(PADRAO_A5)).toBe(13);
  });

  it('as horas saem da duração real da faixa, não de 2h por bloco', () => {
    // 2×4 + 5×3 + 5×3 + 1×2 = 40. O mock do handoff mostra 26h, que equivale
    // a contar 2h por bloco e não deriva das faixas desenhadas.
    expect(horasPorSemana(PADRAO_A5)).toBe(40);
  });

  it('resumo do professor', () => {
    expect(resumo(PADRAO_A5)).toBe('13 blocos · 40h por semana');
  });

  it('resumo no singular', () => {
    expect(resumo([{ dia: 'seg', faixa: 'noite' }])).toBe('1 bloco · 2h por semana');
  });

  it('resumo vazio não mostra zero', () => {
    expect(resumo([])).toBe('Nenhum bloco marcado');
  });

  it('resumo do aluno conta só os blocos', () => {
    expect(resumoMarcados(PADRAO_A5)).toBe('13 blocos marcados');
    expect(resumoMarcados([{ dia: 'seg', faixa: 'noite' }])).toBe('1 bloco marcado');
    expect(resumoMarcados([])).toBe('0 blocos marcados');
  });
});

describe('intersecao', () => {
  it('devolve só o que serve para os dois', () => {
    const professor: BlocoSemanal[] = [
      { dia: 'seg', faixa: 'tarde' },
      { dia: 'ter', faixa: 'noite' },
      { dia: 'qua', faixa: 'manha' },
    ];
    const aluno: BlocoSemanal[] = [
      { dia: 'ter', faixa: 'noite' },
      { dia: 'qua', faixa: 'manha' },
      { dia: 'sex', faixa: 'tarde' },
    ];
    expect(intersecao(professor, aluno)).toEqual([
      { dia: 'ter', faixa: 'noite' },
      { dia: 'qua', faixa: 'manha' },
    ]);
  });

  it('sem sobreposição devolve vazio — é o caso que gera a tela C5', () => {
    expect(
      intersecao([{ dia: 'seg', faixa: 'manha' }], [{ dia: 'sex', faixa: 'noite' }]),
    ).toEqual([]);
  });
});

describe('folgas', () => {
  const feriado: Folga = { de: '07/09', ate: '07/09', motivo: 'feriado' };
  const viagem: Folga = { de: '14/09', ate: '21/09', motivo: 'viagem' };

  it('reconhece o dia exato da folga', () => {
    expect(emFolga('07/09', [feriado, viagem])?.motivo).toBe('feriado');
  });

  it('reconhece um dia dentro do intervalo', () => {
    expect(emFolga('18/09', [feriado, viagem])?.motivo).toBe('viagem');
  });

  it('inclui as duas pontas do intervalo', () => {
    expect(emFolga('14/09', [viagem])).not.toBeNull();
    expect(emFolga('21/09', [viagem])).not.toBeNull();
  });

  it('dia livre devolve null', () => {
    expect(emFolga('22/09', [feriado, viagem])).toBeNull();
  });

  it('formata o período como a lista de E3 mostra', () => {
    expect(periodoDaFolga(feriado)).toBe('07/09');
    expect(periodoDaFolga(viagem)).toBe('14/09 a 21/09');
  });
});

describe('diaDaSemanaDe', () => {
  it('28/08 de 2025 é uma quinta', () => {
    expect(diaDaSemanaDe('28/08', 2025)).toBe('qui');
  });

  it('data inválida devolve null', () => {
    expect(diaDaSemanaDe('99/99')).toBeNull();
  });
});
