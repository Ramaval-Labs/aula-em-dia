/**
 * Exporta os PNG do ícone e do splash a partir dos SVG desta pasta.
 *
 *   cd mobile && node assets/icone/exportar.mjs
 *
 * Abre o Chrome instalado pelo playwright-core (o mesmo de scripts/capturar.mjs,
 * sem baixar navegador), desenha cada SVG num canvas no tamanho final e grava
 * o PNG com o zlib do Node, sem dependência nova. O `icon.png` sai em RGB,
 * sem canal alfa, porque a App Store recusa ícone com transparência.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

import { chromium } from 'playwright-core';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(AQUI, '..');

/** [svg de origem, png de destino, lado em px, opaco] */
export const SAIDAS = [
  ['icone.svg', 'icon.png', 1024, true],
  ['android-frente.svg', 'android-icon-foreground.png', 1024, false],
  ['android-fundo.svg', 'android-icon-background.png', 1024, true],
  ['android-monocromatico.svg', 'android-icon-monochrome.png', 1024, false],
  ['splash.svg', 'splash-icon.png', 1024, false],
  ['splash-escuro.svg', 'splash-icon-escuro.png', 1024, false],
  ['favicon.svg', 'favicon.png', 48, false],
];

export async function abrirNavegador() {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // tenta o próximo
    }
  }
  throw new Error('Nem Chrome nem Edge instalados.');
}

/** Pixels RGBA do SVG desenhado num canvas de `lado` × `lado`. */
export async function rasterizar(pagina, svg, lado) {
  const dados = await pagina.evaluate(
    async ({ svg, lado }) => {
      const img = new Image(lado, lado);
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = lado;
      canvas.height = lado;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, lado, lado);
      // Em base64: um array de 4 milhões de números leva meio minuto para atravessar.
      const px = ctx.getImageData(0, 0, lado, lado).data;
      let bin = '';
      for (let i = 0; i < px.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, px.subarray(i, i + 0x8000));
      }
      return btoa(bin);
    },
    { svg, lado },
  );
  return Buffer.from(dados, 'base64');
}

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

/** PNG de 8 bits por canal; `opaco` descarta o alfa (tipo de cor 2). */
export function codificarPng(rgba, lado, opaco) {
  const canais = opaco ? 3 : 4;
  const linhas = Buffer.alloc(lado * (1 + lado * canais));
  let o = 0;
  for (let y = 0; y < lado; y++) {
    linhas[o++] = 0; // sem filtro
    for (let x = 0; x < lado; x++) {
      const i = (y * lado + x) * 4;
      for (let c = 0; c < canais; c++) linhas[o++] = rgba[i + c];
    }
  }
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(lado, 0);
  cabecalho.writeUInt32BE(lado, 4);
  cabecalho[8] = 8;
  cabecalho[9] = opaco ? 2 : 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', cabecalho),
    bloco('IDAT', deflateSync(linhas, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

async function principal() {
  const navegador = await abrirNavegador();
  try {
    const pagina = await navegador.newPage();
    for (const [origem, destino, lado, opaco] of SAIDAS) {
      const svg = readFileSync(resolve(AQUI, origem), 'utf8');
      const rgba = await rasterizar(pagina, svg, lado);
      writeFileSync(resolve(ASSETS, destino), codificarPng(rgba, lado, opaco));
      console.log(`${origem} → ${destino} (${lado}px${opaco ? ', sem alfa' : ''})`);
    }
  } finally {
    await navegador.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await principal();
}
