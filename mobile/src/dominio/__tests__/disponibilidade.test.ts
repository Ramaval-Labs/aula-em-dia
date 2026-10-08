/**
 * Disponibilidade semanal. As strings vão para a tela, então são conferidas
 * letra a letra — mesmo contrato de `politica.test.ts`.
 */

import {
  adicionarFolga,
  alternarBloco,
  contarBlocos,
  diaDaSemanaDe,
  DIAS_DA_SEMANA,
  DIAS_UTEIS,
  duracaoDaFaixa,
  emFolga,
  ERRO_FOLGA,
  FAIXAS_HORARIAS,
  folgaValida,
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

describe('folgaValida', () => {
  // Ano fixo: a resposta não pode depender do dia em que o teste roda.
  const ANO = 2026;
  const feriado: Folga = { de: '07/09', ate: '07/09', motivo: 'feriado' };
  const viagem: Folga = { de: '14/09', ate: '21/09', motivo: 'viagem' };
  const existentes = [feriado, viagem];
  const folga = (de: string, ate: string): Folga => ({ de, ate, motivo: 'congresso' });

  it('um dia só, com ate igual a de, é válido', () => {
    expect(folgaValida(folga('10/09', '10/09'), existentes, ANO)).toBeNull();
  });

  it('período sem sobreposição é válido', () => {
    expect(folgaValida(folga('01/10', '05/10'), existentes, ANO)).toBeNull();
  });

  it('folga colada em outra, sem dividir dia, é válida', () => {
    expect(folgaValida(folga('08/09', '13/09'), existentes, ANO)).toBeNull();
  });

  it('período que atravessa a virada do ano é válido', () => {
    expect(folgaValida(folga('28/12', '05/01'), existentes, ANO)).toBeNull();
  });

  it('de depois de ate é erro', () => {
    expect(folgaValida(folga('20/10', '10/10'), existentes, ANO)).toBe(
      'A folga termina antes de começar',
    );
    expect(ERRO_FOLGA.fimAntesDoInicio).toBe('A folga termina antes de começar');
  });

  it.each(['32/13', 'abc', '', '7/9', '31/02'])('início malformado "%s" é erro', (de) => {
    expect(folgaValida(folga(de, '10/10'), existentes, ANO)).toBe(
      'Data de início inválida, use dd/mm',
    );
  });

  it.each(['32/13', 'abc', ''])('fim malformado "%s" é erro', (ate) => {
    expect(folgaValida(folga('10/10', ate), existentes, ANO)).toBe(
      'Data de fim inválida, use dd/mm',
    );
  });

  it('sobreposição é erro e diz com qual folga', () => {
    expect(folgaValida(folga('20/09', '25/09'), existentes, ANO)).toBe(
      'Já existe folga em 14/09 a 21/09 (viagem)',
    );
    expect(folgaValida(folga('07/09', '07/09'), existentes, ANO)).toBe(
      'Já existe folga em 07/09 (feriado)',
    );
  });

  it('folga que engole outra inteira também sobrepõe', () => {
    expect(folgaValida(folga('01/09', '30/09'), existentes, ANO)).toBe(
      'Já existe folga em 07/09 (feriado)',
    );
  });

  it('sobreposição atravessando a virada do ano', () => {
    const recesso: Folga = { de: '28/12', ate: '05/01', motivo: 'recesso' };
    expect(folgaValida(folga('03/01', '03/01'), [recesso], ANO)).toBe(
      'Já existe folga em 28/12 a 05/01 (recesso)',
    );
  });

  it('sem motivo, a mensagem não deixa parênteses vazios', () => {
    const semMotivo: Folga = { de: '14/09', ate: '21/09', motivo: '' };
    expect(folgaValida(folga('15/09', '15/09'), [semMotivo], ANO)).toBe(
      'Já existe folga em 14/09 a 21/09',
    );
  });

  it('folga no passado não é erro — barrar é decisão de produto', () => {
    expect(folgaValida(folga('02/01', '03/01'), [], 2020)).toBeNull();
  });
});

describe('adicionarFolga', () => {
  const ANO = 2026;
  const feriado: Folga = { de: '07/09', ate: '07/09', motivo: 'feriado' };
  const viagem: Folga = { de: '14/09', ate: '21/09', motivo: 'viagem' };

  it('insere em ordem de data', () => {
    const nova: Folga = { de: '10/09', ate: '10/09', motivo: 'congresso' };
    expect(adicionarFolga([viagem, feriado], nova, ANO).map((f) => f.de)).toEqual([
      '07/09',
      '10/09',
      '14/09',
    ]);
  });

  it('ordena pela data, não pelo texto dd/mm', () => {
    const nova: Folga = { de: '01/10', ate: '01/10', motivo: 'congresso' };
    expect(adicionarFolga([viagem], nova, ANO).map((f) => f.de)).toEqual(['14/09', '01/10']);
  });

  it('ordena atravessando a virada do ano', () => {
    const recesso: Folga = { de: '28/12', ate: '05/01', motivo: 'recesso' };
    const nova: Folga = { de: '10/01', ate: '10/01', motivo: 'congresso' };
    expect(adicionarFolga([nova], recesso, ANO).map((f) => f.de)).toEqual(['28/12', '10/01']);
  });

  it('devolve array novo e não muta a entrada', () => {
    const antes: Folga[] = [viagem, feriado];
    const copia = JSON.parse(JSON.stringify(antes));
    const nova: Folga = { de: '10/09', ate: '10/09', motivo: 'congresso' };
    const depois = adicionarFolga(antes, nova, ANO);
    expect(depois).not.toBe(antes);
    expect(antes).toEqual(copia);
    expect(depois).toHaveLength(3);
    expect(depois).toContainEqual(nova);
    expect(depois.find((f) => f.de === '10/09')).not.toBe(nova);
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
