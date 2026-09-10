/**
 * Aula em Dia — app do professor.
 *
 * Composição: tema → área segura → tela atual → curva + navbar → toast.
 * A navbar só aparece nas três raízes; nas telas de tarefa o rodapé é da
 * ação primária (spec/navegacao.md).
 */

import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { FaixaCurvaNavbar } from './src/componentes/Curva';
import { Navbar } from './src/componentes/Navbar';
import { Toast } from './src/componentes/Toast';
import { useDados } from './src/estado/dados';
import { ABA_DA_TELA, TELAS_COM_NAVBAR, useNavegacao } from './src/estado/navegacao';
import { useSessao } from './src/estado/sessao';
import { Entrada, Onboarding, Splash } from './src/telas/entrada/Portao';
import { telaDe } from './src/telas/registro';
import { TemaProvider, useTema } from './src/tema/TemaProvider';
import { ARQUIVOS_DE_FONTE } from './src/tema/tipografia';
import { TAMANHO } from './src/tema/tokens';

function App() {
  const { cores, carregado: temaCarregado } = useTema();
  const insets = useSafeAreaInsets();

  const tela = useNavegacao((s) => s.tela);
  const voltar = useNavegacao((s) => s.voltar);
  const trocarTab = useNavegacao((s) => s.trocarTab);

  const carregarDados = useDados((s) => s.carregar);
  const dadosCarregados = useDados((s) => s.carregado);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Botão voltar do Android segue a mesma pilha da navegação da tela.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => voltar());
    return () => sub.remove();
  }, [voltar]);

  const TelaAtual = telaDe(tela);
  const comNavbar = TELAS_COM_NAVBAR.includes(tela);

  // Espera o estado salvo antes de pintar, para a lista não piscar da semente
  // para os dados reais do professor.
  if (!temaCarregado || !dadosCarregados) {
    return <View style={{ flex: 1, backgroundColor: cores.topo }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.tela }}>
      <StatusBar style="light" />

      <View style={{ flex: 1 }}>
        <TelaAtual />
      </View>

      {comNavbar ? (
        <>
          <FaixaCurvaNavbar cor={cores.topo} altura={TAMANHO.faixaCurva} />
          <Navbar
            abaAtiva={ABA_DA_TELA[tela]}
            aoTrocar={trocarTab}
            padBaixo={insets.bottom}
          />
        </>
      ) : null}
    </View>
  );
}

export default function Raiz() {
  const [fontesProntas] = useFonts(ARQUIVOS_DE_FONTE);

  return (
    <SafeAreaProvider>
      <TemaProvider>{fontesProntas ? <Portao /> : <Splash />}</TemaProvider>
    </SafeAreaProvider>
  );
}

/**
 * Decide qual das três máquinas está no ar. O Toast vive aqui, e não dentro
 * do `App`, porque as telas de entrada também avisam coisas.
 */
function Portao() {
  const { carregado: temaCarregado } = useTema();
  const fase = useSessao((s) => s.fase);
  const carregarSessao = useSessao((s) => s.carregar);

  useEffect(() => {
    carregarSessao();
  }, [carregarSessao]);

  const conteudo = () => {
    if (!temaCarregado || fase === 'carregando') return <Splash />;
    if (fase === 'entrada') return <Entrada />;
    if (fase === 'onboarding') return <Onboarding />;
    return <App />;
  };

  return (
    <View style={{ flex: 1 }}>
      {conteudo()}
      <Toast />
    </View>
  );
}
