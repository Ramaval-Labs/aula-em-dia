/**
 * Cabeçalho escuro com a curva no rodapé.
 * O padding inferior existe para o texto não encostar na curva.
 */

import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { TAMANHO } from '../tema/tokens';
import { CurvaCabecalho } from './Curva';

export function CabecalhoEscuro({
  children,
  corDaCurva,
  padBaixo = TAMANHO.padCabecalho,
  estilo,
}: {
  children: React.ReactNode;
  /** cor do CONTEÚDO que vem abaixo — é ela que pinta a curva */
  corDaCurva: string;
  padBaixo?: number;
  estilo?: ViewStyle;
}) {
  const cores = useCores();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          backgroundColor: cores.topo,
          paddingTop: 14 + insets.top,
          paddingHorizontal: 20,
          paddingBottom: padBaixo,
        },
        estilo,
      ]}
    >
      <CurvaCabecalho cor={corDaCurva} />
      {children}
    </View>
  );
}

/** "← Alunos" — o rótulo diz para onde volta, como no protótipo. */
export function BotaoVoltar({ rotulo, aoTocar }: { rotulo: string; aoTocar: () => void }) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voltar para ${rotulo}`}
      onPress={aoTocar}
      hitSlop={12}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }}
    >
      <Text style={[texto(15, 400, { altura: 1 }), { color: cores.suave }]}>←</Text>
      <Text style={[texto(12, 600, { altura: 1, tracking: 0.01 }), { color: cores.suave }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function Eyebrow({ children, cor }: { children: React.ReactNode; cor?: string }) {
  const cores = useCores();
  return <Text style={[TIPO.eyebrow, { color: cor ?? cores.topoFraco }]}>{children}</Text>;
}

/**
 * Título de tela. A cor é sempre explícita: o React Native não herda `color`
 * de um View pai, e o padrão preto some no cabeçalho escuro.
 */
export function TituloTela({
  children,
  tamanho = 24,
  cor,
}: {
  children: React.ReactNode;
  tamanho?: number;
  cor?: string;
}) {
  const cores = useCores();
  return (
    <Text
      accessibilityRole="header"
      style={[
        // Montado pelo tamanho recebido: sobrescrever `fontSize` em cima de
        // TIPO.tituloTela deixaria a entrelinha e a folga da métrica presas
        // ao tamanho do token.
        texto(tamanho, 600, { altura: 1.2, tracking: -0.02 }),
        { color: cor ?? cores.topoTexto },
      ]}
    >
      {children}
    </Text>
  );
}

/** Número herói do cabeçalho (contador de aulas, saldo grande). */
export function Heroi({
  numero,
  rotulo,
  cor,
  tamanho = 30,
  rotuloAcessivel,
  alinhar = 'direita',
}: {
  numero: string;
  rotulo: string;
  cor: string;
  tamanho?: number;
  rotuloAcessivel?: string;
  /** à direita no cabeçalho de lista; à esquerda na tela de resultado */
  alinhar?: 'direita' | 'esquerda';
}) {
  const cores = useCores();
  return (
    <View
      accessible
      accessibilityLabel={rotuloAcessivel ?? `${numero} ${rotulo}`}
      style={{ alignItems: alinhar === 'direita' ? 'flex-end' : 'flex-start' }}
    >
      <Text
        style={[texto(tamanho, 800, { altura: 1, tracking: -0.04 }), { color: cor }]}
      >
        {numero}
      </Text>
      <Text style={[comEspaco(TIPO.micro, { topo: 4 }), { color: cores.topoFraco }]}>
        {rotulo}
      </Text>
    </View>
  );
}
