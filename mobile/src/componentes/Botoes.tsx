/** Botões do handoff. Alturas: primário 52, secundário 44, pequeno 38. */

import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO, TAMANHO } from '../tema/tokens';

type Comum = {
  rotulo: string;
  aoTocar: () => void;
  desabilitado?: boolean;
  estilo?: ViewStyle;
};

export function BotaoPrimario({
  rotulo,
  aoTocar,
  desabilitado,
  altura = TAMANHO.botaoPrimario,
  estilo,
}: Comum & { altura?: number }) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        {
          height: altura,
          borderRadius: RAIO.cartao,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: desabilitado
            ? cores.linha
            : pressed
              ? cores.botaoHover
              : cores.botao,
        },
        estilo,
      ]}
    >
      <Text
        style={[TIPO.botao, { color: desabilitado ? cores.desabFg : cores.botaoTexto }]}
      >
        {rotulo}
      </Text>
    </Pressable>
  );
}

/** Ação de ênfase amarela. Tinta sobre amarelo é sempre a mesma. */
export function BotaoAmarelo({ rotulo, aoTocar, estilo }: Comum) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoTocar}
      style={({ pressed }) => [
        {
          height: TAMANHO.botaoPrimario,
          borderRadius: RAIO.cartao,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? '#F5C41E' : MARCA.amarelo,
        },
        estilo,
      ]}
    >
      <Text style={[TIPO.botao, { color: MARCA.tintaSobreAmarelo }]}>{rotulo}</Text>
    </Pressable>
  );
}

/** Botão de contorno — 1.5px na cor do texto. */
export function BotaoContorno({
  rotulo,
  aoTocar,
  altura = 50,
  cor,
  estilo,
}: Comum & { altura?: number; cor?: string }) {
  const cores = useCores();
  const traco = cor ?? cores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoTocar}
      style={({ pressed }) => [
        {
          height: altura,
          borderRadius: RAIO.cartao,
          borderWidth: 1.5,
          borderColor: traco,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? cores.amareloFraco : 'transparent',
        },
        estilo,
      ]}
    >
      <Text style={[texto(15, 600, { altura: 1 }), { color: traco }]}>{rotulo}</Text>
    </Pressable>
  );
}

/** Ação secundária dentro de cartão (38px). */
export function BotaoPequeno({
  rotulo,
  aoTocar,
  variante = 'contorno',
  estilo,
}: Comum & { variante?: 'contorno' | 'amarelo' | 'perigo' }) {
  const cores = useCores();

  const paletas = {
    contorno: { fundo: cores.cartao, borda: cores.texto, tinta: cores.texto },
    amarelo: { fundo: MARCA.amarelo, borda: MARCA.amarelo, tinta: MARCA.tintaSobreAmarelo },
    perigo: { fundo: cores.cartao, borda: cores.vermelho, tinta: cores.vermelho },
  } as const;
  const p = paletas[variante];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoTocar}
      style={({ pressed }) => [
        {
          height: 38,
          minHeight: 38,
          alignSelf: 'flex-start',
          paddingHorizontal: 14,
          borderRadius: RAIO.cartao,
          borderWidth: variante === 'amarelo' ? 0 : 1.5,
          borderColor: p.borda,
          backgroundColor: pressed && variante !== 'amarelo' ? cores.amareloFraco : p.fundo,
          alignItems: 'center',
          justifyContent: 'center',
        },
        estilo,
      ]}
      hitSlop={{ top: 4, bottom: 4 }}
    >
      <Text style={[texto(13, 600, { altura: 1 }), { color: p.tinta }]}>{rotulo}</Text>
    </Pressable>
  );
}

/** Ação textual de rodapé (44px, cor suave). */
export function BotaoTexto({ rotulo, aoTocar, estilo }: Comum) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoTocar}
      style={[
        { height: TAMANHO.botaoSecundario, alignItems: 'center', justifyContent: 'center' },
        estilo,
      ]}
    >
      <Text style={[texto(14, 600, { altura: 1 }), { color: cores.suave }]}>{rotulo}</Text>
    </Pressable>
  );
}

/**
 * Chips de filtro / seleção. Altura visual menor, alvo de toque de 44px.
 * `variante` "caixa" é a usada dentro de cartão (política): sem borda,
 * fundo --caixa quando inativo.
 */
export function Chip({
  rotulo,
  ativo,
  aoTocar,
  cresce,
  altura = 32,
  variante = 'contorno',
}: {
  rotulo: string;
  ativo: boolean;
  aoTocar: () => void;
  cresce?: boolean;
  altura?: number;
  variante?: 'contorno' | 'caixa';
}) {
  const cores = useCores();
  const emCaixa = variante === 'caixa';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: ativo }}
      onPress={aoTocar}
      hitSlop={{ top: 6, bottom: 6 }}
      style={{ flex: cresce ? 1 : undefined }}
    >
      <View
        style={{
          height: altura,
          paddingHorizontal: cresce ? 0 : 13,
          borderRadius: RAIO.contador,
          borderWidth: emCaixa ? 0 : 1,
          borderColor: ativo ? cores.texto : cores.linha,
          backgroundColor: ativo ? cores.texto : emCaixa ? cores.caixa : cores.cartao,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={[
            texto(12, 600, { altura: 1 }),
            { color: ativo ? cores.botaoTexto : cores.suave },
          ]}
        >
          {rotulo}
        </Text>
      </View>
    </Pressable>
  );
}
