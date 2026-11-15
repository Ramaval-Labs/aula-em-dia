// PROVA SCRUM-95: hook dentro de `if`. O lint do CI tem que ficar vermelho. Não mesclar.
import { useState } from 'react';

export function HookNoIf({ ligado }: { ligado: boolean }) {
  if (ligado) {
    const [valor] = useState(0);
    return valor;
  }
  return null;
}
