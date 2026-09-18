/**
 * Blocos e peças de leitura do iOS Glass (handoff-ios-glass/README.md,
 * "Cartão de vidro", "Blocos de status", "Avatar", "Faixa de status" e os
 * medidores das telas 2 e 6).
 *
 * Regra de cor que vale em todos: status é **fundo suave** (12–16% de alfa)
 * com o texto na cor cheia. Cor cheia no fundo só no quadradinho de ícone de
 * 34px e no avatar de destaque.
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

import { useVidro, type Vidro } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';
import { BotaoInline } from './Controles';
import { Icone, type NomeDeIcone } from './Icone';
import { SuperficieVidro } from './Vidro';

/* ── Cartão ───────────────────────────────────────────────────────────── */

/** O cartão base: vidro, raio 22, padding 17 × 18. */
export function CartaoVidro({
  children,
  semPadding = false,
  estilo,
}: {
  children: React.ReactNode;
  /** desliga o padding para listas que se recortam na borda */
  semPadding?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <SuperficieVidro
      nivel="cartao"
      raio={RAIO_VIDRO.cartao}
      sombra
      style={[semPadding ? null : estilos.padCartao, estilo]}
    >
      {children}
    </SuperficieVidro>
  );
}

/* ── Cor de status ────────────────────────────────────────────────────── */

export type TomDeStatus = 'neutro' | 'tint' | 'vermelho' | 'ambar' | 'verde';

/** Par (fundo suave, cor cheia) de cada tom. `neutro` não tem cor cheia. */
export function coresDoTom(cores: Vidro['cores'], tom: TomDeStatus) {
  switch (tom) {
    case 'tint':
      return { suave: cores.tintSuave, cheia: cores.tint };
    case 'vermelho':
      return { suave: cores.vermelhoSuave, cheia: cores.vermelho };
    case 'ambar':
      return { suave: cores.ambarSuave, cheia: cores.ambar };
    case 'verde':
      return { suave: cores.verdeSuave, cheia: cores.verde };
    default:
      return { suave: cores.preenchimento, cheia: cores.tinta };
  }
}

/* ── Bloco de status ──────────────────────────────────────────────────── */

/**
 * O aviso de uma linha e meia das telas 2, 5 e 9: fundo suave do tom, título
 * na cor cheia, texto em `tinta2`.
 *
 * Com ícone o handoff aperta o bloco (padding 15 × 16, título 14.5); só com
 * texto ele respira (16 × 17, título 15 e texto 13). O `acao` vira botão
 * inline com 13px de folga acima.
 */
export function BlocoStatus({
  tom = 'neutro',
  titulo,
  texto: corpo,
  icone,
  acao,
  aoTocar,
  chevron = false,
  estilo,
}: {
  tom?: TomDeStatus;
  titulo: string;
  texto?: string;
  icone?: NomeDeIcone;
  acao?: { rotulo: string; aoTocar: () => void; variante?: 'tint' | 'vidro' };
  /** bloco inteiro clicável (pagamento em atraso → Cobrança) */
  aoTocar?: () => void;
  chevron?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const { suave, cheia } = coresDoTom(cores, tom);
  const comIcone = !!icone;

  const conteudo = (
    <>
      <View style={estilos.linhaBloco}>
        {icone ? (
          <View style={[estilos.iconeBloco, { backgroundColor: cheia }]}>
            <Icone
              nome={icone}
              tamanho={TAMANHO_VIDRO.glifoBloco}
              cor={tom === 'neutro' ? cores.sobreTint : '#FFFFFF'}
            />
          </View>
        ) : null}
        <View style={estilos.flexivel}>
          <Text
            style={[
              comIcone
                ? texto(14.5, 700, { altura: 1.25 })
                : texto(15, 700, { altura: 1.25, tracking: -0.01 }),
              { color: cheia },
            ]}
          >
            {titulo}
          </Text>
          {corpo ? (
            <Text
              style={[
                comEspaco(
                  comIcone ? texto(12.5, 500, { altura: 1.4 }) : texto(13, 500, { altura: 1.45 }),
                  { topo: comIcone ? 3 : 5 },
                ),
                { color: cores.tinta2 },
              ]}
            >
              {corpo}
            </Text>
          ) : null}
        </View>
        {chevron ? (
          <Icone nome="chevron" tamanho={TAMANHO_VIDRO.chevron} cor={cores.tinta3} />
        ) : null}
      </View>
      {acao ? (
        <BotaoInline
          rotulo={acao.rotulo}
          aoTocar={acao.aoTocar}
          variante={acao.variante ?? (tom === 'neutro' ? 'vidro' : 'tint')}
          estilo={estilos.acaoBloco}
        />
      ) : null}
    </>
  );

  const caixa: StyleProp<ViewStyle> = [
    estilos.bloco,
    comIcone ? estilos.padBlocoIcone : estilos.padBlocoTexto,
    { backgroundColor: suave, borderColor: cores.borda },
    estilo,
  ];

  if (!aoTocar) return <View style={caixa}>{conteudo}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[titulo, corpo].filter(Boolean).join('. ')}
      onPress={aoTocar}
      style={({ pressed }) => [caixa, { opacity: pressed ? 0.86 : 1 }]}
    >
      {conteudo}
    </Pressable>
  );
}

