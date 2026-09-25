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
 */

import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BarraNavegacao,
  BotaoVoltar,
  TituloDeConteudo,
  useBarraComRolagem,
  usePadTopo,
} from '../../componentes/Chassi';
import { TAMANHO } from '../../tema/tokens';

/** Respiro entre o cabeçalho de texto e o primeiro cartão. */
const ESPACO_APOS_TITULO = 18;

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
  const insets = useSafeAreaInsets();
  const padTopo = usePadTopo(voltar ? 'empilhada' : 'raiz');
  // Sem a barra, o conteúdo rolado passaria por baixo do voltar fixo e os
  // dois se sobreporiam.
  const { opacidade, aoRolar } = useBarraComRolagem();

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
        <View style={[estilos.rodape, { paddingBottom: Math.max(30, insets.bottom) }]}>
          {rodape}
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
  rodape: {
    paddingTop: 12,
    paddingHorizontal: TAMANHO.padLateral,
    gap: 8,
  },
});
