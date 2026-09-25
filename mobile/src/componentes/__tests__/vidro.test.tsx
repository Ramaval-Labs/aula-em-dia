/**
 * Primitivas do vidro e o catálogo montam. De quebra, confirma
 * que o jest transforma o expo-blur (import ESM em node_modules).
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { TemaProvider } from '../../tema/TemaProvider';
import { Catalogo } from '../__catalogo__/Catalogo';
import {
  AlvoDeDesfoque,
  blurLigado,
  FundoRefracao,
  ProvedorDeDesfoque,
  somarAlfa,
  SuperficieVidro,
} from '../Vidro';

describe('Vidro', () => {
  it('soma alfa só em rgba e respeita o teto', () => {
    expect(somarAlfa('rgba(255,255,255,0.558)', 0.22)).toBe('rgba(255,255,255,0.778)');
    expect(somarAlfa('rgba(0,0,0,0.9)', 0.3)).toBe('rgba(0,0,0,0.96)');
    expect(somarAlfa('#35577D', 0.2)).toBe('#35577D');
  });

  it('modo forçado vence a plataforma', () => {
    expect(blurLigado('fallback')).toBe(false);
    expect(blurLigado('blur')).toBe(true);
  });

  it('fundo, alvo e superfícies montam', async () => {
    await render(
      <TemaProvider>
        <ProvedorDeDesfoque>
          <AlvoDeDesfoque>
            <FundoRefracao />
            <SuperficieVidro nivel="cartao" raio={22} sombra>
              <Text>dentro</Text>
            </SuperficieVidro>
          </AlvoDeDesfoque>
          <SuperficieVidro nivel="vidro" raio={26} anel>
            <Text>fora</Text>
          </SuperficieVidro>
          <SuperficieVidro nivel="sheet" raio={40} soTopo modo="fallback">
            <Text>sheet</Text>
          </SuperficieVidro>
        </ProvedorDeDesfoque>
      </TemaProvider>,
    );
    expect(screen.getByText('dentro')).toBeTruthy();
    expect(screen.getByText('fora')).toBeTruthy();
    expect(screen.getByText('sheet')).toBeTruthy();
  });

  it('um nível de desfoque por camada: aninhado e semDesfoque não desfocam', async () => {
    const r = await render(
      <TemaProvider>
        <SuperficieVidro nivel="sheet" raio={40} soTopo>
          <SuperficieVidro nivel="cartao" raio={22}>
            <SuperficieVidro nivel="vidro2" raio={17}>
              <Text>botão no cartão no sheet</Text>
            </SuperficieVidro>
          </SuperficieVidro>
        </SuperficieVidro>
        <SuperficieVidro nivel="vidro2" raio={13} semDesfoque>
          <Text>inline</Text>
        </SuperficieVidro>
      </TemaProvider>,
    );
    // Só o painel de fora desfoca (o jest roda como iOS).
    type No = { type: string; children: (No | string)[] | null };
    const contar = (n: No | No[] | string | null): number => {
      if (!n || typeof n === 'string') return 0;
      if (Array.isArray(n)) return n.reduce((t, f) => t + contar(f), 0);
      return (/ExpoBlur/.test(n.type) ? 1 : 0) + contar(n.children as No[] | null);
    };
    expect(contar(r.toJSON() as No | No[] | null)).toBe(1);
  });

  it('o catálogo monta', async () => {
    await render(
      <TemaProvider>
        <Catalogo />
      </TemaProvider>,
    );
    expect(screen.getByText('Catálogo')).toBeTruthy();
  });
});
