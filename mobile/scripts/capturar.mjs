/**
 * Screenshot de uma tela do app no Expo Web, na largura do handoff (390×844).
 *
 * Usado pelo /designer para o "antes" e o "depois" de cada rodada. Sobe o
 * Expo Web se ele não estiver no ar, abre o Chrome instalado (sem baixar
 * navegador), leva o app até a tela pedida pelo gancho de depuração
 * (src/estado/depuracao.ts) e grava o PNG e o HTML renderizado. O HTML é o
 * que o detector do Impeccable consegue ler: ele não entende o código React
 * Native, mas entende o DOM que o react-native-web produz.
 *
 * Opções:
 *   --tela <chave>       tela do app (união `Tela` de estado/navegacao.ts); padrão home
 *   --aluno <id>         aluno do contexto (raf, val, bea… da semente)
 *   --tema claro|escuro  padrão claro
 *   --entrada <qual>     máquina de entrada: splash, boasVindas, acesso, onboarding:1..4
 *   --catalogo           catálogo de componentes (src/componentes/__catalogo__)
 *   --clicar <texto>     toca no primeiro elemento com esse texto (repetível)
 *   --rolar <px|fim>     rola a maior área rolável
 *   --nome <arquivo>     nome do PNG/HTML sem extensão; padrão tela-aluno-tema
 *   --saida <pasta>      padrão docs/design/revisoes/capturas
 *   --porta <n>          porta do Expo Web; padrão 8099 (reaproveita se já no ar)
 *   --largura/--altura   viewport; padrão 390 × 844
 *
 * Como cada tela é aberta sai do próprio app, pelo gancho `__aulaEmDia`
 * (src/estado/depuracao.ts), que expõe `TIPO_DA_TELA`:
 *   - raiz → `trocarTab(tela)`;
 *   - empilhada → `ir(tela)`, empilhada sobre a raiz da aba;
 *   - sheet → com `--aluno`, abre a ficha do aluno e sobe o painel sobre ela
 *     (sem aluno, sobre a Home), como o professor chega lá.
 *
 * Exemplos:
 *   node scripts/capturar.mjs --tela home
 *   node scripts/capturar.mjs --tela reposicao --aluno raf --nome antes-reposicao
 *   node scripts/capturar.mjs --tela aluno --aluno val --tema escuro
 *   node scripts/capturar.mjs --tela registrar --aluno raf --clicar "Falta avisada"
 *   node scripts/capturar.mjs --tela aluno --aluno raf --rolar fim
 *   node scripts/capturar.mjs --entrada acesso
 *   node scripts/capturar.mjs --entrada onboarding:2
 *   node scripts/capturar.mjs --catalogo --tema escuro
 *   node scripts/capturar.mjs --catalogo --rolar 400 --nome catalogo-rolado
 *
 * `--catalogo` abre o catálogo do redesign (src/componentes/__catalogo__) por
 * cima do app, pelo gancho de depuração; `--rolar` e `--clicar` valem nele.
 *
 * O web não é idêntico ao Expo Go (sombra e renderização de fonte variam um
 * pouco), mas espaçamento, hierarquia, cor e texto cortado aparecem igual.
 */

import { execSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright-core';

const RAIZ_MOBILE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA_PADRAO = resolve(RAIZ_MOBILE, '..', 'docs', 'design', 'revisoes', 'capturas');

// As chaves de storage vêm do próprio app, para o script não divergir dele.
const fonteDasChaves = readFileSync(join(RAIZ_MOBILE, 'src', 'dados', 'armazenamento.ts'), 'utf8');
const chave = (nome) => fonteDasChaves.match(new RegExp(`${nome} = '([^']+)'`))[1];
const CHAVE_SESSAO = chave('CHAVE_SESSAO');
const CHAVE_TEMA = chave('CHAVE_TEMA');

const { values: op } = parseArgs({
  options: {
    tela: { type: 'string', default: 'home' },
    aluno: { type: 'string' },
    tema: { type: 'string', default: 'claro' },
    entrada: { type: 'string' },
    catalogo: { type: 'boolean', default: false },
    clicar: { type: 'string', multiple: true, default: [] },
    rolar: { type: 'string' },
    nome: { type: 'string' },
    saida: { type: 'string', default: SAIDA_PADRAO },
    porta: { type: 'string', default: '8099' },
    largura: { type: 'string', default: '390' },
    altura: { type: 'string', default: '844' },
  },
});

const URL_APP = `http://localhost:${op.porta}`;

async function noAr() {
  try {
    return (await fetch(URL_APP)).ok;
  } catch {
    return false;
  }
}

function derrubar(filho) {
  if (!filho?.pid) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${filho.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // já tinha saído
    }
  } else {
    filho.kill('SIGTERM');
  }
}

