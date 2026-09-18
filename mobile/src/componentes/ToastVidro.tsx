/**
 * Toast do iOS Glass (handoff-ios-glass/README.md, "Toast").
 *
 * Faixa de vidro a 106px da base — acima da tab bar —, com ícone de check em
 * tint e uma frase que **confirma o que foi feito**. Nunca pede ação, e por
 * isso é `live region` educada: anuncia sem interromper o leitor de tela.
 *
 * Convive com o `Toast.tsx` antigo até a Onda 4; a loja (`estado/toast.ts`),
 * com os 3600ms do handoff, é a mesma.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useToast } from '../estado/toast';
import { useVidro } from '../tema/TemaProvider';
import { texto } from '../tema/tipografia';
import { MOVIMENTO_VIDRO, RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';
import { useMovimentoReduzido } from './Chassi';
import { SuperficieVidro } from './Vidro';

/** Check do handoff ("Assets"): viewBox 24 × 24, traço 3, round. */
const CHECK = 'M6 12.4l4 4L18 8';

export function ToastVidro() {
  const mensagem = useToast((s) => s.mensagem);
  const { cores, material } = useVidro();
  const semMovimento = useMovimentoReduzido();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!mensagem) {
      fade.setValue(0);
      return;
    }
    if (semMovimento) {
      fade.setValue(1);
      return;
    }
    Animated.timing(fade, {
      toValue: 1,
      duration: MOVIMENTO_VIDRO.toastMs,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [mensagem, semMovimento, fade]);

  if (!mensagem) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: TAMANHO_VIDRO.padLateral,
        right: TAMANHO_VIDRO.padLateral,
        bottom: TAMANHO_VIDRO.toastBase,
        opacity: fade,
      }}
    >
      <SuperficieVidro
        nivel="vidro"
        raio={RAIO_VIDRO.toast}
        sombraExterna={material.sombraTabBar}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: RAIO_VIDRO.iconeToast,
            backgroundColor: cores.tint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path
              d={CHECK}
              fill="none"
              stroke={cores.sobreTint}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={[texto(13, 600, { altura: 1.4 }), { flex: 1, color: cores.tinta }]}>
          {mensagem}
        </Text>
      </SuperficieVidro>
    </Animated.View>
  );
}