/* ── Faixa de status ──────────────────────────────────────────────────── */

export type TipoDeFaixaVidro = 'pausado' | 'atraso' | 'pendente' | 'marcada';

/** Tom de cada faixa, na ordem de prioridade do handoff. */
const TOM_DA_FAIXA: Record<TipoDeFaixaVidro, TomDeStatus> = {
  pausado: 'neutro',
  atraso: 'vermelho',
  pendente: 'ambar',
  marcada: 'verde',
};

/** Prioridade do handoff: só uma faixa por linha, a primeira que existir. */
export const PRIORIDADE_DA_FAIXA: readonly TipoDeFaixaVidro[] = [
  'pausado',
  'atraso',
  'pendente',
  'marcada',
];

/** Pílula de 21px com o estado do aluno. Fundo suave, texto na cor cheia. */
export function FaixaStatus({
  tipo,
  texto: rotulo,
  estilo,
}: {
  tipo: TipoDeFaixaVidro;
  texto: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const { suave, cheia } = coresDoTom(cores, TOM_DA_FAIXA[tipo]);
  // No tom neutro a cor cheia é a tinta de leitura; o handoff pede `ink2`.
  const tinta = tipo === 'pausado' ? cores.tinta2 : cheia;
  return (
    <View style={[estilos.faixa, { backgroundColor: suave }, estilo]}>
      <Text style={[TIPO_VIDRO.faixa, { color: tinta }]} numberOfLines={1}>
        {rotulo}
      </Text>
    </View>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────────── */

export type TamanhoDeAvatar = 62 | 48 | 44 | 40 | 38;

/**
 * `normal`, `baixo` (saldo ≤ 2) e `sem` (sem pacote) são a tabela do handoff.
 * `atraso`, `pago` e `perfil` vêm das listas do Financeiro e do cartão de
 * perfil de Ajustes, que usam o mesmo desenho com outra cor.
 */
export type EstadoDoAvatar = 'normal' | 'baixo' | 'sem' | 'atraso' | 'pago' | 'perfil';

const RAIO_DO_AVATAR: Record<TamanhoDeAvatar, number> = {
  62: RAIO_VIDRO.avatarFicha,
  48: RAIO_VIDRO.avatarPerfil,
  44: RAIO_VIDRO.avatar44,
  40: RAIO_VIDRO.avatar40,
  38: RAIO_VIDRO.avatar38,
};

/** Tamanho das iniciais por diâmetro, como no protótipo. */
const TIPO_DO_AVATAR: Record<TamanhoDeAvatar, number> = {
  62: 21,
  48: 16,
  44: 15,
  40: 14,
  38: 13,
};

/** Iniciais = primeira letra do primeiro nome + primeira do segundo. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const primeira = partes[0][0] ?? '';
  const segunda = partes.length > 1 ? (partes[1][0] ?? '') : '';
  return (primeira + segunda).toUpperCase();
}

export function Avatar({
  nome,
  texto: rotulo,
  estado = 'normal',
  tamanho = 44,
  estilo,
}: {
  /** nome completo — as iniciais saem daqui */
  nome?: string;
  /** iniciais prontas, quando quem chama já as tem */
  texto?: string;
  estado?: EstadoDoAvatar;
  tamanho?: TamanhoDeAvatar;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const par = {
    normal: { fundo: cores.tintSuave, tinta: cores.tint },
    baixo: { fundo: cores.ambarSuave, tinta: cores.ambar },
    sem: { fundo: cores.preenchimento, tinta: cores.tinta3 },
    atraso: { fundo: cores.vermelhoSuave, tinta: cores.vermelho },
    pago: { fundo: cores.verdeSuave, tinta: cores.verde },
    perfil: { fundo: cores.tint, tinta: cores.sobreTint },
  }[estado];

  return (
    <View
      // Decorativo: o nome do aluno já está na linha, em texto.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: tamanho,
          height: tamanho,
          borderRadius: RAIO_DO_AVATAR[tamanho],
          backgroundColor: par.fundo,
          alignItems: 'center',
          justifyContent: 'center',
        },
        estilo,
      ]}
    >
      <Text style={[texto(TIPO_DO_AVATAR[tamanho], 800, { tracking: -0.02 }), { color: par.tinta }]}>
        {rotulo ?? iniciais(nome ?? '')}
      </Text>
    </View>
  );
}

