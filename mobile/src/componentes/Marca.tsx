/**
 * A marca: quatro barras verticais, as três primeiras na cor do texto e a
 * quarta em amarelo. É o wordmark do handoff (assets/LEIA-ME.md).
 */

import React from 'react';
import { Text, View } from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto } from '../tema/tipografia';
import { MARCA } from '../tema/tokens';

export function Barras({
  largura = 3,
  altura = 18,
  espaco = 3,
  cor,
}: {
  largura?: number;
  altura?: number;
  espaco?: number;
  cor?: string;
}) {
  const cores = useCores();
  const tinta = cor ?? cores.texto;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', gap: espaco }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: largura,
            height: altura,
            borderRadius: 2,
            backgroundColor: i === 3 ? MARCA.amarelo : tinta,
          }}
        />
      ))}
    </View>
  );
}

/** Barras + nome, na horizontal. */
export function Wordmark({
  tamanho = 15,
  cor,
  alturaDasBarras = 17,
}: {
  tamanho?: number;
  cor?: string;
  alturaDasBarras?: number;
}) {
  const cores = useCores();
  const tinta = cor ?? cores.texto;
  return (
    <View
      accessible
      accessibilityLabel="Aula em Dia"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
    >
      <Barras altura={alturaDasBarras} cor={tinta} />
      <Text style={[texto(tamanho, 600, { altura: 1, tracking: -0.02 }), { color: tinta }]}>
        Aula em Dia
      </Text>
    </View>
  );
}
