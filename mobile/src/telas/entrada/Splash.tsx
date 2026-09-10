/** A1 — Splash. Abertura de marca, sem interação. */

import React from 'react';
import { Text, View } from 'react-native';

import { Barras } from '../../componentes/Marca';
import { useCores } from '../../tema/TemaProvider';
import { texto } from '../../tema/tipografia';

export function Splash() {
  const cores = useCores();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cores.topo,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
      }}
    >
      <Barras largura={10} altura={64} espaco={7} cor="#FFFFFF" />
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Text
          style={[texto(26, 600, { altura: 1, tracking: -0.02 }), { color: '#FFFFFF' }]}
        >
          Aula em Dia
        </Text>
        <Text style={[texto(13, 400, { altura: 1 }), { color: cores.topoFraco }]}>
          A conta das aulas, sem discussão
        </Text>
      </View>
    </View>
  );
}
