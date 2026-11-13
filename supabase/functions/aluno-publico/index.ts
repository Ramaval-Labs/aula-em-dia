/**
 * A página do aluno pelo link `/a/<token>` (Parte 6, SCRUM-22).
 *
 *   GET  ?token=…                                     → o recorte do aluno
 *   POST { token, acao: 'responder', status, janela? } → aceita ou recusa a proposta
 *   POST { token, acao: 'disponibilidade', blocos }    → o que o aluno pode
 *
 * O aluno não tem login (`verify_jwt = false` no config.toml): o token é a
 * credencial. Por isso a função usa a service role, que só existe aqui, e com
 * ela a RLS não filtra nada. **O `token_publico` é a única barreira**: a
 * primeira leitura é pelo token, e tudo o mais sai da linha que ela achou.
 *
 * Token que não acha aluno, de qualquer jeito, é 404 sem corpo: o trocado por
 * "Gerar novo link", o que nunca existiu, o mal formado e o do aluno
 * arquivado. A página do aluno mostra a mesma frase para todos, e ela não diz
 * que o link já valeu um dia (PO, 26/10).
 *
 * A função não calcula regra (D3). O recorte é o `paginaDoAluno` do domínio, a
 * reposição aceita é o `marcarReposicao` que a store do professor já usa, e a
 * gravação é a mesma RPC `aplicar_movimento` da 0005, com a versão lida: uma
 * resposta não sobrescreve um movimento que o professor gravou no meio.
 *
 * O token nunca vai para log.
 *
 * Só as origens da página do aluno chamam pelo navegador (SCRUM-82, P3-4): a
 * Vercel e o Expo Web local, listadas em `cors.mjs`. Pedido com outra origem é
 * 403, antes de tocar no banco. Pedido sem origem (curl, o teste do CI) segue:
 * o CORS só protege o navegador, e quem não é navegador manda o cabeçalho que
 * quiser.
 */

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';

import {
  alunoParaBanco,
  datasDoBanco,
  janelaVencida,
  DIAS,
  FAIXAS_HORARIAS,
  hoje,
  lancamentoDoMovimento,
  marcarReposicao,
  montarPersistido,
  paginaDoAluno,
} from '../_shared/dominio.js';

import { corsPara, origemEstranha } from './cors.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Cabecalhos = Record<string, string>;

