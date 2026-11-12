// A Edge Function `aluno-publico` só entrega o aluno do link (SCRUM-81).
//
// O achado P2-5 da revisão da Parte 6 (docs/backend/revisoes/parte-6.md): a
// função usa a service role, então a RLS não protege nada lá dentro, e o filtro
// pelo `token_publico` é a única barreira entre um link e os dados de todos os
// professores. Este teste roda a função de verdade, servida localmente, contra
// o banco local, e quebra se ela devolver um campo a mais ou o dado de outro.
//
// Como funciona: cria dois professores e três alunos com valores-sentinela em
// tudo que não pode sair (sobrenomes, e-mails, telefone, chave Pix, valor da
// aula, o outro aluno, o outro professor) e procura essas sentinelas na resposta
// inteira. Depois confere os 404 sem corpo. No fim, apaga os dois professores, e
// o cascade leva o resto.
//
// Como rodar, na raiz do repositório, com o Docker aberto:
//   npx supabase start
//   (cd mobile && npm run bundle:dominio)
//   npx supabase functions serve aluno-publico &
//   set -a; eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY|PUBLISHABLE_KEY)=')"; set +a
//   node supabase/tests/funcoes/aluno-publico.test.mjs
//
// Só no banco local: o teste recusa uma URL que não seja local. Nenhum token
// nem chave vai para a saída.

import { randomBytes, randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const PUBLISHABLE_KEY = process.env.PUBLISHABLE_KEY;

if (!API_URL || !SERVICE_ROLE_KEY || !PUBLISHABLE_KEY) {
  console.error('Faltam API_URL, SERVICE_ROLE_KEY e PUBLISHABLE_KEY (ver o topo do arquivo).');
  process.exit(2);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API_URL.replace(/\/+$/, ''))) {
  console.error('Este teste só roda contra o Supabase local.');
  process.exit(2);
}

const FUNCAO = `${API_URL}/functions/v1/aluno-publico`;
// As chaves do recorte (`PaginaDoAluno`, mobile/src/dominio/paginaDoAluno.ts).
const CHAVES_DO_RECORTE = [
  'nome', 'disciplina', 'dia', 'hora', 'saldo', 'total', 'temPacote', 'validade',
  'agendada', 'regra', 'extrato', 'professor', 'proposta', 'disponibilidade',
];

// Uma marca por execução: duas rodadas no mesmo banco não se confundem.
const RODADA = randomBytes(4).toString('hex');
const SENHA_A = randomBytes(18).toString('base64url');

const PROF_A = {
  email: `prof.a.${RODADA}@sentinela.test`,
  nome: 'Primeironome Sobrenomeprofsentinela',
  chave_pix: `pix-sentinela-${RODADA}`,
  disciplinas: ['Piano', 'Disciplinasentinela'],
};
const PROF_B = {
  email: `prof.b.${RODADA}@sentinela.test`,
  nome: 'Outroprofessor Sobrenomeoutrosentinela',
  chave_pix: `pix-outro-sentinela-${RODADA}`,
  disciplinas: ['Violaosentinela'],
};
const ALUNO_1 = {
  id: randomUUID(),
  nome: 'Alunoum Sobrenomealunosentinela',
  telefone: '51999990001',
  email: `aluno.um.${RODADA}@sentinela.test`,
  valor_por_aula_centavos: 98765,
  total: 8,
  usadas: 1,
};
const ALUNO_2 = {
  id: randomUUID(),
  nome: 'Alunodois Sobrenomedoissentinela',
  telefone: '51999990002',
  email: `aluno.dois.${RODADA}@sentinela.test`,
};
const ALUNO_DO_B = {
  id: randomUUID(),
  nome: 'Alunodooutro Sobrenomedooutrosentinela',
  telefone: '51999990003',
};

// Nada disto pode aparecer na resposta do aluno 1.
const SENTINELAS = [
  'Sobrenomeprofsentinela', PROF_A.email, PROF_A.chave_pix, 'Disciplinasentinela',
  'Sobrenomealunosentinela', ALUNO_1.telefone, '999990001', ALUNO_1.email,
  '98765', '987,65', '987.65',
  'Alunodois', 'Sobrenomedoissentinela', ALUNO_2.telefone, ALUNO_2.email, ALUNO_2.id,
  'Outroprofessor', 'Sobrenomeoutrosentinela', PROF_B.email, PROF_B.chave_pix, 'Violaosentinela',
  'Alunodooutro', 'Sobrenomedooutrosentinela', ALUNO_DO_B.telefone, ALUNO_DO_B.id,
  'Lancamentosentinela', 'sentinela.test', ALUNO_1.id,
];

