/**
 * Repositório da página do aluno (SCRUM-22), com o `fetch` simulado.
 *
 * Cobra o contrato com a Edge Function `aluno-publico`: o endereço, o corpo de
 * cada chamada, o 404 virando `LinkInvalido` e a rede caída virando
 * `ErroDoLink` sem status. A função de verdade é conferida com `curl` contra o
 * banco local (docs/backend/PLANO-BACKEND.md, Parte 6).
 */

import type { PaginaDoAluno } from '../../dominio/paginaDoAluno';
import {
  carregarPagina,
  ehLinkInvalido,
  enviarDisponibilidade,
  ErroDoLink,
  LinkInvalido,
  responder,
} from '../repositorioPublico';

const TOKEN = '285ee902-e4ad-4ab6-8830-e3b64ccbebc5';
const FUNCAO = 'http://192.168.0.10:54321/functions/v1/aluno-publico';

const PAGINA: PaginaDoAluno = {
  nome: 'Rafael',
  disciplina: 'Violão',
  dia: 'segunda',
  hora: '19h',
  saldo: 2,
  total: 8,
  temPacote: true,
  validade: '07/12',
  agendada: null,
  regra: 'Avisando com 24h ou mais, a aula volta para o seu saldo.',
  extrato: [],
  professor: { nome: 'Caio', disciplina: 'Matemática' },
  proposta: {
    principal: { dia: 'Quinta, 05/11', hora: '17h', razoes: [] },
    alternativas: [{ dia: 'Sexta, 06/11', hora: '10h', razoes: [] }],
  },
  disponibilidade: [],
};

const fetchFalso = jest.fn();
const URL_ORIGINAL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const FETCH_ORIGINAL = globalThis.fetch;

function responde(status: number, corpo?: unknown) {
  fetchFalso.mockResolvedValueOnce({
    status,
    ok: status >= 200 && status < 300,
    json: async () => corpo,
  });
}

/** O que a última chamada mandou: endereço, método e corpo já lido. */
function chamada() {
  const [url, init] = fetchFalso.mock.calls[fetchFalso.mock.calls.length - 1];
  return { url, metodo: init?.method ?? 'GET', corpo: init?.body ? JSON.parse(init.body) : undefined };
}

beforeEach(() => {
  fetchFalso.mockReset();
  globalThis.fetch = fetchFalso as unknown as typeof fetch;
  // Com a barra no fim, como às vezes alguém copia do `supabase status`.
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://192.168.0.10:54321/';
});

afterAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = URL_ORIGINAL;
  globalThis.fetch = FETCH_ORIGINAL;
});

describe('carregarPagina', () => {
  it('lê pelo token, na função, e devolve o recorte', async () => {
    responde(200, PAGINA);
    expect(await carregarPagina(TOKEN)).toEqual(PAGINA);
    expect(chamada()).toEqual({ url: `${FUNCAO}?token=${TOKEN}`, metodo: 'GET', corpo: undefined });
  });

  it('404 é LinkInvalido: o token trocado e o que nunca existiu são o mesmo caso', async () => {
    responde(404);
    const erro = await carregarPagina(TOKEN).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(LinkInvalido);
    expect(erro).toBeInstanceOf(ErroDoLink);
    expect(ehLinkInvalido(erro)).toBe(true);
  });

  it('sem rede é ErroDoLink sem status, e não link inválido', async () => {
    fetchFalso.mockRejectedValueOnce(new TypeError('Network request failed'));
    const erro = await carregarPagina(TOKEN).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroDoLink);
    expect((erro as ErroDoLink).status).toBeNull();
    expect(ehLinkInvalido(erro)).toBe(false);
  });

  it('a função caída (500) é ErroDoLink com o status', async () => {
    responde(500);
    const erro = await carregarPagina(TOKEN).catch((e: unknown) => e);
    expect((erro as ErroDoLink).status).toBe(500);
    expect(ehLinkInvalido(erro)).toBe(false);
  });

  it('sem a URL do Supabase no ambiente, rejeita dizendo o que falta', async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    await expect(carregarPagina(TOKEN)).rejects.toThrow(/EXPO_PUBLIC_SUPABASE_URL/);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});

describe('responder', () => {
  it('aceitar leva a janela marcada, só dia e hora, e devolve a página como ficou', async () => {
    const depois = { ...PAGINA, proposta: null, agendada: { dia: 'Sexta, 06/11', hora: '10h' } };
    responde(200, depois);
    const alternativa = { dia: 'Sexta, 06/11', hora: '10h', motivo: 'livre', razoes: ['x'] };

    expect(await responder(TOKEN, 'aceita', alternativa)).toEqual(depois);
    expect(chamada()).toEqual({
      url: FUNCAO,
      metodo: 'POST',
      corpo: { token: TOKEN, acao: 'responder', status: 'aceita', janela: { dia: 'Sexta, 06/11', hora: '10h' } },
    });
  });

  it('recusar não leva janela', async () => {
    responde(200, { ...PAGINA, proposta: null });
    await responder(TOKEN, 'recusada');
    expect(chamada().corpo).toEqual({ token: TOKEN, acao: 'responder', status: 'recusada' });
  });

  it('a proposta já respondida (409) é ErroDoLink, e não link inválido', async () => {
    responde(409);
    const erro = await responder(TOKEN, 'aceita').catch((e: unknown) => e);
    expect((erro as ErroDoLink).status).toBe(409);
    expect(ehLinkInvalido(erro)).toBe(false);
  });

  it('o link trocado no meio do caminho também é LinkInvalido', async () => {
    responde(404);
    await expect(responder(TOKEN, 'aceita')).rejects.toBeInstanceOf(LinkInvalido);
  });
});

describe('enviarDisponibilidade', () => {
  it('manda os blocos para a função', async () => {
    const blocos = [
      { dia: 'seg' as const, faixa: 'tarde' as const },
      { dia: 'qua' as const, faixa: 'noite' as const },
    ];
    responde(200, { ...PAGINA, disponibilidade: blocos });

    expect((await enviarDisponibilidade(TOKEN, blocos)).disponibilidade).toEqual(blocos);
    expect(chamada()).toEqual({
      url: FUNCAO,
      metodo: 'POST',
      corpo: { token: TOKEN, acao: 'disponibilidade', blocos },
    });
  });
});
