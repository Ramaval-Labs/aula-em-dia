/**
 * Sheet modal do iOS Glass (handoff-ios-glass/README.md, "Sheet modal").
 *
 * Fundo `rgba(6,10,20,.4)` com fade de 200ms — a área acima do painel fecha ao
 * toque — e painel de vidro com raio 40 só no topo, subindo em 340ms com
 * `cubic-bezier(.32,.72,0,1)`.
 *
 * Três faixas: puxador, cabeçalho de 52px ("Cancelar" à esquerda com 72px
 * fixos, título centralizado, 72px vazios à direita) e corpo rolável com
 * rodapé fixo, onde mora a ação primária.
 *
 * O painel é o terceiro eixo da navegação: quem fecha é `fecharSheet()`, que
 * devolve o app para a última tela não-sheet (spec/navegacao.md).
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavegacao } from '../estado/navegacao';
import { useVidro } from '../tema/TemaProvider';
import { texto, TIPO_VIDRO } from '../tema/tipografia';
import { MOVIMENTO_VIDRO, RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';
import { useMovimentoReduzido } from './Chassi';
import { SuperficieVidro } from './Vidro';

/** 88% para sheet de tarefa, 74% para o de resultado. */
export type AlturaSheet = 'tarefa' | 'resultado';

/** Fundo do sheet — o único preto do sistema, e ele não é token de cor. */
const COR_DO_FUNDO = 'rgba(6,10,20,0.4)';

/** Faixa mínima de toque acima do painel (handoff, "Sheet modal"). */
const TOQUE_ACIMA = 44;

export type PropsSheet = {
  /** título do cabeçalho: nome do aluno ou a tarefa */
  titulo: string;
  /** 88% (padrão) ou 74% no sheet de resultado */
  altura?: AlturaSheet;
  /** o sheet de resultado não tem "Cancelar" */
  semCancelar?: boolean;
  /** fechar: o padrão é `fecharSheet()` da navegação */
  aoFechar?: () => void;
  /** ação primária, na faixa fixa do rodapé */
  rodape?: React.ReactNode;
  children: React.ReactNode;
};

export function Sheet({
  titulo,
  altura = 'tarefa',
  semCancelar = false,
  aoFechar,
  rodape,
  children,
}: PropsSheet) {
  const { cores, material } = useVidro();
  const insets = useSafeAreaInsets();
  const { height: alturaTela } = useWindowDimensions();
  const semMovimento = useMovimentoReduzido();
  const fecharSheet = useNavegacao((s) => s.fecharSheet);
  const fechar = aoFechar ?? fecharSheet;

  const alturaPainel = Math.round(
    alturaTela *
      (altura === 'resultado' ? TAMANHO_VIDRO.alturaResultado : TAMANHO_VIDRO.alturaSheet),
  );

  const subida = useRef(new Animated.Value(semMovimento ? 0 : alturaPainel)).current;
  const fade = useRef(new Animated.Value(semMovimento ? 1 : 0)).current;

  useEffect(() => {
    if (semMovimento) {
      subida.setValue(0);
      fade.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(subida, {
        toValue: 0,
        duration: MOVIMENTO_VIDRO.sheetMs,
        easing: Easing.bezier(...MOVIMENTO_VIDRO.sheetCurva),
        useNativeDriver: false,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: MOVIMENTO_VIDRO.fundoSheetMs,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
    ]).start();
  }, [semMovimento, subida, fade]);

  // O voltar do Android fecha o painel antes de mexer na pilha da tela.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      fechar();
      return true;
    });
    return () => sub.remove();
  }, [fechar]);

  const corpo = (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 16, paddingBottom: 16 }}
    >
      {children}
    </ScrollView>
  );

  return (
    <View
      // Modal para o leitor de tela: o que está atrás não é alcançável
      // (spec/acessibilidade.md).
      accessibilityViewIsModal
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: COR_DO_FUNDO, opacity: fade }]}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={fechar}
        style={{ flex: 1, minHeight: TOQUE_ACIMA }}
      />

      <Animated.View
        style={{ height: alturaPainel, transform: [{ translateY: subida }] }}
      >
        <SuperficieVidro
          nivel="sheet"
          raio={RAIO_VIDRO.sheet}
          soTopo
          sombraExterna={material.sombraSheet}
          style={{ flex: 1 }}
        >
          <View style={{ paddingTop: 9, paddingBottom: 2, alignItems: 'center' }}>
            <View
              style={{
                width: 38,
                height: 5,
                borderRadius: RAIO_VIDRO.puxador,
                backgroundColor: cores.tinta3,
              }}
            />
          </View>

          <View
            style={{
              height: TAMANHO_VIDRO.cabecalhoSheet,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {semCancelar ? (
              <View style={{ width: 72 }} />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={fechar}
                style={{ width: 72, height: TAMANHO_VIDRO.cabecalhoSheet, justifyContent: 'center' }}
              >
                <Text style={[texto(15.5, 600), { color: cores.tint }]}>Cancelar</Text>
              </Pressable>
            )}
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              style={[
                TIPO_VIDRO.tituloSheet,
                { flex: 1, textAlign: 'center', color: cores.tinta },
              ]}
            >
              {titulo}
            </Text>
            {/* 72px vazios do outro lado: é o que mantém o título no centro. */}
            <View style={{ width: 72 }} />
          </View>

          {corpo}

          {rodape ? (
            <View
              style={{
                paddingTop: 10,
                paddingHorizontal: 16,
                paddingBottom: Math.max(30, insets.bottom),
                borderTopWidth: TAMANHO_VIDRO.bordaVidro,
                borderTopColor: cores.fio,
              }}
            >
              {rodape}
            </View>
          ) : null}
        </SuperficieVidro>
      </Animated.View>
    </View>
  );
}
