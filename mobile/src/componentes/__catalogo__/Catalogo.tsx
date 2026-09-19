/**
 * Catálogo do redesign iOS Glass — tela só de desenvolvimento.
 *
 * Fica fora de `telas/registro.ts` e da união `Tela`: abre por cima do app
 * pelo gancho de depuração (`__aulaEmDia.catalogo.getState().abrir()`) ou por
 * `npm run capturar -- --catalogo`.
 *
 * Uma seção por família de componente (`Secoes.tsx`), cada peça em todos os
 * seus estados. É a tela que prova o catálogo.
 *
 * Prova do material: conteúdo colorido rolando POR BAIXO de uma
 * barra fixa de vidro e de uma tab bar falsa com anel, cartões com recorte
 * arredondado (o que quebrava antes), um bloco de status suave, um painel de
 * sheet sobre conteúdo e o mesmo cartão com blur e em fallback lado a lado.
 */

import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCatalogo } from '../../estado/depuracao';
import { useTema, useCores, type NomeDeTema } from '../../tema/TemaProvider';
import { comEspaco, TIPO } from '../../tema/tipografia';
import { RAIO, TAMANHO } from '../../tema/tokens';
import {
  AlvoDeDesfoque,
  blurLigado,
  FundoRefracao,
  MODO_VIDRO,
  ProvedorDeDesfoque,
  SuperficieVidro,
  type ModoVidro,
} from '../Vidro';
import { SecoesDoCatalogo } from './Secoes';

const TEXTO_LONGO =
  'Professor particular controla pacotes de aulas pré-pagas: quantas o aluno já usou, ' +
  'o que acontece quando ele falta, quando cabe reposição e o que está em atraso. ' +
  'Este parágrafo existe para passar por baixo das barras e mostrar se o vidro desfoca ' +
  'o texto sem apagar a cor de trás.';

