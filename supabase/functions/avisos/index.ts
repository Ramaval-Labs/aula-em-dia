/**
 * Os lembretes do professor por push (Parte 7, SCRUM-23).
 *
 *   POST ?tipo=resumo   → o resumo do dia, às 7h de Brasília
 *   POST ?tipo=aula     → o aviso de cada aula que começa daqui a uma hora
 *
 * Quem chama é o `pg_cron`, pela `chamar_avisos` da 0010, com o segredo
 * `AVISOS_SEGREDO` no `Authorization`. Não há login de professor aqui
 * (`verify_jwt = false`): a função manda push para todos, então só quem tem o
 * segredo a dispara. Pedido sem ele é 401, antes de tocar no banco.
 *
 * **A regra não é reescrita aqui** (decisão D3). O que avisar sai do bundle do
 * domínio: `avisosDoDia` + `resumoDoDia` e `aulasDaProximaHora` +
 * `avisoDaAula` (SCRUM-91). A função lê, decide para quem mandar e manda.
 *
 * **O relógio é o de Brasília, calculado uma vez** (UTC−3, sem horário de
 * verão desde 2019), e passado à regra. O relógio do servidor não decide o dia.
 *
 * **Nada repete.** O resumo marca `professores.ultimo_resumo` antes de mandar,
 * e o aviso da aula insere em `avisos_enviados`; só manda quem marcou. Se o
 * Expo recusar, a marca é desfeita, para uma nova chamada tentar de novo.
 *
 * O push sai pela API do Expo, no endereço de `EXPO_PUSH_URL`: o teste aponta
 * para um servidor falso. Nem token nem nome de aluno vão para o log ou para a
 * resposta, que só conta quantos saíram.
 */

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';

import {
  alunoDoBanco,
  aulasDaProximaHora,
  avisoDaAula,
  avisosDoDia,
  preferenciasDeAvisoDe,
  resumoDoDia,
} from '../_shared/dominio.js';

const EXPO_PUSH_URL = Deno.env.get('EXPO_PUSH_URL') ?? 'https://exp.host/--/api/v2/push/send';
const TITULO = 'Aula em Dia';
/** Brasília é UTC−3 o ano todo desde 2019. */
const FUSO_DE_BRASILIA_EM_HORAS = -3;
/** O aviso de aula guardado por uma semana basta para não repetir. */
const DIAS_DE_HISTORICO = 7;

type Tipo = 'resumo' | 'aula';
type Banco = SupabaseClient;

function resposta(status: number, corpo?: unknown): Response {
  const cabecalhos = { 'Cache-Control': 'no-store' };
  if (corpo === undefined) return new Response(null, { status, headers: cabecalhos });
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhos, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** Compara sem sair na primeira diferença: o tempo não conta quanto do segredo acertou. */
function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

function autorizado(pedido: Request): boolean {
  const segredo = Deno.env.get('AVISOS_SEGREDO');
  if (!segredo) return false; // sem segredo configurado, ninguém dispara
  return iguais(pedido.headers.get('Authorization') ?? '', `Bearer ${segredo}`);
}

/**
 * O agora em Brasília: o dia em `dd/mm` para a regra, em `aaaa-mm-dd` para o
 * banco, a hora cheia, e uma referência ao meio-dia desse dia no fuso do
 * servidor, que é o que o conversor usa para contar dias.
 */
function relogioDeBrasilia(agora: Date) {
  const b = new Date(agora.getTime() + FUSO_DE_BRASILIA_EM_HORAS * 3_600_000);
  const ano = b.getUTCFullYear();
  const mes = b.getUTCMonth() + 1;
  const dia = b.getUTCDate();
  const dd = String(dia).padStart(2, '0');
  const mm = String(mes).padStart(2, '0');
  return {
    hoje: `${dd}/${mm}`,
    data: `${ano}-${mm}-${dd}`,
    hora: b.getUTCHours(),
    referencia: new Date(ano, mes - 1, dia, 12),
  };
}
type Relogio = ReturnType<typeof relogioDeBrasilia>;

function exigir<T>(r: { data: T | null; error: { message?: string } | null }, oQue: string): T {
  if (r.error) throw new Error(`[avisos] ${oQue}: ${r.error.message ?? 'falhou'}`);
  return r.data as T;
}

/** Um push pela API do Expo. `true` só quando o Expo aceitou. */
async function mandar(token: string, corpo: string): Promise<boolean> {
  try {
    const r = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify([{ to: token, title: TITULO, body: corpo, sound: 'default' }]),
    });
    if (!r.ok) return false;
    const json = await r.json();
    return json?.data?.[0]?.status === 'ok';
  } catch {
    return false;
  }
}

interface Professor {
  id: string;
  token_push: string;
  preferencias_aviso: unknown;
  ultimo_resumo: string | null;
}

