/**
 * Sheet modal do iOS Glass (handoff-ios-glass/README.md, "Sheet modal").
 *
 * Véu `veuSheet` com fade de 200ms — a área acima do painel fecha ao
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
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  findNodeHandle,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { useReduzirMovimento } from '../tema/movimento';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { ESCALA_FONTE, MOVIMENTO, RAIO, TAMANHO } from '../tema/tokens';
import { useAlturaDoTeclado } from './teclado';
import { SuperficieVidro } from './Vidro';

/** 88% para sheet de tarefa, 74% para o de resultado. */
export type AlturaSheet = 'tarefa' | 'resultado';

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
  /**
   * Sheet com campo de texto: tocar num botão com o teclado aberto aciona o
   * botão (em vez de só fechar o teclado) e arrastar recolhe o teclado. Com o
   * teclado aberto o painel inteiro sobe acima dele e encolhe para caber
   * (`min(fração · H, H − teclado − topo seguro − 44)`): o rodapé com a ação
   * primária fica sempre à vista, e o corpo rola no que sobrou.
   */
  comTeclado?: boolean;
  children: React.ReactNode;
};

export function Sheet({
  titulo,
  altura = 'tarefa',
  semCancelar = false,
  aoFechar,
  rodape,
  comTeclado = false,
  children,
}: PropsSheet) {
  const { cores, material } = useCores();
  const insets = useSafeAreaInsets();
  const { height: alturaTela } = useWindowDimensions();
  const semMovimento = useReduzirMovimento();
  const fecharSheet = useNavegacao((s) => s.fecharSheet);
  const fechar = aoFechar ?? fecharSheet;

  const teclado = useAlturaDoTeclado(comTeclado);
  const alturaCheia = Math.round(
    alturaTela *
      (altura === 'resultado' ? TAMANHO.alturaResultado : TAMANHO.alturaSheet),
  );
  // Com o teclado, o painel fica entre o teclado e a faixa de toque de 44
  // abaixo da área segura do topo.
  const alturaPainel =
    teclado > 0
      ? Math.min(alturaCheia, alturaTela - teclado - insets.top - TOQUE_ACIMA)
      : alturaCheia;

  const subida = useRef(new Animated.Value(semMovimento ? 0 : alturaCheia)).current;
  const fade = useRef(new Animated.Value(semMovimento ? 1 : 0)).current;

  useEffect(() => {
    if (semMovimento) {
      subida.setValue(0);
      fade.setValue(1);
      return;
    }
    // A animação é independente da árvore: desmontar não a cancela, e o timer
    // segue batendo num nó que já saiu. Por isso ela para na limpeza do efeito.
    const movimento = Animated.parallel([
      Animated.timing(subida, {
        toValue: 0,
        duration: MOVIMENTO.sheetMs,
        easing: Easing.bezier(...MOVIMENTO.sheetCurva),
        useNativeDriver: false,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: MOVIMENTO.fundoSheetMs,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
    ]);
    movimento.start();
    return () => movimento.stop();
  }, [semMovimento, subida, fade]);

  // O foco do leitor de tela vai para o título quando o painel abre: sem
  // isso ele fica no botão que abriu o sheet, agora escondido atrás dele.
  // Espera a subida; o web não tem o que mover (o react-native-web não
  // implementa `setAccessibilityFocus`).
  const refTitulo = useRef<Text>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const t = setTimeout(
      () => {
        try {
          const no = refTitulo.current ? findNodeHandle(refTitulo.current) : null;
          if (no) AccessibilityInfo.setAccessibilityFocus(no);
        } catch {
          // Sem nó nativo (testes): nada a focar.
        }
      },
      semMovimento ? 0 : MOVIMENTO.sheetMs,
    );
    return () => clearTimeout(t);
  }, [semMovimento]);

  // O toast sobe acima do rodapé fixo (e do teclado) enquanto o painel está
  // aberto. `alturaDoRodape` vem do onLayout.
  const reservarSheet = useToast((s) => s.reservarSheet);
  const [alturaDoRodape, setAlturaDoRodape] = React.useState(0);
  const temRodape = !!rodape;
  useEffect(() => {
    reservarSheet((temRodape ? alturaDoRodape : insets.bottom) + teclado);
  }, [temRodape, alturaDoRodape, insets.bottom, teclado, reservarSheet]);
  useEffect(() => () => reservarSheet(null), [reservarSheet]);

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
      keyboardShouldPersistTaps={comTeclado ? 'handled' : undefined}
      keyboardDismissMode={comTeclado ? 'interactive' : undefined}
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
        style={[StyleSheet.absoluteFill, { backgroundColor: cores.veuSheet, opacity: fade }]}
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
          raio={RAIO.sheet}
          soTopo
          sombraExterna={material.sombraSheet}
          style={{ flex: 1 }}
        >
          <View style={{ paddingTop: 9, paddingBottom: 2, alignItems: 'center' }}>
            <View
              style={{
                width: 38,
                height: 5,
                borderRadius: RAIO.puxador,
                backgroundColor: cores.tinta3,
              }}
            />
          </View>

          <View
            style={{
              height: TAMANHO.cabecalhoSheet,
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
                style={{ width: 72, height: TAMANHO.cabecalhoSheet, justifyContent: 'center' }}
              >
                <Text
                  maxFontSizeMultiplier={ESCALA_FONTE.controle}
                  style={[texto(15.5, 600), { color: cores.tint }]}
                >
                  Cancelar
                </Text>
              </Pressable>
            )}
            <Text
              ref={refTitulo}
              accessibilityRole="header"
              numberOfLines={1}
              maxFontSizeMultiplier={ESCALA_FONTE.controle}
              style={[
                TIPO.tituloSheet,
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
              onLayout={(e) => setAlturaDoRodape(e.nativeEvent.layout.height)}
              style={{
                paddingTop: 10,
                paddingHorizontal: 16,
                // Sobre o teclado não há indicador de home a respeitar.
                paddingBottom: teclado > 0 ? 10 : Math.max(30, insets.bottom),
                borderTopWidth: TAMANHO.bordaVidro,
                borderTopColor: cores.fio,
              }}
            >
              {rodape}
            </View>
          ) : null}
        </SuperficieVidro>
      </Animated.View>
      {/* O espaço do teclado: o painel fica apoiado em cima dele. */}
      {teclado > 0 ? <View style={{ height: teclado }} /> : null}
    </View>
  );
}

/**
 * A linha de contexto logo abaixo do cabeçalho do painel (H§5: "Nome ·
 * validade · N de M reposições usadas"): padding `4 6 0`, 13/500 em `tinta2`.
 *
 * `passo` é o "Passo N de 3" do assistente de reposição, que o handoff não
 * desenha: mesma família, um degrau menor e em `tinta3`, para dar a posição
 * no fluxo sem virar título.
 */
export function SubLinhaSheet({ passo, texto: linha }: { passo?: string; texto?: string }) {
  const { cores } = useCores();
  if (!passo && !linha) return null;

  return (
    <View style={{ paddingTop: 4, paddingHorizontal: 6 }}>
      {passo ? (
        <Text style={[texto(11.5, 600, { altura: 1.3 }), { color: cores.tinta3 }]}>{passo}</Text>
      ) : null}
      {linha ? (
        <Text
          style={[
            comEspaco(texto(13, 500, { altura: 1.4 }), { topo: passo ? 2 : 0 }),
            { color: cores.tinta2 },
          ]}
        >
          {linha}
        </Text>
      ) : null}
    </View>
  );
}
