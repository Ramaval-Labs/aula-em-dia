/**
 * Toast do iOS Glass (handoff-ios-glass/README.md, "Toast").
 *
 * Faixa de vidro 14px acima da tab bar (os 106px do handoff = base 26 + barra
 * 66 + 14), acompanhando a tab bar quando a área segura a empurra para cima.
 * Com um sheet aberto, os mesmos 14px acima do rodapé fixo do painel — o
 * toast nunca cobre a ação primária. Ícone de check em tint e uma frase que
 * **confirma o que foi feito**. Nunca pede ação, e por
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
import { useBaseDaTabBar } from './TabBar';
import { SuperficieVidro } from './Vidro';

/** Folga entre o toast e o que está abaixo dele (tab bar ou rodapé do sheet). */
const FOLGA = TAMANHO.toastBase - TAMANHO.baseTabBar - TAMANHO.tabBar;

export function Toast() {
  const mensagem = useToast((s) => s.mensagem);
  const reservaDoSheet = useToast((s) => s.reservaDoSheet);
  const baseDaTabBar = useBaseDaTabBar();
  const base =
    reservaDoSheet !== null ? reservaDoSheet + FOLGA : baseDaTabBar + TAMANHO.tabBar + FOLGA;
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
        bottom: base,
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
