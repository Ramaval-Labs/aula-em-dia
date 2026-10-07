/**
 * Inferência do ano de um dd/mm (SCRUM-55).
 *
 * O "hoje" entra sempre como parâmetro (`referencia`), nunca por `hoje()`:
 * esta suíte não pode depender do dia em que roda nem da flag USAR_DATA_REAL.
 */

import {
  dataPorExtenso,
  diasEntre,
  JANELA_DO_ANO,
  lerDdMm,
  mesPorExtenso,
  somarDias,
} from '../datas';

/** Date local de dd/mm/aaaa, sem passar por parsing de string. */
const em = (ddmm: string, ano: number): Date => {
  const [dia, mes] = ddmm.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
};

const UM_DIA = 24 * 60 * 60 * 1000;
const dias = (de: Date, ate: Date) => Math.round((ate.getTime() - de.getTime()) / UM_DIA);

/** Lê `ddmm` com `hoje` como referência e devolve o ano e a distância a ele. */
const ler = (ddmm: string, hoje: Date) => {
  const d = lerDdMm(ddmm, hoje);
  if (!d) throw new Error(`${ddmm} devia ser uma data válida`);
  return { ano: d.getFullYear(), distancia: dias(hoje, d) };
};

describe('lerDdMm — o ano sai de hoje', () => {
  it('data perto de hoje fica no mesmo ano', () => {
    expect(ler('05/10', em('30/09', 2026))).toEqual({ ano: 2026, distancia: 5 });
  });

  it('janeiro visto de dezembro é o ano seguinte', () => {
    expect(ler('05/01', em('28/12', 2026))).toEqual({ ano: 2027, distancia: 8 });
  });

  it('dezembro visto de janeiro é o ano anterior', () => {
    expect(ler('28/12', em('05/01', 2027))).toEqual({ ano: 2026, distancia: -8 });
  });

  it('o próprio dia é distância zero', () => {
    expect(ler('30/09', em('30/09', 2026))).toEqual({ ano: 2026, distancia: 0 });
  });

  it('a janela é de 183 dias', () => {
    expect(JANELA_DO_ANO).toBe(183);
  });

  it('exatamente 183 dias à frente fica no mesmo ano; 184 desloca', () => {
    const hoje = em('15/06', 2026);
    expect(ler('15/12', hoje)).toEqual({ ano: 2026, distancia: 183 });
    expect(ler('16/12', hoje)).toEqual({ ano: 2025, distancia: -181 });
  });

  it('exatamente 183 dias para trás fica no mesmo ano; 184 desloca', () => {
    const hoje = em('15/12', 2026);
    expect(ler('15/06', hoje)).toEqual({ ano: 2026, distancia: -183 });
    expect(ler('14/06', hoje)).toEqual({ ano: 2027, distancia: 181 });
  });

  it('a referência não precisa ser meia-noite', () => {
    const hoje = new Date(2026, 11, 28, 23, 59);
    expect(lerDdMm('05/01', hoje)?.getFullYear()).toBe(2027);
  });
});

describe('lerDdMm — ano explícito', () => {
  it('um número é o ano, sem inferência', () => {
    expect(lerDdMm('05/01', 2026)?.getFullYear()).toBe(2026);
    expect(lerDdMm('28/12', 2031)?.getFullYear()).toBe(2031);
  });
});

describe('lerDdMm — 29/02', () => {
  it('cai no ano bissexto quando ele é o mais próximo', () => {
    const d = lerDdMm('29/02', em('01/12', 2027));
    expect(d?.getFullYear()).toBe(2028);
    expect(d?.getMonth()).toBe(1);
    expect(d?.getDate()).toBe(29);
  });

  it('é null quando o ano inferido não é bissexto, em vez de virar 01/03', () => {
    expect(lerDdMm('29/02', em('30/09', 2026))).toBeNull();
  });

  it('com ano explícito: vale no bissexto, null no comum', () => {
    expect(lerDdMm('29/02', 2028)?.getDate()).toBe(29);
    expect(lerDdMm('29/02', 2026)).toBeNull();
  });
});

describe('lerDdMm — entrada inválida é null', () => {
  const hoje = em('30/09', 2026);

  it.each(['31/04', '32/01', '00/05', '15/13', '15/00', 'abc', '', '5/1', '05-01'])(
    '%p',
    (entrada) => {
      expect(lerDdMm(entrada, hoje)).toBeNull();
      expect(lerDdMm(entrada, 2026)).toBeNull();
    },
  );

  it('espaço em volta é aceito', () => {
    expect(lerDdMm(' 05/10 ', hoje)?.getDate()).toBe(5);
  });
});

describe('diasEntre', () => {
  it('cruza a virada de ano para frente', () => {
    expect(diasEntre('28/12', '05/01')).toBe(8);
  });

  it('cruza a virada de ano para trás', () => {
    expect(diasEntre('05/01', '28/12')).toBe(-8);
  });

  it('inválido é null', () => {
    expect(diasEntre('31/04', '05/01')).toBeNull();
    expect(diasEntre('05/01', 'abc')).toBeNull();
  });
});

describe('somarDias', () => {
  it('atravessa a virada de ano', () => {
    expect(somarDias('28/12', 8)).toBe('05/01');
  });

  it('inválido volta como veio', () => {
    expect(somarDias('abc', 3)).toBe('abc');
  });
});

describe('o ano que aparece na tela', () => {
  it('mesPorExtenso mostra o ano inferido, para frente e para trás', () => {
    expect(mesPorExtenso('05/01', em('28/12', 2026))).toBe('Janeiro de 2027');
    expect(mesPorExtenso('28/12', em('05/01', 2027))).toBe('Dezembro de 2026');
  });

  it('mesPorExtenso no modo demonstração (28/08 de 2025) e no modo data real', () => {
    expect(mesPorExtenso('28/08', em('28/08', 2025))).toBe('Agosto de 2025');
    expect(mesPorExtenso('07/10', em('07/10', 2026))).toBe('Outubro de 2026');
  });

  it('dataPorExtenso usa o dia da semana do ano inferido', () => {
    // 05/01/2027 é terça; em 2026 seria segunda.
    expect(dataPorExtenso('05/01', em('28/12', 2026))).toBe('Terça, 5 de janeiro');
    expect(dataPorExtenso('05/01', 2026)).toBe('Segunda, 5 de janeiro');
  });

  it('inválido volta como veio', () => {
    expect(mesPorExtenso('abc', em('30/09', 2026))).toBe('abc');
    expect(dataPorExtenso('31/04', em('30/09', 2026))).toBe('31/04');
  });
});
