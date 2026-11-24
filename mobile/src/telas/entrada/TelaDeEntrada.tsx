/**
 * Chassi das telas de entrada (Fluxo A) no iOS Glass — **derivado**: o handoff
 * não desenha nenhuma tela de login ou onboarding.
 *
 * Por que não é o `TelaVidro`: aquele chassi serve as telas do app, que rolam
 * sob uma tab bar flutuante (126px reservados embaixo) e cujo voltar fala com
 * a máquina de navegação do app. A entrada não tem tab bar, o voltar chama
 * `voltarEntrada()` da sessão, e a ação primária fica numa faixa fixa no
 * rodapé, como a entrada sempre teve.
 *
 * O resto é o chrome do `Chassi`, sem cópia: padding de topo (`usePadTopo`),
 * barra de navegação que aparece com a rolagem (`BarraNavegacao` +
 * `useBarraComRolagem`), `BotaoVoltar` e `TituloDeConteudo`. O fundo de
 * refração é do `Portao` (App.tsx), que o desenha sob todas as fases.
 *
 * Medidas: padding `54 16` quando não há voltar e `100 16` quando há — o
 * mesmo par raiz/empilhada do handoff, porque o botão voltar ocupa os
 * primeiros 94px da tela.
 *
 * O rodapé é o espelho da barra de navegação embaixo: quando há conteúdo
 * rolável sob ele, ganha a faixa de vidro com o fio em cima, na mesma rampa de
 * opacidade; com tudo à vista, some, e o primário fica sobre o fundo. Sem isso o
 * conteúdo era cortado seco no meio de um cartão, e nada dizia que havia mais.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BarraNavegacao,
  BotaoVoltar,
  TituloDeConteudo,
  useBarraComRolagem,
  usePadTopo,
} from '../../componentes/Chassi';
import { useRolagemLivre } from '../../componentes/travaDaRolagem';
import { SuperficieVidro } from '../../componentes/Vidro';
import { useReduzirMovimento } from '../../tema/movimento';
import { useCores } from '../../tema/TemaProvider';
import { MOVIMENTO, PAD, TAMANHO } from '../../tema/tokens';

/** Respiro entre o cabeçalho de texto e o primeiro cartão. */
const ESPACO_APOS_TITULO = 18;

/**
 * Quanto de conteúdo escondido sob o rodapé leva a faixa à opacidade cheia —
 * o mesmo curso da barra de navegação, que acende nos primeiros ~50px.
 */
const CURSO_DO_RODAPE = 50;

/**
 * A faixa do rodapé acende conforme sobra conteúdo abaixo da área visível, em
 * degraus de 0,1 como a barra de navegação, e sem transição com "reduzir
 * movimento".
 */
function useFaixaDoRodape() {
  const semMovimento = useReduzirMovimento();
  const opacidade = useRef(new Animated.Value(0)).current;
  const medida = useRef({ y: 0, visivel: 0, conteudo: 0 });
  const degrau = useRef(0);
  const emCurso = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => () => emCurso.current?.stop(), []);

  const atualizar = useCallback(() => {
    const { y, visivel, conteudo } = medida.current;
    const escondido = conteudo - visivel - y;
    const alvo = Math.round(Math.min(1, Math.max(0, escondido / CURSO_DO_RODAPE)) * 10) / 10;
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
      useNativeDriver: false,
    });
    emCurso.current.start();
  }, [opacidade, semMovimento]);

  return {
    opacidade,
    aoRolar: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      medida.current.y = e.nativeEvent.contentOffset.y;
      atualizar();
    },
    aoMedir: (e: LayoutChangeEvent) => {
      medida.current.visivel = e.nativeEvent.layout.height;
      atualizar();
    },
    aoMudarConteudo: (_largura: number, altura: number) => {
      medida.current.conteudo = altura;
      atualizar();
    },
  };
}

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
  const { cores } = useCores();
  const insets = useSafeAreaInsets();
  const padTopo = usePadTopo(voltar ? 'empilhada' : 'raiz');
  // Sem a barra, o conteúdo rolado passaria por baixo do voltar fixo e os
  // dois se sobreporiam.
  const { opacidade, aoRolar } = useBarraComRolagem();
  const faixa = useFaixaDoRodape();
  const rolagemLivre = useRolagemLivre();

  const corpo = (
    <View style={estilos.cheio}>
      <ScrollView
        style={estilos.cheio}
        scrollEnabled={rolagemLivre}
        onScroll={(e) => {
          aoRolar(e);
          faixa.aoRolar(e);
        }}
        onLayout={faixa.aoMedir}
        onContentSizeChange={faixa.aoMudarConteudo}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={comTeclado ? 'handled' : 'never'}
        keyboardDismissMode={comTeclado ? 'on-drag' : 'none'}
        contentContainerStyle={{
          paddingTop: padTopo,
          paddingHorizontal: TAMANHO.padLateral,
          paddingBottom: ESPACO_APOS_TITULO,
        }}
      >
        {acima ? <View style={estilos.acima}>{acima}</View> : null}

        <TituloDeConteudo
          porte={voltar ? 'empilhada' : 'grande'}
          acima={sobrelinha}
          titulo={titulo}
          abaixo={subtitulo}
        />

        <View style={{ marginTop: ESPACO_APOS_TITULO, gap: espaco }}>{children}</View>
      </ScrollView>

      {rodape ? (
        <View>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: faixa.opacidade }]}
          >
            <SuperficieVidro nivel="vidro" raio={0} style={estilos.cheio} />
            <View style={[estilos.fio, { backgroundColor: cores.fio }]} />
          </Animated.View>
          <View
            style={[
              estilos.rodape,
              { paddingBottom: Math.max(PAD.rodapeEntrada.paddingBottom, insets.bottom) },
            ]}
          >
            {rodape}
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={estilos.cheio}>
      {comTeclado ? (
        // `padding` nos dois sistemas: o edge-to-edge do SDK 57 não garante o
        // adjustResize no Android. Onde a janela encolher mesmo assim, o
        // KeyboardAvoidingView mede a sobreposição real e não soma de novo.
        <KeyboardAvoidingView style={estilos.cheio} behavior="padding">
          {corpo}
        </KeyboardAvoidingView>
      ) : (
        corpo
      )}
      <BarraNavegacao titulo={titulo} opacidade={opacidade} />
      {voltar ? <BotaoVoltar rotulo={voltar.rotulo} aoVoltar={voltar.aoTocar} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  cheio: { flex: 1 },
  acima: { marginBottom: 16 },
  fio: { position: 'absolute', left: 0, right: 0, top: 0, height: TAMANHO.bordaVidro },
  rodape: {
    ...PAD.rodapeEntrada,
    paddingHorizontal: TAMANHO.padLateral,
    gap: 8,
  },
});
