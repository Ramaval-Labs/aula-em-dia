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

/** Constrói um TextStyle a partir da escala do handoff. */
export function texto(tamanho: number, peso: Peso, o: Opcoes = {}): TextStyle {
  const estilo: TextStyle = {
    fontFamily: FONTES[peso],
    fontSize: tamanho,
    lineHeight: Math.round(tamanho * (o.altura ?? 1) * 100) / 100,
  };
  if (o.tracking) estilo.letterSpacing = Math.round(tamanho * o.tracking * 100) / 100;
  if (o.maiuscula) estilo.textTransform = 'uppercase';
  if (o.tabular !== false) estilo.fontVariant = ['tabular-nums'];
  return estilo;
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
  micro: texto(9, 600, { altura: 1, tracking: 0.16, maiuscula: true }),
} as const;
