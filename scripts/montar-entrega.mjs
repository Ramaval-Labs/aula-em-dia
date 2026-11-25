/**
 * Monta o zip da entrega final: `entrega-final/aula-em-dia.zip`, com
 *
 *   aula-em-dia/
 *     docs/   README, PROJETO, BMC, DADOS, prints, propostas e os editáveis (docs/projeto/)
 *     app/    o aplicativo (a pasta mobile/), sem node_modules
 *     api/    o backend (a pasta supabase/, dentro de api/supabase/)
 *     web/    a versão web compilada (dist/) e o vercel.json
 *
 *   node scripts/montar-entrega.mjs
 *
 * Só entram arquivos **versionados** (`git ls-files`): node_modules, .env,
 * dist e o domínio gerado das funções ficam de fora por construção. Faça
 * commit antes de rodar. O web/dist é compilado na hora, no modo local
 * (dados de demonstração), para abrir sem conta e sem backend.
 *
 * Os caminhos que atravessam pastas (o app lê tokens, seed e migrações; a API
 * importa o domínio do app) são reescritos para o layout do zip. Cada
 * reescrita confere que achou o trecho, senão o script para.
 *
 * Portões que fazem o script falhar: node_modules, .env real, padrão de
 * segredo, arquivo obrigatório faltando, zip acima de 100 MB.
 */

import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, 'entrega-final');
const ALVO = join(SAIDA, 'aula-em-dia');
const ZIP = join(SAIDA, 'aula-em-dia.zip');
const LIMITE_MB = 100;

const passo = (texto) => console.log(`\n▸ ${texto}`);
const falhar = (texto) => {
  console.error(`\n✗ ${texto}`);
  process.exit(1);
};

// --- cópia -------------------------------------------------------------------

/** Os arquivos versionados sob um prefixo (ou um arquivo só). */
function rastreados(prefixo) {
  const saida = execFileSync('git', ['ls-files', '-z', '--', prefixo], { cwd: RAIZ });
  return saida.toString('utf8').split('\0').filter(Boolean);
}

function copiar(origemRel, destinoRel) {
  const origem = join(RAIZ, origemRel);
  if (!existsSync(origem)) falhar(`não existe: ${origemRel}`);
  const destino = join(ALVO, destinoRel);
  mkdirSync(dirname(destino), { recursive: true });
  copyFileSync(origem, destino);
}

/** Copia tudo o que é versionado sob `de/` para `para/`. */
function copiarPasta(de, para, pular = []) {
  const arquivos = rastreados(de).filter((f) => !pular.includes(f));
  for (const f of arquivos) copiar(f, para + f.slice(de.length));
  return arquivos.length;
}

/** Troca um trecho num arquivo do zip; para se não achar. */
function reescrever(destinoRel, de, para) {
  const arquivo = join(ALVO, destinoRel);
  const texto = readFileSync(arquivo, 'utf8');
  if (!texto.includes(de)) falhar(`reescrita: "${de}" não está em ${destinoRel}`);
  writeFileSync(arquivo, texto.split(de).join(para));
}

// --- 0. começar limpo ----------------------------------------------------------

const sujo = execFileSync('git', ['status', '--porcelain'], { cwd: RAIZ }).toString().trim();
if (sujo) console.warn(`! Há mudanças sem commit; só o que está versionado entra no zip:\n${sujo}`);

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(ALVO, { recursive: true });

// --- 1. app/ -------------------------------------------------------------------

passo('app/ (mobile/)');
const nApp = copiarPasta('mobile/', 'app/', ['mobile/README.md']);
copiar('mobile/README.md', 'app/DESENVOLVIMENTO.md');
copiar('entrega/app/README.md', 'app/README.md');
copiar('.env.example', 'app/.env.example');
copiar('.nvmrc', 'app/.nvmrc');
// O domínio das funções é gerado a partir do app, para a pasta da API.
reescrever('app/package.json', '../supabase/functions/', '../api/supabase/functions/');
// Testes que conferem o app contra arquivos de fora dele.
reescrever(
  'app/src/tema/__tests__/tokens.test.ts',
  "'../../../../tokens/tokens.json'",
  "'../../../../docs/projeto/tokens/tokens.json'",
);
reescrever('app/src/dados/__tests__/conversor.test.ts', '${RAIZ}/supabase/', '${RAIZ}/api/supabase/');
reescrever('app/src/dados/__tests__/sementeSql.test.ts', "ler('supabase',", "ler('api', 'supabase',");
reescrever('app/src/dados/__tests__/sementeSql.test.ts', "ler('mobile',", "ler('app',");
reescrever(
  'app/src/dados/__tests__/sementeSql.test.ts',
  "ler('data', 'seed.json')",
  "ler('docs', 'projeto', 'data', 'seed.json')",
);
console.log(`  ${nApp} arquivos`);

// --- 2. api/ -------------------------------------------------------------------

passo('api/ (supabase/ em api/supabase/)');
const nApi = copiarPasta('supabase/', 'api/supabase/');
copiar('entrega/api/README.md', 'api/README.md');
copiar('.nvmrc', 'api/.nvmrc');
// As funções importam o domínio do app: de ../../../mobile para ../../../../app.
reescrever('api/supabase/functions/_shared/entrada.ts', "'../../../mobile/", "'../../../../app/");
reescrever(
  'api/supabase/tests/funcoes/recuperacao.test.mjs',
  "'../../../mobile/package.json'",
  "'../../../../app/package.json'",
);
console.log(`  ${nApi} arquivos`);

// --- 3. web/ -------------------------------------------------------------------

