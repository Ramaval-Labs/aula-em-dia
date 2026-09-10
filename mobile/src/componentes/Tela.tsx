/**
 * Chassi de tela: cabeçalho fixo, conteúdo com scroll, rodapé de ação.
 *
 * O rodapé FLUTUA sobre a lista, e não ocupa espaço no fluxo. É para isso que
 * serve a máscara em gradiente do handoff: o conteúdo passa por baixo e some
 * no degradê em vez de parar numa faixa morta. Com o rodapé no fluxo, a lista
 * perdia a altura do botão mais a da faixa da curva — quase 80px de tela.
 *
 * O conteúdo ganha um padding inferior do tamanho medido do rodapé, então o
 * último cartão sempre sobe acima do botão ao rolar.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTema } from '../tema/TemaProvider';

/**
 * A MESMA cor, com alfa zero.
 *
 * Não use `'transparent'` num gradiente: ele é `rgba(0,0,0,0)`, e clarear a
 * partir dele passa por preto translúcido — no iOS isso vira uma faixa cinza
 * visível por cima da lista. Sumindo a partir da própria cor de fundo, o
 * degradê fica limpo nos dois temas.
 */
function semAlfa(cor: string): string {
  const hex = cor.replace('#', '');
  if (hex.length !== 6) return cor;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0)`;
}

export function Tela({
  cabecalho,
  children,
  rodape,
  /** cor do conteúdo; a curva do cabeçalho tem que usar a mesma */
  fundo,
  conteudoEstilo,
  /** quando a navbar aparece embaixo, o rodapé não precisa do safe area */
  comNavbar = false,
  semMascara = false,
  /**
   * Telas com campo de texto. Sobe o rodapé junto com o teclado — sem isto o
   * botão de ação fica embaixo dele, porque o rodapé vive fora do ScrollView.
   */
  comTeclado = false,
}: {
  cabecalho: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  fundo?: string;
  conteudoEstilo?: ViewStyle;
  comNavbar?: boolean;
  semMascara?: boolean;
  comTeclado?: boolean;
}) {
  const { cores, tema } = useTema();
  const cor = fundo ?? cores.tela;
  const [alturaDoRodape, setAlturaDoRodape] = useState(0);

  // O respiro que a tela já pedia continua valendo — o rodapé só soma a ele.
  const respiro =
    typeof conteudoEstilo?.paddingBottom === 'number' ? conteudoEstilo.paddingBottom : 16;

  const corpo = (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            paddingTop: 16,
            paddingHorizontal: 20,
            gap: 10,
          },
          conteudoEstilo,
          { paddingBottom: respiro + alturaDoRodape },
        ]}
        showsVerticalScrollIndicator
        indicatorStyle={tema === 'escuro' ? 'white' : 'black'}
        keyboardShouldPersistTaps={comTeclado ? 'handled' : 'never'}
        keyboardDismissMode={comTeclado ? 'on-drag' : 'none'}
      >
        {children}
      </ScrollView>
      {rodape ? (
        <View
          onLayout={(e) => setAlturaDoRodape(e.nativeEvent.layout.height)}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        >
          <RodapeAcao fundo={cor} comNavbar={comNavbar} semMascara={semMascara}>
            {rodape}
          </RodapeAcao>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: cor }}>
      {cabecalho}
      {comTeclado ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {corpo}
        </KeyboardAvoidingView>
      ) : (
        corpo
      )}
    </View>
  );
}

export function RodapeAcao({
  children,
  fundo,
  comNavbar = false,
  semMascara = false,
}: {
  children: React.ReactNode;
  fundo: string;
  comNavbar?: boolean;
  semMascara?: boolean;
}) {
  const insets = useSafeAreaInsets();
  // Com a navbar embaixo, a faixa da curva já separa o botão do resto: 14px de
  // respiro aqui só empurrava a lista para cima sem ganho visual.
  const padBaixo = comNavbar ? 4 : 14 + insets.bottom;

  const conteudo = (
    <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: padBaixo, gap: 9 }}>
      {children}
    </View>
  );

  if (semMascara) {
    return <View style={{ backgroundColor: fundo }}>{conteudo}</View>;
  }

  // linear-gradient(to top, fundo 72%, transparent)
  return (
    <LinearGradient colors={[semAlfa(fundo), fundo, fundo]} locations={[0, 0.28, 1]}>
      {conteudo}
    </LinearGradient>
  );
}
