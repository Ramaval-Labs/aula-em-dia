/**
 * Peças locais dos passos do onboarding que o catálogo ainda não tem.
 * Candidatas a subir para `src/componentes/` na integração.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CartaoVidro } from '../../componentes/Blocos';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../../tema/tokens';

/**
 * Cartão de configuração no padrão de H§9: título 15/700, sub-linha opcional
 * em `tinta2` e o controle abaixo (`children`) ou à direita (`direita`).
 * Padding `16 17`, o dos cartões da Política.
 */
export function CartaoDeAjuste({
  titulo,
  subtitulo,
  direita,
  children,
  estilo,
}: {
  titulo: string;
  subtitulo?: string;
  /** controle na mesma linha do título (switch, stepper) */
  direita?: React.ReactNode;
  /** controle abaixo do título (segmentado, grade) */
  children?: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  return (
    <CartaoVidro estilo={[estilos.cartao, estilo]}>
      <View style={estilos.linha}>
        <View style={estilos.flexivel}>
          <Text style={[texto(15, 700, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta }]}>
            {titulo}
          </Text>
          {subtitulo ? (
            <Text
              style={[
                comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 3 }),
                { color: cores.tinta2 },
              ]}
            >
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {direita}
      </View>
      {children ? <View style={estilos.corpo}>{children}</View> : null}
    </CartaoVidro>
  );
}

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
  cartao: { paddingVertical: 16, paddingHorizontal: 17 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flexivel: { flex: 1, minWidth: 0 },
  corpo: { marginTop: 12 },
  ficha: {
    height: TAMANHO_VIDRO.segmentoCartao,
    paddingHorizontal: 14,
    borderRadius: RAIO_VIDRO.botaoInline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
