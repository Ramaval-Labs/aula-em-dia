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

import { useCores, type CoresDoTema } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { ESCALA_FONTE, RAIO, TAMANHO } from '../tema/tokens';
import { useAnuncio } from './anunciar';
import { BotaoInline } from './Controles';
import { Icone, type NomeDeIcone } from './Icone';
import { SuperficieVidro } from './Vidro';

/* ── Cartão ───────────────────────────────────────────────────────────── */

/**
 * O cartão base: vidro, raio 22, padding 17 × 18. `raio` para o cartão de
 * contexto de H§7, que é 20.
 */
export function CartaoVidro({
  children,
  semPadding = false,
  raio = RAIO.cartao,
  estilo,
}: {
  children: React.ReactNode;
  /** desliga o padding para listas que se recortam na borda */
  semPadding?: boolean;
  raio?: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <SuperficieVidro
      nivel="cartao"
      raio={raio}
      sombra
      style={[semPadding ? null : estilos.padCartao, estilo]}
    >
      {children}
    </SuperficieVidro>
  );
}

/* ── Cartão de ajuste ─────────────────────────────────────────────────── */

/**
 * O cartão de controle da Política (H§9): título 14.5/700, sub-linha
 * opcional em `tinta2` e o controle à direita (`direita`: switch, stepper) ou
 * embaixo (`children`: segmentado, fichas, grade). Padding `16 17`.
 *
 * É o molde de toda configuração do app — Política, onboarding, sub-telas de
 * Ajustes, pacote, pagamento e lembrete.
 */
