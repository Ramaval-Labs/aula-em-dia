/**
 * Gera `supabase/seed.sql` a partir de `data/seed.json`.
 *
 * Este arquivo só executa. A regra mora em `mobile/src/dados/sementeSql.ts`,
 * que é TypeScript tipado contra o domínio e coberto pelo jest; por isso o
 * que acontece aqui é carregar aquele módulo e gravar o que ele devolve.
 *
 * Uso, na raiz do repositório (depois de `npm install` em `mobile/`):
 *   node scripts/gerar-seed-sql.mjs             grava supabase/seed.sql
 *   node scripts/gerar-seed-sql.mjs --conferir  não grava; sai com 1 se o arquivo estiver defasado
 *
 * O `seed.sql` não tem data dentro: as datas são relativas e quem resolve é o
 * banco. Rodar duas vezes seguidas, em dias diferentes, dá o mesmo arquivo.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = join(RAIZ, 'mobile');
const SAIDA = join(RAIZ, 'supabase', 'seed.sql');
const nome = (arquivo) => relative(RAIZ, arquivo);

// O TypeScript vem de `mobile/node_modules`: não há dependência na raiz.
const require = createRequire(join(MOBILE, 'package.json'));
let ts;
try {
  ts = require('typescript');
} catch {
  console.error('Não achei o TypeScript. Rode `npm install` em mobile/ e tente de novo.');
  process.exit(1);
}

// Ensina o `require` a ler `.ts`, transpilando na hora. Basta para o que este
// script carrega, que é a semente e o domínio puro: nada de React Native.
require.extensions['.ts'] = (modulo, arquivo) => {
  const { outputText } = ts.transpileModule(readFileSync(arquivo, 'utf8'), {
    fileName: arquivo,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  modulo._compile(outputText, arquivo);
};

// A fonte é `data/seed.json`; o app lê a cópia. Se as duas divergirem, o seed
// sairia de um arquivo que ninguém acha que é a fonte.
const fonte = join(RAIZ, 'data', 'seed.json');
const copia = join(MOBILE, 'src', 'dados', 'seed.json');
if (readFileSync(fonte, 'utf8') !== readFileSync(copia, 'utf8')) {
  console.error(`${nome(copia)} não é cópia de ${nome(fonte)}. Copie de novo antes de gerar.`);
  process.exit(1);
}

const { gerarSeedSql } = require(join(MOBILE, 'src', 'dados', 'sementeSql.ts'));
const sql = gerarSeedSql();

if (process.argv.includes('--conferir')) {
  let atual = null;
  try {
    atual = readFileSync(SAIDA, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    // arquivo ausente conta como defasado
  }
  if (atual !== sql) {
    console.error(`${nome(SAIDA)} está defasado. Rode: node scripts/gerar-seed-sql.mjs`);
    process.exit(1);
  }
  console.log(`${nome(SAIDA)} está em dia.`);
} else {
  writeFileSync(SAIDA, sql, 'utf8');
  console.log(`${nome(SAIDA)} gerado (${sql.split('\n').length - 1} linhas).`);
}
