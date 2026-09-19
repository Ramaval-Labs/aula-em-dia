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
 */

import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Catalogo } from './src/componentes/__catalogo__/Catalogo';
import { Sheet, type AlturaSheet } from './src/componentes/Sheet';
import { TabBar } from './src/componentes/TabBar';
import { ToastVidro } from './src/componentes/ToastVidro';
import { AlvoDeDesfoque, FundoRefracao, ProvedorDeDesfoque } from './src/componentes/Vidro';
import { useDados } from './src/estado/dados';
import { exporParaDepuracao, useCatalogo } from './src/estado/depuracao';
import {
  ABA_DA_TELA,
  ehSheet,
  telaDeFundo,
  useNavegacao,
  type Tela,
} from './src/estado/navegacao';
import { useSessao } from './src/estado/sessao';
import { Entrada, Onboarding, Splash } from './src/telas/entrada/Portao';
import { telaDe } from './src/telas/registro';
import { TemaProvider, useTema, useVidro } from './src/tema/TemaProvider';
import { ARQUIVOS_DE_FONTE } from './src/tema/tipografia';

// Só no Expo Web em desenvolvimento: deixa o script de screenshots navegar.
exporParaDepuracao();

/**
 * **Temporário (Onda 2A → Onda 3).** As telas de sheet ainda são as antigas:
 * desenham o próprio cabeçalho e rolam por conta própria, então o `App` as
 * embrulha no painel novo com um título genérico e `corpoProprio`.
 *
 * Quando a tela migrar, ela passa a renderizar o seu próprio `<Sheet>` com o
 * título e o rodapé de verdade — e a chave sai deste mapa.
 */
const SHEETS_NAO_MIGRADOS: Partial<Record<Tela, { titulo: string; altura?: AlturaSheet }>> = {
  semHorario: { titulo: 'Sem horário disponível' },
  confirmarReposicao: { titulo: 'Confirmar reposição' },
  alunoForm: { titulo: 'Aluno' },
  pacote: { titulo: 'Pacote' },
  pagamento: { titulo: 'Registrar pagamento' },
  lembrete: { titulo: 'Lembrete de cobrança' },
};

function App() {
  const { carregado: temaCarregado } = useTema();
  const { cores } = useVidro();

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
    return <View style={{ flex: 1, backgroundColor: cores.tela }} />;
  }

  const emSheet = ehSheet(tela);
  const TelaDeFundo = telaDe(fundo);
  const TelaDoSheet = telaDe(tela);
  const painel = SHEETS_NAO_MIGRADOS[tela];

  return (
    <View style={styles.cheio}>
      <ProvedorDeDesfoque>
        {/* O que o vidro desfoca: o fundo de refração e a tela de baixo. */}
        <AlvoDeDesfoque>
          <FundoRefracao />
          <View style={styles.cheio}>
            <TelaDeFundo />
          </View>
        </AlvoDeDesfoque>

        {emSheet ? (
          painel ? (
            <Sheet titulo={painel.titulo} altura={painel.altura} corpoProprio>
              <TelaDoSheet />
            </Sheet>
          ) : (
            // Tela migrada: o painel é dela, com título e rodapé de verdade.
            <View style={StyleSheet.absoluteFill}>
              <TelaDoSheet />
            </View>
          )
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
      <TemaProvider>{fontesProntas ? <Portao /> : <Splash />}</TemaProvider>
    </SafeAreaProvider>
  );
}

/**
 * Decide qual das três máquinas está no ar. O Toast vive aqui, e não dentro
 * do `App`, porque as telas de entrada também avisam coisas.
 */
function Portao() {
  const { tema, carregado: temaCarregado } = useTema();
  const fase = useSessao((s) => s.fase);
  const carregarSessao = useSessao((s) => s.carregar);
  // Catálogo do redesign (src/componentes/__catalogo__): só em desenvolvimento.
  const catalogoAberto = useCatalogo((s) => s.aberto) && __DEV__;

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
    <View style={styles.cheio}>
      {/* Glifos do sistema escuros sobre o tema claro, e vice-versa. */}
      <StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />
      {conteudo()}
      <ToastVidro />
      {catalogoAberto ? <Catalogo /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cheio: { flex: 1 },
});
