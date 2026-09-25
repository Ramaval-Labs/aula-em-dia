/**
 * Tab bar flutuante do iOS Glass (handoff-ios-glass/README.md, "Tab bar").
 *
 * Barra de 66px com raio 26, a 14px das laterais e 26px da base, em vidro com
 * o **anel de refração** — a única peça do sistema que o usa. O item ativo
 * ganha gradiente vertical, borda `bordaTopo`, o reflexo interno e um brilho
 * desfocado acima; o inativo é só ícone e rótulo em `tinta3`.
 *
 * O que o handoff desenha e aqui **não** se desenha: indicador de home e
 * status bar. O sistema já os tem; redesenhá-los dobraria o traço.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Aba } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { TIPO } from '../tema/tipografia';
import { ESCALA_FONTE, PILULA_ABA, RAIO, TAMANHO } from '../tema/tokens';
import { Icone, type NomeDeIcone } from './Icone';
import { SuperficieVidro } from './Vidro';

/** As três abas, com o ícone de `Icone.tsx` (traço 1.9, `PATHS_ABA`). */
const ABAS: { chave: Aba; rotulo: string; icone: NomeDeIcone }[] = [
  { chave: 'home', rotulo: 'Alunos', icone: 'abaAlunos' },
  { chave: 'financeiro', rotulo: 'Financeiro', icone: 'abaFinanceiro' },
  { chave: 'ajustes', rotulo: 'Ajustes', icone: 'abaAjustes' },
];

/**
 * Os 26px da base foram medidos no aparelho de referência, onde a área segura
 * de baixo é 34 — a barra encosta 8px dentro dela, como a tab bar do iOS.
 * Onde a área segura é maior (navegação por gestos do Android), ela manda.
 */
const RECUO_NA_AREA_SEGURA = 8;

/** Distância da tab bar à base da tela, com a área segura. */
export function useBaseDaTabBar(): number {
  const insets = useSafeAreaInsets();
  return Math.max(TAMANHO.baseTabBar, insets.bottom - RECUO_NA_AREA_SEGURA);
}

function ItemDeAba({
  icone,
  rotulo,
  ativa,
  aoTocar,
}: {
  icone: NomeDeIcone;
  rotulo: string;
  ativa: boolean;
  aoTocar: () => void;
}) {
  const { cores, material } = useCores();
  const cor = ativa ? cores.tint : cores.tinta3;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      accessibilityLabel={rotulo}
      onPress={aoTocar}
      style={{
        flex: 1,
        // 56px de altura: acima dos 48px de alvo de aba (spec/acessibilidade.md).
        height: TAMANHO.itemAba,
        borderRadius: RAIO.pilulaAba,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      {ativa ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: RAIO.pilulaAba,
              overflow: 'hidden',
              borderWidth: TAMANHO.bordaVidro,
              borderColor: cores.bordaTopo,
              boxShadow: `${material.gin}, 0px 4px 12px ${cores.sombra}`,
            }}
          >
            <LinearGradient
              colors={[...PILULA_ABA.gradiente]}
              locations={[...PILULA_ABA.paradas]}
              style={{ flex: 1 }}
            />
          </View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '-52%',
              height: '86%',
              borderRadius: RAIO.circulo,
              filter: 'blur(6px)',
            }}
          >
            <LinearGradient
              colors={[...PILULA_ABA.brilho]}
              locations={[...PILULA_ABA.brilhoParadas]}
              style={{ flex: 1, borderRadius: RAIO.circulo }}
            />
          </View>
        </>
      ) : null}

      <Icone nome={icone} tamanho={TAMANHO.iconeAba} cor={cor} />
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={ESCALA_FONTE.compacta}
        style={[TIPO.rotuloAba, { color: cor }]}
      >
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function TabBar({
  abaAtiva,
  aoTrocar,
}: {
  abaAtiva: Aba;
  aoTrocar: (aba: Aba) => void;
}) {
  const { material } = useCores();
  const base = useBaseDaTabBar();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: 'absolute',
        left: TAMANHO.margemTabBar,
        right: TAMANHO.margemTabBar,
        bottom: base,
      }}
    >
      <SuperficieVidro
        nivel="vidro"
        raio={RAIO.tabBar}
        anel
        sombraExterna={material.sombraTabBar}
        style={{
          height: TAMANHO.tabBar,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 5,
          gap: 4,
        }}
      >
        {ABAS.map((a) => (
          <ItemDeAba
            key={a.chave}
            icone={a.icone}
            rotulo={a.rotulo}
            ativa={a.chave === abaAtiva}
            aoTocar={() => aoTrocar(a.chave)}
          />
        ))}
      </SuperficieVidro>
    </View>
  );
}
