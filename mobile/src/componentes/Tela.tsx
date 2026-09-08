/**
 * Chassi de tela: cabeçalho fixo, conteúdo com scroll, rodapé de ação.
 * O rodapé usa a máscara em gradiente sobre a lista, como no handoff.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTema } from '../tema/TemaProvider';

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
}: {
  cabecalho: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  fundo?: string;
  conteudoEstilo?: ViewStyle;
  comNavbar?: boolean;
  semMascara?: boolean;
}) {
  const { cores, tema } = useTema();
  const cor = fundo ?? cores.tela;

  return (
    <View style={{ flex: 1, backgroundColor: cor }}>
      {cabecalho}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            gap: 10,
          },
          conteudoEstilo,
        ]}
        showsVerticalScrollIndicator
        indicatorStyle={tema === 'escuro' ? 'white' : 'black'}
      >
        {children}
      </ScrollView>
      {rodape ? (
        <RodapeAcao fundo={cor} comNavbar={comNavbar} semMascara={semMascara}>
          {rodape}
        </RodapeAcao>
      ) : null}
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
  const padBaixo = 14 + (comNavbar ? 0 : insets.bottom);

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
    <LinearGradient colors={['transparent', fundo, fundo]} locations={[0, 0.28, 1]}>
      {conteudo}
    </LinearGradient>
  );
}
