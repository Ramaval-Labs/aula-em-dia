/**
 * Tokens do "Aula em Dia" — direção iOS Glass (handoff-ios-glass/README.md,
 * seção "Design Tokens"). Espelho tipado de tokens/tokens.json; o teste
 * `tema/__tests__/tokens.test.ts` pega o descuido de mudar um lado só.
 * Não inventar valores aqui: todo número e toda cor vêm do handoff, e o que
 * é derivado diz isso no comentário.
 */

export type NomeDeCor =
  /** fundo do aparelho (--tela) */
  | 'tela'
  /** títulos e texto de leitura (--ink) */
  | 'tinta'
  /** texto de apoio (--ink2) */
  | 'tinta2'
  /** legenda, cabeçalho de grupo, chevron (--ink3) */
  | 'tinta3'
  /** separador (--hair) */
  | 'fio'
  /** miolo de cartão (--card) */
  | 'cartao'
  /** barras e toast (--glass) */
  | 'vidro'
  /** botão secundário, segmento ativo (--glass2) */
  | 'vidro2'
  /** painel do sheet (--sheet) */
  | 'sheet'
  /** borda de vidro (--edge) */
  | 'borda'
  /** reflexo de topo (--edgeTop) */
  | 'bordaTopo'
  /** trilho, hover, bloco neutro (--fill) */
  | 'preenchimento'
  /** aula usada, botão desabilitado (--fill2) */
  | 'preenchimento2'
  /** destaque do sistema (--tint) */
  | 'tint'
  /** fundo de seleção, avatar (--tintSoft) */
  | 'tintSuave'
  /** sombra do primário (--tintSh) */
  | 'tintSombra'
  /** texto sobre o destaque (--onTint) */
  | 'sobreTint'
  | 'vermelho'
  | 'vermelhoSuave'
  | 'ambar'
  | 'ambarSuave'
  | 'verde'
  | 'verdeSuave'
  /**
   * Status como **texto** (título de bloco, faixa, valor, delta, saldo baixo).
   * A cor cheia (`ambar`, `verde`, `vermelho`) fica para barra, medidor,
   * preenchimento e ícone; como texto ela não passa 4.5:1 no claro sobre o
   * próprio `*Suave` com as manchas por trás (1.8–2.4:1). Sem handoff: valores
   * na mesma matiz, escurecidos até o pior caso passar. Contas no fim de
   * `CORES`.
   */
  | 'ambarTexto'
  | 'verdeTexto'
  | 'vermelhoTexto'
  | 'sombra'
  /**
   * glifo sobre cor cheia — o check do Resultado sobre verde e o glifo do
   * ícone de bloco de status. Handoff: "glifo branco", nos dois temas; no
   * escuro o branco sobre verde/âmbar claros fica em 1.6–1.9:1, então lá ele é
   * o `sobreTint` escuro (#0B1524: 9.8:1 no verde, 11.4:1 no âmbar, 6.2:1 no
   * vermelho). No claro continua branco.
   */
  | 'sobreCor'
  /** botão do switch ("círculo branco", nos dois temas) */
  | 'botaoSwitch'
  /** véu sob o sheet aberto (`rgba(6,10,20,.4)`, nos dois temas) */
  | 'veuSheet'
  /** manchas do fundo de refração (--m1 a --m4) */
  | 'mancha1'
  | 'mancha2'
  | 'mancha3'
  | 'mancha4';

export type Paleta = Record<NomeDeCor, string>;

/**
 * Cor do iOS Glass. `--glassA` (.62) já está multiplicado: `--card` é
 * .62 × .9 = .558, `--glass` é .62 × .82 = .5084 no claro e .62 × .8 = .496
 * no escuro.
 */
