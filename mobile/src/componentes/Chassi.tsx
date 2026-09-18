/**
 * Chassi das telas não-sheet do iOS Glass (handoff-ios-glass/README.md,
 * "Chrome comum" e "Rolagem").
 *
 * Uma tela é só conteúdo rolável: o fundo de refração vem do `App.tsx` e a tab
 * bar flutua por cima, então aqui ficam apenas os dois elementos de chrome que
 * pertencem à tela —
 *
 * - **barra de navegação** (94px, vidro, fio embaixo) cuja opacidade sai da
 *   rolagem: `min(1, max(0, (y − 16) / 34))`, arredondado a 1 decimal, com
 *   transição de 180ms linear. Invisível no topo, cheia depois de ~50px;
 * - **botão voltar** nas telas empilhadas, fixo, que **não** acompanha a
 *   opacidade da barra.
 *
 * O padding do conteúdo é o do handoff: `54 16 126` na raiz de aba e
 * `100 16 126` na empilhada. Os 126px embaixo são o que garante que a tab bar
 * nunca cubra conteúdo.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useNavegacao } from '../estado/navegacao';
import { useVidro } from '../tema/TemaProvider';
import { texto, TIPO_VIDRO } from '../tema/tipografia';
import { MOVIMENTO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';
import { SuperficieVidro } from './Vidro';

/** Tipos de tela que têm chassi próprio; `sheet` é o `Sheet.tsx`. */
export type TipoDeChassi = 'raiz' | 'empilhada';

/**
 * A status bar do sistema mede 52px no aparelho do handoff (390 × 844), e é
 * sobre ela que os 54/100 do conteúdo e os 50 do botão voltar foram medidos.
 * Em aparelho com recorte maior, o inset manda.
 */
const ALTURA_STATUS_HANDOFF = 52;

/** Parâmetros da rampa de opacidade da barra (handoff, "Chrome comum"). */
const ROLAGEM_INICIO = 16;
const ROLAGEM_CURSO = 34;

/** Chevron do handoff, espelhado para apontar para a esquerda. */
const CHEVRON_ESQUERDA = 'M15 5.5L8.5 12 15 18.5';

/** Reduzir movimento: mesma leitura que a tab bar antiga já fazia. */
export function useMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => vivo && setReduzido(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);
  return reduzido;
}

/* ── Barra de navegação ───────────────────────────────────────────────── */

function BarraNavegacao({ titulo, opacidade }: { titulo: string; opacidade: Animated.Value }) {
  const { cores } = useVidro();
  const insets = useSafeAreaInsets();
  const altura = Math.max(
    TAMANHO_VIDRO.barraNav,
    insets.top + TAMANHO_VIDRO.barraNav - ALTURA_STATUS_HANDOFF,
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: opacidade }}
    >
      <SuperficieVidro nivel="vidro" raio={0} style={{ height: altura, justifyContent: 'flex-end' }}>
        <View
          style={{
            height: TAMANHO_VIDRO.tituloNav,
            justifyContent: 'center',
            paddingHorizontal: 60,
          }}
        >
          <Text
            numberOfLines={1}
            style={[TIPO_VIDRO.tituloNav, { color: cores.tinta, textAlign: 'center' }]}
          >
            {titulo}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: TAMANHO_VIDRO.bordaVidro,
            backgroundColor: cores.fio,
          }}
        />
      </SuperficieVidro>
    </Animated.View>
  );
}

/* ── Botão voltar ─────────────────────────────────────────────────────── */

/**
 * Chevron + título curto da tela anterior, sempre em tint. Fixo: não
 * acompanha a opacidade da barra.
 */
export function BotaoVoltar({
  rotulo,
  aoVoltar,
  style,
}: {
  rotulo: string;
  aoVoltar?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const insets = useSafeAreaInsets();
  const voltar = useNavegacao((s) => s.voltar);
  const topo = Math.max(50, insets.top + 3);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voltar para ${rotulo}`}
      onPress={aoVoltar ?? (() => voltar())}
      style={[
        {
          position: 'absolute',
          top: topo,
          left: 12,
          height: TAMANHO_VIDRO.alvoMinimo,
          paddingHorizontal: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
        },
        style,
      ]}
    >
      <Svg width={19} height={19} viewBox="0 0 24 24">
        <Path
          d={CHEVRON_ESQUERDA}
          fill="none"
          stroke={cores.tint}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text numberOfLines={1} style={[texto(16, 600), { color: cores.tint }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

/* ── Tela ─────────────────────────────────────────────────────────────── */

export type PropsTelaVidro = {
  /** `raiz` de aba (padding 54) ou `empilhada` sob uma raiz (padding 100) */
  tipo: TipoDeChassi;
  /** título da barra de navegação, que aparece com a rolagem */
  titulo: string;
  /** título curto da tela anterior; obrigatório na empilhada */
  voltarPara?: string;
  /** destino do voltar; o padrão é desempilhar */
  aoVoltar?: () => void;
  /**
   * Ações do fim da tela. Tela não-sheet não tem faixa fixa: o rodapé vai no
   * fim do conteúdo, com os 18px do handoff (§2 "Ações", §9).
   */
  rodape?: React.ReactNode;
  children: React.ReactNode;
};

export function TelaVidro({
  tipo,
  titulo,
  voltarPara,
  aoVoltar,
  rodape,
  children,
}: PropsTelaVidro) {
  const insets = useSafeAreaInsets();
  const semMovimento = useMovimentoReduzido();
  const opacidade = useRef(new Animated.Value(0)).current;
  const degrau = useRef(0);

  const base =
    tipo === 'raiz' ? TAMANHO_VIDRO.padTopoRaiz : TAMANHO_VIDRO.padTopoEmpilhada;
  const padTopo = Math.max(base, insets.top + base - ALTURA_STATUS_HANDOFF);

  const aoRolar = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const bruto = Math.min(1, Math.max(0, (y - ROLAGEM_INICIO) / ROLAGEM_CURSO));
      // Degraus de 0.1: o handoff arredonda a 1 decimal para a barra não
      // repintar a cada pixel de rolagem.
      const alvo = Math.round(bruto * 10) / 10;
      if (alvo === degrau.current) return;
      degrau.current = alvo;
      if (semMovimento) {
        opacidade.setValue(alvo);
        return;
      }
      Animated.timing(opacidade, {
        toValue: alvo,
        duration: MOVIMENTO_VIDRO.barraNavMs,
        easing: Easing.linear,
        // O driver nativo não roda no web, e a barra é uma view só.
        useNativeDriver: false,
      }).start();
    },
    [opacidade, semMovimento],
  );

  return (
    <View style={styles.cheio}>
      <ScrollView
        style={styles.cheio}
        onScroll={aoRolar}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: padTopo,
          paddingHorizontal: TAMANHO_VIDRO.padLateral,
          paddingBottom: TAMANHO_VIDRO.padBaixoConteudo,
        }}
      >
        {children}
        {rodape ? <View style={{ marginTop: 18 }}>{rodape}</View> : null}
      </ScrollView>

      <BarraNavegacao titulo={titulo} opacidade={opacidade} />
      {tipo === 'empilhada' && voltarPara ? (
        <BotaoVoltar rotulo={voltarPara} aoVoltar={aoVoltar} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cheio: { flex: 1 },
});
