/** Peças genéricas reaproveitadas por várias telas. */

import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

/** Cartão branco com borda fina — o contêiner padrão do conteúdo. */
export function Cartao({
  children,
  estilo,
  semBorda,
}: {
  children: React.ReactNode;
  estilo?: ViewStyle;
  semBorda?: boolean;
}) {
  const cores = useCores();
  return (
    <View
      style={[
        {
          backgroundColor: cores.cartao,
          borderRadius: RAIO.cartao,
          borderWidth: semBorda ? 0 : 1,
          borderColor: cores.linha,
        },
        estilo,
      ]}
    >
      {children}
    </View>
  );
}

/** Caixa de destaque sem borda (fundo --caixa). */
export function Caixa({ children, estilo }: { children: React.ReactNode; estilo?: ViewStyle }) {
  const cores = useCores();
  return (
    <View
      style={[
        {
          backgroundColor: cores.caixa,
          borderRadius: RAIO.cartao,
          paddingVertical: 14,
          paddingHorizontal: 16,
        },
        estilo,
      ]}
    >
      {children}
    </View>
  );
}

/** Micro-rótulo em caixa alta que abre uma seção. */
export function RotuloSecao({
  children,
  direita,
  estilo,
}: {
  children: React.ReactNode;
  direita?: React.ReactNode;
  estilo?: ViewStyle;
}) {
  const cores = useCores();
  return (
    <View
      style={[
        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        estilo,
      ]}
    >
      <Text style={[TIPO.eyebrow, { fontSize: 10, letterSpacing: 1.6, color: cores.suave }]}>
        {children}
      </Text>
      {direita}
    </View>
  );
}

/** Cartão-lista: cabeçalho com rótulo e linhas separadas por régua. */
export function Lista({
  rotulo,
  direita,
  children,
}: {
  rotulo: string;
  direita?: React.ReactNode;
  children: React.ReactNode;
}) {
  const cores = useCores();
  return (
    <Cartao estilo={{ overflow: 'hidden' }}>
      <View
        style={{
          paddingVertical: 11,
          paddingHorizontal: 15,
          borderBottomWidth: 1,
          borderBottomColor: cores.linha,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={[TIPO.eyebrow, { fontSize: 10, letterSpacing: 1.6, color: cores.suave }]}>
          {rotulo}
        </Text>
        {direita}
      </View>
      {children}
    </Cartao>
  );
}

/** Linha de lista com título, subtítulo e chevron opcional. */
export function LinhaLista({
  titulo,
  sub,
  direita,
  aoTocar,
  alturaMinima = 56,
  chevron,
  chevronApagado,
  ultima,
  rotuloAcessivel,
}: {
  titulo: string;
  sub?: string;
  direita?: React.ReactNode;
  aoTocar?: () => void;
  alturaMinima?: number;
  chevron?: boolean;
  chevronApagado?: boolean;
  ultima?: boolean;
  rotuloAcessivel?: string;
}) {
  const cores = useCores();

  const corpo = (pressionado: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: alturaMinima,
        paddingVertical: 11,
        paddingHorizontal: 15,
        borderBottomWidth: ultima ? 0 : 1,
        borderBottomColor: cores.linha,
        backgroundColor: pressionado ? cores.hover : 'transparent',
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[texto(14, 600, { altura: 1.3 }), { color: cores.texto }]}>{titulo}</Text>
        {sub ? (
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>{sub}</Text>
        ) : null}
      </View>
      {direita}
      {chevron ? (
        <Text
          style={[
            texto(16, 600, { altura: 1 }),
            { color: chevronApagado ? cores.fraco : cores.suave },
          ]}
        >
          ›
        </Text>
      ) : null}
    </View>
  );

  if (!aoTocar) return corpo(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? `${titulo}${sub ? `. ${sub}` : ''}`}
      onPress={aoTocar}
    >
      {({ pressed }) => corpo(pressed)}
    </Pressable>
  );
}

export function EstadoVazio({ titulo, nota }: { titulo: string; nota?: string }) {
  const cores = useCores();
  return (
    <View style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' }}>
      <Text
        style={[texto(13, 400, { altura: 1.5 }), { color: cores.textoMedio, textAlign: 'center' }]}
      >
        {titulo}
      </Text>
      {nota ? (
        <Text
          style={[TIPO.nota, { marginTop: 4, color: cores.textoMedio, textAlign: 'center' }]}
        >
          {nota}
        </Text>
      ) : null}
    </View>
  );
}

