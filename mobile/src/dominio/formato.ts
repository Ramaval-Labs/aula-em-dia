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

/** Só o agrupamento de milhar, sem centavos. */
export function milhar(n: number): string {
  return agruparMilhar(String(Math.round(n)));
}

export function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0];
}

export function plural(n: number, singular: string, plural_: string): string {
  return `${n} ${n === 1 ? singular : plural_}`;
}

/** Só a unidade, sem o número ("aula"/"aulas") — para o número ficar à parte. */
export function unidade(n: number, singular: string, plural_: string): string {
  return n === 1 ? singular : plural_;
}

/**
 * Valor curto para caixa estreita: a partir de 5 dígitos vira "R$ 12,5 mil"
 * (uma casa decimal, sem zero à toa) e, no milhão, "R$ 1,2 mi". Abaixo disso
 * é o valor inteiro com o milhar agrupado, como nos cartões de resumo do
 * Financeiro. O rótulo do leitor de tela continua com o valor por extenso.
 */
export function dinheiroCompacto(n: number): string {
  const v = Math.round(n);
  const sinal = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs < 10000) return `R$ ${sinal}${agruparMilhar(String(abs))}`;
  const [divisor, sufixo] = abs < 1000000 ? [1000, 'mil'] : [1000000, 'mi'];
  const escala = Math.round((abs / divisor) * 10) / 10;
  const inteiro = Math.floor(escala);
  const decimal = Math.round((escala - inteiro) * 10);
  const corpo = decimal === 0 ? agruparMilhar(String(inteiro)) : `${inteiro},${decimal}`;
  return `R$ ${sinal}${corpo} ${sufixo}`;
}
