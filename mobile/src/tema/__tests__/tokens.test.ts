/**
 * Os tokens em `tokens.ts` são espelho de `tokens/tokens.json`. Este teste
 * pega o descuido de mudar um lado só.
 */

import { TIPO } from '../tipografia';
import {
  CORES,
  MATERIAL,
  MOVIMENTO,
  PILULA_ABA,
  RAIO,
  TAMANHO,
  TRACO_ICONE,
} from '../tokens';

const json = require('../../../../tokens/tokens.json');

describe('tokens', () => {
  it.each(['claro', 'escuro'] as const)('cores do tema %s batem com o JSON', (tema) => {
    expect(CORES[tema]).toEqual(json.color[tema]);
  });

  it('os dois temas têm os mesmos nomes de cor', () => {
    expect(Object.keys(CORES.escuro).sort()).toEqual(Object.keys(CORES.claro).sort());
  });

  it.each(['claro', 'escuro'] as const)('material do tema %s bate com o JSON', (tema) => {
    const m = MATERIAL[tema];
    const j = json.material[tema];
    expect(m.intensidade).toBe(j.intensidade);
    expect(m.tintDesfoque).toBe(j.tintDesfoque);
    expect(m.filtroWeb).toBe(j.filtroWeb);
    expect(m.opacidadeFundo).toBe(j.opacidadeFundo);
    expect(m.alfaExtraFallback).toBe(j.alfaExtraFallback);
    expect(m.intensidadeAndroid).toBe(j.intensidadeAndroid);
    expect(m.reducaoAndroid).toBe(j.reducaoAndroid);
    expect(m.intensidade).toBeGreaterThan(0);
    expect(m.intensidade).toBeLessThanOrEqual(100);
  });

  it('raios, tamanhos e movimento batem com o JSON', () => {
    expect(RAIO).toEqual(json.radius);
    expect(TAMANHO).toEqual(json.size);
    expect(MOVIMENTO).toEqual(json.motion);
    expect(TRACO_ICONE).toEqual(json.stroke);
  });

  it('pílula da aba ativa bate com o JSON', () => {
    const { _fonte, ...pilula } = json.pilulaAba;
    expect(PILULA_ABA).toEqual(pilula);
  });

  it.each(['claro', 'escuro'] as const)('sombras novas do tema %s existem nos dois lados', (tema) => {
    expect(MATERIAL[tema].sombraToast).toMatch(/16px 38px/);
    expect(json.material[tema].sombraToast).toMatch(/16px 38px/);
    expect(MATERIAL[tema].sombraBotaoSwitch).toMatch(/2px 6px/);
    expect(json.material[tema].sombraBotaoSwitch).toMatch(/2px 6px/);
  });

  it('o JSON só tem a direção iOS Glass (a seção antiga saiu)', () => {
    expect(json.brand).toBeUndefined();
    expect(json.iosGlass).toBeUndefined();
    expect(json.vidro).toBeUndefined();
    expect(json.space).toBeUndefined();
  });

  it('papéis tipográficos existem no JSON com o mesmo tamanho', () => {
    for (const [papel, estilo] of Object.entries(TIPO)) {
      expect(json.type[papel]?.size).toBe(estilo.fontSize);
    }
  });
});
