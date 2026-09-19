/**
 * Chassi das telas de entrada (Fluxo A) no iOS Glass — **derivado**: o handoff
 * não desenha nenhuma tela de login ou onboarding.
 *
 * Por que não é o `TelaVidro` do catálogo: aquele chassi serve as telas do
 * app, que rolam sob uma tab bar flutuante (126px reservados embaixo) e cujo
 * voltar fala com a máquina de navegação do app. A entrada não tem tab bar, o
 * voltar chama `voltarEntrada()` da sessão, e a ação primária fica numa faixa
 * fixa no rodapé, como a entrada sempre teve. A barra de navegação que
 * aparece com a rolagem é a mesma do handoff ("Chrome comum"), refeita aqui
 * porque a do `Chassi` não é exportada.
 *
 * O que é reaproveitado do catálogo, sem remontar nada: o `FundoRefracao`
 * (aqui é obrigatório desenhá-lo, porque o `Portao` do `App.tsx` só monta o
 * fundo dentro do app) e o `BotaoVoltar` do chassi, com a geometria do
 * handoff ("Chrome comum": topo 50, esquerda 12, chevron 19px em tint).
 *
 * Medidas: padding `54 16` quando não há voltar e `100 16` quando há — o
 * mesmo par raiz/empilhada do handoff, porque o botão voltar ocupa os
 * primeiros 94px da tela.
 */

import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoVoltar, useMovimentoReduzido } from '../../componentes/Chassi';
import { FundoRefracao, SuperficieVidro } from '../../componentes/Vidro';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../../tema/tipografia';
import { MOVIMENTO_VIDRO, TAMANHO_VIDRO } from '../../tema/tokens';

/** A status bar do aparelho do handoff (390 × 844), como no `Chassi`. */
const ALTURA_STATUS_HANDOFF = 52;

/** Respiro entre o cabeçalho de texto e o primeiro cartão. */
const ESPACO_APOS_TITULO = 18;

/** Rampa de opacidade da barra (handoff, "Chrome comum"), como no `Chassi`. */
const ROLAGEM_INICIO = 16;
const ROLAGEM_CURSO = 34;

export type PropsTelaDeEntrada = {
  /** título grande, o único cabeçalho da tela */
  titulo: string;
  /** sub-linha acima do título ("Passo 1 de 4") */
  sobrelinha?: string;
  /** apoio abaixo do título */
  subtitulo?: string;
  /** voltar em tint; sem isto a tela é uma raiz da entrada */
  voltar?: { rotulo: string; aoTocar: () => void };
  /** peça acima da sub-linha (o medidor de passos do onboarding) */
  acima?: React.ReactNode;
  /** faixa fixa do rodapé, com a ação primária */
  rodape?: React.ReactNode;
  /** vão entre os filhos */
  espaco?: number;
  /** telas com campo de texto: o rodapé sobe junto com o teclado */
  comTeclado?: boolean;
  children: React.ReactNode;
};

