import type { TextStyle } from 'react-native';

/**
 * Satoshi em instâncias estáticas geradas do arquivo variável da Fontshare
 * (300–900). A família é escolhida pelo peso porque o React Native não
 * interpola eixos de fonte variável.
 */
export const FONTES = {
  400: 'Satoshi-Regular',
  500: 'Satoshi-Medium',
  600: 'Satoshi-Semibold',
  700: 'Satoshi-Bold',
  800: 'Satoshi-Extrabold',
} as const;

export type Peso = keyof typeof FONTES;

export const ARQUIVOS_DE_FONTE = {
  'Satoshi-Regular': require('../../assets/fonts/Satoshi-Regular.ttf'),
  'Satoshi-Medium': require('../../assets/fonts/Satoshi-Medium.ttf'),
  'Satoshi-Semibold': require('../../assets/fonts/Satoshi-Semibold.ttf'),
  'Satoshi-Bold': require('../../assets/fonts/Satoshi-Bold.ttf'),
  'Satoshi-Extrabold': require('../../assets/fonts/Satoshi-Extrabold.ttf'),
};

type Opcoes = {
  /** múltiplo do tamanho, como no CSS (ex.: 1.25) */
  altura?: number;
  /** em, como nos tokens (ex.: -0.02); convertido para pontos */
  tracking?: number;
  maiuscula?: boolean;
  /** números tabulares — ligado por padrão, é regra do projeto */
  tabular?: boolean;
};

/**
 * Tinta do glifo em `em`, lida dos TTFs em `assets/fonts` — os cinco pesos do
 * Satoshi têm a mesma métrica: ascendente 1.010 + descendente 0.240 = 1.25em
 * (a entrelinha de 0.100em é espaço, não tinta, e por isso fica de fora).
 *
 * O handoff é CSS, onde um `line-height` menor que a tinta apenas deixa o
 * glifo transbordar da linha. O React Native não faz isso: ele encaixa o
 * glifo na entrelinha, então `altura: 1` fica 0.25em curto e `altura: 0.9`
 * fica 0.35em — é daí que vinham números e letras cortados ou fora do centro
 * das caixas de altura fixa (contador do cartão, botões, chips, pílulas).
 */
const TINTA_EM = 1.25;

const arredonda = (v: number) => Math.round(v * 100) / 100;

/**
 * Constrói um TextStyle a partir da escala do handoff.
 *
 * A entrelinha nunca desce abaixo da tinta do glifo; o que sobra volta como
 * margem negativa simétrica, então a caixa continua ocupando no layout
 * exatamente a altura do protótipo (`tamanho × altura`) sem recortar o
 * desenho da letra. É o mesmo resultado do CSS, escrito do jeito que o React
 * Native entende.
 */
export function texto(tamanho: number, peso: Peso, o: Opcoes = {}): TextStyle {
  const caixa = arredonda(tamanho * (o.altura ?? 1));
  const linha = Math.max(caixa, arredonda(tamanho * TINTA_EM));
  const folga = arredonda((linha - caixa) / 2);

  const estilo: TextStyle = {
    fontFamily: FONTES[peso],
    fontSize: tamanho,
    lineHeight: linha,
    // O Android soma a font padding do arquivo por padrão, o que empurra o
    // texto para baixo dentro de caixas centralizadas. Desligar iguala o
    // Android ao iOS e à web.
    includeFontPadding: false,
  };
  if (folga > 0) {
    estilo.marginTop = -folga;
    estilo.marginBottom = -folga;
  }
  if (o.tracking) estilo.letterSpacing = arredonda(tamanho * o.tracking);
  if (o.maiuscula) estilo.textTransform = 'uppercase';
  if (o.tabular !== false) estilo.fontVariant = ['tabular-nums'];
  return estilo;
}

/**
 * Soma espaçamento vertical a um estilo de `texto()` preservando a folga da
 * métrica.
 *
 * Use isto no lugar de `{ marginTop: n }` solto no `style`: a margem escrita
 * direto sobrescreve a compensação de `texto()` e desalinha o glifo de novo.
 */
export function comEspaco(
  estilo: TextStyle,
  { topo = 0, base = 0 }: { topo?: number; base?: number },
): TextStyle {
  const atualTopo = typeof estilo.marginTop === 'number' ? estilo.marginTop : 0;
  const atualBase = typeof estilo.marginBottom === 'number' ? estilo.marginBottom : 0;
  return {
    ...estilo,
    marginTop: arredonda(atualTopo + topo),
    marginBottom: arredonda(atualBase + base),
  };
}

