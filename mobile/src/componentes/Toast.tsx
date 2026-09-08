/** Toast: 3600ms, barra amarela de 4px à esquerda, fundo elevado. */

import React from 'react';
import { Text, View } from 'react-native';

import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

export function Toast() {
  const mensagem = useToast((s) => s.mensagem);
  const cores = useCores();

  if (!mensagem) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 88,
        backgroundColor: cores.elevado,
        borderRadius: RAIO.cartao,
        paddingVertical: 13,
        paddingHorizontal: 15,
        flexDirection: 'row',
        gap: 11,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 4,
          alignSelf: 'stretch',
          backgroundColor: MARCA.amarelo,
          borderRadius: 2,
        }}
      />
      <Text style={[texto(13, 500, { altura: 1.4 }), { flex: 1, color: '#FFFFFF' }]}>
        {mensagem}
      </Text>
    </View>
  );
}
