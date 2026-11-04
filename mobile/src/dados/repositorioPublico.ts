/**
 * Repositório da página do aluno (`/a/<token>`, Parte 6 do backend).
 *
 * O aluno não tem login nem os dados do professor: tudo passa pela Edge
 * Function `aluno-publico`, que acha o aluno pelo token e devolve o recorte já
 * calculado (`dominio/paginaDoAluno`). Por isso aqui não há supabase-js, store
 * nem cache: são três chamadas `fetch`, e cada uma devolve a página como ficou.
 *
 * O 404 da função é o mesmo para o token trocado e para o que nunca existiu, e
 * vira `LinkInvalido`, para a tela mostrar a frase do link. O resto (rede
 * caída, a proposta que já foi respondida, o professor gravando no meio) vira
 * `ErroDoLink`, com o status quando houve resposta.
 */

import type { PaginaDoAluno } from '../dominio/paginaDoAluno';
import type { BlocoSemanal } from '../dominio/tipos';

/** A chamada à função falhou. `status` é `null` quando nem houve resposta (sem rede). */
export class ErroDoLink extends Error {
  readonly status: number | null;
  constructor(oQue: string, status: number | null, causa?: unknown) {
    super(`[link do aluno] ${oQue}: ${status === null ? 'sem resposta' : `HTTP ${status}`}`, {
      cause: causa,
    });
    this.name = 'ErroDoLink';
    this.status = status;
  }
}

/** O token não acha aluno: trocado por "Gerar novo link", ou nunca existiu. */
export class LinkInvalido extends ErroDoLink {
  constructor(oQue: string) {
    super(oQue, 404);
    this.name = 'LinkInvalido';
  }
}

export const ehLinkInvalido = (erro: unknown): boolean => erro instanceof LinkInvalido;

function endereco(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('A página do aluno precisa de EXPO_PUBLIC_SUPABASE_URL em mobile/.env (ver .env.example).');
  }
  return `${url.replace(/\/+$/, '')}/functions/v1/aluno-publico`;
}

async function chamar(oQue: string, url: string, init?: RequestInit): Promise<PaginaDoAluno> {
  let resposta: Response;
  try {
    resposta = await fetch(url, init);
  } catch (erro) {
    throw new ErroDoLink(oQue, null, erro);
  }
  if (resposta.status === 404) throw new LinkInvalido(oQue);
  if (!resposta.ok) throw new ErroDoLink(oQue, resposta.status);
  return (await resposta.json()) as PaginaDoAluno;
}

function postar(oQue: string, corpo: Record<string, unknown>): Promise<PaginaDoAluno> {
  return chamar(oQue, endereco(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
}

/** O recorte do aluno do token. */
export async function carregarPagina(token: string): Promise<PaginaDoAluno> {
  return chamar('abrir a página', `${endereco()}?token=${encodeURIComponent(token)}`);
}

/**
 * A resposta à proposta aberta. `janela` é a que o aluno tocou, a principal ou
 * uma alternativa; sem ela, vale a principal. A função recusa uma janela que a
 * página não ofereceu.
 */
export async function responder(
  token: string,
  status: 'aceita' | 'recusada',
  janela?: { dia: string; hora: string },
): Promise<PaginaDoAluno> {
  return postar('responder a proposta', {
    token,
    acao: 'responder',
    status,
    ...(janela ? { janela: { dia: janela.dia, hora: janela.hora } } : {}),
  });
}

/** Os horários em que o aluno pode, no lugar dos que ele tinha mandado. */
export async function enviarDisponibilidade(token: string, blocos: BlocoSemanal[]): Promise<PaginaDoAluno> {
  return postar('enviar a disponibilidade', { token, acao: 'disponibilidade', blocos });
}
