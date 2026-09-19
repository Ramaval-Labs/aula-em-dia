/**
 * Toast do iOS Glass (handoff-ios-glass/README.md, "Toast").
 *
 * Faixa de vidro a 106px da base — acima da tab bar —, com ícone de check em
 * tint e uma frase que **confirma o que foi feito**. Nunca pede ação, e por
 * isso é `live region` educada: anuncia sem interromper o leitor de tela.
 *
 * A loja (`estado/toast.ts`) guarda a mensagem pelos 3600ms do handoff.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { useReduzirMovimento } from '../tema/movimento';
import { texto } from '../tema/tipografia';
import { MOVIMENTO, RAIO, TAMANHO } from '../tema/tokens';
import { useAnuncio } from './anunciar';
import { Icone } from './Icone';
import { SuperficieVidro } from './Vidro';

export function Toast() {
  const mensagem = useToast((s) => s.mensagem);
  const { cores, material } = useCores();
  const semMovimento = useReduzirMovimento();
  const fade = useRef(new Animated.Value(0)).current;
  // Live region no Android; no iOS a frase é anunciada.
  useAnuncio(mensagem, true);

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
      duration: MOVIMENTO.toastMs,
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
        left: TAMANHO.padLateral,
        right: TAMANHO.padLateral,
        bottom: TAMANHO.toastBase,
        opacity: fade,
      }}
    >
      <SuperficieVidro
        nivel="vidro"
        raio={RAIO.toast}
        sombraExterna={material.sombraToast}
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
            width: TAMANHO.iconeToast,
            height: TAMANHO.iconeToast,
            borderRadius: RAIO.iconeToast,
            backgroundColor: cores.tint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icone nome="check" tamanho={TAMANHO.checkEscolha} cor={cores.sobreTint} />
        </View>
        <Text style={[texto(13, 600, { altura: 1.4 }), { flex: 1, color: cores.tinta }]}>
          {mensagem}
        </Text>
      </SuperficieVidro>
    </Animated.View>
  );
}
