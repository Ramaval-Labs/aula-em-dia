/**
 * Listas agrupadas do iOS Glass (handoff-ios-glass/README.md, "Lista
 * agrupada", mais as variações das telas 2, 6, 7 e 8).
 *
 * O contêiner é um cartão de vidro com `overflow: hidden`; o separador de
 * .5px é desenhado pela `ListaAgrupada`, não pela linha — assim qualquer
 * conteúdo (linha, estado vazio, bloco) entra na lista sem saber se é o
 * último.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useVidro } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';
import {
  Avatar,
  FaixaStatus,
  type EstadoDoAvatar,
  type TipoDeFaixaVidro,
} from './Blocos';
import { Icone } from './Icone';
import { SuperficieVidro } from './Vidro';

/* ── Contêiner ────────────────────────────────────────────────────────── */

/** Cartão de vidro recortado, com fio entre os filhos. */
export function ListaAgrupada({
  children,
  estilo,
}: {
  children: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const filhos = React.Children.toArray(children).filter(Boolean);

  return (
    <SuperficieVidro nivel="cartao" raio={RAIO_VIDRO.cartao} sombra style={estilo}>
      {filhos.map((filho, i) => (
        <View
          key={i}
          style={
            i < filhos.length - 1
              ? { borderBottomWidth: TAMANHO_VIDRO.bordaVidro, borderBottomColor: cores.fio }
              : null
          }
        >
          {filho}
        </View>
      ))}
    </SuperficieVidro>
  );
}

/* ── Cabeçalho de grupo ───────────────────────────────────────────────── */

/** "EXTRATO", "EM ATRASO 2" — 12/600, .05em, caixa alta, `tinta3`. */
export function CabecalhoGrupo({
  titulo,
  contagem,
  tom = 'neutro',
  estilo,
}: {
  titulo: string;
  /** texto à direita, como a contagem de atrasos */
  contagem?: string;
  /** `atraso` pinta a contagem de vermelho, como no Financeiro */
  tom?: 'neutro' | 'atraso';
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  return (
    <View style={[estilos.cabecalhoGrupo, estilo]}>
      <Text style={[TIPO_VIDRO.cabecalhoGrupo, { color: cores.tinta3 }]}>{titulo}</Text>
      {contagem ? (
        <Text
          style={[texto(12, 700), { color: tom === 'atraso' ? cores.vermelho : cores.tinta3 }]}
        >
          {contagem}
        </Text>
      ) : null}
    </View>
  );
}

/* ── Linha simples ────────────────────────────────────────────────────── */

/** Casca tocável de uma linha: alvo de 44px garantido pelo `minHeight`. */
function Linha({
  aoTocar,
  rotuloAcessivel,
  minAltura,
  padHorizontal,
  children,
}: {
  aoTocar?: () => void;
  rotuloAcessivel?: string;
  minAltura: number;
  padHorizontal: number;
  children: React.ReactNode;
}) {
  const { cores } = useVidro();
  const base: ViewStyle = {
    minHeight: minAltura,
    paddingVertical: 12,
    paddingHorizontal: padHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  };

  if (!aoTocar) {
    return (
      <View accessible={!!rotuloAcessivel} accessibilityLabel={rotuloAcessivel} style={base}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      onPress={aoTocar}
      // O hover do handoff (`background: --fill`) vira o pressionado do toque.
      style={({ pressed }) => [base, pressed ? { backgroundColor: cores.preenchimento } : null]}
    >
      {children}
    </Pressable>
  );
}

export type PorteDaLinha = 'padrao' | 'grande';

/**
 * Linha de ação ou de configuração: título, sub-linha e chevron.
 * `padrao` é a lista de ações (62px, título 14.5); `grande` é a de Ajustes
 * (64px, título 15).
 */
export function LinhaLista({
  titulo,
  subtitulo,
  aoTocar,
  chevron,
  direita,
  porte = 'padrao',
  rotuloAcessivel,
}: {
  titulo: string;
  subtitulo?: string;
  aoTocar?: () => void;
  /** por padrão aparece quando a linha é tocável */
  chevron?: boolean;
  /** controle embutido à direita (o segmentado de Aparência) */
  direita?: React.ReactNode;
  porte?: PorteDaLinha;
  rotuloAcessivel?: string;
}) {
  const { cores } = useVidro();
  const grande = porte === 'grande';
  const mostraChevron = chevron ?? (!!aoTocar && !direita);

  return (
    <Linha
      aoTocar={aoTocar}
      rotuloAcessivel={rotuloAcessivel ?? [titulo, subtitulo].filter(Boolean).join('. ')}
      minAltura={grande ? TAMANHO_VIDRO.linhaAjustes : TAMANHO_VIDRO.linhaLista}
      padHorizontal={15}
    >
      <View style={estilos.flexivel}>
        <Text
          style={[
            grande
              ? texto(15, 700, { altura: 1.3, tracking: -0.01 })
              : texto(14.5, 700, { altura: 1.3, tracking: -0.01 }),
            { color: cores.tinta },
          ]}
        >
          {titulo}
        </Text>
        {subtitulo ? (
          <Text
            style={[
              comEspaco(texto(12, 500, { altura: 1.35 }), { topo: 3 }),
              { color: cores.tinta2 },
            ]}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {direita}
      {mostraChevron ? (
        <Icone nome="chevron" tamanho={TAMANHO_VIDRO.chevron} cor={cores.tinta3} />
      ) : null}
    </Linha>
  );
}

/* ── Linha de aluno ───────────────────────────────────────────────────── */

export type PorteDaLinhaDeAluno = 'lista' | 'sheet' | 'cobranca';

/**
 * A linha da tela Alunos e suas irmãs: avatar, nome, apoio, faixa opcional e
 * um valor à direita.
 *
 * - `lista` (76px): avatar 44, nome 16, saldo 17 + unidade.
 * - `sheet` (68px): avatar 40, nome 15.5 — a escolha de aluno em Registrar.
 * - `cobranca` (66px): avatar 38, nome 15 — as listas do Financeiro.
 */
export function LinhaAluno({
  nome,
  apoio,
  iniciais,
  estadoDoAvatar = 'normal',
  faixa,
  valor,
  unidade,
  corDoValor,
  caixaNoValor = false,
  porte = 'lista',
  aoTocar,
  chevron,
  rotuloAcessivel,
}: {
  nome: string;
  apoio?: string;
  /** iniciais prontas; sem isso saem do `nome` */
  iniciais?: string;
  estadoDoAvatar?: EstadoDoAvatar;
  faixa?: { tipo: TipoDeFaixaVidro; texto: string };
  /** saldo, valor em reais, o que a tela mostrar à direita */
  valor?: string;
  /** legenda sob o valor ("aulas") */
  unidade?: string;
  corDoValor?: string;
  /** encaixota valor + unidade em `preenchimento` (escolha de aluno) */
  caixaNoValor?: boolean;
  porte?: PorteDaLinhaDeAluno;
  aoTocar?: () => void;
  chevron?: boolean;
  rotuloAcessivel?: string;
}) {
  const { cores } = useVidro();
  const p = {
    lista: {
      altura: TAMANHO_VIDRO.linhaAluno,
      avatar: 44,
      pad: 14,
      nome: texto(16, 700, { altura: 1.2, tracking: -0.015 }),
      apoio: texto(13, 500, { altura: 1.3 }),
      valor: texto(17, 800, { tracking: -0.03 }),
    },
    sheet: {
      altura: TAMANHO_VIDRO.linhaEscolhaAluno,
      avatar: 40,
      pad: 15,
      nome: texto(15.5, 700, { altura: 1.2, tracking: -0.012 }),
      apoio: texto(12.5, 500, { altura: 1.35 }),
      valor: texto(14, 800),
    },
    cobranca: {
      altura: TAMANHO_VIDRO.linhaCobranca,
      avatar: 38,
      pad: 15,
      nome: texto(15, 700, { altura: 1.2, tracking: -0.012 }),
      apoio: texto(12, 500, { altura: 1.35 }),
      valor: texto(15, 800),
    },
  }[porte] as {
    altura: number;
    avatar: 44 | 40 | 38;
    pad: number;
    nome: ReturnType<typeof texto>;
    apoio: ReturnType<typeof texto>;
    valor: ReturnType<typeof texto>;
  };

  const mostraChevron = chevron ?? !!aoTocar;
  const rotulo =
    rotuloAcessivel ??
    [nome, apoio, faixa?.texto, valor ? `${valor} ${unidade ?? ''}`.trim() : null]
      .filter(Boolean)
      .join('. ');

  // Na escolha de aluno o valor vira uma caixinha `preenchimento` com o
  // número e "aulas" lado a lado; nas outras, coluna alinhada à direita.
  const blocoValor = !valor ? null : caixaNoValor ? (
    <View style={[estilos.caixaValor, { backgroundColor: cores.preenchimento }]}>
      <Text style={[p.valor, { color: corDoValor ?? cores.tinta }]}>{valor}</Text>
      {unidade ? (
        <Text style={[texto(10.5, 600), { color: cores.tinta2 }]}>{unidade}</Text>
      ) : null}
    </View>
  ) : (
    <View style={estilos.direita}>
      <Text style={[p.valor, { color: corDoValor ?? cores.tinta }]}>{valor}</Text>
      {unidade ? (
        <Text style={[comEspaco(texto(10, 600), { topo: 3 }), { color: cores.tinta2 }]}>
          {unidade}
        </Text>
      ) : null}
    </View>
  );

  return (
    <Linha
      aoTocar={aoTocar}
      rotuloAcessivel={rotulo}
      minAltura={p.altura}
      padHorizontal={p.pad}
    >
      <Avatar nome={nome} texto={iniciais} estado={estadoDoAvatar} tamanho={p.avatar} />
      <View style={estilos.flexivel}>
        <Text style={[p.nome, { color: cores.tinta }]} numberOfLines={1}>
          {nome}
        </Text>
        {apoio ? (
          <Text
            style={[comEspaco(p.apoio, { topo: 3 }), { color: cores.tinta2 }]}
            numberOfLines={1}
          >
            {apoio}
          </Text>
        ) : null}
        {faixa ? (
          <FaixaStatus tipo={faixa.tipo} texto={faixa.texto} estilo={estilos.faixaNaLinha} />
        ) : null}
      </View>
      {blocoValor}
      {mostraChevron ? (
        <Icone nome="chevron" tamanho={TAMANHO_VIDRO.chevron} cor={cores.tinta3} />
      ) : null}
    </Linha>
  );
}

/* ── Linha de extrato ─────────────────────────────────────────────────── */

export type TomDoDelta = 'debito' | 'credito' | 'neutro' | 'pagamento';

/**
 * Um lançamento do extrato: data em coluna fixa de 38px, título e subtítulo
 * no meio, delta colorido à direita com o saldo embaixo.
 *
 * A cor não é o único sinal: `deltaEmPalavras` entra no rótulo do leitor de
 * tela ("1 aula debitada", "pagamento recebido").
 */
export function LinhaExtrato({
  data,
  titulo,
  subtitulo,
  delta,
  deltaEmPalavras,
  rodape,
  tom,
}: {
  data: string;
  titulo: string;
  subtitulo?: string;
  /** já formatado: "−1", "+8", "✓" */
  delta: string;
  deltaEmPalavras: string;
  /** "saldo 4" ou "recebido" */
  rodape: string;
  tom: TomDoDelta;
}) {
  const { cores } = useVidro();
  const cor = {
    debito: cores.vermelho,
    credito: cores.tint,
    neutro: cores.verde,
    pagamento: cores.verde,
  }[tom];

  return (
    <Linha
      rotuloAcessivel={[data, titulo, subtitulo, deltaEmPalavras, rodape]
        .filter(Boolean)
        .join('. ')}
      minAltura={TAMANHO_VIDRO.linhaLista}
      padHorizontal={15}
    >
      <Text
        style={[texto(11.5, 600, { altura: 1.3 }), estilos.colunaData, { color: cores.tinta3 }]}
      >
        {data}
      </Text>
      <View style={estilos.flexivel}>
        <Text style={[texto(14, 700, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta }]}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text
            style={[comEspaco(texto(12, 500, { altura: 1.35 }), { topo: 3 }), { color: cores.tinta2 }]}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>
      <View style={estilos.direita}>
        <Text style={[texto(14, 800), { color: cor }]}>{delta}</Text>
        <Text style={[comEspaco(texto(11, 500), { topo: 4 }), { color: cores.tinta3 }]}>
          {rodape}
        </Text>
      </View>
    </Linha>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  direita: { alignItems: 'flex-end' },
  cabecalhoGrupo: {
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  faixaNaLinha: { marginTop: 7 },
  colunaData: { width: TAMANHO_VIDRO.colunaData },
  caixaValor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RAIO_VIDRO.saldoLinha,
  },
});
