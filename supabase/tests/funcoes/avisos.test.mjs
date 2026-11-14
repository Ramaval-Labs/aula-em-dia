// A Edge Function `avisos` contra um Expo Push falso (SCRUM-23).
//
// O que prova:
//   - só quem tem o AVISOS_SEGREDO dispara a função;
//   - o resumo sai uma vez por professor e por dia, e a segunda chamada não manda nada;
//   - o aviso da aula sai uma vez por aluno, dia e hora, só para a aula da próxima hora;
//   - professor sem token, sem preferência ligada ou sem nada a avisar não recebe nada;
//   - o push que o Expo recusa é desfeito, e a chamada seguinte tenta de novo;
//   - nem token nem nome de aluno saem na resposta.
//
// O relógio é fixo: a função recebe `agora` como hoje às 17h de Brasília, e as
// aulas do teste são de hoje às 18h (a próxima hora) e às 19h (a seguinte).
//
// O Expo falso é um servidor HTTP aqui mesmo, na porta de EXPO_PUSH_URL. A
// função roda no Docker e o alcança por `host.docker.internal`.
//
// Como rodar, na raiz do repositório, com o Docker aberto:
//   npx supabase start
//   (cd mobile && npm run bundle:dominio)
//   printf 'AVISOS_SEGREDO=%s\nEXPO_PUSH_URL=http://host.docker.internal:54399\n' "$(openssl rand -hex 16)" > /tmp/avisos.env
//   npx supabase functions serve --env-file /tmp/avisos.env &
//   set -a; . /tmp/avisos.env; eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY)=')"; set +a
//   node supabase/tests/funcoes/avisos.test.mjs
//
// Só no banco local: o teste recusa uma URL que não seja local. Nenhum token,
// chave ou segredo vai para a saída.

import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';

const { API_URL, SERVICE_ROLE_KEY, AVISOS_SEGREDO, EXPO_PUSH_URL } = process.env;

if (!API_URL || !SERVICE_ROLE_KEY || !AVISOS_SEGREDO || !EXPO_PUSH_URL) {
  console.error('Faltam API_URL, SERVICE_ROLE_KEY, AVISOS_SEGREDO e EXPO_PUSH_URL (ver o topo do arquivo).');
  process.exit(2);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API_URL.replace(/\/+$/, ''))) {
  console.error('Este teste só roda contra o Supabase local.');
  process.exit(2);
}

const FUNCAO = `${API_URL}/functions/v1/avisos`;
const PORTA_DO_EXPO = Number(new URL(EXPO_PUSH_URL).port);

// --- o Expo falso ---------------------------------------------------------------------

/** Todo push que chegou, na ordem. O token com "falha" é recusado, como o Expo faz. */
const recebidos = [];
const expo = createServer((pedido, resposta) => {
  let corpo = '';
  pedido.on('data', (parte) => (corpo += parte));
  pedido.on('end', () => {
    const mensagens = JSON.parse(corpo || '[]');
    const data = mensagens.map((m) => {
      recebidos.push(m);
      return m.to.includes('falha')
        ? { status: 'error', message: 'DeviceNotRegistered', details: { error: 'DeviceNotRegistered' } }
        : { status: 'ok', id: randomBytes(4).toString('hex') };
    });
    resposta.writeHead(200, { 'Content-Type': 'application/json' });
    resposta.end(JSON.stringify({ data }));
  });
});
await new Promise((pronto) => expo.listen(PORTA_DO_EXPO, '0.0.0.0', pronto));

const pushesPara = (token) => recebidos.filter((m) => m.to === token);

// --- o relógio ------------------------------------------------------------------------

/** Hoje em Brasília (UTC−3), às 17h: as aulas das 18h são as da próxima hora. */
const brasilia = new Date(Date.now() - 3 * 3_600_000);
const AGORA = new Date(
  Date.UTC(brasilia.getUTCFullYear(), brasilia.getUTCMonth(), brasilia.getUTCDate(), 17 + 3),
).toISOString();
const DIA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][brasilia.getUTCDay()];
const DATA = AGORA.slice(0, 10);

// --- as pessoas do teste --------------------------------------------------------------

const RODADA = randomBytes(4).toString('hex');
const token = (quem) => `ExponentPushToken[${quem}-${RODADA}]`;
const DESLIGADAS = {
  aulaDoDia: false, saldoBaixo: false, reposicaoPendente: false, pagamentoVencendo: false, antesDaAula: false,
};
const aula = (hora) => ({ dias: [DIA], hora });

