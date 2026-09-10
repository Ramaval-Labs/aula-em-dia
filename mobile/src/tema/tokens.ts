/**
 * Tokens do "Aula em Dia" — espelho tipado de tokens/tokens.json.
 * Não inventar valores aqui: todo número/cor vem do handoff.
 */

export const MARCA = {
  amarelo: '#FFD032',
  tintaSobreAmarelo: '#0E1626',
} as const;

export type NomeDeCor =
  | 'tela'
  | 'caixa'
  | 'cartao'
  | 'linha'
  | 'texto'
  | 'textoMedio'
  | 'suave'
  | 'fraco'
  | 'inativo'
  | 'topo'
  | 'topoTexto'
  | 'topoFraco'
  | 'topoCartao'
  | 'elevado'
  | 'elevadoSuave'
  | 'botao'
  | 'botaoTexto'
  | 'botaoHover'
  | 'desabFg'
  | 'hover'
  | 'amareloFraco'
  | 'vermelho'
  | 'vermelhoFraco'
  | 'verde';

export type Paleta = Record<NomeDeCor, string>;

export const CORES: { claro: Paleta; escuro: Paleta } = {
  claro: {
    tela: '#F0F3F7',
    caixa: '#F0F3F7',
    cartao: '#FFFFFF',
    linha: '#E2E8F0',
    texto: '#141E30',
    textoMedio: '#35577D',
    suave: '#6E819B',
    fraco: '#B7C0CE',
    inativo: '#D3DAE4',
    topo: '#141E30',
    topoTexto: '#FFFFFF',
    topoFraco: '#8FA8C4',
    topoCartao: '#24395B',
    elevado: '#141E30',
    elevadoSuave: '#A6B6CE',
    botao: '#141E30',
    botaoTexto: '#FFFFFF',
    botaoHover: '#24395B',
    desabFg: '#9AA6B8',
    hover: '#F7FAFD',
    amareloFraco: '#FFF6D9',
    vermelho: '#E3001A',
    vermelhoFraco: '#FFF0F2',
    verde: '#1E7A55',
  },
  escuro: {
    tela: '#141E30',
    caixa: '#22304C',
    cartao: '#1B2740',
    linha: '#2C3E5C',
    texto: '#E9EDF4',
    textoMedio: '#C2CCDD',
    suave: '#93A2BC',
    fraco: '#46587A',
    inativo: '#33456A',
    topo: '#0E1626',
    topoTexto: '#FFFFFF',
    topoFraco: '#8299B8',
    topoCartao: '#24365A',
    elevado: '#24365A',
    elevadoSuave: '#A6B6CE',
    botao: '#E9EDF4',
    botaoTexto: '#0E1626',
    botaoHover: '#FFFFFF',
    desabFg: '#5D6E8C',
    hover: '#22304C',
    amareloFraco: '#33301C',
    vermelho: '#FF4D5E',
    vermelhoFraco: '#3A1A20',
    verde: '#35B37E',
  },
};

export const RAIO = {
  micro: 5,
  contador: 6,
  cartao: 8,
  pastilha: 13,
  aparelho: 14,
  pilula: 99,
} as const;

/** Grade de 4 — só os passos efetivamente usados no handoff. */
export const ESPACO = [4, 6, 7, 9, 10, 12, 14, 16, 20, 22, 32] as const;

export const TAMANHO = {
  botaoPrimario: 52,
  botaoSecundario: 44,
  aba: 42,
  /** área tocável da aba (spec/acessibilidade.md) mantendo o visual de 42px */
  abaToque: 48,
  /**
   * Faixa da curva acima da navbar. O handoff especifica 58px, mas acima da
   * linha da curva ela é transparente — na esquerda são ~46px de fundo vazio.
   * 44px mantém o desenho e devolve tela para a lista. Este é o botão de
   * ajuste: subir para 58 volta ao valor do protótipo.
   */
  faixaCurva: 44,
  padCabecalho: 64,
  padCabecalhoCompacto: 62,
  padCabecalhoResultado: 70,
} as const;

export const MOVIMENTO = {
  abaAtivaMs: 220,
  toastMs: 3600,
} as const;

/** Vidro da pílula da aba ativa — sem backdrop-filter, por decisão de projeto. */
export const VIDRO = {
  gradiente: [
    'rgba(255,255,255,0.11)',
    'rgba(255,255,255,0.015)',
    'rgba(255,255,255,0.015)',
    'rgba(255,255,255,0.10)',
  ] as const,
  paradas: [0, 0.26, 0.72, 1] as const,
  borda: 'rgba(255,255,255,0.5)',
  sombra:
    'inset 0px 1.5px 1.5px rgba(255,255,255,0.7), ' +
    'inset 0px -1.5px 1.5px rgba(255,255,255,0.34), ' +
    'inset 1.5px 0px 1.5px rgba(255,255,255,0.2), ' +
    'inset -1.5px 0px 1.5px rgba(255,255,255,0.2), ' +
    '0px 3px 10px rgba(0,0,0,0.32)',
  brilho: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)'] as const,
  brilhoParadas: [0.6, 1] as const,
} as const;

/** Paths das duas curvas assinatura (assets/curva-*.svg). Mesma direção sempre. */
export const CURVAS = {
  cabecalho: {
    viewBox: '0 0 390 80',
    altura: 80,
    d: 'M0,80 L0,74 C10,62 34,48 80,46 L316,46 C356,44 378,30 390,12 L390,80 Z',
  },
  navbar: {
    viewBox: '0 0 390 60',
    altura: 60,
    d: 'M0,55 C10,46 34,36 80,34 L316,34 C356,33 378,22 390,9 L390,61 L0,61 Z',
  },
} as const;

/** Ícones da navbar (viewBox 24×24, stroke 1.8, round). */
export const ICONES_ABA = {
  alunos:
    'M12 10.9a3.35 3.35 0 100-6.7 3.35 3.35 0 000 6.7M5.6 19.8c0-3.55 2.86-5.5 6.4-5.5s6.4 1.95 6.4 5.5',
  financeiro:
    'M4.2 9.2h13.3a2.5 2.5 0 012.5 2.5v4.9a2.5 2.5 0 01-2.5 2.5H6.7a2.5 2.5 0 01-2.5-2.5zM4.2 9.2V7.3a2 2 0 012-2h8.6M16 14.1h1.4',
  ajustes: 'M4.6 8.2h8.2M16.6 8.2H19.4M4.6 15.8h2.8M11.4 15.8h8M14.7 6.1v4.2M8.5 13.7v4.2',
} as const;
