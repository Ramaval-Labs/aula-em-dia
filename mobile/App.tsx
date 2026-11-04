/**
 * Aula em Dia — app do professor.
 *
 * Composição do iOS Glass: fundo de refração sob tudo → tela não-sheet dentro
 * do alvo de desfoque → tab bar flutuante por cima → sheet modal quando a tela
 * atual é um painel → toast.
 *
 * A tab bar aparece em toda tela **não-sheet** e some com o painel aberto; o
 * sheet sobe sobre a última tela não-sheet da pilha, que continua desenhada
 * atrás dele (spec/navegacao.md, "Semântica de sheet").
 *
 * No Expo Web, o caminho `/a/<token>` não abre nada disto: abre a página do
 * aluno (`telas/aluno/AppDoAluno.tsx`), ver `PortaoDoAluno`.
 */

import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Catalogo } from './src/componentes/__catalogo__/Catalogo';
import { TabBar } from './src/componentes/TabBar';
import { Toast } from './src/componentes/Toast';
import { AlvoDeDesfoque, FundoRefracao, ProvedorDeDesfoque } from './src/componentes/Vidro';
import { useDados } from './src/estado/dados';
import { exporParaDepuracao, useCatalogo } from './src/estado/depuracao';
import {
  ABA_DA_TELA,
  ehSheet,
  telaDeFundo,
  useNavegacao,
} from './src/estado/navegacao';
import { useSessao } from './src/estado/sessao';
import { AppDoAluno, tokenDoCaminho } from './src/telas/aluno/AppDoAluno';
import { Entrada, Onboarding, Splash } from './src/telas/entrada/Portao';
import { telaDe } from './src/telas/registro';
import { TemaProvider, useTema } from './src/tema/TemaProvider';
import { ARQUIVOS_DE_FONTE } from './src/tema/tipografia';

// Só no Expo Web em desenvolvimento: deixa o script de screenshots navegar.
exporParaDepuracao();

/**
 * O link do aluno (`/a/<token>`, Parte 6): no Expo Web, esse caminho abre a
 * página pública no lugar do app do professor, sem sessão e sem carregar os
 * dados dele. No nativo não há caminho, e nada muda.
 */
const CAMINHO_DO_ALUNO =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.location?.pathname?.startsWith('/a/')
    ? window.location.pathname
    : null;

export function App() {
  const { carregado: temaCarregado } = useTema();
  const tela = useNavegacao((s) => s.tela);
  const fundo = useNavegacao(telaDeFundo);
  const voltar = useNavegacao((s) => s.voltar);
  const trocarTab = useNavegacao((s) => s.trocarTab);

  const carregarDados = useDados((s) => s.carregar);
  const dadosCarregados = useDados((s) => s.carregado);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Botão voltar do Android segue a mesma pilha da navegação da tela. Com um
  // sheet aberto, o próprio painel intercepta antes e só fecha.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => voltar());
    return () => sub.remove();
  }, [voltar]);

  // Espera o estado salvo antes de pintar, para a lista não piscar da semente
  // para os dados reais do professor.
  if (!temaCarregado || !dadosCarregados) {
    return <FundoRefracao />;
  }

  const emSheet = ehSheet(tela);
  const TelaDeFundo = telaDe(fundo);
  const TelaDoSheet = telaDe(tela);

  return (
    <View style={styles.cheio}>
      <ProvedorDeDesfoque>
        {/* O que o vidro desfoca: o fundo de refração e a tela de baixo. */}
        <AlvoDeDesfoque>
          <FundoRefracao />
          <View
            // Com o sheet aberto a tela de baixo sai do leitor de tela nos
            // dois sistemas: `accessibilityViewIsModal` do painel só vale no
            // iOS, e só entre irmãos.
            accessibilityElementsHidden={emSheet}
            importantForAccessibility={emSheet ? 'no-hide-descendants' : 'auto'}
            aria-hidden={emSheet || undefined}
            style={styles.cheio}
          >
            <TelaDeFundo />
          </View>
        </AlvoDeDesfoque>

        {emSheet ? (
          // O painel é da própria tela, com título e rodapé de verdade.
          <View style={StyleSheet.absoluteFill}>
            <TelaDoSheet />
          </View>
        ) : (
          <TabBar abaAtiva={ABA_DA_TELA[tela]} aoTrocar={trocarTab} />
        )}
      </ProvedorDeDesfoque>
    </View>
  );
}

export default function Raiz() {
  const [fontesProntas] = useFonts(ARQUIVOS_DE_FONTE);

  return (
    <SafeAreaProvider>
      <TemaProvider>
        {CAMINHO_DO_ALUNO !== null ? (
          <PortaoDoAluno fontesProntas={fontesProntas} caminho={CAMINHO_DO_ALUNO} />
        ) : (
          <Portao fontesProntas={fontesProntas} />
        )}
      </TemaProvider>
    </SafeAreaProvider>
  );
}

/**
 * A raiz do link do aluno. Só espera as fontes e o tema: sem `useSessao` e
 * sem `carregarDados`, porque o aluno não tem conta e os dados do professor
 * não chegam ao navegador dele. O fundo de refração e o toast são da própria
 * página.
 */
function PortaoDoAluno({ fontesProntas, caminho }: { fontesProntas: boolean; caminho: string }) {
  const { tema, carregado: temaCarregado } = useTema();

  return (
    <View style={styles.cheio}>
      <StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />
      {fontesProntas && temaCarregado ? (
        <AppDoAluno token={tokenDoCaminho(caminho)} />
      ) : (
        <FundoRefracao />
      )}
    </View>
  );
}

/**
 * Decide qual das três máquinas está no ar. O Toast vive aqui, e não dentro
 * do `App`, porque as telas de entrada também avisam coisas.
 *
 * O fundo de refração também: ele fica sob **todas** as fases. Na entrada é
 * este, desenhado aqui; o `App` desenha o seu dentro do alvo de desfoque,
 * porque no Android o vidro das barras e do sheet só desfoca o que está no
 * alvo — por isso aqui ele não é desenhado com o app no ar (seriam dois).
 */
function Portao({ fontesProntas }: { fontesProntas: boolean }) {
  const { tema, carregado: temaCarregado } = useTema();
  const fase = useSessao((s) => s.fase);
  const carregarSessao = useSessao((s) => s.carregar);
  // Catálogo do redesign (src/componentes/__catalogo__): só em desenvolvimento.
  const catalogoAberto = useCatalogo((s) => s.aberto) && __DEV__;

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  const noApp = fontesProntas && temaCarregado && fase === 'app';

  const conteudo = () => {
    if (!fontesProntas || !temaCarregado || fase === 'carregando') return <Splash />;
    if (fase === 'entrada') return <Entrada />;
    if (fase === 'onboarding') return <Onboarding />;
    return <App />;
  };

  return (
    <View style={styles.cheio}>
      {/* Glifos do sistema escuros sobre o tema claro, e vice-versa. */}
      <StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />
      {noApp ? null : <FundoRefracao />}
      {conteudo()}
      <Toast />
      {catalogoAberto ? <Catalogo /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cheio: { flex: 1 },
});
