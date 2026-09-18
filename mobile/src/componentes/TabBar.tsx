/**
 * Tab bar flutuante do iOS Glass (handoff-ios-glass/README.md, "Tab bar").
 *
 * Barra de 66px com raio 26, a 14px das laterais e 26px da base, em vidro com
 * o **anel de refração** — a única peça do sistema que o usa. O item ativo
 * ganha gradiente vertical, borda `bordaTopo`, o reflexo interno e um brilho
 * desfocado acima; o inativo é só ícone e rótulo em `tinta3`.
 *
 * O que o handoff desenha e aqui **não** se desenha: indicador de home e
 * status bar. O sistema já os tem; redesenhá-los dobraria o traço.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Aba } from '../estado/navegacao';
import { useVidro } from '../tema/TemaProvider';
import { TIPO_VIDRO } from '../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';
import { SuperficieVidro } from './Vidro';

/**
 * Ícones de aba do handoff ("Tab bar"): viewBox 24 × 24, traço 1.9, sem
 * preenchimento. Ficam aqui porque o `ICONES_ABA` de `tokens.ts` ainda é o
 * conjunto antigo (traço 1.8), que as telas não migradas usam — os dois só se
 * encontram na Onda 4.
 */
const ICONES_ABA_VIDRO: Record<Aba, string> = {
  home:
    'M9.3 11.2a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2M3.7 19.3c0-3.1 2.5-4.9 5.6-4.9s5.6 1.8 5.6 4.9' +
    'M16.4 11.5a2.6 2.6 0 100-5.2M17.5 14.6c1.9.4 3 1.9 3 4.7',
  financeiro:
    'M3.9 9.9A2.4 2.4 0 016.3 7.5h11.4a2.4 2.4 0 012.4 2.4v6.2a2.4 2.4 0 01-2.4 2.4H6.3a2.4 2.4 0 ' +
    '01-2.4-2.4zM3.9 11.7h16.2M6.9 15.5h3.2',
  ajustes:
    'M4.4 8.2h6.4M14.2 8.2h5.4M4.4 15.8h5.3M13.4 15.8h6.2M10.8 8.2a1.7 1.7 0 103.4 0 1.7 1.7 0 ' +
    '10-3.4 0M9.7 15.8a1.7 1.7 0 103.4 0 1.7 1.7 0 10-3.4 0',
};

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: 'home', rotulo: 'Alunos' },
  { chave: 'financeiro', rotulo: 'Financeiro' },
  { chave: 'ajustes', rotulo: 'Ajustes' },
];

const TRACO_ICONE = 1.9;
const TAMANHO_ICONE = 23;

/**
 * Os 26px da base foram medidos no aparelho de referência, onde a área segura
 * de baixo é 34 — a barra encosta 8px dentro dela, como a tab bar do iOS.
 * Onde a área segura é maior (navegação por gestos do Android), ela manda.
 */
const RECUO_NA_AREA_SEGURA = 8;

/** Gradiente do item ativo (handoff, "Tab bar" → Item). */
const GRADIENTE_ATIVO = [
  'rgba(255,255,255,0.28)',
  'rgba(255,255,255,0.03)',
  'rgba(255,255,255,0.02)',
  'rgba(255,255,255,0.2)',
] as const;
const PARADAS_ATIVO = [0, 0.44, 0.7, 1] as const;

const BRILHO_ATIVO = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)'] as const;
const PARADAS_BRILHO = [0.56, 1] as const;

function ItemDeAba({
  chave,
  rotulo,
  ativa,
  aoTocar,
}: {
  chave: Aba;
  rotulo: string;
  ativa: boolean;
  aoTocar: () => void;
}) {
  const { cores, material } = useVidro();
  const cor = ativa ? cores.tint : cores.tinta3;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      accessibilityLabel={rotulo}
      onPress={aoTocar}
      style={{
        flex: 1,
        // 56px de altura: acima dos 48px de alvo de aba (spec/acessibilidade.md).
        height: TAMANHO_VIDRO.itemAba,
        borderRadius: RAIO_VIDRO.pilulaAba,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      {ativa ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: RAIO_VIDRO.pilulaAba,
              overflow: 'hidden',
              borderWidth: TAMANHO_VIDRO.bordaVidro,
              borderColor: cores.bordaTopo,
              boxShadow: `${material.gin}, 0px 4px 12px ${cores.sombra}`,
            }}
          >
            <LinearGradient
              colors={[...GRADIENTE_ATIVO]}
              locations={[...PARADAS_ATIVO]}
              style={{ flex: 1 }}
            />
          </View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '-52%',
              height: '86%',
              borderRadius: RAIO_VIDRO.circulo,
              filter: 'blur(6px)',
            }}
          >
            <LinearGradient
              colors={[...BRILHO_ATIVO]}
              locations={[...PARADAS_BRILHO]}
              style={{ flex: 1, borderRadius: RAIO_VIDRO.circulo }}
            />
          </View>
        </>
      ) : null}

      <Svg width={TAMANHO_ICONE} height={TAMANHO_ICONE} viewBox="0 0 24 24">
        <Path
          d={ICONES_ABA_VIDRO[chave]}
          fill="none"
          stroke={cor}
          strokeWidth={TRACO_ICONE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text numberOfLines={1} style={[TIPO_VIDRO.rotuloAba, { color: cor }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function TabBar({
  abaAtiva,
  aoTrocar,
}: {
  abaAtiva: Aba;
  aoTrocar: (aba: Aba) => void;
}) {
  const { material } = useVidro();
  const insets = useSafeAreaInsets();
  const base = Math.max(TAMANHO_VIDRO.baseTabBar, insets.bottom - RECUO_NA_AREA_SEGURA);

  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: 'absolute',
        left: TAMANHO_VIDRO.margemTabBar,
        right: TAMANHO_VIDRO.margemTabBar,
        bottom: base,
      }}
    >
      <SuperficieVidro
        nivel="vidro"
        raio={RAIO_VIDRO.tabBar}
        anel
        sombraExterna={material.sombraTabBar}
        style={{
          height: TAMANHO_VIDRO.tabBar,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 5,
          gap: 4,
        }}
      >
        {ABAS.map((a) => (
          <ItemDeAba
            key={a.chave}
            chave={a.chave}
            rotulo={a.rotulo}
            ativa={a.chave === abaAtiva}
            aoTocar={() => aoTrocar(a.chave)}
          />
        ))}
      </SuperficieVidro>
    </View>
  );
}
