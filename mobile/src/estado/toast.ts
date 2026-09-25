/** Toast único, com o tempo de vida do handoff (3600ms). */

import { create } from 'zustand';

import { MOVIMENTO } from '../tema/tokens';

type Toast = {
  mensagem: string | null;
  /**
   * Altura, a partir da base da tela, que um sheet aberto ocupa com o rodapé
   * fixo (e o teclado, se houver). `null` sem sheet. O toast sobe acima
   * disso para não cobrir a ação primária do painel.
   */
  reservaDoSheet: number | null;
  avisar: (mensagem: string) => void;
  limpar: () => void;
  reservarSheet: (altura: number | null) => void;
};

let temporizador: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<Toast>((set) => ({
  mensagem: null,
  reservaDoSheet: null,

  reservarSheet(reservaDoSheet) {
    set({ reservaDoSheet });
  },

  avisar(mensagem) {
    if (temporizador) clearTimeout(temporizador);
    set({ mensagem });
    temporizador = setTimeout(() => {
      set({ mensagem: null });
      temporizador = null;
    }, MOVIMENTO.toastDuracaoMs);
  },

  limpar() {
    if (temporizador) clearTimeout(temporizador);
    temporizador = null;
    set({ mensagem: null });
  },
}));
