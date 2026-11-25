/**
 * A trava da rolagem (SCRUM-101). Enquanto a `GradeLivre` pinta um horário,
 * o arrasto é dela: a rolagem da tela, do sheet e da entrada fica parada, para
 * o dedo não mover a página e a pintura ao mesmo tempo.
 *
 * Fora do arrasto a rolagem é a de sempre: só o toque longo trava, então o
 * arrasto rápido continua rolando a página por cima da grade.
 */

import { create } from 'zustand';

interface TravaDaRolagem {
  travada: boolean;
  travar: (travada: boolean) => void;
}

export const useTravaDaRolagem = create<TravaDaRolagem>((set) => ({
  travada: false,
  travar: (travada) => set({ travada }),
}));

/** `scrollEnabled` de quem rola: falso só durante a pintura da grade. */
export const useRolagemLivre = (): boolean => !useTravaDaRolagem((s) => s.travada);
