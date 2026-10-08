/**
 * Montagem de pacote, `pacote.ts` (SCRUM-33).
 *
 * O "hoje" entra sempre como parâmetro, nunca por `hoje()`. As datas dos casos
 * ficam entre agosto e janeiro: `somarDias` infere o ano a partir do dia em
 * que a suíte roda, e só uma conta que atravesse 29 de fevereiro mudaria de um
 * ano para o outro.
 */

import {
  AULAS_OFERECIDAS,
  AULAS_PADRAO,
  calcularPacote,
  configPadrao,
  DIAS_ATE_VENCER,
  validadeDoPacote,
} from '../pacote';
import { VALOR_AULA } from '../politica';
import type { ConfigPacote, Politicas } from '../tipos';

const HOJE = '28/08';

/** A política padrão de `spec/casos-de-teste.md`. */
const PADRAO: Politicas = {
  avisoHoras: 24,
  avisadaDevolve: true,
  limiteReposicoes: 3,
  validadeDias: 60,
};

const config = (over: Partial<ConfigPacote> = {}): ConfigPacote => ({
  aulas: 8,
  valorPorAula: 80,
  validadeDias: 60,
  somarSaldo: false,
  ...over,
});

describe('as constantes do handoff (A7 e D1)', () => {
  it('as quantidades oferecidas são 4, 8 e 12', () => {
    expect(AULAS_OFERECIDAS).toEqual([4, 8, 12]);
  });

  it('o pacote padrão tem 8 aulas, e 8 está entre as oferecidas', () => {
    expect(AULAS_PADRAO).toBe(8);
    expect(AULAS_OFERECIDAS).toContain(AULAS_PADRAO);
  });

  it('o primeiro vencimento é em 7 dias', () => {
    expect(DIAS_ATE_VENCER).toBe(7);
  });
});

describe('configPadrao(politicas)', () => {
  it('8 aulas a R$ 80, com a validade da política e sem somar saldo', () => {
    expect(VALOR_AULA).toBe(80);
    expect(configPadrao(PADRAO)).toEqual({
      aulas: 8,
      valorPorAula: 80,
      validadeDias: 60,
      somarSaldo: false,
    });
  });

  it('a validade acompanha a política, inclusive "sem prazo" (0)', () => {
    expect(configPadrao({ ...PADRAO, validadeDias: 30 }).validadeDias).toBe(30);
    expect(configPadrao({ ...PADRAO, validadeDias: 0 }).validadeDias).toBe(0);
  });

  it('o valor por aula não vem da política: é sempre o padrão do app', () => {
    const outra: Politicas = {
      avisoHoras: 0,
      avisadaDevolve: false,
      limiteReposicoes: 0,
      validadeDias: 0,
    };

    expect(configPadrao(outra).valorPorAula).toBe(VALOR_AULA);
  });

  it('cada chamada devolve um objeto novo', () => {
    expect(configPadrao(PADRAO)).not.toBe(configPadrao(PADRAO));
  });
});

describe('validadeDoPacote(validadeDias, hoje)', () => {
  it('0 dias é "sem prazo", seja qual for o dia', () => {
    expect(validadeDoPacote(0, HOJE)).toBe('sem prazo');
    expect(validadeDoPacote(0, '31/12')).toBe('sem prazo');
  });

  it.each([
    [60, '28/08', '27/10'], // a política padrão, atravessando dois meses
    [30, '28/08', '27/09'],
    [3, '28/08', '31/08'], // último dia do mês
    [4, '28/08', '01/09'], // virada de mês
    [DIAS_ATE_VENCER, '28/08', '04/09'], // o prazo do primeiro vencimento
    [30, '15/12', '14/01'], // virada de ano
    [1, '31/12', '01/01'],
  ])('%d dias a partir de %s → %s', (dias, hoje, validade) => {
    expect(validadeDoPacote(dias, hoje)).toBe(validade);
  });
});

describe('calcularPacote(config, saldoAnterior, hoje)', () => {
  it.each(AULAS_OFERECIDAS)('pacote de %d aulas a R$ 80', (aulas) => {
    expect(calcularPacote(config({ aulas }), 0, HOJE)).toEqual({
      total: aulas,
      saldoFinal: aulas,
      valorTotal: aulas * 80,
      validade: '27/10',
      vence: '04/09',
    });
  });

  it('os três valores, por extenso: R$ 320, R$ 640 e R$ 960', () => {
    const valores = AULAS_OFERECIDAS.map(
      (aulas) => calcularPacote(config({ aulas }), 0, HOJE).valorTotal,
    );

    expect(valores).toEqual([320, 640, 960]);
  });

  it('sem somar o saldo, o que sobrou do pacote anterior não entra', () => {
    const p = calcularPacote(config({ somarSaldo: false }), 2, HOJE);

    expect(p.total).toBe(8);
    expect(p.saldoFinal).toBe(8);
  });

  it('somando o saldo, as aulas que sobraram entram no total e não são cobradas', () => {
    const p = calcularPacote(config({ somarSaldo: true }), 2, HOJE);

    expect(p.total).toBe(10);
    expect(p.saldoFinal).toBe(10);
    expect(p.valorTotal).toBe(640);
  });

  it('somar saldo zero não muda nada', () => {
    expect(calcularPacote(config({ somarSaldo: true }), 0, HOJE)).toEqual(
      calcularPacote(config({ somarSaldo: false }), 0, HOJE),
    );
  });

  it('pacote sem prazo ainda tem o primeiro vencimento em 7 dias', () => {
    const p = calcularPacote(config({ validadeDias: 0 }), 0, HOJE);

    expect(p.validade).toBe('sem prazo');
    expect(p.vence).toBe('04/09');
  });

  it('o vencimento conta de hoje, e vira o mês e o ano junto', () => {
    expect(calcularPacote(config(), 0, '28/09').vence).toBe('05/10');
    expect(calcularPacote(config(), 0, '28/12').vence).toBe('04/01');
  });

  it('valor por aula com centavos', () => {
    expect(calcularPacote(config({ aulas: 4, valorPorAula: 62.5 }), 0, HOJE).valorTotal).toBe(250);
  });

  it('valor por aula zero dá um pacote de R$ 0: o cálculo não recusa', () => {
    expect(calcularPacote(config({ valorPorAula: 0 }), 0, HOJE).valorTotal).toBe(0);
  });

  it('valor por aula ausente vira NaN: quem impede é o tipo, não o cálculo', () => {
    const semValor = { aulas: 8, validadeDias: 60, somarSaldo: false } as ConfigPacote;
    const p = calcularPacote(semValor, 0, HOJE);

    expect(p.valorTotal).toBeNaN();
    // O resto do pacote sai inteiro: só o valor se perde.
    expect(p.total).toBe(8);
    expect(p.validade).toBe('27/10');
  });
});