// --- pedidos -----------------------------------------------------------------------

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
  const texto = await r.text();
  return { status: r.status, texto, cabecalhos: r.headers };
}

async function exigir(oQue, promessa, esperado = [200, 201, 204]) {
  const r = await promessa;
  if (!esperado.includes(r.status)) {
    throw new Error(`preparar o teste: ${oQue} deu HTTP ${r.status}`);
  }
  return r.texto ? JSON.parse(r.texto) : null;
}

const rest = (caminho, opcoes) => pedir(`${API_URL}/rest/v1/${caminho}`, opcoes);

async function criarProfessor(p, senha) {
  const usuario = await exigir(
    `criar o login ${p.email}`,
    pedir(`${API_URL}/auth/v1/admin/users`, {
      metodo: 'POST',
      cabecalhos: comoServico,
      corpo: { email: p.email, password: senha, email_confirm: true },
    }),
  );
  // O trigger da 0003 criou o professor; o perfil entra por cima.
  await exigir(
    'gravar o perfil',
    rest(`professores?id=eq.${usuario.id}`, {
      metodo: 'PATCH',
      cabecalhos: comoServico,
      corpo: { nome: p.nome, chave_pix: p.chave_pix, disciplinas: p.disciplinas, onboarding_concluido: true },
    }),
  );
  return usuario.id;
}

async function criarAluno(professorId, a) {
  const [linha] = await exigir(
    `criar o aluno ${a.nome.split(' ')[0]}`,
    rest('alunos?select=id,token_publico', {
      metodo: 'POST',
      cabecalhos: { ...comoServico, Prefer: 'return=representation' },
      corpo: { dia: 'segunda', hora: '15h', disciplina: 'Piano', ...a, professor_id: professorId },
    }),
  );
  return linha.token_publico;
}

async function lancar(professorId, alunoId, titulo) {
  await exigir(
    'lançar no extrato',
    rest('lancamentos', {
      metodo: 'POST',
      cabecalhos: comoServico,
      corpo: {
        aluno_id: alunoId,
        professor_id: professorId,
        tipo: 'aula',
        data: new Date().toISOString().slice(0, 10),
        titulo,
        subtitulo: '',
        delta: -1,
        saldo_depois: 7,
      },
    }),
  );
}

/** A função sobe em segundo plano no CI: espera ela responder. */
async function esperarAFuncao() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(FUNCAO, { method: 'OPTIONS' });
      if (r.status === 200) return;
    } catch {
      // ainda subindo
    }
    await new Promise((pronto) => setTimeout(pronto, 2000));
  }
  throw new Error('a função não respondeu em 2 minutos: o `functions serve` está no ar?');
}

// --- conferências --------------------------------------------------------------------

