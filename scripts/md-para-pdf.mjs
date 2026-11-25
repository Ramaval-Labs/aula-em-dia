/**
 * Markdown → PDF, para os documentos da entrega (`docs/DADOS.md`, `docs/PROJETO.md`).
 *
 *   node scripts/md-para-pdf.mjs docs/DADOS.md [docs/PROJETO.md …]
 *
 * O PDF sai ao lado do `.md`, com o mesmo nome. O `.md` continua sendo o
 * editável; o PDF é gerado.
 *
 * Usa o `playwright-core` que o app já tem (o mesmo do `capturar.mjs`) e o
 * Chrome ou Edge do sistema. O Markdown e os diagramas Mermaid são
 * renderizados na própria página, pelo `marked` e pelo `mermaid` do CDN: nenhuma
 * dependência nova no projeto. Precisa de internet.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exigirDoApp = createRequire(resolve(raiz, 'mobile/package.json'));
const { chromium } = exigirDoApp('playwright-core');

const MARKED = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js';
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';

const ESTILO = `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color: #1c2430;
         font-size: 10.5pt; line-height: 1.5; }
  h1 { color: #35577D; font-size: 22pt; margin: 0 0 4pt; }
  h2 { color: #35577D; font-size: 15pt; margin-top: 20pt; border-bottom: 1.5px solid #c9d6e4;
       padding-bottom: 3pt; break-after: avoid; }
  h3 { font-size: 12pt; margin-top: 14pt; break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9pt;
          break-inside: auto; }
  tr { break-inside: avoid; }
  th, td { border: 1px solid #d5dde6; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #eef3f8; }
  code { font-family: Consolas, "Cascadia Mono", monospace; font-size: 8.6pt;
         background: #f2f4f7; padding: 0 3pt; border-radius: 3pt; }
  pre code { display: block; padding: 6pt; white-space: pre-wrap; }
  blockquote { border-left: 3px solid #35577D; margin: 8pt 0; padding: 2pt 10pt; color: #3b4756; }
  .mermaid { text-align: center; margin: 10pt 0; break-inside: avoid; }
  a { color: #35577D; text-decoration: none; }
`;

function pagina(titulo, markdown) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${titulo}</title><style>${ESTILO}</style>
<script src="${MARKED}"></script><script src="${MERMAID}"></script></head>
<body><main id="conteudo"></main>
<script>
  const md = ${JSON.stringify(markdown)};
  document.getElementById('conteudo').innerHTML = marked.parse(md);
  for (const bloco of document.querySelectorAll('pre code.language-mermaid')) {
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = bloco.textContent;
    bloco.parentElement.replaceWith(div);
  }
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
  mermaid.run({ querySelector: '.mermaid' })
    .then(() => { window.pronto = true; })
    .catch((e) => { window.erro = String(e); window.pronto = true; });
</script></body></html>`;
}

async function abrirNavegador() {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // tenta o próximo
    }
  }
  throw new Error('Nem Chrome nem Edge encontrados. Instale um dos dois.');
}

const arquivos = process.argv.slice(2);
if (arquivos.length === 0) {
  console.error('Uso: node scripts/md-para-pdf.mjs docs/DADOS.md [outro.md …]');
  process.exit(1);
}

const navegador = await abrirNavegador();
try {
  for (const arquivo of arquivos) {
    const md = resolve(process.cwd(), arquivo);
    const pdf = md.replace(/\.md$/i, '.pdf');
    const conteudo = readFileSync(md, 'utf8');
    const pag = await navegador.newPage();
    // A base é a pasta do .md, para links e imagens relativos resolverem.
    await pag.goto(pathToFileURL(md).href.replace(/[^/]+$/, ''));
    await pag.setContent(pagina(basename(md, '.md'), conteudo), { waitUntil: 'networkidle' });
    await pag.waitForFunction(() => window.pronto === true, null, { timeout: 60_000 });
    const erro = await pag.evaluate(() => window.erro);
    if (erro) throw new Error(`Mermaid falhou em ${arquivo}: ${erro}`);
    const diagramas = await pag.locator('.mermaid svg').count();
    await pag.pdf({
      path: pdf,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="font-size:8px;width:100%;text-align:center;color:#7a8696">' +
        `${basename(md)} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
      margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
    });
    await pag.close();
    console.log(`${arquivo} → ${pdf} (${diagramas} diagrama(s))`);
  }
} finally {
  await navegador.close();
}