const PROFESSORES = {
  // tudo no padrão (preferências nulas), duas aulas hoje: às 18h e às 19h
  a: { token: token('a'), preferencias: null, alunos: [['Carolina Sentinelaum', aula(18)], ['Otavio Sentineladois', aula(19)]] },
  // tudo desligado, com aula às 18h: nada
  b: { token: token('b'), preferencias: DESLIGADAS, alunos: [['Bruno Sentinelatres', aula(18)]] },
  // sem aparelho, com aula às 18h: nada
  c: { token: null, preferencias: null, alunos: [['Celia Sentinelaquatro', aula(18)]] },
  // com aparelho e sem alunos: nada a avisar
  d: { token: token('d'), preferencias: null, alunos: [] },
  // o Expo recusa o aparelho dele
  e: { token: token('falha-e'), preferencias: null, alunos: [['Elisa Sentinelacinco', aula(18)]] },
};
const NOMES = Object.values(PROFESSORES).flatMap((p) => p.alunos.map(([nome]) => nome));

// --- pedidos --------------------------------------------------------------------------

const comoServico = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function pedir(url, { metodo = 'GET', cabecalhos = {}, corpo } = {}) {
  const r = await fetch(url, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: r.status, texto: await r.text() };
}

async function exigir(oQue, promessa, esperado = [200, 201, 204]) {
  const r = await promessa;
  if (!esperado.includes(r.status)) throw new Error(`preparar o teste: ${oQue} deu HTTP ${r.status}`);
  return r.texto ? JSON.parse(r.texto) : null;
}

const rest = (caminho, opcoes) => pedir(`${API_URL}/rest/v1/${caminho}`, opcoes);

const chamar = (tipo, cabecalhos = { Authorization: `Bearer ${AVISOS_SEGREDO}` }, metodo = 'POST') =>
  pedir(`${FUNCAO}?tipo=${tipo}&agora=${encodeURIComponent(AGORA)}`, { metodo, cabecalhos });

const criados = [];

async function criarProfessor(chave, p) {
  const usuario = await exigir(
    `criar o professor ${chave}`,
    pedir(`${API_URL}/auth/v1/admin/users`, {
      metodo: 'POST',
      cabecalhos: comoServico,
      corpo: { email: `prof.${chave}.${RODADA}@sentinela.test`, password: randomBytes(18).toString('base64url'), email_confirm: true },
    }),
  );
  criados.push(usuario.id);
  await exigir(
    `gravar o professor ${chave}`,
    rest(`professores?id=eq.${usuario.id}`, {
      metodo: 'PATCH',
      cabecalhos: comoServico,
      corpo: { token_push: p.token, preferencias_aviso: p.preferencias, onboarding_concluido: true },
    }),
  );
  for (const [nome, aulaFixa] of p.alunos) {
    await exigir(
      `criar um aluno do ${chave}`,
      rest('alunos', {
        metodo: 'POST',
        cabecalhos: comoServico,
        corpo: {
          professor_id: usuario.id, nome, disciplina: 'Piano', dia: 'hoje', hora: `${aulaFixa.hora}h`,
          aula_fixa: aulaFixa, sem_pacote: true,
        },
      }),
    );
  }
  return usuario.id;
}

async function ultimoResumo(id) {
  const [linha] = await exigir('ler o professor', rest(`professores?id=eq.${id}&select=ultimo_resumo`, { cabecalhos: comoServico }));
  return linha.ultimo_resumo;
}

/** A função sobe em segundo plano no CI: espera ela responder. */
async function esperarAFuncao() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(FUNCAO, { method: 'POST' });
      if (r.status === 401) return;
    } catch {
      // ainda subindo
    }
    await new Promise((pronto) => setTimeout(pronto, 2000));
  }
  throw new Error('a função não respondeu em 2 minutos: o `functions serve` está no ar?');
}

// --- conferências ---------------------------------------------------------------------

