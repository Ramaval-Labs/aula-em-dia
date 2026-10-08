/**
 * A notação da semente (SCRUM-13, SCRUM-14, SCRUM-18).
 *
 * `lerNotacao` é a gramática; quem a lê são o app (`resolverData`) e o gerador
 * de `seed.sql`. A base entra sempre como parâmetro e os casos ficam entre
 * junho e novembro: assim a suíte não depende do dia em que roda nem de ano
 * bissexto.
 */

import { estadoInicial, lerNotacao, resolverData, SEMENTE_NA_NOTACAO } from '../semente';

const BASE = '28/08';

describe('lerNotacao — a gramática', () => {
  it.each([
    ['hoje', [{ dias: 0, comDia: false }]],
    ['hoje+0', [{ dias: 0, comDia: false }]],
    ['hoje-12', [{ dias: -12, comDia: false }]],
    ['hoje+32', [{ dias: 32, comDia: false }]],
  ])('%s é um deslocamento só', (valor, partes) => {
    expect(lerNotacao(valor)).toEqual(partes);
  });

  it.each(['16/08', '', 'sem prazo', 'quarta', 'Livre hoje, sem aula', 'hoje-', 'hoje-1x'])(
    '"%s" não tem a notação e volta como um literal',
    (valor) => {
      expect(lerNotacao(valor)).toEqual([valor]);
    },
  );

  it('dentro de um texto, só o trecho entre chaves é deslocamento', () => {
    expect(lerNotacao('Pago em {hoje-58} · Pix')).toEqual([
      'Pago em ',
      { dias: -58, comDia: false },
      ' · Pix',
    ]);
  });

  it('`dia:` pede o nome do dia junto', () => {
    expect(lerNotacao('{dia:hoje+1}, 17h')).toEqual([{ dias: 1, comDia: true }, ', 17h']);
    expect(lerNotacao('{dia:hoje+1}')).toEqual([{ dias: 1, comDia: true }]);
  });

  it('mais de um deslocamento no mesmo texto', () => {
    expect(lerNotacao('{hoje-1} a {hoje+1}')).toEqual([
      { dias: -1, comDia: false },
      ' a ',
      { dias: 1, comDia: false },
    ]);
  });
});

describe('resolverData — a notação para o app', () => {
  it.each([
    ['hoje', '28/08'],
    ['hoje-12', '16/08'],
    ['hoje+33', '30/09'],
    ['hoje-58', '01/07'],
    ['Pago em {hoje-58} · Pix', 'Pago em 01/07 · Pix'],
    ['{hoje-1} a {hoje+1}', '27/08 a 29/08'],
    ['16/08', '16/08'],
    ['', ''],
    ['sem prazo', 'sem prazo'],
  ])('%s → %s', (valor, esperado) => {
    expect(resolverData(valor, BASE)).toBe(esperado);
  });

  it('com `dia:`, o nome do dia vem na frente da data', () => {
    expect(resolverData('{dia:hoje+1}', BASE)).toMatch(
      /^(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo), 29\/08$/,
    );
  });
});

describe('a semente e o estado inicial', () => {
  const textos = (valor: unknown): string[] => {
    if (typeof valor === 'string') return [valor];
    if (Array.isArray(valor)) return valor.flatMap(textos);
    if (valor !== null && typeof valor === 'object') return Object.values(valor).flatMap(textos);
    return [];
  };
  const temDeslocamento = (v: string) => lerNotacao(v).some((p) => typeof p !== 'string');

  it('a semente guarda deslocamento', () => {
    expect(textos(SEMENTE_NA_NOTACAO).some(temDeslocamento)).toBe(true);
  });

  it('o estado inicial não deixa nenhum deslocamento sem resolver', () => {
    expect(textos(estadoInicial()).filter(temDeslocamento)).toEqual([]);
  });

  it('cada chamada devolve uma cópia: mexer numa não mexe na semente', () => {
    const um = estadoInicial();
    um.alunos[0].name = 'mexido';
    um.extratos.val.length = 0;

    expect(estadoInicial().alunos[0].name).not.toBe('mexido');
    expect(estadoInicial().extratos.val.length).toBeGreaterThan(0);
    expect(SEMENTE_NA_NOTACAO.alunos[0].name).not.toBe('mexido');
  });
});
