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

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
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

import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { useReduzirMovimento } from '../tema/movimento';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { MOVIMENTO, TAMANHO } from '../tema/tokens';
import { Icone } from './Icone';
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

/**
 * Padding de topo do conteúdo (54 na raiz, 100 na empilhada) somado ao que o
 * recorte do aparelho tiver a mais que a status bar do handoff.
 */
export function usePadTopo(tipo: TipoDeChassi): number {
  const insets = useSafeAreaInsets();
  const base = tipo === 'raiz' ? TAMANHO.padTopoRaiz : TAMANHO.padTopoEmpilhada;
  return Math.max(base, insets.top + base - ALTURA_STATUS_HANDOFF);
}

/**
 * A opacidade da barra de navegação a partir da rolagem:
 * `min(1, max(0, (y − 16) / 34))`, em degraus de 0.1, com 180ms linear.
 * Devolve o valor animado e o `onScroll` para o ScrollView.
 */
export function useBarraComRolagem() {
  const semMovimento = useReduzirMovimento();
  const opacidade = useRef(new Animated.Value(0)).current;
  const degrau = useRef(0);
  // A última animação disparada pela rolagem. Desmontar não cancela o
  // `Animated`, que é independente da árvore — sem isto o timer continua
  // batendo num nó que já saiu.
  const emCurso = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => () => emCurso.current?.stop(), []);

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
      emCurso.current?.stop();
      emCurso.current = Animated.timing(opacidade, {
        toValue: alvo,
        duration: MOVIMENTO.barraNavMs,
        easing: Easing.linear,
        // O driver nativo não roda no web, e a barra é uma view só.
        useNativeDriver: false,
      });
      emCurso.current.start();
    },
    [opacidade, semMovimento],
  );

  return { opacidade, aoRolar };
}

/* ── Barra de navegação ───────────────────────────────────────────────── */

/**
 * Barra de 94px em vidro com o título centralizado e fio embaixo. Não recebe
 * toque: a opacidade vem de `useBarraComRolagem`.
 */
export function BarraNavegacao({
  titulo,
  opacidade,
}: {
  titulo: string;
  opacidade: Animated.Value;
}) {
  const { cores } = useCores();
  const insets = useSafeAreaInsets();
  const altura = Math.max(
    TAMANHO.barraNav,
    insets.top + TAMANHO.barraNav - ALTURA_STATUS_HANDOFF,
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: opacidade }}
    >
      <SuperficieVidro nivel="vidro" raio={0} style={{ height: altura, justifyContent: 'flex-end' }}>
        <View
          style={{
            height: TAMANHO.tituloNav,
            justifyContent: 'center',
            paddingHorizontal: 60,
          }}
        >
          <Text
            numberOfLines={1}
            style={[TIPO.tituloNav, { color: cores.tinta, textAlign: 'center' }]}
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
            height: TAMANHO.bordaVidro,
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
  const { cores } = useCores();
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
          height: TAMANHO.alvoMinimo,
          paddingHorizontal: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
        },
        style,
      ]}
    >
      <Icone nome="chevron" girar={180} tamanho={TAMANHO.chevronVoltar} cor={cores.tint} />
      <Text numberOfLines={1} style={[texto(16, 600), { color: cores.tint }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

/* ── Título de conteúdo ───────────────────────────────────────────────── */

/**
 * O cabeçalho que mora **no conteúdo** (a barra de navegação só aparece com
 * a rolagem): sub-linha opcional acima (a data em Alunos, a disciplina em
 * Cobrança), o título e uma linha de apoio opcional abaixo. Recuo de 6px,
 * como em H§1 e H§9.
 *
 * - `grande` (34/800): raiz de aba e primeira tela da entrada;
 * - `empilhada` (29/800): tela empilhada e passos do onboarding.
 *
 * `direita` acompanha o título na base (a contagem "N hoje" de H§1).
 */
export function TituloDeConteudo({
  titulo,
  acima,
  abaixo,
  porte = 'empilhada',
  direita,
  estilo,
}: {
  titulo: string;
  acima?: string;
  abaixo?: string;
  porte?: 'grande' | 'empilhada';
  direita?: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const grande = porte === 'grande';
  const papel = grande ? TIPO.tituloGrande : TIPO.tituloEmpilhada;

  const textos = (
    <View style={direita ? styles.flexivel : null}>
      {acima ? (
        <Text style={[texto(13, 600, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta2 }]}>
          {acima}
        </Text>
      ) : null}
      <Text
        accessibilityRole="header"
        style={[comEspaco(papel, { topo: acima ? (grande ? 8 : 7) : 0 }), { color: cores.tinta }]}
      >
        {titulo}
      </Text>
      {abaixo ? (
        <Text
          style={[comEspaco(texto(13.5, 500, { altura: 1.45 }), { topo: 8 }), { color: cores.tinta2 }]}
        >
          {abaixo}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.titulo,
        grande ? styles.tituloGrande : null,
        direita ? styles.tituloComDireita : null,
        estilo,
      ]}
    >
      {textos}
      {direita}
    </View>
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
  /** tela com campo de texto: o conteúdo sobe com o teclado */
  comTeclado?: boolean;
  children: React.ReactNode;
};

export function TelaVidro({
  tipo,
  titulo,
  voltarPara,
  aoVoltar,
  rodape,
  comTeclado = false,
  children,
}: PropsTelaVidro) {
  const padTopo = usePadTopo(tipo);
  const { opacidade, aoRolar } = useBarraComRolagem();

  const rolagem = (
    <ScrollView
      style={styles.cheio}
      onScroll={aoRolar}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      // Com campo de texto: o toque num botão fecha o teclado *e* aciona o
      // botão, e arrastar a lista recolhe o teclado.
      keyboardShouldPersistTaps={comTeclado ? 'handled' : undefined}
      keyboardDismissMode={comTeclado ? 'on-drag' : undefined}
      contentContainerStyle={{
        paddingTop: padTopo,
        paddingHorizontal: TAMANHO.padLateral,
        paddingBottom: TAMANHO.padBaixoConteudo,
      }}
    >
      {children}
      {rodape ? <View style={{ marginTop: 18 }}>{rodape}</View> : null}
    </ScrollView>
  );

  return (
    <View style={styles.cheio}>
      {comTeclado ? (
        // `padding` nos dois sistemas: o iOS não encolhe a janela com o
        // teclado, e o edge-to-edge do SDK 57 não garante o adjustResize no
        // Android. Onde a janela encolher mesmo assim, o KeyboardAvoidingView
        // mede a sobreposição real (quadro × topo do teclado) e não soma de novo.
        <KeyboardAvoidingView style={styles.cheio} behavior="padding">
          {rolagem}
        </KeyboardAvoidingView>
      ) : (
        rolagem
      )}

      <BarraNavegacao titulo={titulo} opacidade={opacidade} />
      {tipo === 'empilhada' && voltarPara ? (
        <BotaoVoltar rotulo={voltarPara} aoVoltar={aoVoltar} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cheio: { flex: 1 },
  flexivel: { flex: 1, minWidth: 0 },
  titulo: { paddingHorizontal: 6 },
  tituloGrande: { paddingTop: 8, paddingBottom: 2 },
  tituloComDireita: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },
});
