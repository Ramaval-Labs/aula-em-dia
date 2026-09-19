/**
 * Chassi das telas de entrada (Fluxo A) no iOS Glass — **derivado**: o handoff
 * não desenha nenhuma tela de login ou onboarding.
 *
 * Por que não é o `TelaVidro` do catálogo: aquele chassi serve as telas do
 * app, que rolam sob uma tab bar flutuante (126px reservados embaixo) e têm
 * barra de navegação que aparece com a rolagem. A entrada não tem tab bar nem
 * barra de navegação — o título grande é o único cabeçalho, e a ação primária
 * fica numa faixa fixa no rodapé, como a entrada sempre teve.
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

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoVoltar } from '../../componentes/Chassi';
import { FundoRefracao } from '../../componentes/Vidro';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../../tema/tipografia';
import { TAMANHO_VIDRO } from '../../tema/tokens';

/** A status bar do aparelho do handoff (390 × 844), como no `Chassi`. */
const ALTURA_STATUS_HANDOFF = 52;

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
  const { cores } = useVidro();
  const insets = useSafeAreaInsets();

  const base = voltar ? TAMANHO_VIDRO.padTopoEmpilhada : TAMANHO_VIDRO.padTopoRaiz;
  const padTopo = Math.max(base, insets.top + base - ALTURA_STATUS_HANDOFF);

  const corpo = (
    <View style={estilos.cheio}>
      <ScrollView
        style={estilos.cheio}
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
});