let falhas = 0;
function conferir(nome, ok, detalhe = '') {
  if (!ok) falhas++;
  console.log(`${ok ? 'ok  ' : 'FALHOU'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

/** A resposta só conta: nem token, nem nome de aluno. */
function semDados(r) {
  return !r.texto.includes('ExponentPushToken') && NOMES.every((n) => !r.texto.includes(n.split(' ')[0]));
}

try {
  await esperarAFuncao();
  const ids = {};
  for (const [chave, p] of Object.entries(PROFESSORES)) ids[chave] = await criarProfessor(chave, p);

  // 1. Só com o segredo.
  let r = await chamar('resumo', {});
  conferir('sem o segredo: 401', r.status === 401, `HTTP ${r.status}`);
  r = await chamar('resumo', { Authorization: 'Bearer outro' });
  conferir('com o segredo errado: 401', r.status === 401, `HTTP ${r.status}`);
  r = await chamar('qualquer');
  conferir('tipo que não existe: 400', r.status === 400, `HTTP ${r.status}`);
  r = await chamar('resumo', undefined, 'GET');
  conferir('GET: 405', r.status === 405, `HTTP ${r.status}`);
  conferir('  e nada foi mandado', recebidos.length === 0, `${recebidos.length} push(es)`);

  // 2. O resumo do dia.
  r = await chamar('resumo');
  conferir('o resumo: 200', r.status === 200, `HTTP ${r.status}`);
  conferir('  a resposta não leva token nem nome', semDados(r));
  const resumoDoA = pushesPara(PROFESSORES.a.token);
  conferir('o A recebe um resumo', resumoDoA.length === 1, `${resumoDoA.length}`);
  conferir('  com a frase da regra', resumoDoA[0]?.body === 'Hoje: 2 aulas.' && resumoDoA[0]?.title === 'Aula em Dia');
  conferir('  e o dia fica marcado', (await ultimoResumo(ids.a)) === DATA);
  conferir('o B, com tudo desligado, nada', pushesPara(PROFESSORES.b.token).length === 0);
  conferir('o D, sem nada a avisar, nada', pushesPara(PROFESSORES.d.token).length === 0);
  conferir('  e o dia dele não fica marcado', (await ultimoResumo(ids.d)) === null);
  conferir('o E tentou, e o Expo recusou', pushesPara(PROFESSORES.e.token).length === 1);
  conferir('  então o dia dele não fica marcado', (await ultimoResumo(ids.e)) === null);
  conferir('só os aparelhos do A e do E foram chamados',
    recebidos.every((m) => m.to === PROFESSORES.a.token || m.to === PROFESSORES.e.token));

  r = await chamar('resumo');
  conferir('o resumo de novo, no mesmo dia: 200', r.status === 200, `HTTP ${r.status}`);
  conferir('  e o A não recebe outro', pushesPara(PROFESSORES.a.token).length === 1);
  conferir('  o E, que falhou, é tentado de novo', pushesPara(PROFESSORES.e.token).length === 2);

  // 3. O aviso antes da aula.
  const antes = recebidos.length;
  r = await chamar('aula');
  conferir('o aviso da aula: 200', r.status === 200, `HTTP ${r.status}`);
  conferir('  a resposta não leva token nem nome', semDados(r));
  const avisosDoA = pushesPara(PROFESSORES.a.token).slice(1);
  conferir('o A recebe um aviso, só da aula das 18h', avisosDoA.length === 1, `${avisosDoA.length}`);
  conferir('  com a frase da regra', avisosDoA[0]?.body === 'Aula com Carolina às 18h.');
  conferir('o B, com o aviso desligado, nada', pushesPara(PROFESSORES.b.token).length === 0);
  const marcados = await exigir('ler os avisos', rest(
    `avisos_enviados?professor_id=in.(${ids.a},${ids.e})&select=professor_id,hora,dia`,
    { cabecalhos: comoServico },
  ));
  conferir('o aviso do A fica marcado, com o dia e a hora',
    marcados.length === 1 && marcados[0].professor_id === ids.a && marcados[0].hora === 18 && marcados[0].dia === DATA,
    `${marcados.length} marcado(s)`);
  conferir('  e o do E, que o Expo recusou, não', marcados.every((m) => m.professor_id !== ids.e));

  r = await chamar('aula');
  conferir('o aviso da aula de novo, na mesma hora: 200', r.status === 200, `HTTP ${r.status}`);
  conferir('  e o A não recebe outro', pushesPara(PROFESSORES.a.token).length === 2);
  conferir('  o E é tentado de novo', pushesPara(PROFESSORES.e.token).length === 4);
  conferir('no total, só A e E foram chamados', recebidos.slice(antes).every(
    (m) => m.to === PROFESSORES.a.token || m.to === PROFESSORES.e.token,
  ));
} catch (erro) {
  falhas++;
  console.log(`FALHOU ${erro instanceof Error ? erro.message : 'sem mensagem'}`);
} finally {
  // O cascade leva professor, alunos e avisos enviados.
  for (const id of criados) {
    await pedir(`${API_URL}/auth/v1/admin/users/${id}`, { metodo: 'DELETE', cabecalhos: comoServico }).catch(() => {});
  }
  expo.close();
}

console.log(falhas ? `\n${falhas} conferência(s) falharam.` : '\nTudo certo: um resumo por dia, um aviso por aula, nada repetido.');
process.exit(falhas ? 1 : 0);
