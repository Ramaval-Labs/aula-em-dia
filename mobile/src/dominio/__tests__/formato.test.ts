/**
 * Leitura de moeda em pt-BR (SCRUM-51).
 *
 * `lerDinheiro` devolve centavos inteiros, ou `null` quando o texto não é um
 * valor utilizável. Os casos são os da tabela do card, na mesma ordem.
 */

import { dinheiro, lerDinheiro } from '../formato';

describe('lerDinheiro — os casos do card', () => {
  it.each([
    ['62,50', 6250], // o caso do bug: vírgula decimal
    ['62.50', 6250], // teclado numérico com ponto
    ['62', 6200], // sem centavos
    ['1.234,56', 123456], // ponto como separador de milhar
    ['R$ 80,00', 8000], // prefixo
    ['80,5', 8050], // um dígito de centavo
  ])('"%s" → %d centavos', (texto, centavos) => {
    expect(lerDinheiro(texto)).toBe(centavos);
  });

  it('"80,555" é recusado: três casas não é valor de moeda', () => {
    expect(lerDinheiro('80,555')).toBeNull();
  });

  it.each(['', ',', 'abc', '-5'])('"%s" não é valor', (texto) => {
    expect(lerDinheiro(texto)).toBeNull();
  });
});

describe('lerDinheiro — bordas da leitura', () => {
  it.each([
    ['R$80', 8000], // prefixo colado
    ['  62,50  ', 6250], // espaço em volta
    ['1.234', 123400], // ponto seguido de três dígitos é milhar, como em pt-BR
    ['1.234.567,89', 123456789], // mais de um grupo de milhar
    ['80.5', 8050], // ponto decimal com um dígito
    ['0', 0], // zero é valor; se pode ou não, é a validação que decide
  ])('"%s" → %d centavos', (texto, centavos) => {
    expect(lerDinheiro(texto)).toBe(centavos);
  });

  it.each([
    'R$', // só o prefixo
    '62,', // vírgula sem centavos
    ',50', // centavos sem reais
    '1.23,45', // grupo de milhar quebrado
    '1.234.56', // dois pontos sem vírgula
    '1,234.56', // formato americano
    '62,50,00', // duas vírgulas
    '6 250', // espaço no meio
  ])('"%s" é recusado', (texto) => {
    expect(lerDinheiro(texto)).toBeNull();
  });

  it('"62.555" é milhar (62.555 reais), não 62,555: ponto + três dígitos é sempre milhar', () => {
    expect(lerDinheiro('62.555')).toBe(6255500);
  });

  it('valor grande demais para inteiro seguro é recusado', () => {
    expect(lerDinheiro('9'.repeat(20))).toBeNull();
  });
});

describe('lerDinheiro — ida e volta com dinheiro()', () => {
  // dinheiro() recebe reais, lerDinheiro devolve centavos: o ciclo divide por 100.
  it.each([
    ['62,50', 'R$ 62,50'],
    ['R$ 1.234,56', 'R$ 1.234,56'],
    ['80,5', 'R$ 80,50'],
    ['62', 'R$ 62,00'],
  ])('"%s" → %s', (texto, naTela) => {
    expect(dinheiro((lerDinheiro(texto) as number) / 100)).toBe(naTela);
  });
});
