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
 *   não é usada. Quem lembra do onboarding é o banco
 *   (`professores.onboarding_concluido`, Parte 4): quem fechou o app no meio
 *   dele volta para o passo 1, e não para dentro do app.
 *
 * Nos dois, nenhuma senha é guardada. As fases não mudam:
 * `carregando → entrada → onboarding → app`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { CHAVE_SESSAO } from '../dados/armazenamento';
import {
  apagarConta as apagarContaNoBanco,
  marcarOnboardingConcluido,
  onboardingConcluido,
} from '../dados/repositorioSupabase';
import { clienteSupabase, usaSupabase } from '../dados/supabase';
import { emailValido, ERRO, senhaValida, validarAcesso } from '../dominio/validacao';
import { useDados } from './dados';

/** Em qual das três máquinas o app está. */
export type Fase = 'carregando' | 'entrada' | 'onboarding' | 'app';

/**
 * Telas da máquina de entrada (A2 e A3; A1 é a fase 'carregando'). A
 * `novaSenha` é a do link de recuperação (SCRUM-62): o app abre nela pelo
 * caminho `/redefinir-senha` do e-mail, e não pelo fluxo de boas-vindas.
 */
export type TelaDeEntrada = 'boasVindas' | 'acesso' | 'novaSenha';

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
  /**
   * "Esqueci minha senha" (SCRUM-62): pede o e-mail com o link. Devolve `null`
   * quando o pedido saiu, **tenha o e-mail conta ou não**: a tela mostra
   * `FRASE_DO_LINK_ENVIADO` nos dois casos, para não revelar quem tem conta.
   * Erro só de formulário, de rede ou do servidor, como em `entrar`.
   */
  pedirRecuperacao: (email: string) => Promise<string | null>;
  /**
   * A senha nova, com o `token_hash` que veio no link do e-mail. Deu certo:
   * `null`, e a pessoa já entra, como em `entrar`. Senão, a frase para a tela.
   */
  redefinirSenha: (tokenHash: string, novaSenha: string) => Promise<string | null>;
  avancar: () => void;
  /** Devolve false quando não há para onde voltar — o SO fecha o app. */
  voltarEntrada: () => boolean;
  concluirOnboarding: () => void;
  sair: () => Promise<void>;
  /**
   * Apaga a conta de verdade, com todos os alunos (Parte 8, LGPD). Só no modo
   * supabase: no local, rejeita. Primeiro o servidor; só se ele confirmar,
   * a sessão sai como em `sair()`, que também esquece os dados do aparelho.
   * Se falhar, rejeita e a pessoa continua no app, com a conta inteira.
   */
  apagarConta: () => Promise<void>;
};

/**
 * O que a tela mostra depois de pedir o link, exista a conta ou não
 * (SCRUM-62): a mesma frase nos dois casos é o que não revela quem tem conta.
 */
export const FRASE_DO_LINK_ENVIADO = 'Se houver uma conta com esse e-mail, mandamos o link.';

/**
 * As frases da recuperação que `ERRO` ainda não tem. Moram aqui, ao lado do
 * mapa de códigos, até irem para `dominio/validacao.ts`, que é de onde as
 * frases de acesso saem.
 */
export const ERRO_DA_RECUPERACAO = {
  linkVencido: 'Esse link expirou ou já foi usado. Peça um novo',
  senhaIgual: 'A senha nova precisa ser diferente da atual',
  falhaNoEnvio: 'Não deu para mandar o link agora. Tente de novo em instantes',
} as const;

/** O caminho do app que o link do e-mail abre (o `App.tsx` o lê, no SCRUM-96). */
export const CAMINHO_DA_NOVA_SENHA = '/redefinir-senha';

/**
 * Para onde o link do e-mail leva: `<EXPO_PUBLIC_URL_DO_APP>/redefinir-senha`,
 * o app do professor no navegador. `null` sem a variável.
 */
export function enderecoDaNovaSenha(
  base: string | undefined = process.env.EXPO_PUBLIC_URL_DO_APP,
): string | null {
  if (!base) return null;
  return `${base.replace(/\/+$/, '')}${CAMINHO_DA_NOVA_SENHA}`;
}

/** Se o login é de verdade, para a tela decidir o que oferecer sem ler o ambiente. */
export const loginReal = (): boolean => usaSupabase();