export const CORES: { claro: Paleta; escuro: Paleta } = {
  claro: {
    tela: '#E9EEF7',
    tinta: '#0B1220',
    tinta2: 'rgba(11,18,32,0.72)',
    tinta3: 'rgba(11,18,32,0.62)',
    fio: 'rgba(11,18,32,0.085)',
    cartao: 'rgba(255,255,255,0.558)',
    vidro: 'rgba(255,255,255,0.5084)',
    vidro2: 'rgba(255,255,255,0.7)',
    sheet: 'rgba(244,247,252,0.62)',
    borda: 'rgba(255,255,255,0.88)',
    bordaTopo: 'rgba(255,255,255,1)',
    preenchimento: 'rgba(118,138,178,0.15)',
    preenchimento2: 'rgba(118,138,178,0.26)',
    tint: '#35577D',
    tintSuave: 'rgba(53,87,125,0.14)',
    tintSombra: 'rgba(53,87,125,0.34)',
    sobreTint: '#FFFFFF',
    vermelho: '#DE203A',
    vermelhoSuave: 'rgba(222,32,58,0.12)',
    ambar: '#C07C00',
    ambarSuave: 'rgba(224,150,0,0.16)',
    verde: '#158A61',
    verdeSuave: 'rgba(21,138,97,0.13)',
    ambarTexto: '#6C4500',
    verdeTexto: '#0D563C',
    vermelhoTexto: '#8E1425',
    sombra: 'rgba(9,15,30,0.13)',
    sobreCor: '#FFFFFF',
    botaoSwitch: '#FFFFFF',
    veuSheet: 'rgba(6,10,20,0.4)',
    mancha1: '#8FB6FF',
    mancha2: '#FFD6A5',
    mancha3: '#CDB8FF',
    mancha4: '#9FE3D0',
  },
  escuro: {
    tela: '#06080F',
    tinta: '#F4F7FC',
    tinta2: 'rgba(244,247,252,0.78)',
    tinta3: 'rgba(244,247,252,0.64)',
    fio: 'rgba(255,255,255,0.1)',
    cartao: 'rgba(26,34,52,0.558)',
    vidro: 'rgba(38,48,70,0.496)',
    vidro2: 'rgba(52,64,90,0.66)',
    sheet: 'rgba(20,26,42,0.6)',
    borda: 'rgba(255,255,255,0.24)',
    bordaTopo: 'rgba(255,255,255,0.5)',
    preenchimento: 'rgba(255,255,255,0.08)',
    preenchimento2: 'rgba(255,255,255,0.15)',
    tint: '#9FBEDF',
    tintSuave: 'rgba(159,190,223,0.2)',
    tintSombra: 'rgba(0,0,0,0.45)',
    sobreTint: '#0B1524',
    vermelho: '#FF5F72',
    vermelhoSuave: 'rgba(255,95,114,0.16)',
    ambar: '#FFC24D',
    ambarSuave: 'rgba(255,194,77,0.16)',
    verde: '#33D69F',
    verdeSuave: 'rgba(51,214,159,0.15)',
    ambarTexto: '#FFC24D',
    verdeTexto: '#33D69F',
    vermelhoTexto: '#FF7A8A',
    sombra: 'rgba(0,0,0,0.5)',
    sobreCor: '#0B1524',
    botaoSwitch: '#FFFFFF',
    veuSheet: 'rgba(6,10,20,0.4)',
    mancha1: '#1B3A80',
    mancha2: '#5C3A16',
    mancha3: '#3A2C73',
    mancha4: '#164A45',
  },
};

/*
 * Contraste dos tokens `*Texto` (WCAG 2, 4.5:1 para texto normal).
 *
 * Pior caso: o texto sobre o `*Suave` composto **direto** sobre o fundo de
 * refração (bloco de status fora de cartão), sobre o `*Suave` dentro de um
 * `cartao`, sobre o `cartao` e sobre o fundo, com o campo das quatro manchas
 * amostrado de 6 em 6px na área visível de 390 × 844 (entre a barra de 94px e
 * a tab bar). No claro o pior ponto é a mancha azul (mancha1).
 *
 *   claro   ambarTexto    #6C4500  pior 4.53 · sobre cartão/tela 7.90 · suave em cartão 6.93
 *           verdeTexto    #0D563C  pior 4.51 · sobre cartão/tela 8.14 · suave em cartão 6.95
 *           vermelhoTexto #8E1425  pior 4.56 · sobre cartão/tela 8.63 · suave em cartão 7.17
 *           (as cheias: âmbar 1.84, verde 2.25, vermelho 2.37 no mesmo pior caso)
 *   escuro  ambarTexto    #FFC24D  pior 6.16 (= ambar)
 *           verdeTexto    #33D69F  pior 5.56 (= verde)
 *           vermelhoTexto #FF7A8A  pior 4.59 — o `vermelho` cheio #FF5F72 fica em
 *                                  3.89 sobre o próprio suave, então clareia um degrau
 */

