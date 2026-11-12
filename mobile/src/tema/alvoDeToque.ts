import { Platform } from 'react-native';

import { TAMANHO } from './tokens';

/**
 * Piso do alvo de toque por plataforma (SCRUM-41, decisão de PO de 04/11):
 * 44pt no iOS e na web, como o handoff e `spec/acessibilidade.md`; 48dp no
 * Android, como a diretriz do Material. A altura **visual** das peças não
 * muda: o que sobe no Android é a área de toque, por `hitSlop` ou pela caixa
 * tocável em volta do desenho.
 */
export function alvoMinimoPara(plataforma: string): number {
  return plataforma === 'android' ? TAMANHO.alvoMinimoAndroid : TAMANHO.alvoMinimo;
}

/** O piso desta plataforma. Componente lê daqui, nunca 44 ou 48 soltos. */
export const ALVO_MINIMO = alvoMinimoPara(Platform.OS);

/**
 * `hitSlop` que fecha o alvo mínimo numa peça mais baixa que ele — e, com
 * `largura`, numa mais estreita também. Peça que já passa do piso recebe 0.
 */
export function folgaDeToque(altura: number, largura?: number, alvo: number = ALVO_MINIMO) {
  const falta = Math.max(0, alvo - altura) / 2;
  const lado = largura === undefined ? 0 : Math.max(0, alvo - largura) / 2;
  return { top: falta, bottom: falta, left: lado, right: lado };
}
