/**
 * Preferência de "reduzir movimento" do sistema.
 *
 * Toda animação do iOS Glass (switch, sheet, barra de navegação) passa por
 * aqui: com a preferência ligada, a mudança acontece sem transição em vez de
 * ficar mais lenta. Mesmo padrão que o `Navbar.tsx` antigo já usava, extraído
 * para o tema porque agora são vários componentes.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduzirMovimento(): boolean {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => vivo && setReduzido(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);

  return reduzido;
}

/** Duração em ms respeitando a preferência: 0 quando o movimento é reduzido. */
export function duracao(ms: number, reduzido: boolean): number {
  return reduzido ? 0 : ms;
}
