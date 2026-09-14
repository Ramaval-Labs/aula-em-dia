/**
 * Os tokens do iOS Glass em `tokens.ts` são espelho da seção `iosGlass` de
 * `tokens/tokens.json`. Este teste pega o descuido de mudar um lado só.
 */

import { TIPO_VIDRO } from '../tipografia';
import {
  CORES_VIDRO,
  MATERIAL,
  MOVIMENTO_VIDRO,
  RAIO_VIDRO,
  TAMANHO_VIDRO,
} from '../tokens';

const json = require('../../../../tokens/tokens.json').iosGlass;

describe('tokens iOS Glass', () => {
  it.each(['claro', 'escuro'] as const)('cores do tema %s batem com o JSON', (tema) => {
    expect(CORES_VIDRO[tema]).toEqual(json.color[tema]);
  });

  it('os dois temas têm os mesmos nomes de cor', () => {
    expect(Object.keys(CORES_VIDRO.escuro).sort()).toEqual(Object.keys(CORES_VIDRO.claro).sort());
  });

  it.each(['claro', 'escuro'] as const)('material do tema %s bate com o JSON', (tema) => {
    const m = MATERIAL[tema];
    const j = json.material[tema];
    expect(m.intensidade).toBe(j.intensidade);
    expect(m.tintDesfoque).toBe(j.tintDesfoque);
    expect(m.filtroWeb).toBe(j.filtroWeb);
    expect(m.opacidadeFundo).toBe(j.opacidadeFundo);
    expect(m.alfaExtraFallback).toBe(j.alfaExtraFallback);
    expect(m.intensidade).toBeGreaterThan(0);
    expect(m.intensidade).toBeLessThanOrEqual(100);
  });

  it('raios, tamanhos e movimento batem com o JSON', () => {
    expect(RAIO_VIDRO).toEqual(json.radius);
    expect(TAMANHO_VIDRO).toEqual(json.size);
    expect(MOVIMENTO_VIDRO).toEqual(json.motion);
  });

  it('papéis tipográficos existem no JSON com o mesmo tamanho', () => {
    for (const [papel, estilo] of Object.entries(TIPO_VIDRO)) {
      expect(json.type[papel]?.size).toBe(estilo.fontSize);
    }
  });
});