/** Se dá para apagar a conta: só com login de verdade, porque no local não há conta. */
export const podeApagarConta = (): boolean => usaSupabase();

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
  if (semRede(e)) return ERRO.semConexao;
  return ERRO.falhaNoAcesso;
}

const semRede = (e: { name?: unknown; status?: unknown }): boolean =>
  e.name === 'AuthRetryableFetchError' && e.status === 0;

/**
 * Erro do pedido de recuperação → frase, ou `null`. O limite de envio
 * (`over_email_send_rate_limit`, 429) vira `null`, como o sucesso: o primeiro
 * e-mail já saiu, e uma resposta diferente diria que o e-mail tem conta.
 */
export function fraseDoErroDoPedido(erro: unknown): string | null {
  const e = (erro ?? {}) as { code?: unknown; name?: unknown; status?: unknown };
  if (e.code === 'over_email_send_rate_limit') return null;
  if (e.code === 'email_address_invalid') return ERRO.emailInvalido;
  if (semRede(e)) return ERRO.semConexao;
  return ERRO_DA_RECUPERACAO.falhaNoEnvio;
}

/**
 * Erro da troca de senha → frase. `otp_expired` é o código do link usado, do
 * vencido e do inventado (GoTrue 2.197, conferido no Supabase local).
 */
export function fraseDoErroDaNovaSenha(erro: unknown): string {
  const e = (erro ?? {}) as { code?: unknown };
  if (e.code === 'otp_expired') return ERRO_DA_RECUPERACAO.linkVencido;
  if (e.code === 'same_password') return ERRO_DA_RECUPERACAO.senhaIgual;
  return fraseDoErroDeAcesso(erro);
}

/**
 * O link já trocado por sessão nesta aba. O `token_hash` vale uma vez só: se a
 * senha nova for recusada depois do `verifyOtp` (igual à atual, por exemplo),
 * a segunda tentativa usa a sessão que ele abriu, em vez de gastar o link de
 * novo e cair em "link usado".
 */
let linkJaVerificado: string | null = null;

/** O que a tela precisa corrigir antes de ir à rede: o primeiro erro, ou null. */
function erroDoFormulario(email: string, senha: string | undefined): string | null {
  const erros = validarAcesso(email, senha ?? '');
  return erros.email ?? erros.senha ?? null;
}

/** Só o e-mail, para o pedido de recuperação: as frases de `validarAcesso`. */
function erroDoEmail(email: string): string | null {
  if (!email.trim()) return ERRO.emailVazio;
  return emailValido(email) ? null : ERRO.emailInvalido;
}

/** Só a senha, para a senha nova: as frases de `validarAcesso`. */
function erroDaSenha(senha: string): string | null {
  if (!senha) return ERRO.senhaVazia;
  return senhaValida(senha) ? null : ERRO.senhaCurta;
}

/** Falha que não é do usuário (variável faltando, por exemplo): aparece no console. */
function avisarEmDesenvolvimento(onde: string, erro: unknown) {
  if (__DEV__) console.warn(`[sessao] ${onde} falhou no modo supabase.`, erro);
}

/**
 * Com sessão no modo supabase: para o app, ou de volta ao onboarding se ele
 * não terminou. Sem rede não dá para saber, e aí vale o app, que abre pelo
 * cache: quem já usava não fica preso fora dele.
 */
