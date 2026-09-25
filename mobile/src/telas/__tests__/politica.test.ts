/**
 * O aviso de impacto da Política (H§9): uma linha por campo alterado, com o
 * texto de retroatividade que o handoff define, e limite 0 falado como "sem
 * limite" — o stepper mostra "—", que não se lê.
 */

import { mudancas } from '../Politica';
import type { Politicas } from '../../dominio/tipos';

const base: Politicas = {
  avisoHoras: 24,
  avisadaDevolve: true,
  limiteReposicoes: 3,
  validadeDias: 30,
};

describe('aviso de impacto da política', () => {
  it('sem mudança não há aviso', () => {
    expect(mudancas(base, base, 4)).toEqual([]);
  });

  it('lista todos os campos alterados, um por linha', () => {
    const lista = mudancas(
      base,
      { ...base, avisoHoras: 48, avisadaDevolve: false, validadeDias: 0 },
      4,
    );
    expect(lista.map((m) => m.campo)).toEqual(['avisoHoras', 'avisadaDevolve', 'validadeDias']);
    expect(lista[0].titulo).toBe('Prazo de aviso muda de 24h para 48h');
    expect(lista[2].titulo).toBe('Validade padrão muda para sem prazo');
  });

  it('limite 0 é "sem limite", e o texto concorda com o número de pacotes', () => {
    expect(mudancas(base, { ...base, limiteReposicoes: 0 }, 4)[0]).toEqual({
      campo: 'limiteReposicoes',
      titulo: 'Você mudou o limite de 3 para sem limite',
      texto:
        'Vale só para pacotes novos. Os 4 pacotes em andamento seguem com a regra antiga até vencer.',
    });
    expect(mudancas({ ...base, limiteReposicoes: 0 }, base, 1)[0].texto).toBe(
      'Vale só para pacotes novos. O pacote em andamento segue com a regra antiga até vencer.',
    );
  });
});