/** Radio de 20px usado nos cartões selecionáveis (desfecho e janela). */
export function Radio({ selecionado }: { selecionado: boolean }) {
  const cores = useCores();
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: cores.cartao,
        borderWidth: selecionado ? 6 : 1.5,
        borderColor: selecionado ? cores.texto : cores.fraco,
      }}
    />
  );
}

/** Avatar com as iniciais — extraído do cartão de perfil de Ajustes. */
export function Avatar({
  iniciais,
  tamanho = 38,
  fundo,
  tinta,
}: {
  iniciais: string;
  tamanho?: number;
  fundo?: string;
  tinta?: string;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: RAIO.cartao,
        backgroundColor: fundo ?? MARCA.amarelo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[
          texto(Math.round(tamanho * 0.39), 800, { altura: 1 }),
          { color: tinta ?? MARCA.tintaSobreAmarelo },
        ]}
      >
        {iniciais}
      </Text>
    </View>
  );
}

/**
 * Cartão de contexto com barra colorida à esquerda.
 *
 * Estava duplicado à mão em três lugares (dois em AlunoDetalhe, um no diff da
 * Política). A variante escura é a do bloco de atraso, que usa `--elevado`
 * com uma barrinha em vez da borda.
 */
export function CartaoContexto({
  titulo,
  detalhe,
  cor,
  acao,
  escuro = false,
  aoTocar,
  rotuloAcessivel,
}: {
  titulo: string;
  detalhe?: string;
  cor: string;
  acao?: React.ReactNode;
  escuro?: boolean;
  aoTocar?: () => void;
  rotuloAcessivel?: string;
}) {
  const cores = useCores();

  const corpoClaro = (
    <View
      style={{
        backgroundColor: cores.cartao,
        borderRadius: RAIO.cartao,
        borderWidth: 1,
        borderColor: cores.linha,
        borderLeftWidth: 4,
        borderLeftColor: cor,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text style={[texto(14, 600, { altura: 1.25 }), { color: cores.texto }]}>{titulo}</Text>
      {detalhe ? (
        <Text style={[TIPO.corpo, { marginTop: 4, color: cores.textoMedio }]}>{detalhe}</Text>
      ) : null}
      {acao ? <View style={{ marginTop: 11 }}>{acao}</View> : null}
    </View>
  );

  const corpoEscuro = (
    <View
      style={{
        backgroundColor: cores.elevado,
        borderRadius: RAIO.cartao,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 12,
      }}
    >
      <View
        style={{ width: 4, alignSelf: 'stretch', backgroundColor: cor, borderRadius: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[texto(14, 600, { altura: 1.25 }), { color: '#FFFFFF' }]}>{titulo}</Text>
        {detalhe ? (
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.elevadoSuave }]}>
            {detalhe}
          </Text>
        ) : null}
        {acao ? <View style={{ marginTop: 11 }}>{acao}</View> : null}
      </View>
      {aoTocar ? (
        <Text
          style={[
            texto(16, 600, { altura: 1 }),
            { color: cores.topoFraco, alignSelf: 'center' },
          ]}
        >
          ›
        </Text>
      ) : null}
    </View>
  );

  const corpo = escuro ? corpoEscuro : corpoClaro;

  if (!aoTocar) return corpo;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? `${titulo}${detalhe ? `. ${detalhe}` : ''}`}
      onPress={aoTocar}
    >
      {corpo}
    </Pressable>
  );
}

/**
 * Barra de passos do cabeçalho escuro (A4–A7 e o assistente de reposição).
 * Segmento cumprido em amarelo, restante em `--topo-cartao`.
 */
export function BarraDePassos({
  total,
  atual,
  rotulo,
}: {
  total: number;
  atual: number;
  rotulo?: string;
}) {
  const cores = useCores();
  return (
    <View
      accessible
      accessibilityLabel={rotulo ?? `Passo ${atual} de ${total}`}
      style={{ flexDirection: 'row', gap: 5 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i < atual ? MARCA.amarelo : cores.topoCartao,
          }}
        />
      ))}
    </View>
  );
}