export function TelaDeEntrada({
  titulo,
  sobrelinha,
  subtitulo,
  voltar,
  acima,
  rodape,
  espaco = 12,
  comTeclado = false,
  children,
}: PropsTelaDeEntrada) {
  const { cores } = useVidro();
  const insets = useSafeAreaInsets();

  const base = voltar ? TAMANHO_VIDRO.padTopoEmpilhada : TAMANHO_VIDRO.padTopoRaiz;
  const padTopo = Math.max(base, insets.top + base - ALTURA_STATUS_HANDOFF);

  // Barra de navegação que aparece com a rolagem: sem ela o conteúdo rolado
  // passa por baixo do voltar fixo e os dois se sobrepõem.
  const semMovimento = useMovimentoReduzido();
  const opacidade = useRef(new Animated.Value(0)).current;
  const degrau = useRef(0);
  const aoRolar = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const bruto = Math.min(1, Math.max(0, (y - ROLAGEM_INICIO) / ROLAGEM_CURSO));
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
        useNativeDriver: false,
      }).start();
    },
    [opacidade, semMovimento],
  );
  const alturaBarra = Math.max(
    TAMANHO_VIDRO.barraNav,
    insets.top + TAMANHO_VIDRO.barraNav - ALTURA_STATUS_HANDOFF,
  );

  const corpo = (
    <View style={estilos.cheio}>
      <ScrollView
        style={estilos.cheio}
        onScroll={aoRolar}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={comTeclado ? 'handled' : 'never'}
        keyboardDismissMode={comTeclado ? 'on-drag' : 'none'}
        contentContainerStyle={{
          paddingTop: padTopo,
          paddingHorizontal: TAMANHO_VIDRO.padLateral,
          paddingBottom: ESPACO_APOS_TITULO,
        }}
      >
        {acima ? <View style={{ marginBottom: 16 }}>{acima}</View> : null}

        {sobrelinha ? (
          <Text style={[texto(13, 600, { altura: 1.3 }), { color: cores.tinta2 }]}>
            {sobrelinha}
          </Text>
        ) : null}

        <Text
          accessibilityRole="header"
          style={[
            sobrelinha
              ? comEspaco(voltar ? TIPO_VIDRO.tituloEmpilhada : TIPO_VIDRO.tituloGrande, {
                  topo: 8,
                })
              : voltar
                ? TIPO_VIDRO.tituloEmpilhada
                : TIPO_VIDRO.tituloGrande,
            { color: cores.tinta },
          ]}
        >
          {titulo}
        </Text>

        {subtitulo ? (
          <Text
            style={[
              comEspaco(texto(13.5, 500, { altura: 1.45 }), { topo: 9 }),
              { color: cores.tinta2 },
            ]}
          >
            {subtitulo}
          </Text>
        ) : null}

        <View style={{ marginTop: ESPACO_APOS_TITULO, gap: espaco }}>{children}</View>
      </ScrollView>

      {rodape ? (
        <View
          style={{
            paddingTop: 12,
            paddingHorizontal: TAMANHO_VIDRO.padLateral,
            paddingBottom: Math.max(30, insets.bottom),
            gap: 8,
          }}
        >
          {rodape}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={estilos.cheio}>
      <FundoRefracao />
      {comTeclado ? (
        <KeyboardAvoidingView
          style={estilos.cheio}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {corpo}
        </KeyboardAvoidingView>
      ) : (
        corpo
      )}
      <Animated.View
        pointerEvents="none"
        style={[estilos.barra, { opacity: opacidade }]}
      >
        <SuperficieVidro
          nivel="vidro"
          raio={0}
          style={{ height: alturaBarra, justifyContent: 'flex-end' }}
        >
          <View style={estilos.tituloBarra}>
            <Text
              numberOfLines={1}
              style={[TIPO_VIDRO.tituloNav, estilos.centro, { color: cores.tinta }]}
            >
              {titulo}
            </Text>
          </View>
          <View style={[estilos.fioBarra, { backgroundColor: cores.fio }]} />
        </SuperficieVidro>
      </Animated.View>
      {voltar ? <BotaoVoltar rotulo={voltar.rotulo} aoVoltar={voltar.aoTocar} /> : null}
    </View>
  );
}

/**
 * O que falta para o primário acender, dito logo acima dele. Live region:
 * o texto aparece e some conforme o formulário fica válido.
 */
export function MotivoDoBotao({ texto: motivo }: { texto: string }) {
  const { cores } = useVidro();
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[texto(12.5, 500, { altura: 1.4 }), estilos.centro, { color: cores.tinta2 }]}
    >
      {motivo}
    </Text>
  );
}

const estilos = StyleSheet.create({
  cheio: { flex: 1 },
  centro: { textAlign: 'center' },
  barra: { position: 'absolute', left: 0, right: 0, top: 0 },
  tituloBarra: {
    height: TAMANHO_VIDRO.tituloNav,
    justifyContent: 'center',
    paddingHorizontal: 60,
  },
  fioBarra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TAMANHO_VIDRO.bordaVidro,
  },
});
