/**
 * Ícones do iOS Glass (handoff-ios-glass/README.md, "Assets" e "Tab bar").
 *
 * Todos são paths inline em viewBox 24 × 24, sem preenchimento, com
 * `linecap`/`linejoin` redondos. A espessura é parte do caráter do desenho:
 * 1.9 nas abas, 2.4–2.6 em chevron, mais e alerta, 3 no check do cartão de
 * escolha. Cada nome já traz a sua espessura padrão em `TRACO_ICONE`; passe
 * `traco` só quando o handoff pedir outro valor na peça específica.
 *
 * Nenhum arquivo de imagem e nenhuma fonte de ícone entram no app.
 */

import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { TRACO_ICONE } from '../tema/tokens';

/** Paths das três abas — o chassi (tab bar) importa daqui. */
export const PATHS_ABA = {
  alunos:
    'M9.3 11.2a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2M3.7 19.3c0-3.1 2.5-4.9 5.6-4.9s5.6 1.8 5.6 4.9' +
    'M16.4 11.5a2.6 2.6 0 100-5.2M17.5 14.6c1.9.4 3 1.9 3 4.7',
  financeiro:
    'M3.9 9.9A2.4 2.4 0 016.3 7.5h11.4a2.4 2.4 0 012.4 2.4v6.2a2.4 2.4 0 01-2.4 2.4H6.3a2.4 2.4 0 ' +
    '01-2.4-2.4zM3.9 11.7h16.2M6.9 15.5h3.2',
  ajustes:
    'M4.4 8.2h6.4M14.2 8.2h5.4M4.4 15.8h5.3M13.4 15.8h6.2M10.8 8.2a1.7 1.7 0 103.4 0 1.7 1.7 0 ' +
    '10-3.4 0M9.7 15.8a1.7 1.7 0 103.4 0 1.7 1.7 0 10-3.4 0',
} as const;

/** Todos os glifos do sistema, com a espessura padrão de cada um. */
export const ICONES = {
  /** ponta para a direita; use `girar` para virar (voltar = 180) */
  chevron: { d: 'M9 5.5l6.5 6.5L9 18.5', traco: TRACO_ICONE.chevron },
  check: { d: 'M6 12.4l4 4L18 8', traco: TRACO_ICONE.check },
  /** check do bloco de status e do ícone de resultado — traço mais fino */
  checkBloco: { d: 'M6 12.6l3.8 3.8L18 8.2', traco: TRACO_ICONE.checkBloco },
  mais: { d: 'M12 5.6v12.8M5.6 12h12.8', traco: TRACO_ICONE.mais },
  alerta: { d: 'M12 7v6.4M12 16.6v.4', traco: TRACO_ICONE.alerta },
  abaAlunos: { d: PATHS_ABA.alunos, traco: TRACO_ICONE.aba },
  abaFinanceiro: { d: PATHS_ABA.financeiro, traco: TRACO_ICONE.aba },
  abaAjustes: { d: PATHS_ABA.ajustes, traco: TRACO_ICONE.aba },
} as const;

export type NomeDeIcone = keyof typeof ICONES;

export function Icone({
  nome,
  tamanho,
  cor,
  traco,
  /** graus no sentido horário — chevron para baixo é 90; para a esquerda, 180 */
  girar = 0,
  style,
}: {
  nome: NomeDeIcone;
  tamanho: number;
  cor: string;
  traco?: number;
  girar?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { d, traco: padrao } = ICONES[nome];
  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      // O ícone nunca é a informação: quem chama rotula o controle.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[girar ? { transform: [{ rotate: `${girar}deg` }] } : null, style]}
    >
      <Path
        d={d}
        fill="none"
        stroke={cor}
        strokeWidth={traco ?? padrao}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
