/** Toast único, com o tempo de vida do handoff (3600ms). */

import { create } from 'zustand';

import { MOVIMENTO } from '../tema/tokens';

type Toast = {
  mensagem: string | null;
  avisar: (mensagem: string) => void;
  limpar: () => void;
};

let temporizador: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<Toast>((set) => ({
  mensagem: null,

  avisar(mensagem) {
    if (temporizador) clearTimeout(temporizador);
    set({ mensagem });
    temporizador = setTimeout(() => {
      set({ mensagem: null });
      temporizador = null;
    }, MOVIMENTO.toastMs);
  },

  limpar() {
    if (temporizador) clearTimeout(temporizador);
    temporizador = null;
    set({ mensagem: null });
  },
}));
