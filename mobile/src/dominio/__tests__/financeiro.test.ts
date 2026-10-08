/**
 * Resumo do mês do Financeiro (SCRUM-28).
 *
 * A referência entra sempre como parâmetro, nunca por `hoje()`: esta suíte
 * não pode depender do dia em que roda nem da flag USAR_DATA_REAL.
 */

import { resumoDoMes } from '../financeiro';
import type { Extratos, Lancamento } from '../tipos';

/** Date local de dd/mm/aaaa, sem passar por parsing de string. */
const em = (ddmm: string, ano: number): Date => {
  const [dia, mes] = ddmm.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
};

/** Lançamento mínimo: só data, título e delta importam para o resumo. */
const l = (d: string, t: string, delta = 0): Lancamento => ({ d, t, s: '', delta, saldo: 0 });

const ZERADO = { aulasDadas: 0, faltasDebitadas: 0, reposicoes: 0 };

describe('resumoDoMes — só o mês da referência', () => {
  it('extrato de dois meses conta só o mês pedido (o bug do cartão)', () => {
    const extratos: Extratos = {
      raf: [
        l('05/08', 'Aula realizada', -1),
        l('12/08', 'Falta sem aviso', -1),
        l('02/09', 'Aula realizada', -1),
        l('09/09', 'Reposição realizada', -1),
      ],
      val: [l('28/08', 'Aula realizada', -1), l('03/09', 'Falta avisada', -1)],
    };
    expect(resumoDoMes(extratos, em('15/09', 2026))).toEqual({
      aulasDadas: 2,
      faltasDebitadas: 1,
      reposicoes: 1,
    });
    expect(resumoDoMes(extratos, em('28/08', 2026))).toEqual({
      aulasDadas: 2,
      faltasDebitadas: 1,
      reposicoes: 0,
    });
  });

  it('na virada do ano, dezembro lido em janeiro é do ano anterior', () => {
    const extratos: Extratos = {
      raf: [
        l('18/12', 'Aula realizada', -1),
        l('22/12', 'Falta sem aviso', -1),
        l('08/01', 'Aula realizada', -1),
        l('15/01', 'Reposição realizada', -1),
      ],
    };
    expect(resumoDoMes(extratos, em('20/01', 2027))).toEqual({
      aulasDadas: 2,
      faltasDebitadas: 0,
      reposicoes: 1,
    });
  });

  it('na virada do ano, janeiro lido em dezembro fica fora de dezembro', () => {
    const extratos: Extratos = {
      raf: [
        l('18/12', 'Aula realizada', -1),
        l('22/12', 'Falta sem aviso', -1),
        l('08/01', 'Aula realizada', -1),
      ],
    };
    expect(resumoDoMes(extratos, em('28/12', 2026))).toEqual({
      aulasDadas: 1,
      faltasDebitadas: 1,
      reposicoes: 0,
    });
  });

  it('mês sem lançamento devolve zeros, não undefined', () => {
    const extratos: Extratos = { raf: [l('05/08', 'Aula realizada', -1)] };
    expect(resumoDoMes(extratos, em('15/10', 2026))).toEqual(ZERADO);
  });

  it('sem extrato nenhum, ou aluno com extrato vazio, devolve zeros', () => {
    expect(resumoDoMes({}, em('15/09', 2026))).toEqual(ZERADO);
    expect(resumoDoMes({ raf: [] }, em('15/09', 2026))).toEqual(ZERADO);
  });
});

describe('resumoDoMes — a regra de contagem é a de antes', () => {
  const ref = em('15/09', 2026);

  it('lançamento de pacote, pagamento e marcação não contam nada', () => {
    const extratos: Extratos = {
      raf: [
        l('01/09', 'Pacote de 8 aulas', 8),
        l('01/09', 'Pagamento recebido', 0),
        l('02/09', 'Reposição marcada', 0),
        l('03/09', 'Proposta de reposição enviada', 0),
        l('04/09', 'Validade estendida', 0),
      ],
    };
    expect(resumoDoMes(extratos, ref)).toEqual(ZERADO);
  });

  it('falta só conta quando debitou', () => {
    const extratos: Extratos = {
      raf: [
        l('02/09', 'Falta avisada', -1),
        l('03/09', 'Falta avisada', 0),
        l('04/09', 'Falta sem aviso', -1),
      ],
    };
    expect(resumoDoMes(extratos, ref).faltasDebitadas).toBe(2);
  });

  it('reposição realizada conta como aula dada e como reposição', () => {
    const extratos: Extratos = { raf: [l('09/09', 'Reposição realizada', -1)] };
    expect(resumoDoMes(extratos, ref)).toEqual({
      aulasDadas: 1,
      faltasDebitadas: 0,
      reposicoes: 1,
    });
  });

  it('lançamento com data inválida é ignorado', () => {
    const extratos: Extratos = { raf: [l('31/04', 'Aula realizada', -1), l('xx', 'Aula realizada', -1)] };
    expect(resumoDoMes(extratos, em('15/04', 2026))).toEqual(ZERADO);
  });
});
