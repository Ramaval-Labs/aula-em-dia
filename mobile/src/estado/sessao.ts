/**
 * Sessão e onboarding — a máquina de entrada (Fluxo A).
 *
 * É separada da máquina de navegação do app de propósito. `voltar()` de
 * `navegacao.ts` cai na raiz da aba quando a pilha esvazia; se o login
 * morasse na mesma união de telas, o botão físico do Android colocaria o
 * professor dentro do app sem autenticar. Aqui o fluxo é linear e o "voltar"
 * na raiz devolve `false`, deixando o sistema fechar o app.
 *
 * Dois modos, escolhidos por `EXPO_PUBLIC_BACKEND` (Parte 3 do backend):
 *
 * - **local**, o padrão e a rede de segurança da demonstração: login de
 *   mentira, nenhuma rede. O que fica em disco é a fase e o e-mail, em
 *   `CHAVE_SESSAO`, para não pedir login toda vez;
 * - **supabase**: entrar, criar conta e sair são de verdade, pelo Supabase
 *   Auth. Quem lembra do login é a sessão do supabase-js, e `CHAVE_SESSAO`
 *   não é usada.
 *
 * Nos dois, nenhuma senha é guardada. As fases não mudam:
 * `carregando → entrada → onboarding → app`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { CHAVE_SESSAO } from '../dados/armazenamento';
import { clienteSupabase, usaSupabase } from '../dados/supabase';
import { ERRO, validarAcesso } from '../dominio/validacao';

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
  /**
   * Login de quem já tem conta: pula o onboarding. Devolve `null` quando deu
   * certo e, senão, a frase de `ERRO` para a tela mostrar. A senha é opcional
   * só porque o modo local não a usa; no modo supabase, sem ela, é erro.
   */
  entrar: (email: string, senha?: string) => Promise<string | null>;
  /** Conta nova: começa o onboarding no passo 1. Mesma resposta de `entrar`. */
  criarConta: (email: string, senha?: string) => Promise<string | null>;
  avancar: () => void;
  /** Devolve false quando não há para onde voltar — o SO fecha o app. */
  voltarEntrada: () => boolean;
  concluirOnboarding: () => void;
  sair: () => Promise<void>;
};

/** Se o login é de verdade, para a tela decidir o que oferecer sem ler o ambiente. */
export const loginReal = (): boolean => usaSupabase();

/**
 * Erro do Supabase Auth → frase de `ERRO`. Decide pelo `code` do erro da API
 * e pelo `name` do erro do cliente, como a documentação do Supabase manda —
 * nunca pelo texto em inglês da mensagem. O que não casar é a falha genérica.
 */
export function fraseDoErroDeAcesso(erro: unknown): string {
  const e = (erro ?? {}) as { code?: unknown; name?: unknown; status?: unknown };
  switch (e.code) {
    case 'invalid_credentials':
      return ERRO.credenciaisInvalidas;
    // A documentação lista os dois para e-mail repetido, sem dizer qual o
    // signUp devolve.
    case 'user_already_exists':
    case 'email_exists':
      return ERRO.emailJaCadastrado;
    // A única exigência configurada é o tamanho mínimo, o mesmo SENHA_MINIMA.
    case 'weak_password':
      return ERRO.senhaCurta;
  }
  // O fetch nem chegou ao servidor: o auth-js embrulha a falha com status 0.
  if (e.name === 'AuthRetryableFetchError' && e.status === 0) return ERRO.semConexao;
  return ERRO.falhaNoAcesso;
}

/** O que a tela precisa corrigir antes de ir à rede: o primeiro erro, ou null. */
function erroDoFormulario(email: string, senha: string | undefined): string | null {
  const erros = validarAcesso(email, senha ?? '');
  return erros.email ?? erros.senha ?? null;
}

/** Falha que não é do usuário (variável faltando, por exemplo): aparece no console. */
function avisarEmDesenvolvimento(onde: string, erro: unknown) {
  if (__DEV__) console.warn(`[sessao] ${onde} falhou no modo supabase.`, erro);
}

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
    if (usaSupabase()) {
      try {
        const { data, error } = await clienteSupabase().auth.getSession();
        if (!error && data.session) {
          set({ fase: 'app', email: data.session.user.email ?? null });
          return;
        }
      } catch (erro) {
        avisarEmDesenvolvimento('Restaurar a sessão', erro);
      }
      set({ fase: 'entrada', tela: 'boasVindas' });
      return;
    }

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

  async entrar(email, senha) {
    if (!usaSupabase()) {
      // Antes de qualquer await: a tela de hoje não espera a promessa.
      set({ fase: 'app', email, contaNova: false });
      gravar({ fase: 'app', email });
      return null;
    }

    const doFormulario = erroDoFormulario(email, senha);
    if (doFormulario) return doFormulario;
    try {
      const { data, error } = await clienteSupabase().auth.signInWithPassword({
        email,
        password: senha as string,
      });
      if (error) return fraseDoErroDeAcesso(error);
      set({ fase: 'app', email: data.user?.email ?? email, contaNova: false });
      return null;
    } catch (erro) {
      avisarEmDesenvolvimento('Entrar', erro);
      return fraseDoErroDeAcesso(erro);
    }
  },

  async criarConta(email, senha) {
    if (!usaSupabase()) {
      set({ fase: 'onboarding', passo: 1, email, contaNova: true });
      return null;
    }

    const doFormulario = erroDoFormulario(email, senha);
    if (doFormulario) return doFormulario;
    try {
      const { data, error } = await clienteSupabase().auth.signUp({
        email,
        password: senha as string,
      });
      if (error) return fraseDoErroDeAcesso(error);
      // Sem sessão é cadastro que pede confirmação de e-mail, desligada no
      // MVP (Parte 3, passo 4). Seguir para o onboarding sem login deixaria a
      // pessoa num app que não consegue gravar nada no banco.
      if (!data.session) return ERRO.falhaNoAcesso;
      set({ fase: 'onboarding', passo: 1, email: data.user?.email ?? email, contaNova: true });
      return null;
    } catch (erro) {
      avisarEmDesenvolvimento('Criar a conta', erro);
      return fraseDoErroDeAcesso(erro);
    }
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
    // No modo supabase quem lembra do login é o supabase-js.
    if (!usaSupabase()) gravar({ fase: 'app', email });
  },

  async sair() {
    // A tela volta para a entrada na hora, como hoje; a rede vem depois.
    set({ fase: 'entrada', tela: 'boasVindas', passo: 1, email: null, contaNova: false });
    if (!usaSupabase()) {
      AsyncStorage.removeItem(CHAVE_SESSAO).catch(() => {});
      return;
    }
    try {
      // Sem rede o servidor não fica sabendo, mas o supabase-js apaga a sessão
      // do aparelho mesmo assim: reabrir o app não volta logado.
      await clienteSupabase().auth.signOut();
    } catch (erro) {
      avisarEmDesenvolvimento('Sair', erro);
    }
  },
}));
