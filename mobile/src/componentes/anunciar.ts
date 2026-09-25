/**
 * Anúncio para o leitor de tela nos dois sistemas.
 *
 * `accessibilityLiveRegion` só existe no Android (TalkBack); o VoiceOver do
 * iOS ignora a prop. Por isso toda live region do app passa também por aqui:
 * no iOS o texto vai por `announceForAccessibility`, no Android a própria live
 * region fala (anunciar dos dois jeitos leria duas vezes), e no web nada — o
 * react-native-web já traduz a live region em `aria-live`.
 */

import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function anunciar(texto: string | undefined | null): void {
  if (!texto || Platform.OS !== 'ios') return;
  AccessibilityInfo.announceForAccessibility(texto);
}

/**
 * Anuncia `texto` quando ele muda. `naMontagem` anuncia também o primeiro
 * valor — para peças que só aparecem em resposta a um gesto (toast, aviso de
 * impacto); a nota do botão já está lá quando a tela abre e não fala sozinha.
 */
export function useAnuncio(texto: string | undefined | null, naMontagem = false): void {
  const anterior = useRef<string | undefined | null>(naMontagem ? undefined : texto);
  useEffect(() => {
    if (texto === anterior.current) return;
    anterior.current = texto;
    anunciar(texto);
  }, [texto]);
}
