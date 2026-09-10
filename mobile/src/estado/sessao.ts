/**
 * Sessão e onboarding — a máquina de entrada (Fluxo A).
 *
 * É separada da máquina de navegação do app de propósito. `voltar()` de
 * `navegacao.ts` cai na raiz da aba quando a pilha esvazia; se o login
 * morasse na mesma união de telas, o botão físico do Android colocaria o
 * professor dentro do app sem autenticar. Aqui o fluxo é linear e o "voltar"
 * na raiz devolve `false`, deixando o sistema fechar o app.
 *
 * Autenticação é **mock**: nenhuma rede, nenhuma senha guardada. O que fica
 * em disco é só a fase e o e-mail, para não pedir login toda vez.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { CHAVE_SESSAO } from '../dados/armazenamento';

/** Em qual das três máquinas o app está. */
export type Fase = 'carregando' | 'entrada' | 'onboarding' | 'app';

/** Telas da máquina de entrada (A2 e A3; A1 é a fase 'carregando'). */
export type TelaDeEntrada = 'boasVindas' | 'acesso';

/** Passos do onboarding (A4 a A7). */
export type PassoDeOnboarding = 1 | 2 | 3 | 4;

export const TOTAL_DE_PASSOS = 4;

type Persistido = { fase: Fase; email: string | null };

type Sessao = {
  fase: Fase;
  tela: TelaDeEntrada;
  passo: PassoDeOnboarding;
  email: string | null;
  /** true quando a conta é nova — o onboarding só roda nesse caso */
  contaNova: boolean;

  carregar: () => Promise<void>;
  irPara: (tela: TelaDeEntrada) => void;
  /** Login de quem já tem conta: pula o onboarding. */
  entrar: (email: string) => void;
  /** Conta nova: começa o onboarding no passo 1. */
  criarConta: (email: string) => void;
  avancar: () => void;
  /** Devolve false quando não há para onde voltar — o SO fecha o app. */
  voltarEntrada: () => boolean;
  concluirOnboarding: () => void;
  sair: () => void;
};

function gravar(p: Persistido) {
  AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(p)).catch(() => {
    // Sessão é conveniência: falhar aqui não pode derrubar a tela.
  });
}

export const useSessao = create<Sessao>((set, get) => ({
  fase: 'carregando',
  tela: 'boasVindas',
  passo: 1,
  email: null,
  contaNova: false,

  async carregar() {
    try {
      const bruto = await AsyncStorage.getItem(CHAVE_SESSAO);
      if (bruto) {
        const d = JSON.parse(bruto) as Partial<Persistido>;
        // Só 'app' é restaurado: quem parou no meio do onboarding recomeça,
        // porque os passos intermediários não gravam nada de útil.
        if (d?.fase === 'app') {
          set({ fase: 'app', email: d.email ?? null });
          return;
        }
      }
    } catch {
      // Sem sessão ou payload corrompido: entra pelo começo.
    }
    set({ fase: 'entrada', tela: 'boasVindas' });
  },

  irPara: (tela) => set({ tela }),

  entrar(email) {
    set({ fase: 'app', email, contaNova: false });
    gravar({ fase: 'app', email });
  },

  criarConta(email) {
    set({ fase: 'onboarding', passo: 1, email, contaNova: true });
  },

  avancar() {
    const { passo } = get();
    if (passo < TOTAL_DE_PASSOS) {
      set({ passo: (passo + 1) as PassoDeOnboarding });
      return;
    }
    get().concluirOnboarding();
  },

  voltarEntrada() {
    const { fase, tela, passo } = get();

    if (fase === 'onboarding') {
      if (passo > 1) {
        set({ passo: (passo - 1) as PassoDeOnboarding });
        return true;
      }
      // Do primeiro passo, volta para a tela de acesso.
      set({ fase: 'entrada', tela: 'acesso' });
      return true;
    }

    if (fase === 'entrada' && tela === 'acesso') {
      set({ tela: 'boasVindas' });
      return true;
    }

    // Raiz da entrada: nada a desempilhar.
    return false;
  },

  concluirOnboarding() {
    const email = get().email;
    set({ fase: 'app' });
    gravar({ fase: 'app', email });
  },

  sair() {
    AsyncStorage.removeItem(CHAVE_SESSAO).catch(() => {});
    set({ fase: 'entrada', tela: 'boasVindas', passo: 1, email: null, contaNova: false });
  },
}));