function resposta(cors: Cabecalhos, status: number, corpo?: unknown): Response {
  const cabecalhos = {
    ...cors,
    // A resposta é de uma pessoa só: nada de cache no caminho, nem buscador.
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  };
  if (corpo === undefined) return new Response(null, { status, headers: cabecalhos });
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhos, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** Encerra o pedido com um status sem corpo, de qualquer ponto da função. */
class Recusa extends Error {
  constructor(readonly status: number) {
    super(String(status));
  }
}

const NAO_ACHOU = 404;
/** Pedido de uma origem fora da lista (P3-4). */
const ORIGEM_RECUSADA = 403;
/** A proposta já foi respondida, ou o professor gravou o aluno no meio. */
const CONFLITO = 409;
const PEDIDO_INVALIDO = 400;

type Banco = SupabaseClient;

function exigir<T>(r: { data: T | null; error: { message?: string } | null }, oQue: string): T {
  if (r.error) throw new Error(`[aluno-publico] ${oQue}: ${r.error.message ?? 'falhou'}`);
  return r.data as T;
}

// --- Leitura -------------------------------------------------------------------------

/**
 * O aluno do token e o que o recorte precisa. A primeira consulta é pelo
 * token; as outras usam o aluno e o professor que ela achou. As dos outros
 * alunos e da grade do professor servem só para o motor calcular as janelas da
 * proposta, e nada delas sai na resposta: o `paginaDoAluno` escolhe campo a
 * campo.
 */
async function ler(banco: Banco, token: string) {
  if (!UUID.test(token)) throw new Recusa(NAO_ACHOU);

  const linha = exigir(
    await banco.from('alunos').select('*').eq('token_publico', token).maybeSingle(),
    'ler o aluno',
  );
  if (!linha || linha.arquivado) throw new Recusa(NAO_ACHOU);

  const professorId: string = linha.professor_id;
  const [professor, politicas, disponibilidade, alunos, lancamentos, propostas] = await Promise.all([
    banco.from('professores').select('*').eq('id', professorId).single(),
    banco.from('politicas').select('*').eq('professor_id', professorId).single(),
    banco.from('disponibilidades').select('*').eq('professor_id', professorId).single(),
    banco.from('alunos').select('*').eq('professor_id', professorId),
    // Só o extrato deste aluno, do mais novo para o mais antigo.
    banco
      .from('lancamentos')
      .select('*')
      .eq('aluno_id', linha.id)
      .order('criado_em', { ascending: false }),
    banco.from('propostas').select('*').eq('professor_id', professorId).eq('status', 'enviada'),
  ]);

  const persistido = montarPersistido({
    professor: exigir(professor, 'ler o professor'),
    politicas: exigir(politicas, 'ler a política'),
    disponibilidade: exigir(disponibilidade, 'ler a disponibilidade'),
    alunos: exigir(alunos, 'ler os alunos'),
    lancamentos: exigir(lancamentos, 'ler o extrato'),
    propostas: exigir(propostas, 'ler as propostas'),
  });
  const aluno = persistido.alunos.find((a: { id: string }) => a.id === linha.id);
  const pagina = paginaDoAluno(
    aluno,
    persistido.extratos[linha.id] ?? [],
    persistido.perfil,
    persistido.politicas,
    persistido.alunos,
    persistido.disponibilidade,
  );
  return { linha, aluno, pagina };
}

// --- Gravação ------------------------------------------------------------------------

async function mover(
  banco: Banco,
  aluno: unknown,
  linha: { versao: number },
  extra: { p_lancamento?: unknown; p_proposta: unknown },
) {
  const { error } = await banco.rpc('aplicar_movimento', {
    // As datas da linha lida voltam com o ano que tinham: inferir de novo
    // estragaria as antigas (SCRUM-83).
    p_aluno: alunoParaBanco(aluno, undefined, datasDoBanco(linha)),
    p_versao: linha.versao,
    ...extra,
  });
  // O horário ocupado (0007) também é 409: a página relê, e o recorte já não
  // oferece a janela que outro aluno pegou.
  if (error?.message === 'conflito_de_versao' || error?.message === 'horario_ocupado') {
    throw new Recusa(CONFLITO);
  }
  if (error) throw new Error(`[aluno-publico] gravar a resposta: ${error.message}`);
}

const mesmaJanela = (a: { dia: string; hora: string }, b: { dia: string; hora: string }) =>
  a.dia === b.dia && a.hora === b.hora;

/** `{ dia, hora }` com textos: o que a página manda quando o aluno toca numa janela. */
function ehJanela(j: unknown): j is { dia: string; hora: string } {
  if (typeof j !== 'object' || j === null) return false;
  const { dia, hora } = j as { dia?: unknown; hora?: unknown };
  return typeof dia === 'string' && typeof hora === 'string';
}

async function responder(banco: Banco, token: string, corpo: Record<string, unknown>) {
  const { status, janela } = corpo;
  if (status !== 'aceita' && status !== 'recusada') throw new Recusa(PEDIDO_INVALIDO);
  // A janela vem ausente ou como a página a manda. `null`, texto, número ou
  // objeto sem os campos são 400, antes de tocar no banco (P3-1): antes, o
  // `null` derrubava a comparação abaixo num 500.
  if (janela !== undefined && !ehJanela(janela)) throw new Recusa(PEDIDO_INVALIDO);

  const { linha, aluno, pagina } = await ler(banco, token);
  // Sem proposta aberta não há o que responder: a segunda resposta seguida
  // cai aqui e não marca a reposição de novo.
  if (!pagina.proposta) throw new Recusa(CONFLITO);

  if (status === 'recusada') {
    // Só fecha a proposta: o aluno não muda e não há lançamento.
    return mover(banco, aluno, linha, { p_proposta: { status: 'recusada' } });
  }

  // A janela que já passou dá 409, como a proposta que mudou no meio: a página
  // relê e não a oferece mais (SCRUM-79). A principal vencida já chega aqui sem
  // proposta; isto pega a alternativa vencida, que senão cairia no 400 abaixo.
  if (janela !== undefined && janelaVencida(janela, hoje())) throw new Recusa(CONFLITO);

  // A janela tem de ser uma das que a página ofereceu, e não uma qualquer.
  const ofertadas = [pagina.proposta.principal, ...pagina.proposta.alternativas];
  const escolhida =
    janela === undefined
      ? pagina.proposta.principal
      : ofertadas.find((o: { dia: string; hora: string }) => mesmaJanela(o, janela));
  if (!escolhida) throw new Recusa(PEDIDO_INVALIDO);

  const marcado = marcarReposicao(aluno, { dia: escolhida.dia, hora: escolhida.hora }, hoje());
  return mover(banco, marcado.aluno, linha, {
    p_lancamento: lancamentoDoMovimento(marcado.lancamento, 'reposicao'),
    p_proposta: { status: 'aceita' },
  });
}

const DIAS_VALIDOS = new Set<string>(DIAS.map((d: { chave: string }) => d.chave));
const FAIXAS_VALIDAS = new Set<string>(FAIXAS_HORARIAS);

/** Os blocos como o app grava, `{ dia, faixa }`, sem campo a mais e sem repetido. */
function blocosValidos(blocos: unknown): { dia: string; faixa: string }[] | null {
  if (!Array.isArray(blocos) || blocos.length > DIAS_VALIDOS.size * FAIXAS_VALIDAS.size) return null;
  const vistos = new Set<string>();
  const saida: { dia: string; faixa: string }[] = [];
  for (const b of blocos) {
    const { dia, faixa } = (b ?? {}) as { dia?: unknown; faixa?: unknown };
    if (typeof dia !== 'string' || !DIAS_VALIDOS.has(dia)) return null;
    if (typeof faixa !== 'string' || !FAIXAS_VALIDAS.has(faixa)) return null;
    const chave = `${dia}:${faixa}`;
    if (!vistos.has(chave)) saida.push({ dia, faixa });
    vistos.add(chave);
  }
  return saida;
}

async function enviarDisponibilidade(banco: Banco, token: string, corpo: Record<string, unknown>) {
  const blocos = blocosValidos(corpo.blocos);
  if (!blocos) throw new Recusa(PEDIDO_INVALIDO);
  if (!UUID.test(token)) throw new Recusa(NAO_ACHOU);

  // Gravação direta, como a `salvarDisponibilidadeDoAluno` do professor (Parte
  // 4): não é movimento e não mexe na versão. O filtro é o token.
  const gravadas = exigir(
    await banco
      .from('alunos')
      .update({ disponibilidade: blocos })
      .eq('token_publico', token)
      .eq('arquivado', false)
      .select('id'),
    'gravar a disponibilidade',
  );
  if (!gravadas || gravadas.length === 0) throw new Recusa(NAO_ACHOU);
}

// --- Entrada -------------------------------------------------------------------------

function banco(): Banco {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve(async (pedido) => {
  const origem = pedido.headers.get('Origin');
  const cors = corsPara(origem);
  // Origem fora da lista: 403 para tudo, o preflight inclusive, e sem tocar no
  // banco. Sem origem, segue.
  if (origemEstranha(origem)) return resposta(cors, ORIGEM_RECUSADA);
  if (pedido.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const db = banco();

    if (pedido.method === 'GET') {
      const token = new URL(pedido.url).searchParams.get('token') ?? '';
      return resposta(cors, 200, (await ler(db, token)).pagina);
    }

    if (pedido.method === 'POST') {
      const corpo = (await pedido.json().catch(() => null)) as Record<string, unknown> | null;
      if (!corpo || typeof corpo.token !== 'string') throw new Recusa(NAO_ACHOU);
      if (corpo.acao === 'responder') await responder(db, corpo.token, corpo);
      else if (corpo.acao === 'disponibilidade') await enviarDisponibilidade(db, corpo.token, corpo);
      else throw new Recusa(PEDIDO_INVALIDO);
      // A página como ficou, para a tela do aluno não precisar ler de novo.
      return resposta(cors, 200, (await ler(db, corpo.token)).pagina);
    }

    return resposta(cors, 405);
  } catch (erro) {
    if (erro instanceof Recusa) return resposta(cors, erro.status);
    // Só a mensagem: o pedido, que leva o token, não vai para o log.
    console.error(erro instanceof Error ? erro.message : 'falha sem mensagem');
    return resposta(cors, 500);
  }
});