/** Tints do BlurView que o expo-blur aceita e que usamos. */
export type TintDoDesfoque = 'systemUltraThinMaterialLight' | 'systemUltraThinMaterialDark';

export type Material = {
  /**
   * `intensity` do BlurView (0–100). Conversão: px do `--bf` × 5.
   *
   * É o inverso da própria conta do expo-blur no web
   * (`blur(intensity × 0.2 px)`), então 16px → 80 e 18px → 90. No iOS o
   * número vira a fração da animação do UIVisualEffectView (0.8/0.9 do
   * material cheio); no Android vira raio `intensity / blurReductionFactor`
   * (padrão 4) → 20/22.5. É ponto de partida: calibrar no aparelho.
   */
  intensidade: number;
  /**
   * `tint` do BlurView. O "ultra thin" é o material de sistema mais leve e o
   * que mais preserva a cor de trás (blur baixo, saturação alta, como pede o
   * handoff); o miolo translúcido de cada nível vai por cima dele.
   */
  tintDesfoque: TintDoDesfoque;
  /**
   * Android: o overlay de cor do tint cresce com `intensity` e somaria um
   * segundo miolo ao nosso. Por isso lá a intensidade é baixa e o
   * `blurReductionFactor` também, mantendo o mesmo raio (intensidade ÷
   * redução = 20 no claro, 22.5 no escuro) com menos véu por cima.
   */
  intensidadeAndroid: number;
  reducaoAndroid: number;
  /** `--bf` literal, aplicado como `backdropFilter` no web. */
  filtroWeb: string;
  /** `--bfRim` literal (anel da tab bar). Referência: o anel aproximado não o aplica. */
  filtroAnelWeb: string;
  /** `--gin`: reflexo especular interno (sombras inset). */
  gin: string;
  /** `--gsh`: sombra de contato + difusa. */
  gsh: string;
  /** opacidade do fundo de refração */
  opacidadeFundo: number;
  /** sombra externa da tab bar (sem o `gin`, que a primitiva soma) */
  sombraTabBar: string;
  /** sombra externa do painel do sheet (sem o `gin`) */
  sombraSheet: string;
  /** sombra externa do toast: `0 16px 38px --sombra` (sem o `gin`) */
  sombraToast: string;
  /** sombra do botão do switch */
  sombraBotaoSwitch: string;
  /**
   * Alfa somado ao miolo quando não há blur (fallback). Sem handoff: sem
   * desfoque o que está atrás fica nítido e compete com o texto, então o
   * miolo engrossa para manter a leitura.
   */
  alfaExtraFallback: number;
  /**
   * Anel de refração aproximado (tab bar), sem a máscara do CSS — o handoff
   * manda não reimplementá-la em nativo. Sombra inset com espalhamento e
   * desfoque: uma moldura clara que some para dentro em ~9px (o `padding` do
   * anel), mais um fio de luz no topo. Borda dura desenhava um segundo
   * contorno por dentro da barra.
   */
  anel: string;
};

const GIN_CLARO =
  'inset 0px 1.4px 0.8px -0.7px rgba(255,255,255,0.98), ' +
  'inset 0px -1.4px 0.8px -0.7px rgba(255,255,255,0.66), ' +
  'inset 1.4px 0px 0.8px -0.7px rgba(255,255,255,0.6), ' +
  'inset -1.4px 0px 0.8px -0.7px rgba(255,255,255,0.6), ' +
  'inset 0px 0px 14px 5px rgba(255,255,255,0.16)';

const GIN_ESCURO =
  'inset 0px 1.4px 0.8px -0.7px rgba(255,255,255,0.6), ' +
  'inset 0px -1.4px 0.8px -0.7px rgba(255,255,255,0.26), ' +
  'inset 1.4px 0px 0.8px -0.7px rgba(255,255,255,0.22), ' +
  'inset -1.4px 0px 0.8px -0.7px rgba(255,255,255,0.22), ' +
  'inset 0px 0px 16px 5px rgba(255,255,255,0.07)';

