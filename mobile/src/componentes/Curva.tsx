/**
 * As duas curvas assinatura. Sempre na mesma direção: baixa à esquerda,
 * reta no meio, subindo à direita. Não trocar por borderRadius — os paths
 * vêm de assets/curva-*.svg e são parte da identidade.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CURVAS } from '../tema/tokens';

/**
 * Curva do cabeçalho escuro para o conteúdo. Vai absoluta no rodapé do
 * cabeçalho e é pintada com a cor do CONTEÚDO, não do cabeçalho.
 */
export function CurvaCabecalho({ cor }: { cor: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: CURVAS.cabecalho.altura,
      }}
    >
      <Svg
        width="100%"
        height={CURVAS.cabecalho.altura}
        viewBox={CURVAS.cabecalho.viewBox}
        preserveAspectRatio="none"
      >
        <Path d={CURVAS.cabecalho.d} fill={cor} />
      </Svg>
    </View>
  );
}

/**
 * Curva do conteúdo para a navbar. Faixa que OCUPA espaço no fluxo (não é
 * overlay), justamente para nunca pintar por cima de um botão.
 *
 * O SVG é desenhado NA ALTURA DA FAIXA, e não na altura do viewBox: com
 * `preserveAspectRatio="none"` ele se ajusta e o desenho inteiro continua
 * visível. Fixar a altura em 60 dentro de um contêiner menor recortaria a
 * curva pela base — e como a linha começa em y=55 na esquerda, é justamente
 * o lado esquerdo que sumiria, achatando a curva contra a navbar.
 */
export function FaixaCurvaNavbar({ cor, altura }: { cor: string; altura: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ height: altura }}
    >
      <Svg
        width="100%"
        height={altura}
        viewBox={CURVAS.navbar.viewBox}
        preserveAspectRatio="none"
      >
        <Path d={CURVAS.navbar.d} fill={cor} />
      </Svg>
    </View>
  );
}
