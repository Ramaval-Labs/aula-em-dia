/**
 * Altura do teclado na tela, para o sheet com campo de texto.
 *
 * No iOS os eventos `Will` chegam antes da animação do teclado, e o painel
 * sobe junto; no Android só existem os `Did`. O edge-to-edge do SDK 57 não
 * garante o `adjustResize` no Android, então o painel se ajusta sozinho nos
 * dois sistemas em vez de contar com a janela encolher.
 */

import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useAlturaDoTeclado(ativo: boolean): number {
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    if (!ativo || Platform.OS === 'web') return;
    const ios = Platform.OS === 'ios';
    const abriu = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setAltura(e.endCoordinates.height),
    );
    const fechou = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setAltura(0),
    );
    return () => {
      abriu.remove();
      fechou.remove();
    };
  }, [ativo]);

  return ativo ? altura : 0;
}