/**
 * Igual a `texto()`, mas sem a compensação de margem.
 *
 * A folga negativa de `texto()` é pensada para um `<Text>` em fluxo, onde a
 * caixa precisa ocupar exatamente a altura do protótipo. Dentro de um
 * `TextInput`, que tem altura própria e centraliza o conteúdo, essa margem
 * desloca o texto dentro do campo. Use isto — e só isto — em campo de
 * formulário.
 */
export function textoDeCampo(tamanho: number, peso: Peso, o: Opcoes = {}): TextStyle {
  const { marginTop: _t, marginBottom: _b, ...resto } = texto(tamanho, peso, o);
  return {
    ...resto,
    // O Android desenha o texto do campo colado no topo sem isto.
    paddingVertical: 0,
    textAlignVertical: 'center',
  };
}

/** Escala nomeada do README, para não repetir números soltos nas telas. */
export const TIPO = {
  heroi: texto(30, 800, { altura: 1, tracking: -0.04 }),
  tituloTela: texto(24, 600, { altura: 1.15, tracking: -0.02 }),
  tituloInterno: texto(22, 600, { altura: 1.2, tracking: -0.02 }),
  botao: texto(15.5, 600, { altura: 1 }),
  nome: texto(15, 600, { altura: 1.25 }),
  saldo: texto(15, 800, { altura: 1, tracking: -0.03 }),
  aba: texto(13, 600, { altura: 1, tracking: 0.01 }),
  corpo: texto(12.5, 400, { altura: 1.5 }),
  legenda: texto(12, 400, { altura: 1.4 }),
  nota: texto(11.5, 400, { altura: 1.55 }),
  eyebrow: texto(10, 600, { altura: 1, tracking: 0.18, maiuscula: true }),
  /**
   * Rótulo de campo e de seção (10px, 0.16em, caixa alta) — o do Fluxo A e o
   * dos cartões-lista. Criado pelo /designer: estava reescrito à mão em várias
   * telas, ou montado como `TIPO.eyebrow` com `letterSpacing: 1.6` por cima.
   */
  rotulo: texto(10, 600, { altura: 1, tracking: 0.16, maiuscula: true }),
  micro: texto(9, 600, { altura: 1, tracking: 0.16, maiuscula: true }),
} as const;

/**
 * `line-height: normal` do CSS para o Satoshi: ascendente 1.010 + descendente
 * 0.240 + entrelinha 0.100 (lidos dos TTFs). É o que o protótipo iOS Glass
 * usa onde a tabela de tipografia não dá entrelinha.
 */
const ALTURA_NORMAL = 1.35;

/**
 * Papéis tipográficos do iOS Glass (handoff-ios-glass/README.md, "Tipografia —
 * Satoshi"). Objeto separado do `TIPO` antigo porque há colisão de nomes
 * (`botao`); na Onda 4 este vira o `TIPO`. Tamanho em faixa no handoff
 * (resumo 21–34, título de bloco 14.5–15.5) fica no menor valor: para os
 * outros, chame `texto()` com o tamanho e o mesmo peso/tracking.
 */
export const TIPO_VIDRO = {
  tituloGrande: texto(34, 800, { altura: 1.05, tracking: -0.035 }),
  tituloEmpilhada: texto(29, 800, { altura: 1.1, tracking: -0.035 }),
  saldoResultado: texto(54, 800, { altura: ALTURA_NORMAL, tracking: -0.05 }),
  saldoCartao: texto(40, 800, { altura: ALTURA_NORMAL, tracking: -0.045 }),
  resumo: texto(21, 800, { altura: ALTURA_NORMAL, tracking: -0.04 }),
  tituloSheet: texto(16, 700, { altura: ALTURA_NORMAL, tracking: -0.015 }),
  tituloNav: texto(16.5, 700, { altura: ALTURA_NORMAL, tracking: -0.01 }),
  nomeLista: texto(16, 700, { altura: 1.2, tracking: -0.015 }),
  tituloBloco: texto(14.5, 700, { altura: ALTURA_NORMAL, tracking: -0.01 }),
  botao: texto(16.5, 700, { altura: ALTURA_NORMAL, tracking: -0.015 }),
  apoio: texto(13, 500, { altura: 1.3 }),
  textoBloco: texto(12.5, 500, { altura: 1.4 }),
  cabecalhoGrupo: texto(12, 600, { altura: ALTURA_NORMAL, tracking: 0.05, maiuscula: true }),
  /** rótulo dentro de cartão ("SALDO DO PACOTE", H§2) — mais fechado que o de grupo */
  rotuloCartao: texto(12, 600, { altura: ALTURA_NORMAL, tracking: 0.04, maiuscula: true }),
  faixa: texto(10.5, 700, { altura: ALTURA_NORMAL, tracking: 0.02 }),
  rotuloAba: texto(10.5, 700, { altura: ALTURA_NORMAL }),
} as const;