/** Os professores com aparelho registrado, e os alunos de cada um já como o app os vê. */
async function ler(banco: Banco, relogio: Relogio) {
  const professores = exigir<Professor[]>(
    await banco
      .from('professores')
      .select('id, token_push, preferencias_aviso, ultimo_resumo')
      .not('token_push', 'is', null),
    'ler os professores',
  );
  if (professores.length === 0) return [];

  const ids = professores.map((p) => p.id);
  const [alunos, propostas] = await Promise.all([
    banco.from('alunos').select('*').in('professor_id', ids),
    // A proposta aberta conta: com ela, a reposição já tem horário em espera.
    banco.from('propostas').select('*').in('professor_id', ids).eq('status', 'enviada'),
  ]);
  const linhas = exigir<{ id: string; professor_id: string }[]>(alunos, 'ler os alunos');
  const abertas = exigir<{ aluno_id: string }[]>(propostas, 'ler as propostas');
  const propostaDe = new Map(abertas.map((p) => [p.aluno_id, p]));

  return professores.map((p) => ({
    professor: p,
    preferencias: preferenciasDeAvisoDe(p.preferencias_aviso),
    alunos: linhas
      .filter((l) => l.professor_id === p.id)
      .map((l) => alunoDoBanco(l, propostaDe.get(l.id), relogio.referencia)),
  }));
}

type Lido = Awaited<ReturnType<typeof ler>>[number];

/** Um resumo por professor por dia. `null` da regra é dia sem push. */
async function resumo(banco: Banco, relogio: Relogio, { professor, preferencias, alunos }: Lido) {
  const texto = resumoDoDia(avisosDoDia(alunos, preferencias, relogio.hoje));
  if (texto === null) return false;

  // Marca antes de mandar: só uma chamada do dia passa por aqui.
  const marcados = exigir<unknown[]>(
    await banco
      .from('professores')
      .update({ ultimo_resumo: relogio.data })
      .eq('id', professor.id)
      .or(`ultimo_resumo.is.null,ultimo_resumo.neq.${relogio.data}`)
      .select('id'),
    'marcar o resumo',
  );
  if (marcados.length === 0) return false;

  if (await mandar(professor.token_push, texto)) return true;
  await banco.from('professores').update({ ultimo_resumo: professor.ultimo_resumo }).eq('id', professor.id);
  return false;
}

/** Um aviso por aula: por aluno, dia e hora. */
async function aulas(banco: Banco, relogio: Relogio, { professor, preferencias, alunos }: Lido) {
  let enviados = 0;
  for (const aviso of aulasDaProximaHora(alunos, preferencias, relogio.hoje, relogio.hora)) {
    const chave = { aluno_id: aviso.id, dia: relogio.data, hora: aviso.hora };
    const marcados = exigir<unknown[]>(
      await banco
        .from('avisos_enviados')
        .upsert({ ...chave, professor_id: professor.id }, {
          onConflict: 'aluno_id,dia,hora',
          ignoreDuplicates: true,
        })
        .select('aluno_id'),
      'marcar o aviso',
    );
    if (marcados.length === 0) continue;

    if (await mandar(professor.token_push, avisoDaAula(aviso))) {
      enviados++;
    } else {
      await banco.from('avisos_enviados').delete().match(chave);
    }
  }
  return enviados;
}

function cliente(): Banco {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** `agora` só para o teste fixar o relógio; quem o manda já tem o segredo. */
function agoraDo(url: URL): Date | null {
  const valor = url.searchParams.get('agora');
  if (valor === null) return new Date();
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

Deno.serve(async (pedido) => {
  if (!autorizado(pedido)) return resposta(401);
  if (pedido.method !== 'POST') return resposta(405);

  const url = new URL(pedido.url);
  const tipo = url.searchParams.get('tipo') as Tipo | null;
  const agora = agoraDo(url);
  if ((tipo !== 'resumo' && tipo !== 'aula') || agora === null) return resposta(400);

  const relogio = relogioDeBrasilia(agora);
  try {
    const banco = cliente();
    const lidos = await ler(banco, relogio);
    let enviados = 0;
    for (const lido of lidos) {
      enviados += tipo === 'resumo'
        ? Number(await resumo(banco, relogio, lido))
        : await aulas(banco, relogio, lido);
    }
    if (tipo === 'aula') {
      await banco
        .from('avisos_enviados')
        .delete()
        .lt('dia', new Date(Date.parse(relogio.data) - DIAS_DE_HISTORICO * 86_400_000).toISOString().slice(0, 10));
    }
    return resposta(200, { tipo, dia: relogio.data, hora: relogio.hora, professores: lidos.length, enviados });
  } catch (erro) {
    console.error(erro instanceof Error ? erro.message : '[avisos] falhou');
    return resposta(500);
  }
});