/* ── Medidores ────────────────────────────────────────────────────────── */

/**
 * Uma barra por aula do pacote: usadas em `preenchimento2`, restantes em
 * tint — âmbar quando o saldo está baixo. Decorativo: a informação está no
 * número do saldo e na linha "N de M usadas".
 */
export function MedidorPacote({
  total,
  usadas,
  baixo = false,
  estilo,
}: {
  total: number;
  usadas: number;
  baixo?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[estilos.medidor, estilo]}
    >
      {Array.from({ length: Math.max(0, total) }, (_, i) => (
        <View
          key={i}
          style={[
            estilos.barraMedidor,
            {
              backgroundColor:
                i < usadas ? cores.preenchimento2 : baixo ? cores.ambar : cores.tint,
            },
          ]}
        />
      ))}
    </View>
  );
}

export type SegmentoProporcional = { peso: number; tom: TomDeStatus; rotulo: string };

/**
 * Três segmentos proporcionais (aulas, reposições, faltas). Peso mínimo 1
 * para um segmento zerado ainda aparecer como fio de cor, como no handoff.
 */
export function BarraProporcional({
  segmentos,
  estilo,
}: {
  segmentos: readonly SegmentoProporcional[];
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  return (
    <View
      accessible
      accessibilityLabel={segmentos.map((s) => s.rotulo).join('. ')}
      style={[estilos.medidor, estilo]}
    >
      {segmentos.map((s, i) => (
        <View
          key={i}
          style={[
            estilos.barraMedidor,
            { flex: Math.max(1, s.peso), backgroundColor: coresDoTom(cores, s.tom).cheia },
          ]}
        />
      ))}
    </View>
  );
}

/* ── Cartão de resumo ─────────────────────────────────────────────────── */

/**
 * Um dos três cartões do topo do Financeiro: raio 19, rótulo em cima, valor
 * grande embaixo na cor do tom. Zero fica em `tinta3` — é o que o handoff
 * pede para não gritar um valor que não existe.
 */
export function CartaoResumo({
  rotulo,
  valor,
  tom = 'neutro',
  zerado = false,
  estilo,
}: {
  rotulo: string;
  valor: string;
  tom?: TomDeStatus;
  zerado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const cor = zerado ? cores.tinta3 : tom === 'neutro' ? cores.tinta : coresDoTom(cores, tom).cheia;
  return (
    <SuperficieVidro
      nivel="cartao"
      raio={RAIO_VIDRO.resumo}
      sombra
      style={[estilos.padResumo, estilo]}
    >
      <Text style={[texto(11, 600, { altura: 1.2 }), { color: cores.tinta2 }]} numberOfLines={2}>
        {rotulo}
      </Text>
      <Text
        style={[comEspaco(TIPO_VIDRO.resumo, { topo: 10 }), { color: cor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {valor}
      </Text>
    </SuperficieVidro>
  );
}

/* ── Estado vazio ─────────────────────────────────────────────────────── */

/** "Nenhum lançamento ainda." — centralizado dentro da lista agrupada. */
export function EstadoVazio({
  titulo,
  nota,
  estilo,
}: {
  titulo: string;
  nota?: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  return (
    <View style={[estilos.vazio, estilo]}>
      <Text style={[texto(13.5, 500, { altura: 1.5 }), estilos.centro, { color: cores.tinta2 }]}>
        {titulo}
      </Text>
      {nota ? (
        <Text
          style={[
            comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 5 }),
            estilos.centro,
            { color: cores.tinta3 },
          ]}
        >
          {nota}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  centro: { textAlign: 'center' },
  padCartao: { paddingVertical: 17, paddingHorizontal: 18 },
  padResumo: { flex: 1, paddingVertical: 14, paddingHorizontal: 13 },
  bloco: {
    borderRadius: RAIO_VIDRO.bloco,
    borderWidth: TAMANHO_VIDRO.bordaVidro,
  },
  padBlocoIcone: { paddingVertical: 15, paddingHorizontal: 16 },
  padBlocoTexto: { paddingVertical: 16, paddingHorizontal: 17 },
  linhaBloco: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconeBloco: {
    width: TAMANHO_VIDRO.iconeBloco,
    height: TAMANHO_VIDRO.iconeBloco,
    borderRadius: RAIO_VIDRO.iconeBloco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoBloco: { marginTop: 13 },
  faixa: {
    height: TAMANHO_VIDRO.faixaStatus,
    paddingHorizontal: 8,
    borderRadius: RAIO_VIDRO.faixa,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medidor: { flexDirection: 'row', gap: 4 },
  barraMedidor: { flex: 1, height: TAMANHO_VIDRO.medidor, borderRadius: RAIO_VIDRO.medidor },
  vazio: { paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center' },
});