export function Catalogo() {
  const { cores, material, tema } = useCores();
  const { trocarTema } = useTema();
  const fechar = useCatalogo((s) => s.fechar);

  const faixas = [cores.tint, cores.verde, cores.ambar, cores.vermelho];

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <ProvedorDeDesfoque>
        <AlvoDeDesfoque>
          <FundoRefracao />
          <ScrollView
            style={styles.cheio}
            contentContainerStyle={{
              paddingTop: TAMANHO.barraNav + 16,
              paddingHorizontal: TAMANHO.padLateral,
              paddingBottom: TAMANHO.padBaixoConteudo,
            }}
          >
            <Text style={[TIPO.tituloGrande, { color: cores.tinta }]}>Vidro</Text>
            <Text style={[comEspaco(TIPO.apoio, { topo: 8 }), { color: cores.tinta2 }]}>
              Tema {tema} · {Platform.OS} {String(Platform.Version ?? '')} · modo {MODO_VIDRO} ·
              blur {blurLigado() ? 'ligado' : 'desligado'}
            </Text>

            <SeletorDeTema tema={tema} aoTrocar={trocarTema} />

            <SecoesDoCatalogo />

            <Text style={[comEspaco(TIPO.tituloEmpilhada, { topo: 30 }), { color: cores.tinta }]}>
              Material
            </Text>

            <Palco />

            <SuperficieVidro nivel="cartao" raio={RAIO.cartao} sombra style={styles.cartao}>
              <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>
                Saldo do pacote
              </Text>
              <View style={styles.linhaSaldo}>
                <Text style={[TIPO.saldoCartao, { color: cores.tint }]}>4</Text>
                <Text style={[TIPO.apoio, { color: cores.tinta2 }]}>aulas</Text>
              </View>
              <Text style={[comEspaco(TIPO.nomeLista, { topo: 10 }), { color: cores.tinta }]}>
                Rafael Dornelas
              </Text>
              <Text style={[comEspaco(TIPO.apoio, { topo: 3 }), { color: cores.tinta2 }]}>
                Violão · segunda, 19h
              </Text>
              <Text style={[comEspaco(TIPO.textoBloco, { topo: 8 }), { color: cores.tinta3 }]}>
                validade 12/09 · 1 de 3 reposições
              </Text>
            </SuperficieVidro>

            <View
              style={[
                styles.bloco,
                {
                  backgroundColor: cores.vermelhoSuave,
                  borderColor: cores.borda,
                  boxShadow: material.gin,
                },
              ]}
            >
              <Text style={[TIPO.tituloBloco, { color: cores.vermelho }]}>
                Pagamento em atraso
              </Text>
              <Text style={[comEspaco(TIPO.textoBloco, { topo: 4 }), { color: cores.tinta2 }]}>
                Venceu 16/08 · 12 dias. Status sempre em fundo suave, texto na cor cheia.
              </Text>
            </View>

            {/* Cor cheia: passa sob a tab bar e, rolando, sob a barra do topo. */}
            {faixas.map((cor, i) => (
              <View key={cor} style={[styles.faixa, { backgroundColor: cor }]}>
                <Text style={[TIPO.tituloBloco, { color: cores.sobreTint }]}>
                  Faixa {i + 1} de cor cheia
                </Text>
              </View>
            ))}

            <Comparacao />

            <Text style={[comEspaco(TIPO.textoBloco, { topo: 18 }), { color: cores.tinta2 }]}>
              {TEXTO_LONGO}
            </Text>
            {faixas.map((cor) => (
              <View key={`fim-${cor}`} style={[styles.faixa, { backgroundColor: cor }]}>
                <Text style={[TIPO.textoBloco, { color: cores.sobreTint }]}>
                  {TEXTO_LONGO}
                </Text>
              </View>
            ))}
          </ScrollView>
        </AlvoDeDesfoque>

        {/* Barra fixa do topo, nível "vidro", fora do alvo de desfoque. */}
        <SuperficieVidro nivel="vidro" raio={0} style={styles.barra}>
          <View style={styles.tituloBarra}>
            <Text style={[TIPO.tituloNav, { color: cores.tinta }]}>Catálogo</Text>
          </View>
          <Pressable
            onPress={fechar}
            accessibilityRole="button"
            accessibilityLabel="Fechar catálogo"
            style={styles.fechar}
          >
            <Text style={[TIPO.tituloSheet, { color: cores.tint }]}>Fechar</Text>
          </Pressable>
        </SuperficieVidro>

        {/* Tab bar falsa: vidro + anel, flutuando sobre a rolagem. */}
        <SuperficieVidro
          nivel="vidro"
          raio={RAIO.tabBar}
          anel
          sombraExterna={material.sombraTabBar}
          style={styles.tabBar}
        >
          {['Alunos', 'Financeiro', 'Ajustes'].map((rotulo, i) => (
            <View key={rotulo} style={styles.itemAba}>
              <Text style={[TIPO.rotuloAba, { color: i === 0 ? cores.tint : cores.tinta3 }]}>
                {rotulo}
              </Text>
            </View>
          ))}
        </SuperficieVidro>
      </ProvedorDeDesfoque>
    </View>
  );
}

