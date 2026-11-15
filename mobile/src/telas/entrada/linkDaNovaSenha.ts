/**
 * O link do e-mail de recuperação (SCRUM-96): `/redefinir-senha?token_hash=…`.
 *
 * No Expo Web, o `App.tsx` lê o link uma vez, na carga: guarda o `token_hash`
 * aqui e tira o endereço da barra (`history.replaceState`), para o token não
 * ficar no histórico do navegador nem ser compartilhado por engano. A tela de
 * nova senha pega o token daqui. No nativo não há caminho, e nada acontece.
 */

import { Platform } from 'react-native';

import { CAMINHO_DA_NOVA_SENHA } from '../../estado/sessao';

let token: string | null = null;

type Local = { pathname: string; search: string };
type Historico = { replaceState: (estado: null, titulo: string, url: string) => void };

/**
 * Lê o link uma vez: devolve o `token_hash` quando o caminho é o da nova
 * senha, guarda-o e limpa a barra de endereço. Fora dele, `null`.
 */
export function lerLinkDaNovaSenha(
  local: Local | undefined = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location
    : undefined,
  historico: Historico | undefined = typeof window !== 'undefined' ? window.history : undefined,
): string | null {
  if (!local || local.pathname !== CAMINHO_DA_NOVA_SENHA) return null;
  const parametros = new URLSearchParams(local.search);
  const lido = parametros.get('token_hash');
  // O caminho certo sem token ainda é a tela de nova senha: ela mostra que o
  // link não vale e oferece pedir outro. Por isso o token vazio vira ''.
  token = lido ?? '';
  historico?.replaceState(null, '', '/');
  return token;
}

/** O token que o link trouxe, ou `null` quando o app não abriu por ele. */
export const tokenDaNovaSenha = (): string | null => token;

/** Só para os testes: esquece o link lido. */
export function esquecerLinkDaNovaSenha() {
  token = null;
}
