/**
 * Peças locais dos passos do onboarding que o catálogo ainda não tem.
 * Candidatas a subir para `src/componentes/` na integração.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useVidro } from '../../tema/TemaProvider';
import { texto } from '../../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../../tema/tokens';

/**
 * Ficha de escolha múltipla (as disciplinas do Perfil). O `Segmentado` do
 * catálogo é de escolha única; esta é a mesma dupla de cor do segmentado e
 * do switch — trilho `preenchimento`, ligada em tint com `sobreTint`.
 */
export function FichaDeEscolha({
  rotulo,
  marcada,
  aoTocar,
}: {
  rotulo: string;
  marcada: boolean;
  aoTocar: () => void;
}) {
  const { cores } = useVidro();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: marcada }}
      onPress={aoTocar}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        estilos.ficha,
        {
          backgroundColor: marcada ? cores.tint : cores.preenchimento,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <Text style={[texto(13.5, 600), { color: marcada ? cores.sobreTint : cores.tinta2 }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  ficha: {
    height: TAMANHO_VIDRO.segmentoCartao,
    paddingHorizontal: 14,
    borderRadius: RAIO_VIDRO.botaoInline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
