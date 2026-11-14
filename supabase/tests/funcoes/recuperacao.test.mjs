// Recuperar a senha pelo e-mail, de ponta a ponta no Supabase local (SCRUM-62).
//
// O que prova, com o Auth de verdade e o e-mail lido da caixa local (Inbucket):
//   - pedir o link responde igual para quem tem conta e quem não tem;
//   - o e-mail chega com o modelo de supabase/templates/recuperacao.html, e o
//     link leva à tela de nova senha com `token_hash` e `type=recovery`, sem o
//     `code` do PKCE;
//   - o `verifyOtp` com o token_hash abre a sessão, e a senha nova entra;
//   - a senha antiga deixa de valer e a nova passa a valer;
//   - o mesmo link, usado de novo, dá `otp_expired`: vale uma vez só.
//
// As mesmas chamadas que `mobile/src/estado/sessao.ts` faz (`resetPasswordForEmail`,
// `verifyOtp`, `updateUser`), pelo mesmo supabase-js do app.
//
// Como rodar, na raiz do repositório, com o Docker aberto e o Inbucket ligado (o
// `supabase start` sem `-x inbucket`):
//   npx supabase start
//   set -a; eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY|PUBLISHABLE_KEY|INBUCKET_URL)=')"; set +a
//   node supabase/tests/funcoes/recuperacao.test.mjs
//
// Só no banco local. Nenhuma chave, senha ou token vai para a saída.

import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const { API_URL, SERVICE_ROLE_KEY, PUBLISHABLE_KEY, INBUCKET_URL } = process.env;

if (!API_URL || !SERVICE_ROLE_KEY || !PUBLISHABLE_KEY || !INBUCKET_URL) {
  console.error('Faltam API_URL, SERVICE_ROLE_KEY, PUBLISHABLE_KEY e INBUCKET_URL (ver o topo do arquivo).');
  process.exit(2);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API_URL.replace(/\/+$/, ''))) {
  console.error('Este teste só roda contra o Supabase local.');
  process.exit(2);
}

// O supabase-js do app, para as chamadas serem as mesmas da sessão.
const exigirDoApp = createRequire(new URL('../../../mobile/package.json', import.meta.url));
const { createClient } = exigirDoApp('@supabase/supabase-js');

/** Um navegador novo: sem sessão guardada, como o computador que abre o link. */
const navegador = () =>
  createClient(API_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
const admin = createClient(API_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const RODADA = randomBytes(4).toString('hex');
const EMAIL = `recupera.${RODADA}@exemplo.test`;
const SENHA_ANTIGA = randomBytes(12).toString('base64url');
const SENHA_NOVA = randomBytes(12).toString('base64url');
// O que o app manda: <EXPO_PUBLIC_URL_DO_APP>/redefinir-senha, e o config.toml permite.
const RETORNO = 'http://localhost:8081/redefinir-senha';

let falhas = 0;
function conferir(nome, ok, detalhe = '') {
  if (!ok) falhas++;
  console.log(`${ok ? 'ok  ' : 'FALHOU'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

/** O link do e-mail mais novo para o endereço, lido na caixa local. */
async function linkDoEmail(endereco) {
  for (let i = 0; i < 20; i++) {
    const busca = await (await fetch(`${INBUCKET_URL}/api/v1/search?query=${encodeURIComponent(`to:${endereco}`)}`)).json();
    const [maisNovo] = [...(busca.messages ?? [])].sort((a, b) => b.Created.localeCompare(a.Created));
    if (maisNovo) {
      const mensagem = await (await fetch(`${INBUCKET_URL}/api/v1/message/${maisNovo.ID}`)).json();
      const href = /href="([^"]*token_hash[^"]*)"/.exec(mensagem.HTML ?? '')?.[1];
      return { assunto: maisNovo.Subject, link: href ? new URL(href.replace(/&amp;/g, '&')) : null };
    }
    await new Promise((pronto) => setTimeout(pronto, 500));
  }
  return { assunto: null, link: null };
}

let usuario = null;
try {
  const criado = await admin.auth.admin.createUser({ email: EMAIL, password: SENHA_ANTIGA, email_confirm: true });
  if (criado.error) throw new Error(`criar o professor: ${criado.error.code ?? criado.error.message}`);
  usuario = criado.data.user;

  // 1. Pedir o link.
  let r = await navegador().auth.resetPasswordForEmail(EMAIL, { redirectTo: RETORNO });
  conferir('pedir com conta: sem erro', !r.error, r.error?.code);
  r = await navegador().auth.resetPasswordForEmail(`ninguem.${RODADA}@exemplo.test`, { redirectTo: RETORNO });
  conferir('pedir sem conta: a mesma resposta, sem erro', !r.error, r.error?.code);
  const semConta = await (await fetch(`${INBUCKET_URL}/api/v1/search?query=${encodeURIComponent(`to:ninguem.${RODADA}@exemplo.test`)}`)).json();
  conferir('  e para quem não tem conta não sai e-mail', (semConta.messages ?? []).length === 0);

  // 2. O e-mail.
  const { assunto, link } = await linkDoEmail(EMAIL);
  conferir('o e-mail chega, com o assunto do modelo', assunto === 'Redefinir a senha do Aula em Dia', assunto ?? 'nenhum');
  conferir('o link leva à tela de nova senha', link !== null && `${link.origin}${link.pathname}` === RETORNO);
  conferir('  com token_hash e type=recovery', !!link?.searchParams.get('token_hash') && link?.searchParams.get('type') === 'recovery');
  conferir('  e sem o code do PKCE', link !== null && !link.searchParams.has('code'));
  const tokenHash = link?.searchParams.get('token_hash') ?? '';

  // 3. A senha nova, noutro navegador.
  const outro = navegador();
  const v = await outro.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
  conferir('o link abre a sessão noutro navegador', !v.error && !!v.data.session && v.data.user?.email === EMAIL, v.error?.code);
  const igual = await outro.auth.updateUser({ password: SENHA_ANTIGA });
  conferir('a senha igual à atual é recusada (same_password)', igual.error?.code === 'same_password', igual.error?.code);
  const nova = await outro.auth.updateUser({ password: SENHA_NOVA });
  conferir('  e a senha nova entra, na mesma sessão', !nova.error, nova.error?.code);

  // 4. Entrar.
  const comNova = await navegador().auth.signInWithPassword({ email: EMAIL, password: SENHA_NOVA });
  conferir('entra com a senha nova', !comNova.error, comNova.error?.code);
  const comAntiga = await navegador().auth.signInWithPassword({ email: EMAIL, password: SENHA_ANTIGA });
  conferir('a senha antiga não entra mais', comAntiga.error?.code === 'invalid_credentials', comAntiga.error?.code);

  // 5. O link vale uma vez só.
  const deNovo = await navegador().auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
  conferir('o mesmo link, de novo: otp_expired', deNovo.error?.code === 'otp_expired', deNovo.error?.code);
} catch (erro) {
  falhas++;
  console.log(`FALHOU ${erro instanceof Error ? erro.message : 'sem mensagem'}`);
} finally {
  if (usuario) await admin.auth.admin.deleteUser(usuario.id).catch(() => {});
}

console.log(falhas ? `\n${falhas} conferência(s) falharam.` : '\nTudo certo: o link chega, troca a senha e vale uma vez só.');
process.exit(falhas ? 1 : 0);