passo('web/ (expo export --platform web, modo local)');
const distTemp = join(SAIDA, 'dist-web');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
execFileSync(npx, ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', distTemp], {
  cwd: join(RAIZ, 'mobile'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
  // As variáveis do processo vencem as do .env: o dist sai sem backend nem chave.
  env: {
    ...process.env,
    EXPO_PUBLIC_BACKEND: 'local',
    EXPO_PUBLIC_SUPABASE_URL: '',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
    EXPO_PUBLIC_URL_DO_ALUNO: '',
    EXPO_PUBLIC_URL_DO_APP: '',
    CI: '1',
  },
});
mkdirSync(join(ALVO, 'web'), { recursive: true });
renameSync(distTemp, join(ALVO, 'web', 'dist'));
copiar('mobile/vercel.json', 'web/vercel.json');
copiar('entrega/web/README.md', 'web/README.md');

// --- 4. docs/ ------------------------------------------------------------------

passo('docs/');
const nDocs = copiarPasta('docs/', 'docs/');
let nProjeto = 0;
for (const pasta of ['handoff-ios-glass/', 'spec/', 'tokens/', 'data/']) {
  nProjeto += copiarPasta(pasta, `docs/projeto/${pasta}`);
}
for (const arquivo of ['PRODUCT.md', 'DESIGN.md', 'PROXIMOS-PASSOS.md', 'CONTRIBUTING.md']) {
  copiar(arquivo, `docs/projeto/${arquivo}`);
  nProjeto += 1;
}
console.log(`  ${nDocs} arquivos em docs/ e ${nProjeto} em docs/projeto/`);

// --- 5. portões ----------------------------------------------------------------

passo('Conferindo');

function andar(pasta, visitar) {
  for (const nome of readdirSync(pasta)) {
    const caminho = join(pasta, nome);
    const ehPasta = statSync(caminho).isDirectory();
    visitar(caminho, nome, ehPasta);
    if (ehPasta) andar(caminho, visitar);
  }
}

const problemas = [];
const SEGREDOS = [
  /sb_secret_[A-Za-z0-9_-]{10,}/,
  /service_role["']?\s*[:=]\s*["']?eyJ/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S{20,}/,
  /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}/, // chave do Resend
  /\bsk_(live|test)_[A-Za-z0-9]{10,}/,
];
const TEXTO = /\.(md|ts|tsx|js|mjs|json|sql|toml|html|txt|yml|yaml|example|css)$/i;

andar(ALVO, (caminho, nome, ehPasta) => {
  const rel = relative(ALVO, caminho).split(sep).join('/');
  if (ehPasta && nome === 'node_modules') problemas.push(`node_modules: ${rel}`);
  if (!ehPasta && /^\.env(\..+)?$/.test(nome) && nome !== '.env.example') {
    problemas.push(`arquivo .env: ${rel}`);
  }
  if (!ehPasta && TEXTO.test(nome) && !rel.startsWith('web/dist/')) {
    const texto = readFileSync(caminho, 'utf8');
    for (const p of SEGREDOS) if (p.test(texto)) problemas.push(`padrão de segredo (${p}) em ${rel}`);
  }
});

const OBRIGATORIOS = [
  'docs/README.md',
  'docs/PROJETO.md',
  'docs/PROJETO.pdf',
  'docs/BMC.md',
  'docs/DADOS.md',
  'docs/DADOS.pdf',
  'docs/prints/01-alunos.png',
  'docs/prints/02-reposicao.png',
  'docs/prints/03-pagina-do-aluno.png',
  'docs/propostas/Envio01-AulaEmDia.pdf',
  'app/README.md',
  'app/package.json',
  'app/.env.example',
  'api/README.md',
  'api/supabase/config.toml',
  'api/supabase/functions/_shared/entrada.ts',
  'web/README.md',
  'web/vercel.json',
  'web/dist/index.html',
];
for (const f of OBRIGATORIOS) if (!existsSync(join(ALVO, f))) problemas.push(`falta: ${f}`);
if (existsSync(join(ALVO, 'api/supabase/functions/_shared/dominio.js'))) {
  problemas.push('o dominio.js gerado entrou no zip');
}

if (problemas.length > 0) falhar(`O zip não passou:\n  - ${problemas.join('\n  - ')}`);
console.log('  sem node_modules, sem .env, sem segredo, nada faltando');

// --- 6. compactar --------------------------------------------------------------

passo('Compactando');
rmSync(ZIP, { force: true });
// O tar do Windows (bsdtar) grava zip com "/" nos caminhos, que abre em
// qualquer sistema; o Compress-Archive do PowerShell 5 grava "\".
const tar = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'zip';
if (process.platform === 'win32') {
  execFileSync(tar, ['-a', '-c', '-f', ZIP, 'aula-em-dia'], { cwd: SAIDA, stdio: 'inherit' });
} else {
  execFileSync('zip', ['-qr', ZIP, 'aula-em-dia'], { cwd: SAIDA, stdio: 'inherit' });
}

const mb = statSync(ZIP).size / 1024 / 1024;
if (mb > LIMITE_MB) falhar(`O zip tem ${mb.toFixed(1)} MB, acima de ${LIMITE_MB} MB.`);

console.log(`\n✓ ${relative(RAIZ, ZIP)} · ${mb.toFixed(1)} MB`);
for (const pasta of readdirSync(ALVO)) {
  let n = 0;
  andar(join(ALVO, pasta), (_c, _n, ehPasta) => {
    if (!ehPasta) n += 1;
  });
  console.log(`  aula-em-dia/${pasta}/  ${n} arquivos`);
}