export function CartaoDeAjuste({
  titulo,
  subtitulo,
  direita,
  children,
  estilo,
}: {
  titulo: string;
  subtitulo?: string;
  /** controle na mesma linha do título (switch, stepper) */
  direita?: React.ReactNode;
  /** controle abaixo do título (segmentado, fichas), 12px abaixo */
  children?: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  return (
    <CartaoVidro estilo={[estilos.padAjuste, estilo]}>
      <View style={estilos.linhaAjuste}>
        <View style={estilos.flexivel}>
          <Text style={[texto(14.5, 700, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta }]}>
            {titulo}
          </Text>
          {subtitulo ? (
            <Text
              style={[
                comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 3 }),
                { color: cores.tinta2 },
              ]}
            >
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {direita}
      </View>
      {children ? <View style={estilos.corpoAjuste}>{children}</View> : null}
    </CartaoVidro>
  );
}

/* ── Cor de status ────────────────────────────────────────────────────── */

export type TomDeStatus = 'neutro' | 'tint' | 'vermelho' | 'ambar' | 'verde';

/**
 * Trio de cada tom: fundo suave, cor cheia (barra, medidor, ícone) e cor de
 * **texto** (`*Texto`, que passa 4.5:1 sobre o suave — tokens.ts). `neutro`
 * não tem cor cheia.
 */
export function coresDoTom(cores: CoresDoTema['cores'], tom: TomDeStatus) {
  switch (tom) {
    case 'tint':
      return { suave: cores.tintSuave, cheia: cores.tint, texto: cores.tint };
    case 'vermelho':
      return { suave: cores.vermelhoSuave, cheia: cores.vermelho, texto: cores.vermelhoTexto };
    case 'ambar':
      return { suave: cores.ambarSuave, cheia: cores.ambar, texto: cores.ambarTexto };
    case 'verde':
      return { suave: cores.verdeSuave, cheia: cores.verde, texto: cores.verdeTexto };
    default:
      return { suave: cores.preenchimento, cheia: cores.tinta, texto: cores.tinta };
  }
}

/* ── Bloco de status ──────────────────────────────────────────────────── */

/**
 * O aviso de uma linha e meia das telas 2, 5 e 9: fundo suave do tom, título
 * na cor de texto do tom, texto em `tinta2`.
 *
 * Com ícone o handoff aperta o bloco (padding 15 × 16, título 14.5); só com
 * texto ele respira (16 × 17, título 15 e texto 13). O `acao` vira botão
 * inline com 13px de folga acima.
 *
 * `vivo`: o bloco é uma resposta a um gesto (o aviso de impacto da Política)
 * e se anuncia — live region no Android, `announceForAccessibility` no iOS.
 */
export function BlocoStatus({
  tom = 'neutro',
  titulo,
  texto: corpo,
  icone,
  acao,
  aoTocar,
  chevron = false,
  vivo = false,
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
  /** anuncia o bloco quando ele aparece ou muda */
  vivo?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const { suave, cheia, texto: corDoTitulo } = coresDoTom(cores, tom);
  useAnuncio(vivo ? [titulo, corpo].filter(Boolean).join('. ') : undefined, true);
  const comIcone = !!icone;

  const conteudo = (
    <>
      <View style={estilos.linhaBloco}>
        {icone ? (
          <View style={[estilos.iconeBloco, { backgroundColor: cheia }]}>
            <Icone
              nome={icone}
              tamanho={TAMANHO.glifoBloco}
              cor={tom === 'neutro' ? cores.sobreTint : cores.sobreCor}
            />
          </View>
        ) : null}
        <View style={estilos.flexivel}>
          <Text
            style={[
              comIcone
                ? texto(14.5, 700, { altura: 1.25 })
                : texto(15, 700, { altura: 1.25, tracking: -0.01 }),
              { color: corDoTitulo },
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
          <Icone nome="chevron" tamanho={TAMANHO.chevron} cor={cores.tinta3} />
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

  if (!aoTocar) {
    return (
      <View accessibilityLiveRegion={vivo ? 'polite' : undefined} style={caixa}>
        {conteudo}
      </View>
    );
  }
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

/* ── Cartão de débito ─────────────────────────────────────────────────── */

export type TomDoDebito = 'vermelho' | 'verde' | 'neutro';

/**
 * O cartão de valor de H§7: rótulo em caixa alta, valor grande (32/800) à
 * esquerda, notas ou um par rótulo/valor à direita e, depois do fio, os pares
 * da dívida (`linhas`) ou uma nota (`children`). Raio 22, padding 18.
 *
 * - `vermelho`/`verde`: fundo suave do status com o valor na cor cheia
 *   (Cobrança em atraso, pagamento em dia);
 * - `neutro`: cartão de vidro com o valor em `tinta` (em aberto, e o resumo
 *   do sheet Registrar pagamento).
 */
export function CartaoDeDebito({
  tom = 'vermelho',
  rotulo,
  valor,
  notas,
  direita,
  linhas,
  children,
  estilo,
}: {
  tom?: TomDoDebito;
  rotulo: string;
  /** já formatado em pt-BR */
  valor: string;
  /** texto à direita do valor, alinhado à direita ("Pacote de 8\nvenceu 12/08") */
  notas?: string;
  /** peça própria à direita, no lugar de `notas` */
  direita?: React.ReactNode;
  linhas?: readonly { rotulo: string; valor: string }[];
  /** conteúdo depois do fio, no lugar de `linhas` */
  children?: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores, material } = useCores();
  const { suave, texto: corDoValor } = coresDoTom(cores, tom);
  const neutro = tom === 'neutro';

  const miolo = (
    <>
      <View style={estilos.linhaDebito}>
        <View style={estilos.flexivel}>
          <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>{rotulo}</Text>
          <Text
            style={[
              comEspaco(texto(32, 800, { tracking: -0.045 }), { topo: 9 }),
              { color: neutro ? cores.tinta : corDoValor },
            ]}
          >
            {valor}
          </Text>
        </View>
        {direita ??
          (notas ? (
            <Text
              style={[texto(12, 500, { altura: 1.5 }), estilos.aDireita, { color: cores.tinta2 }]}
            >
              {notas}
            </Text>
          ) : null)}
      </View>

      {linhas?.length || children ? (
        <View style={[estilos.separadorDebito, { borderTopColor: cores.fio }]}>
          {linhas?.map((l) => (
            <View key={l.rotulo} style={estilos.parDebito}>
              <Text style={[texto(13, 500, { altura: 1.35 }), { color: cores.tinta2 }]}>
                {l.rotulo}
              </Text>
              <Text style={[texto(13, 700, { altura: 1.35 }), { color: cores.tinta }]}>
                {l.valor}
              </Text>
            </View>
          ))}
          {children}
        </View>
      ) : null}
    </>
  );

  if (neutro) {
    return (
      <SuperficieVidro
        nivel="cartao"
        raio={RAIO.cartao}
        sombra
        style={[estilos.padDebito, estilo]}
      >
        {miolo}
      </SuperficieVidro>
    );
  }
  return (
    <View
      style={[
        estilos.debito,
        { backgroundColor: suave, borderColor: cores.borda, boxShadow: material.gin },
        estilo,
      ]}
    >
      {miolo}
    </View>
  );
}

/* ── Faixa de status ──────────────────────────────────────────────────── */

export type TipoDeFaixa = 'pausado' | 'atraso' | 'pendente' | 'marcada';

/** Tom de cada faixa, na ordem de prioridade do handoff. */
const TOM_DA_FAIXA: Record<TipoDeFaixa, TomDeStatus> = {
  pausado: 'neutro',
  atraso: 'vermelho',
  pendente: 'ambar',
  marcada: 'verde',
};

/** Prioridade do handoff: só uma faixa por linha, a primeira que existir. */
export const PRIORIDADE_DA_FAIXA: readonly TipoDeFaixa[] = [
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
  tipo: TipoDeFaixa;
  texto: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const { suave, texto: corDoTexto } = coresDoTom(cores, TOM_DA_FAIXA[tipo]);
  // No tom neutro a cor de texto é a tinta de leitura; o handoff pede `ink2`.
  const tinta = tipo === 'pausado' ? cores.tinta2 : corDoTexto;
  return (
    <View style={[estilos.faixa, { backgroundColor: suave }, estilo]}>
      <Text
        style={[TIPO.faixa, { color: tinta }]}
        numberOfLines={1}
        maxFontSizeMultiplier={ESCALA_FONTE.compacta}
      >
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
  62: RAIO.avatarFicha,
  48: RAIO.avatarPerfil,
  44: RAIO.avatar44,
  40: RAIO.avatar40,
  38: RAIO.avatar38,
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
  const { cores } = useCores();
  const par = {
    normal: { fundo: cores.tintSuave, tinta: cores.tint },
    // As iniciais são texto sobre o suave: cor de texto do tom.
    baixo: { fundo: cores.ambarSuave, tinta: cores.ambarTexto },
    sem: { fundo: cores.preenchimento, tinta: cores.tinta3 },
    atraso: { fundo: cores.vermelhoSuave, tinta: cores.vermelhoTexto },
    pago: { fundo: cores.verdeSuave, tinta: cores.verdeTexto },
    perfil: { fundo: cores.tint, tinta: cores.sobreTint },
  }[estado];

  return (
    <View
      // Decorativo: o nome do aluno já está na linha, em texto.
      aria-hidden
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
 * Uma barra por unidade, 7px, raio 4, vão 4 (medidor de pacote de H§2).
 *
 * - `saldo` (padrão): as `usadas` primeiro, em `preenchimento2`; as restantes
 *   em tint — âmbar quando `baixo`. É o medidor do pacote.
 * - `progresso`: as `usadas` primeiro, em tint (âmbar quando `baixo`); o
 *   resto em `preenchimento2`. Serve os passos do onboarding e as vagas do
 *   plano gratuito.
 *
 * Decorativo: a informação está no número ao lado ("N de M usadas", "Passo N
 * de 4").
 */
export function MedidorPacote({
  total,
  usadas,
  baixo = false,
  variante = 'saldo',
  estilo,
}: {
  total: number;
  /** quantas barras, a partir da esquerda, estão no primeiro estado */
  usadas: number;
  baixo?: boolean;
  variante?: 'saldo' | 'progresso';
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const cheia = baixo ? cores.ambar : cores.tint;
  const [primeiras, resto] =
    variante === 'saldo' ? [cores.preenchimento2, cheia] : [cheia, cores.preenchimento2];
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[estilos.medidor, estilo]}
    >
      {Array.from({ length: Math.max(0, total) }, (_, i) => (
        <View
          key={i}
          style={[estilos.barraMedidor, { backgroundColor: i < usadas ? primeiras : resto }]}
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
  const { cores } = useCores();
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
  /** já formatado em pt-BR e **sem centavos**, como no handoff */
  valor: string;
  tom?: TomDeStatus;
  zerado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const cor = zerado ? cores.tinta3 : tom === 'neutro' ? cores.tinta : coresDoTom(cores, tom).texto;
  return (
    <SuperficieVidro
      nivel="cartao"
      raio={RAIO.resumo}
      sombra
      style={[estilos.padResumo, estilo]}
    >
      <Text style={[texto(11, 600, { altura: 1.2 }), { color: cores.tinta2 }]} numberOfLines={2}>
        {rotulo}
      </Text>
      {/* Uma linha sempre: são três cartões lado a lado e o handoff formata
          o valor sem centavos ("R$ 1.280"). Valor comprido encolhe no
          aparelho (`adjustsFontSizeToFit`); no web ele corta, porque o
          react-native-web não implementa o encolhimento. */}
      <Text
        style={[comEspaco(TIPO.resumo, { topo: 10 }), { color: cor }]}
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
  const { cores } = useCores();
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
  padAjuste: { paddingVertical: 16, paddingHorizontal: 17 },
  aDireita: { textAlign: 'right' },
  padDebito: { padding: 18 },
  debito: {
    borderRadius: RAIO.cartao,
    borderWidth: TAMANHO.bordaVidro,
    padding: 18,
  },
  linhaDebito: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  separadorDebito: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: TAMANHO.bordaVidro,
    gap: 8,
  },
  parDebito: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  linhaAjuste: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  corpoAjuste: { marginTop: 12 },
  padResumo: { flex: 1, paddingVertical: 14, paddingHorizontal: 13 },
  bloco: {
    borderRadius: RAIO.bloco,
    borderWidth: TAMANHO.bordaVidro,
  },
  padBlocoIcone: { paddingVertical: 15, paddingHorizontal: 16 },
  padBlocoTexto: { paddingVertical: 16, paddingHorizontal: 17 },
  linhaBloco: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconeBloco: {
    width: TAMANHO.iconeBloco,
    height: TAMANHO.iconeBloco,
    borderRadius: RAIO.iconeBloco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoBloco: { marginTop: 13 },
  faixa: {
    minHeight: TAMANHO.faixaStatus,
    paddingHorizontal: 8,
    borderRadius: RAIO.faixa,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medidor: { flexDirection: 'row', gap: 4 },
  barraMedidor: { flex: 1, height: TAMANHO.medidor, borderRadius: RAIO.medidor },
  vazio: { paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center' },
});
