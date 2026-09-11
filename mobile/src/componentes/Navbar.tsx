/**
 * Navbar de três abas com a pílula de vidro "Clear".
 *
 * O vidro é feito só de gradiente, borda e sombras internas.
 * NÃO usar backdrop-filter / BlurView aqui: o efeito é intencionalmente
 * de borda, e o desfoque quebrava o recorte do container no protótipo.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Aba } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { TIPO } from '../tema/tipografia';
import { ICONES_ABA, MARCA, MOVIMENTO, RAIO, TAMANHO, VIDRO } from '../tema/tokens';

type Descricao = { chave: Aba; rotulo: string; icone: string };

const ABAS: Descricao[] = [
  { chave: 'home', rotulo: 'Alunos', icone: ICONES_ABA.alunos },
  { chave: 'financeiro', rotulo: 'Financeiro', icone: ICONES_ABA.financeiro },
  { chave: 'ajustes', rotulo: 'Ajustes', icone: ICONES_ABA.ajustes },
];

const LARGURA_INATIVA = 52;

function useMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = React.useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => vivo && setReduzido(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);
  return reduzido;
}

/** O vidro em si: gradiente + borda + sombras internas + brilho especular. */
function PilulaVidro() {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: RAIO.pilula,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: VIDRO.borda,
          boxShadow: VIDRO.sombra,
        },
      ]}
    >
      <LinearGradient
        colors={[...VIDRO.gradiente]}
        locations={[...VIDRO.paradas]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: '-46%',
          height: '80%',
          borderRadius: RAIO.pilula,
          filter: 'blur(5px)',
        }}
      >
        <LinearGradient
          colors={[...VIDRO.brilho]}
          locations={[...VIDRO.brilhoParadas]}
          style={{ flex: 1, borderRadius: RAIO.pilula }}
        />
      </View>
    </View>
  );
}

function AbaItem({
  descricao,
  ativa,
  aoTocar,
  semMovimento,
}: {
  descricao: Descricao;
  ativa: boolean;
  aoTocar: () => void;
  semMovimento: boolean;
}) {
  const cores = useCores();
  const crescer = useRef(new Animated.Value(ativa ? 1 : 0)).current;

  useEffect(() => {
    const destino = ativa ? 1 : 0;
    if (semMovimento) {
      crescer.setValue(destino);
      return;
    }
    Animated.timing(crescer, {
      toValue: destino,
      duration: MOVIMENTO.abaAtivaMs,
      useNativeDriver: false,
    }).start();
  }, [ativa, semMovimento, crescer]);

  return (
    <Animated.View
      style={{
        flexGrow: crescer,
        flexShrink: 0,
        flexBasis: LARGURA_INATIVA,
        minWidth: 0,
      }}
    >
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: ativa }}
        accessibilityLabel={descricao.rotulo}
        onPress={aoTocar}
        style={{
          // Visual de 42px, alvo de toque de 48px (spec/acessibilidade.md).
          height: TAMANHO.abaToque,
          justifyContent: 'center',
        }}
      >
        <View style={{ height: TAMANHO.aba, borderRadius: RAIO.pilula }}>
          {ativa ? <PilulaVidro /> : null}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              paddingLeft: ativa ? 14 : 0,
              paddingRight: ativa ? 17 : 0,
            }}
          >
            <Svg width={19} height={19} viewBox="0 0 24 24">
              <Path
                d={descricao.icone}
                fill="none"
                stroke={ativa ? MARCA.amarelo : cores.elevadoSuave}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            {ativa ? (
              <Text numberOfLines={1} style={[TIPO.aba, { color: cores.topoTexto }]}>
                {descricao.rotulo}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function Navbar({
  abaAtiva,
  aoTrocar,
  padBaixo,
}: {
  abaAtiva: Aba;
  aoTrocar: (a: Aba) => void;
  padBaixo: number;
}) {
  const cores = useCores();
  const semMovimento = useMovimentoReduzido();
  // Só para forçar novo layout quando a largura muda (rotação/split view).
  useWindowDimensions();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        backgroundColor: cores.topo,
        paddingTop: 6,
        paddingHorizontal: 14,
        paddingBottom: 18 + padBaixo,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {ABAS.map((a) => (
        <AbaItem
          key={a.chave}
          descricao={a}
          ativa={a.chave === abaAtiva}
          aoTocar={() => aoTrocar(a.chave)}
          semMovimento={semMovimento}
        />
      ))}
    </View>
  );
}