async function faseDoLogado(): Promise<Extract<Fase, 'app' | 'onboarding'>> {
  return (await onboardingConcluido()) === false ? 'onboarding' : 'app';
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
          const email = data.session.user.email ?? null;
          if ((await faseDoLogado()) === 'onboarding') {
            set({ fase: 'onboarding', passo: 1, email, contaNova: true });
            return;
          }
          set({ fase: 'app', email });
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
      const doLogin = data.user?.email ?? email;
      // Conta criada noutro aparelho, e o onboarding parou no meio: termina aqui.
      if ((await faseDoLogado()) === 'onboarding') {
        set({ fase: 'onboarding', passo: 1, email: doLogin, contaNova: true });
        return null;
      }
      set({ fase: 'app', email: doLogin, contaNova: false });
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

  async pedirRecuperacao(email) {
    const doFormulario = erroDoEmail(email);
    if (doFormulario) return doFormulario;
    // No modo local não há conta nem e-mail: responde como se tivesse mandado.
    if (!usaSupabase()) return null;

    const redirectTo = enderecoDaNovaSenha();
    if (!redirectTo) {
      // Sem a variável, o link cairia no `site_url`, fora da tela de nova senha.
      avisarEmDesenvolvimento('Pedir a recuperação', 'falta EXPO_PUBLIC_URL_DO_APP');
      return ERRO_DA_RECUPERACAO.falhaNoEnvio;
    }
    try {
      // E-mail sem conta não é erro: o Supabase responde igual e não manda nada.
      const { error } = await clienteSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      return error ? fraseDoErroDoPedido(error) : null;
    } catch (erro) {
      avisarEmDesenvolvimento('Pedir a recuperação', erro);
      return fraseDoErroDoPedido(erro);
    }
  },

  async redefinirSenha(tokenHash, novaSenha) {
    const daSenha = erroDaSenha(novaSenha);
    if (daSenha) return daSenha;
    if (!usaSupabase()) {
      // Sem conta no modo local: a senha nova é aceita e a pessoa entra.
      const email = get().email;
      set({ fase: 'app', contaNova: false });
      gravar({ fase: 'app', email });
      return null;
    }

    if (!tokenHash) return ERRO_DA_RECUPERACAO.linkVencido;
    try {
      const auth = clienteSupabase().auth;
      if (linkJaVerificado !== tokenHash) {
        // O token_hash e não o PKCE: funciona no navegador que abriu o link,
        // seja ele qual for. Dá certo uma vez só; depois, `otp_expired`.
        const { error } = await auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
        if (error) return fraseDoErroDaNovaSenha(error);
        linkJaVerificado = tokenHash;
      }
      const { data, error } = await auth.updateUser({ password: novaSenha });
      if (error) return fraseDoErroDaNovaSenha(error);
      linkJaVerificado = null;

      // A conta do link pode não ser a que este aparelho guardava: os alunos
      // de antes não ficam à mostra, e o app relê os desta conta.
      useDados.getState().esquecer();
      const email = data.user?.email ?? null;
      if ((await faseDoLogado()) === 'onboarding') {
        set({ fase: 'onboarding', passo: 1, email, contaNova: true });
        return null;
      }
      set({ fase: 'app', email, contaNova: false });
      return null;
    } catch (erro) {
      avisarEmDesenvolvimento('Redefinir a senha', erro);
      return fraseDoErroDaNovaSenha(erro);
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
    if (!usaSupabase()) {
      gravar({ fase: 'app', email });
      return;
    }
    // No modo supabase quem lembra do login é o supabase-js, e do onboarding,
    // o banco. Se a marca não for gravada, o pior caso é refazer os passos.
    marcarOnboardingConcluido().catch((erro) =>
      avisarEmDesenvolvimento('Concluir o onboarding', erro),
    );
  },

  async sair() {
    // A tela volta para a entrada na hora, como hoje; a rede vem depois.
    set({ fase: 'entrada', tela: 'boasVindas', passo: 1, email: null, contaNova: false });
    if (!usaSupabase()) {
      AsyncStorage.removeItem(CHAVE_SESSAO).catch(() => {});
      return;
    }
    // Os alunos são da conta: quem entrar depois neste aparelho não os vê.
    useDados.getState().esquecer();
    try {
      // Sem rede o servidor não fica sabendo, mas o supabase-js apaga a sessão
      // do aparelho mesmo assim: reabrir o app não volta logado.
      await clienteSupabase().auth.signOut();
    } catch (erro) {
      avisarEmDesenvolvimento('Sair', erro);
    }
  },

  async apagarConta() {
    if (!usaSupabase()) {
      throw new Error('[sessao] apagar a conta só existe no modo supabase: no local não há conta.');
    }
    // Primeiro o servidor. Sair antes deixaria a pessoa ver como apagada uma
    // conta que continua no banco, se a rede caísse aqui.
    await apagarContaNoBanco();
    // O usuário já não existe: o `signOut` do `sair()` pode falhar no servidor,
    // mas apaga a sessão do aparelho mesmo assim (Parte 3, decisão 6).
    await get().sair();
  },
}));