let falhas = 0;
function conferir(nome, ok, detalhe = '') {
  if (!ok) falhas++;
  console.log(`${ok ? 'ok  ' : 'FALHOU'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

const pagina = (token) => pedir(`${FUNCAO}?token=${encodeURIComponent(token)}`);

/** Os cabeçalhos que não mudam de um pedido para outro. */
function forma(r) {
  const nomes = [...r.cabecalhos.keys()].filter(
    (n) => !/^(date|sb-|x-sb-|x-served-by|x-deno|x-kong|via|cf-|vary$|server$|content-length$|connection$|keep-alive$|access-control-allow-origin$)/i.test(n),
  );
  return nomes.sort().join(',');
}

async function conferir404(nome, token, formaEsperada) {
  const r = await pagina(token);
  conferir(`${nome}: 404 sem corpo`, r.status === 404 && r.texto === '', `HTTP ${r.status}, ${r.texto.length} bytes`);
  if (formaEsperada !== undefined) {
    conferir(`${nome}: os mesmos cabeçalhos do 404 inexistente`, forma(r) === formaEsperada);
  }
}

// --- o teste ---------------------------------------------------------------------------

const criados = [];
try {
  await esperarAFuncao();

  const profA = await criarProfessor(PROF_A, SENHA_A);
  criados.push(profA);
  const profB = await criarProfessor(PROF_B, randomBytes(18).toString('base64url'));
  criados.push(profB);

  const token1 = await criarAluno(profA, ALUNO_1);
  const token2 = await criarAluno(profA, ALUNO_2);
  await criarAluno(profB, ALUNO_DO_B);
  await lancar(profA, ALUNO_1.id, 'Aula realizada');
  await lancar(profA, ALUNO_2.id, 'Lancamentosentinela do aluno dois');
  await lancar(profB, ALUNO_DO_B.id, 'Lancamentosentinela do outro professor');

  // 1. O GET com o token do aluno 1.
  const r1 = await pagina(token1);
  conferir('o aluno do link: 200', r1.status === 200, `HTTP ${r1.status}`);
  const recorte = r1.status === 200 ? JSON.parse(r1.texto) : {};
  const chaves = Object.keys(recorte).sort();
  conferir(
    'as chaves são exatamente as do recorte',
    JSON.stringify(chaves) === JSON.stringify([...CHAVES_DO_RECORTE].sort()),
    chaves.join(', '),
  );
  conferir('só o primeiro nome do aluno', recorte.nome === 'Alunoum');
  conferir(
    'do professor, só o primeiro nome e a primeira disciplina',
    JSON.stringify(recorte.professor) === JSON.stringify({ nome: 'Primeironome', disciplina: 'Piano' }),
    JSON.stringify(recorte.professor),
  );
  conferir(
    'o extrato é só o do aluno do link',
    Array.isArray(recorte.extrato) && recorte.extrato.length === 1 && recorte.extrato[0].t === 'Aula realizada',
    `${recorte.extrato?.length ?? 0} lançamento(s)`,
  );
  const vazadas = SENTINELAS.filter((s) => r1.texto.includes(s));
  conferir('nenhuma sentinela na resposta', vazadas.length === 0, vazadas.length ? `vazou: ${vazadas.join(', ')}` : '');
  conferir('a resposta não fica em cache', /no-store/.test(r1.cabecalhos.get('cache-control') ?? ''));

  // 2. Os 404.
  const inexistente = await pagina(randomUUID());
  conferir('UUID inexistente: 404 sem corpo', inexistente.status === 404 && inexistente.texto === '', `HTTP ${inexistente.status}`);
  const formaDo404 = forma(inexistente);
  await conferir404('token mal formado', 'nao-e-um-uuid', formaDo404);
  await conferir404('token vazio', '', formaDo404);

  // O link velho, depois de "Gerar novo link", pelo próprio professor.
  const sessao = await exigir(
    'entrar como o professor A',
    pedir(`${API_URL}/auth/v1/token?grant_type=password`, {
      metodo: 'POST',
      cabecalhos: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      corpo: { email: PROF_A.email, password: SENHA_A },
    }),
  );
  const tokenNovo = await exigir(
    'gerar um link novo',
    rest('rpc/novo_link_do_aluno', {
      metodo: 'POST',
      cabecalhos: {
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${sessao.access_token}`,
        'Content-Type': 'application/json',
      },
      corpo: { p_aluno: ALUNO_1.id },
    }),
  );
  await conferir404('link velho, depois de novo_link_do_aluno', token1, formaDo404);
  const rNovo = await pagina(tokenNovo);
  conferir('o link novo abre a mesma página', rNovo.status === 200 && JSON.parse(rNovo.texto).nome === 'Alunoum', `HTTP ${rNovo.status}`);

  // O aluno arquivado.
  const r2 = await pagina(token2);
  conferir('o aluno 2, antes de arquivar: 200', r2.status === 200, `HTTP ${r2.status}`);
  await exigir(
    'arquivar o aluno 2',
    rest(`alunos?id=eq.${ALUNO_2.id}`, { metodo: 'PATCH', cabecalhos: comoServico, corpo: { arquivado: true } }),
  );
  await conferir404('aluno arquivado', token2, formaDo404);
} catch (erro) {
  falhas++;
  console.log(`FALHOU ${erro instanceof Error ? erro.message : 'sem mensagem'}`);
} finally {
  // O cascade da 0001 leva professor, alunos, extrato e propostas.
  for (const id of criados) {
    await pedir(`${API_URL}/auth/v1/admin/users/${id}`, { metodo: 'DELETE', cabecalhos: comoServico }).catch(() => {});
  }
}

console.log(falhas ? `\n${falhas} conferência(s) falharam.` : '\nTudo certo: a função só entrega o aluno do link.');
process.exit(falhas ? 1 : 0);