export const MATERIAL: { claro: Material; escuro: Material } = {
  claro: {
    intensidade: 80,
    tintDesfoque: 'systemUltraThinMaterialLight',
    intensidadeAndroid: 32,
    reducaoAndroid: 1.6,
    filtroWeb: 'blur(16px) saturate(190%) brightness(1.08)',
    filtroAnelWeb: 'blur(9px) saturate(300%) brightness(1.2)',
    gin: GIN_CLARO,
    gsh: '0px 10px 28px rgba(9,15,30,0.13), 0px 1px 2px rgba(9,15,30,0.05)',
    opacidadeFundo: 0.85,
    sombraTabBar: '0px 16px 40px rgba(9,15,30,0.13), 0px 2px 6px rgba(9,15,30,0.08)',
    sombraSheet: '0px -18px 50px rgba(6,10,20,0.32)',
    sombraToast: '0px 16px 38px rgba(9,15,30,0.13)',
    sombraBotaoSwitch: '0px 2px 6px rgba(9,15,30,0.28)',
    alfaExtraFallback: 0.22,
    anel: 'inset 0px 0px 6px 3px rgba(255,255,255,0.5), inset 0px 1px 0px 0px rgba(255,255,255,0.9)',
  },
  escuro: {
    intensidade: 90,
    tintDesfoque: 'systemUltraThinMaterialDark',
    intensidadeAndroid: 36,
    reducaoAndroid: 1.6,
    filtroWeb: 'blur(18px) saturate(175%) brightness(1.12)',
    filtroAnelWeb: 'blur(10px) saturate(240%) brightness(1.3)',
    gin: GIN_ESCURO,
    gsh: '0px 12px 32px rgba(0,0,0,0.5), 0px 1px 2px rgba(0,0,0,0.3)',
    opacidadeFundo: 0.6,
    sombraTabBar: '0px 16px 40px rgba(0,0,0,0.5), 0px 2px 6px rgba(9,15,30,0.08)',
    sombraSheet: '0px -18px 50px rgba(6,10,20,0.32)',
    sombraToast: '0px 16px 38px rgba(0,0,0,0.5)',
    sombraBotaoSwitch: '0px 2px 6px rgba(9,15,30,0.28)',
    alfaExtraFallback: 0.28,
    anel: 'inset 0px 0px 6px 3px rgba(255,255,255,0.12), inset 0px 1px 0px 0px rgba(255,255,255,0.4)',
  },
};

/**
 * Quatro gradientes radiais do fundo de refração, na ordem do handoff.
 * `raio` e `centro` em fração da tela; `fim` é onde a cor chega a zero.
 */
export const FUNDO_REFRACAO = [
  { mancha: 'mancha1', raioX: 0.58, raioY: 0.44, centroX: 0.14, centroY: 0.06, fim: 0.7 },
  { mancha: 'mancha2', raioX: 0.52, raioY: 0.4, centroX: 0.96, centroY: 0.14, fim: 0.68 },
  { mancha: 'mancha3', raioX: 0.64, raioY: 0.46, centroX: 0.82, centroY: 0.92, fim: 0.72 },
  { mancha: 'mancha4', raioX: 0.5, raioY: 0.34, centroX: 0.08, centroY: 0.74, fim: 0.7 },
] as const satisfies readonly {
  mancha: NomeDeCor;
  raioX: number;
  raioY: number;
  centroX: number;
  centroY: number;
  fim: number;
}[];

/** Raios do sistema, por papel (handoff, "Raios do sistema" e Componentes). */
export const RAIO = {
  aparelho: 48,
  sheet: 40,
  tabBar: 26,
  iconeResultado: 26,
  cartao: 22,
  pilulaAba: 21,
  avatarFicha: 21,
  bloco: 20,
  escolha: 20,
  toast: 20,
  resumo: 19,
  botao: 18,
  botaoCompacto: 17,
  avatarPerfil: 17,
  avatar44: 15,
  avatar40: 14,
  avatar38: 13,
  botaoInline: 13,
  trilho: 12,
  iconeBloco: 12,
  /** trilho do segmentado embutido em linha de lista (30px) */
  trilhoLinha: 11,
  saldoLinha: 10,
  segmento: 9,
  iconeToast: 9,
  /** segmento do segmentado embutido em linha de lista */
  segmentoLinha: 8.5,
  /** ficha de escolha múltipla (derivada: raio do botão inline) */
  ficha: 13,
  /** caixa de valor lido dentro de cartão (derivada: raio do botão inline) */
  caixaValor: 13,
  faixa: 7,
  selo: 6,
  medidor: 4,
  puxador: 3,
  circulo: 999,
} as const;