function SeletorDeTema({
  tema,
  aoTrocar,
}: {
  tema: NomeDeTema;
  aoTrocar: (t: NomeDeTema) => void;
}) {
  const { cores } = useCores();
  return (
    <View style={[styles.trilho, { backgroundColor: cores.preenchimento }]}>
      {(['claro', 'escuro'] as const).map((t) => {
        const ativo = t === tema;
        return (
          <Pressable
            key={t}
            onPress={() => aoTrocar(t)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            style={[
              styles.segmento,
              ativo
                ? { backgroundColor: cores.vidro2, borderColor: cores.borda }
                : { borderColor: 'transparent' },
            ]}
          >
            <Text style={[TIPO.tituloBloco, { color: ativo ? cores.tinta : cores.tinta2 }]}>
              {t === 'claro' ? 'Claro' : 'Escuro'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** O mesmo cartão com e sem desfoque, sobre faixas de cor. */
function Comparacao() {
  const { cores } = useCores();
  const modos: ModoVidro[] = ['auto', 'fallback'];
  return (
    <View style={styles.palcoComparacao}>
      <View style={StyleSheet.absoluteFill}>
        {[cores.mancha1, cores.tint, cores.mancha2, cores.vermelho, cores.mancha4].map((cor) => (
          <View key={cor} style={[styles.listra, { backgroundColor: cor }]} />
        ))}
      </View>
      {modos.map((modo) => (
        <SuperficieVidro
          key={modo}
          nivel="cartao"
          raio={RAIO.cartao}
          modo={modo}
          style={styles.cartaoComparacao}
        >
          <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>{modo}</Text>
          <Text style={[comEspaco(TIPO.resumo, { topo: 6 }), { color: cores.tinta }]}>
            R$ 480
          </Text>
          <Text style={[comEspaco(TIPO.textoBloco, { topo: 4 }), { color: cores.tinta2 }]}>
            {modo === 'auto' ? 'com desfoque' : 'miolo reforçado'}
          </Text>
        </SuperficieVidro>
      ))}
    </View>
  );
}

/** Painel de sheet (raio 40 só no topo) sobre texto e cor. */
function Palco() {
  const { cores, material } = useCores();
  return (
    <View style={styles.palcoSheet}>
      <View style={StyleSheet.absoluteFill}>
        <Text style={[TIPO.tituloEmpilhada, { color: cores.tinta }]}>
          Conteúdo atrás do sheet
        </Text>
        <View style={[styles.faixa, { backgroundColor: cores.tint }]} />
        <Text style={[comEspaco(TIPO.textoBloco, { topo: 8 }), { color: cores.tinta2 }]}>
          {TEXTO_LONGO}
        </Text>
        <View style={[styles.faixa, { backgroundColor: cores.ambar }]} />
      </View>
      <SuperficieVidro
        nivel="sheet"
        raio={RAIO.sheet}
        soTopo
        sombraExterna={material.sombraSheet}
        style={styles.sheet}
      >
        <View style={styles.puxadorArea}>
          <View style={[styles.puxador, { backgroundColor: cores.tinta3 }]} />
        </View>
        <View style={styles.cabecalhoSheet}>
          <Text style={[TIPO.tituloSheet, styles.cancelar, { color: cores.tint }]}>
            Cancelar
          </Text>
          <Text style={[TIPO.tituloSheet, styles.tituloSheet, { color: cores.tinta }]}>
            Registrar aula
          </Text>
          <View style={styles.cancelar} />
        </View>
        <Text style={[TIPO.textoBloco, styles.corpoSheet, { color: cores.tinta2 }]}>
          Painel estático de nível sheet, raio 40 nos cantos de cima.
        </Text>
      </SuperficieVidro>
    </View>
  );
}

const styles = StyleSheet.create({
  cheio: { flex: 1 },
  faixa: {
    marginTop: 12,
    minHeight: 64,
    borderRadius: RAIO.bloco,
    padding: 16,
    justifyContent: 'center',
  },
  cartao: { marginTop: 18, paddingVertical: 17, paddingHorizontal: 18 },
  linhaSaldo: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 9 },
  bloco: {
    marginTop: 14,
    borderRadius: RAIO.bloco,
    borderWidth: TAMANHO.bordaVidro,
    paddingVertical: 16,
    paddingHorizontal: 17,
  },
  trilho: {
    marginTop: 18,
    flexDirection: 'row',
    padding: 3,
    gap: 2,
    borderRadius: RAIO.trilho,
  },
  segmento: {
    flex: 1,
    height: TAMANHO.alvoMinimo - 8,
    borderRadius: RAIO.segmento,
    borderWidth: TAMANHO.bordaVidro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  palcoComparacao: {
    marginTop: 18,
    height: 150,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  listra: { flex: 1 },
  cartaoComparacao: { flex: 1, padding: 14 },
  palcoSheet: { marginTop: 18, height: 260, justifyContent: 'flex-end', overflow: 'hidden' },
  sheet: { height: 170 },
  puxadorArea: { paddingTop: 9, paddingBottom: 2, alignItems: 'center' },
  puxador: { width: 38, height: 5, borderRadius: RAIO.puxador },
  cabecalhoSheet: {
    height: TAMANHO.cabecalhoSheet,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelar: { width: 72 },
  tituloSheet: { flex: 1, textAlign: 'center' },
  corpoSheet: { paddingHorizontal: 16, paddingTop: 6 },
  barra: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TAMANHO.barraNav,
  },
  tituloBarra: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 0,
    height: TAMANHO.tituloNav,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fechar: {
    position: 'absolute',
    right: 6,
    bottom: 0,
    height: TAMANHO.alvoMinimo,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  tabBar: {
    position: 'absolute',
    left: TAMANHO.margemTabBar,
    right: TAMANHO.margemTabBar,
    bottom: TAMANHO.baseTabBar,
    height: TAMANHO.tabBar,
    padding: 5,
    gap: 4,
    flexDirection: 'row',
  },
  itemAba: {
    flex: 1,
    height: TAMANHO.itemAba,
    borderRadius: RAIO.pilulaAba,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
