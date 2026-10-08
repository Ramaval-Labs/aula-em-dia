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

/**
 * Reais e centavos com vírgula decimal; os reais são dígitos soltos ou grupos
 * de milhar bem formados ("1.234.567").
 */
const COM_VIRGULA = /^(\d{1,3}(?:\.\d{3})+|\d+),(\d+)$/;
/** Só reais, sem vírgula, com ou sem milhar. */
const SO_REAIS = /^(\d{1,3}(?:\.\d{3})+|\d+)$/;
/** Sem vírgula, ponto com uma ou duas casas é decimal ("62.50"). */
const PONTO_DECIMAL = /^(\d+)\.(\d{1,2})$/;

/**
 * Texto digitado → centavos inteiros, ou `null` se não for um valor utilizável.
 *
 * Centavos e não reais: é como o banco guarda (`valor_por_aula_centavos`) e
 * evita ponto flutuante em dinheiro. Para mostrar, `dinheiro(centavos / 100)`.
 *
 * A leitura, em ordem:
 * - "R$" na frente é aceito, colado ou com espaço; espaço em volta também;
 * - com vírgula, ela é o decimal e os pontos antes dela são milhar ("1.234,56");
 * - sem vírgula, ponto seguido de três dígitos é milhar, como em pt-BR
 *   ("1.234" é mil e duzentos), e seguido de um ou dois é decimal ("62.50"),
 *   porque o teclado numérico às vezes só tem ponto.
 *
 * Mais de duas casas decimais ("80,555") é recusado, não arredondado: num
 * valor de moeda isso é erro de digitação, e arredondar mudaria em silêncio o
 * que o professor cobra. Quem chama mostra o erro e a pessoa corrige.
 *
 * Sinal de menos, separador sobrando ("62,", ",50") e formato americano
 * ("1,234.56") também dão `null` — nunca `NaN`, que chegaria à tela como
 * "R$ NaN". Zero é valor: se pode ou não, é a validação de quem chama.
 */
export function lerDinheiro(texto: string): number | null {
  const s = texto.trim().replace(/^R\$\s*/i, '');

  let reais: string;
  let centavos = '';
  let m: RegExpExecArray | null;
  if ((m = COM_VIRGULA.exec(s))) {
    [, reais, centavos] = m;
    if (centavos.length > 2) return null;
  } else if ((m = SO_REAIS.exec(s))) {
    [, reais] = m;
  } else if ((m = PONTO_DECIMAL.exec(s))) {
    [, reais, centavos] = m;
  } else {
    return null;
  }

  const total = Number(reais.replace(/\./g, '')) * 100 + Number(centavos.padEnd(2, '0'));
  return Number.isSafeInteger(total) ? total : null;
}