export const TAMANHO = {
  barraNav: 94,
  tituloNav: 44,
  tabBar: 66,
  itemAba: 56,
  margemTabBar: 14,
  baseTabBar: 26,
  padTopoRaiz: 54,
  padTopoEmpilhada: 100,
  padBaixoConteudo: 126,
  padLateral: 16,
  botaoPrimario: 54,
  botaoSecundario: 52,
  botaoCompacto: 50,
  botaoInline: 40,
  botaoTexto: 46,
  cabecalhoSheet: 52,
  /** fração da altura da tela */
  alturaSheet: 0.88,
  /** fração da altura da tela (sheet de resultado) */
  alturaResultado: 0.74,
  toastBase: 106,
  switchLargura: 52,
  switchAltura: 32,
  alvoMinimo: 44,
  abaToque: 48,
  /** borda de vidro (.5px) */
  bordaVidro: 0.5,

  /* linhas de lista agrupada (altura mínima) */
  linhaAluno: 76,
  /** linha de aluno dentro do sheet Registrar */
  linhaEscolhaAluno: 68,
  /** linha de cobrança do Financeiro */
  linhaCobranca: 66,
  /** linha de Ajustes, com sub-linha longa */
  linhaAjustes: 64,
  /** linha de lista padrão (ação, extrato) */
  linhaLista: 62,
  /** linha do grupo APP em Ajustes (H§8) */
  linhaApp: 58,
  /** coluna de data do extrato */
  colunaData: 38,

  /* avatares, por diâmetro */
  avatar62: 62,
  avatar48: 48,
  avatar44: 44,
  avatar40: 40,
  avatar38: 38,

  /* peças pequenas */
  faixaStatus: 21,
  selo: 19,
  /** barra do medidor de pacote e da barra proporcional */
  medidor: 7,
  /** quadrado do ícone de bloco de status */
  iconeBloco: 34,
  /** glifo dentro do ícone de bloco */
  glifoBloco: 17,
  chevron: 14,
  /** chevron do botão voltar ("Chrome comum") */
  chevronVoltar: 19,
  /** ícone de mais dentro do botão primário */
  iconeMais: 19,
  /** marca redonda do cartão de escolha */
  marcaEscolha: 24,
  /** check dentro da marca */
  checkEscolha: 14,
  /** ícone da tab bar */
  iconeAba: 23,
  /** quadrado do check do toast */
  iconeToast: 26,

  /* controles */
  segmentoFiltro: 34,
  segmentoCartao: 36,
  segmentoLinha: 30,
  stepperBotaoLargura: 38,
  stepperBotaoAltura: 34,
  switchBotao: 27,
  /** trilho do campo de texto (derivado: escala do botão compacto) */
  campo: 50,
  /** ficha de escolha múltipla (derivada: altura do segmento de cartão) */
  ficha: 36,

  /* Resultado (H§4) */
  /** lado do ícone do topo */
  medalhaResultado: 72,
  /** check dentro dele */
  glifoMedalha: 34,
  /** largura máxima da explicação */
  larguraExplicacao: 300,

  /** marcador redondo de lista de motivos ("Por que esse horário") */
  pontoLista: 6,
} as const;

/**
 * Item ativo da tab bar (handoff, "Tab bar" → Item): gradiente vertical do
 * miolo e o brilho desfocado acima dele. Branco nos dois temas.
 */
export const PILULA_ABA = {
  gradiente: [
    'rgba(255,255,255,0.28)',
    'rgba(255,255,255,0.03)',
    'rgba(255,255,255,0.02)',
    'rgba(255,255,255,0.2)',
  ] as const,
  paradas: [0, 0.44, 0.7, 1] as const,
  brilho: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)'] as const,
  brilhoParadas: [0.56, 1] as const,
} as const;

/**
 * Espessura de traço dos ícones (handoff, "Assets"): 1.9 nas abas, 2.4–2.6
 * em chevron, mais e alerta, 3 no check do cartão de escolha.
 */
export const TRACO_ICONE = {
  aba: 1.9,
  chevron: 2.6,
  mais: 2.4,
  alerta: 2.4,
  check: 3,
  /** check do bloco de status e do ícone de resultado */
  checkBloco: 2.6,
} as const;

export const MOVIMENTO = {
  sheetMs: 340,
  sheetCurva: [0.32, 0.72, 0, 1] as const,
  fundoSheetMs: 200,
  toastMs: 200,
  toastDuracaoMs: 3600,
  barraNavMs: 180,
  switchMs: 200,
} as const;
