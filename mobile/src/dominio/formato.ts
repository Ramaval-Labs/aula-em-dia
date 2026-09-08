/**
 * Formatação pt-BR feita à mão de propósito: o Hermes nem sempre traz ICU
 * completo, e moeda errada na tela de cobrança é um bug caro. Números
 * tabulares ficam por conta da tipografia.
 */

/** Agrupa o milhar com ponto, como em pt-BR. */
function agruparMilhar(inteiro: string): string {
  return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 480 → "R$ 480,00" */
export function dinheiro(n: number): string {
  const negativo = n < 0;
  const centavos = Math.round(Math.abs(n) * 100);
  const inteiro = Math.floor(centavos / 100);
  const resto = centavos % 100;
  const corpo = `${agruparMilhar(String(inteiro))},${resto < 10 ? '0' : ''}${resto}`;
  return `R$ ${negativo ? '-' : ''}${corpo}`;
}

/** Só o agrupamento de milhar — usado nos três totais do Financeiro. */
export function milhar(n: number): string {
  return agruparMilhar(String(Math.round(n)));
}

export function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0];
}

export function plural(n: number, singular: string, plural_: string): string {
  return `${n} ${n === 1 ? singular : plural_}`;
}