async function subirServidor() {
  const filho = spawn('npx', ['expo', 'start', '--web', '--port', op.porta], {
    cwd: RAIZ_MOBILE,
    env: { ...process.env, CI: '1', BROWSER: 'none' },
    shell: process.platform === 'win32',
    stdio: 'ignore',
  });
  const limite = Date.now() + 180_000;
  while (Date.now() < limite) {
    if (await noAr()) return filho;
    await new Promise((r) => setTimeout(r, 1000));
  }
  derrubar(filho);
  throw new Error(`O Expo Web não respondeu em ${URL_APP} em 3 minutos.`);
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

const servidorProprio = (await noAr()) ? null : await subirServidor();
const navegador = await abrirNavegador();

try {
  const contexto = await navegador.newContext({
    viewport: { width: Number(op.largura), height: Number(op.altura) },
    deviceScaleFactor: 2,
    colorScheme: op.tema === 'escuro' ? 'dark' : 'light',
  });

  // Contexto novo = storage vazio = dados da semente. Só o tema e a sessão
  // são plantados, para abrir direto no app em vez de no login.
  await contexto.addInitScript(
    ({ chaveTema, tema, chaveSessao, sessao }) => {
      localStorage.setItem(chaveTema, tema);
      if (sessao) localStorage.setItem(chaveSessao, sessao);
    },
    {
      chaveTema: CHAVE_TEMA,
      tema: op.tema,
      chaveSessao: CHAVE_SESSAO,
      sessao: op.entrada ? null : JSON.stringify({ fase: 'app', email: 'caio@exemplo.com' }),
    },
  );

  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text());
  });

  await pagina.goto(URL_APP, { waitUntil: 'load', timeout: 180_000 });
  await pagina.waitForFunction(
    () => globalThis.__aulaEmDia?.sessao.getState().fase !== 'carregando',
    null,
    { timeout: 180_000 },
  );
  await pagina.evaluate(() => document.fonts.ready);

  await pagina.evaluate(
    ({ tela, aluno, entrada, catalogo }) => {
      const { navegacao, sessao, tipoDaTela } = globalThis.__aulaEmDia;
      if (catalogo) {
        globalThis.__aulaEmDia.catalogo.getState().abrir();
        return;
      }
      if (entrada) {
        const [qual, passo] = entrada.split(':');
        if (qual === 'splash') sessao.setState({ fase: 'carregando' });
        else if (qual === 'onboarding') {
          sessao.setState({
            fase: 'onboarding',
            passo: Number(passo || 1),
            email: 'caio@exemplo.com',
            contaNova: true,
          });
        } else sessao.setState({ fase: 'entrada', tela: qual });
        return;
      }
      const tipo = tipoDaTela[tela];
      if (!tipo) throw new Error(`Tela desconhecida: ${tela}`);
      const nav = navegacao.getState();
      if (tipo === 'raiz') {
        nav.trocarTab(tela);
      } else if (tipo === 'sheet' && aluno) {
        // O painel sobe sobre a ficha, como no app; o sheet guarda o aluno.
        nav.ir('aluno', { alunoId: aluno });
        navegacao.getState().ir(tela, { alunoId: aluno });
      } else {
        nav.ir(tela, aluno ? { alunoId: aluno } : undefined);
      }
    },
    {
      tela: op.tela,
      aluno: op.aluno ?? null,
      entrada: op.entrada ?? null,
      catalogo: op.catalogo,
    },
  );
  // O sheet sobe em 340ms; a barra e o toast, em 200ms.
  await pagina.waitForTimeout(500);

  for (const alvo of op.clicar) {
    await pagina.getByText(alvo, { exact: false }).first().click({ timeout: 10_000 });
    await pagina.waitForTimeout(400);
  }

  if (op.rolar) {
    // A rolagem do React Native Web é de um View interno, não do documento.
    await pagina.evaluate(({ px, catalogo }) => {
      const rolaveis = [...document.querySelectorAll('div')].filter((el) => {
        const s = getComputedStyle(el);
        return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight;
      });
      // O catálogo fica por cima do app e vem depois no DOM: no empate de altura,
      // a rolagem dele vence a da tela que está embaixo.
      if (catalogo) rolaveis.reverse();
      const maior = rolaveis.sort((a, b) => b.clientHeight - a.clientHeight)[0];
      if (maior) maior.scrollTop = px === 'fim' ? maior.scrollHeight : Number(px);
    }, { px: op.rolar, catalogo: op.catalogo });
  }

  // Deixa assentar a expansão da aba ativa (220ms) e qualquer transição.
  await pagina.waitForTimeout(700);

  const alvo = op.catalogo
    ? 'catalogo'
    : op.entrada
      ? `entrada-${op.entrada.replace(':', '-')}`
      : op.tela;
  const nome = op.nome ?? [alvo, op.aluno, op.tema].filter(Boolean).join('-');
  mkdirSync(op.saida, { recursive: true });
  const png = join(op.saida, `${nome}.png`);
  const html = join(op.saida, `${nome}.html`);
  await pagina.screenshot({ path: png });
  writeFileSync(html, await pagina.content());

  console.log(JSON.stringify({ png, html, tela: alvo, aluno: op.aluno ?? null, tema: op.tema, erros }, null, 2));
} finally {
  await navegador.close();
  if (servidorProprio) derrubar(servidorProprio);
}
