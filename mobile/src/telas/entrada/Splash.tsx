/**
 * A1 — Splash. Abertura de marca, sem interação.
 *
 * No iOS Glass a marca é só tipográfica: "Aula em Dia" em Satoshi 800 sobre o
 * fundo de refração (desenhado pelo `Portao`, sob todas as fases). As quatro barras amarelas da direção anterior saíram do
 * sistema junto com o amarelo.
 *
 * Esta tela também é o que o `App.tsx` mostra enquanto as fontes carregam,
 * então ela não pode depender de nada além do tema.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';

export function Splash() {
  const { cores } = useCores();

  return (
    <View style={estilos.cheio}>
      <View accessible accessibilityRole="header" style={estilos.centro}>
        <Text style={[TIPO.tituloGrande, estilos.aoCentro, { color: cores.tint }]}>
          Aula em Dia
        </Text>
        <Text
          style={[
            comEspaco(texto(13.5, 500, { altura: 1.4 }), { topo: 12 }),
            estilos.aoCentro,
            { color: cores.tinta2 },
          ]}
        >
          A conta das aulas, sem discussão
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cheio: { flex: 1 },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  aoCentro: { textAlign: 'center' },
});
