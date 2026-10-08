# Como contribuir — Aula em Dia

Três pessoas trabalhando em paralelo num repositório que até agora teve um autor só.
Este arquivo existe para que ninguém precise perguntar: onde eu mexo, como eu comito, e o
que quebra se eu esquecer.

Leia também o [`CLAUDE.md`](CLAUDE.md), que é a regra do projeto. Este arquivo é o processo.

---

## 1. Começar

```bash
git clone https://github.com/dornelasxz/aula-em-dia.git
cd aula-em-dia/mobile
npm install
npx expo login        # obrigatório desde o SDK 57; é interativo e pede senha
npx expo start        # QR Code para o Expo Go
```

Node **22** (está no `.nvmrc`). Para ver as telas sem celular: `npx expo start --web`, que não
exige login.

O Expo Go só abre o projeto com a **mesma conta** logada no terminal e no aplicativo. Sem isso
aparece *"You need to be signed in to Expo Go and Expo CLI"*. Outros erros de rede e porta estão
em [`mobile/README.md`](mobile/README.md).

### Ordem de leitura (são 22 documentos; não leia todos)

1. [`README.md`](README.md) — o que é o produto
2. [`CLAUDE.md`](CLAUDE.md) — as 8 regras e as convenções de implementação
3. [`mobile/README.md`](mobile/README.md) — a stack, o mapa do código e **as 14 divergências
   entre o protótipo e o app**, cada uma com a razão
4. Conforme a tarefa: [`handoff-ios-glass/README.md`](handoff-ios-glass/README.md) (só a
   seção H§ da sua tela), [`MAPA-DE-TELAS.md`](docs/design/redesign-ios-glass/MAPA-DE-TELAS.md),
   [`spec/`](spec/), [`docs/backend/PLANO-BACKEND.md`](docs/backend/PLANO-BACKEND.md)

**Não leia `IMPLEMENTACAO.md` nem nada em `docs/design/historico/`.** Descrevem a direção visual
aposentada (cabeçalho escuro com curva, amarelo, chips). Seguir esses documentos é reconstruir
o que foi jogado fora — e há um teste que barra isso (`src/tema/__tests__/legado.test.ts`).

---

## 2. Quem é dono de quê

A divisão segue as três camadas que o código já tem, não perfil técnico. É isso que faz os
conjuntos de arquivos serem quase disjuntos e ninguém pisar no pé de ninguém.

| Camada | Dono | Diretórios |
|---|---|---|
| **Apresentação** | Rafael | `mobile/src/telas/`, `mobile/src/componentes/`, `mobile/src/tema/`, `tokens/`, `mobile/src/estado/{navegacao,formularios,toast,avisos}.ts`, `DESIGN.md`, `PRODUCT.md`, `CLAUDE.md`, `README.md`, `mobile/scripts/`, `handoff-ios-glass/`, `docs/design/` |
| **Regra pura + portões** | Mauro | `mobile/src/dominio/` e seus testes, `mobile/jest.setup.js`, bloco `jest` do `package.json`, `mobile/src/telas/__tests__/montagem.test.tsx`, `mobile/src/estado/__tests__/navegacao.test.ts`, `.github/`, eslint, `.nvmrc`, este arquivo, `.claude/settings.json`, `CODEOWNERS` |
| **Persistência** | Valentin | `mobile/src/dados/`, `mobile/src/estado/{dados,sessao,depuracao}.ts`, `data/seed.json`, `supabase/`, `.env.example`, `docs/backend/` |

**O teste segue o dono do módulo testado.** `tema/__tests__/` é de Rafael (é o mesmo commit que
muda o token); `dominio/__tests__/` é de Mauro. Duas exceções, porque são portões e não
espelhos: `telas/__tests__/montagem.test.tsx` e `estado/__tests__/navegacao.test.ts` são de
Mauro mesmo cobrindo código alheio.

### Arquivos de alta contenção

Estes têm 20 ou mais arquivos importando. Um commit aqui atinge todo mundo:

| Arquivo | Importadores | Dono |
|---|---|---|
| `mobile/src/tema/TemaProvider.tsx` | 36 | Rafael — congelado |
| `mobile/src/tema/tipografia.ts` | 32 | Rafael — congelado |
| `mobile/src/estado/navegacao.ts` | 27 | Rafael |
| `mobile/src/estado/dados.ts` | 27 | Valentin |
| `mobile/src/tema/tokens.ts` | 26 | Rafael |
| `mobile/src/estado/formularios.ts` | 22 | Rafael |
| `mobile/src/dominio/tipos.ts` | 22 | Mauro, como **contrato** |
| `mobile/src/dominio/datas.ts` | 14 | Mauro |

### Precisa tocar um arquivo que não é seu?

Três formas, em ordem de preferência. Vale a regra: **nunca duas pessoas no mesmo arquivo na
mesma sprint**, nem com "eu mexo só embaixo".

**(a) Commit de abertura — o padrão.** O dono faz a fatia dele num commit que *só faz isso* e
empurra antes de você começar. Exemplo real: ligar o campo de valor por aula precisa de um
`lerDinheiro()` em `dominio/formato.ts`, que é de Mauro. Mauro publica a função e o teste; só
depois Rafael liga o campo na tela. Um card, dois commits, dois autores, zero conflito.

**(b) Quebrar o card em dois.** Quando a fatia alheia passa de umas 15 linhas ou tem lógica
própria. Dois cards no board, com vínculo *blocks*.

**(c) Empréstimo de faixa — exceção.** Só para mudança mecânica menor que umas 15 linhas. O dono
declara no card "fico fora de tal arquivo até este card mesclar" e entra como revisor obrigatório.

**`mobile/src/dominio/tipos.ts` só aceita a forma (a).** Nunca (b) nem (c): 22 importadores
atravessando as três camadas, e um rebase em cima dele estraga o dia de três pessoas. Mauro
muda em commit isolado, avisa no grupo, e os outros dois rebaseiam na hora.

---

## 3. Branch, commit e PR

**Branch:** `scrum-<nn>-<apelido-curto>`, do número do card.

```
scrum-32-teste-agenda
scrum-14-seed-relativo
```

As branches `designer/<data>-<alvo>` são criadas pelo `/designer` e não seguem esta regra.

**Commit:** a chave do card no começo, imperativo em português, minúsculas.

```
SCRUM-32: teste do motor de agenda — descarte, pontuação e agrupamento
SCRUM-14: seed com datas relativas e telefone nos quatro alunos
```

O prefixo `SCRUM-nn:` não é decoração: é o que o **GitHub for Jira** lê para mostrar o commit
no cartão. Sem ele o board não sabe que o trabalho aconteceu, e alguém vai ter que atualizar
card à mão. Os escopos antigos do histórico (`redesign(onda-5):`, `designer(<comando>):`)
pertencem a trabalhos encerrados; não use.

**PR:** um por card, contra `main`. **A `main` é protegida** desde o `SCRUM-49`: para quem não
é administrador o GitHub recusa o push direto e exige o PR, com 1 aprovação e o check
`Testes e tipos` verde. A aprovação é descartada quando chega commit novo, a branch precisa
estar atualizada com a `main` antes de mesclar, e force push e deleção estão fechados para
todo mundo.

> **Exceção consciente:** `enforce_admins` está `false`, então o dono do repositório
> (`@dornelasxz`) consegue empurrar direto e mesclar por cima da regra. É o que mantém o fluxo
> de trabalho dele; o portão vale para o Mauro e o Valentin. Não é licença para contornar o
> CI — se o check está vermelho, o problema é o código.

- **Review cruzado, não centralizado:** Mauro revisa os PRs de Valentin e vice-versa. Rafael é
  revisor obrigatório só do que é dele (`tema/`, `componentes/`, `telas/`), e o
  [`CODEOWNERS`](CODEOWNERS) faz isso valer sem ninguém precisar lembrar. Isso existe para o
  Rafael não virar fila única de aprovação — ele acumula PO e review.
- **CI verde é obrigatório** — e agora é o GitHub que cobra, não a boa vontade de quem abriu
  o PR. `npm test` e `npm run typecheck` rodam no Actions a cada push, e o botão de merge fica
  bloqueado enquanto o check `Testes e tipos` não passar. "Passou aqui" não conta.
- **Branch de verificação descartável não leva a chave do card no nome.** O GitHub for Jira
  vincula pelo nome da branch e pelo prefixo do commit, então um PR de teste chamado
  `teste/portao-scrum-49` deixou um PR `DECLINED` e uma compilação vermelha penduradas no
  painel do cartão, para sempre. Para experimento, use nome sem `scrum-nn`.
- No corpo do PR: o "Pronto quando" do card, marcado. Se mexeu em tela, **anexe captura nos
  dois temas** (`npm run capturar -- --tela <chave>`).
- `git diff --name-only` só deve listar arquivos da sua faixa. Se listar mais, pare.

---

## 4. Antes de dizer que terminou

```bash
cd mobile
npm test ; echo "EXIT=$?"   # hoje: 551 testes, 18 suítes — só conta com EXIT=0
npm run typecheck           # tsc --noEmit, sem saída = passou
```

**Leia o código de saída, não o resumo.** O Jest consegue imprimir
`Test Suites: 10 passed` e `Tests: 303 passed` e **ainda assim sair com 1**. Foi assim que o CI
ficou vermelho por duas execuções sem ninguém notar, até o `SCRUM-49`: trabalho assíncrono
agendado durante a montagem e não cancelado dispara depois do ambiente da suíte cair, vira
`ReferenceError: ... after the Jest environment has been torn down`, e o Jest conta isso como
erro do **processo** sem marcar suíte nenhuma como falha. Se der 1 com tudo passando, procure
`torn down` na saída — costuma ser `Animated.timing(...).start()` sem
`return () => movimento.stop()` na limpeza do efeito.

**Adicionou teste? Atualize a contagem** no `CLAUDE.md`, `README.md` e `mobile/README.md` no
mesmo PR. Esses números já divergiram uma vez (dois diziam 294 quando eram 303), e é
exatamente o tipo de número que uma sessão de Claude Code cita de volta errado.

---

## 5. Armadilhas deste repositório

Várias destas têm teste que cobra. Descobrir por teste vermelho custa um ciclo; ler custa
dez segundos.

**Tema e texto**

- **Cor de texto é sempre explícita.** O React Native não herda `color` de um `View` pai; sem
  cor o texto sai preto.
- **Não escreva `marginTop` nem `marginBottom` no `style` de um texto.** Isso apaga a
  compensação métrica que `texto()` devolve e desalinha o glifo. Use
  `comEspaco(estilo, { topo, base })`.
- **Não sobrescreva `fontSize` nem `lineHeight` em cima de um `TIPO.*`.** Chame `texto()` com o
  tamanho que você quer.
- **Nada de cor ou medida solta numa tela.** Importe de `tema/tokens.ts` e `useCores()`.
  Faltando token, **pergunte** — não invente (regra 2 do `CLAUDE.md`).
- **Token muda em quatro lugares no mesmo commit:** `tokens/tokens.json`,
  `mobile/src/tema/tokens.ts`, `DESIGN.md` e, quando for tipografia, `tema/tipografia.ts`. O
  teste `tema/__tests__/tokens.test.ts` compara o JSON com o TS e falha se você esquecer um.
- **Números sempre tabulares**, moeda em pt-BR por `dinheiro()`. Não chame `toLocaleString`
  direto: o Hermes nem sempre traz ICU completo.

**Navegação e telas**

- **Tela nova entra em quatro lugares** e há teste que cobra os quatro: a união `Tela`, os mapas
  `ABA_DA_TELA` e `TIPO_DA_TELA` (em `estado/navegacao.ts`) e `telas/registro.ts`.
- **Sheet não empilha:** `ir` de um sheet para outro troca o conteúdo; `fecharSheet()` volta
  para a última tela que não é sheet.
- **Formulário que atravessa telas não usa `useState`.** O chassi desmonta a tela ao navegar;
  rascunho mora em `estado/formularios.ts` (`useRascunho`). `useState` só para o que morre com
  a tela.
- **Seletor de store nunca cria objeto novo.** `useDados((s) => s.x ?? [])` devolve um array
  diferente a cada chamada e trava o app em loop de render. Use uma constante estável fora do
  seletor.

**Regra e dados**

- **Regra de negócio não mora na UI.** Tudo em `mobile/src/dominio/`, que é puro e testado.
  Mudou regra? Atualize o teste junto, e só depois ligue na tela.
- **Data "hoje" só sai de `dominio/datas.ts`.** Nunca escreva `'28/08'` nem `new Date()` numa
  tela.
- **`mobile/src/dados/seed.json` é cópia de `data/seed.json`** (o Metro não resolve fora da raiz
  do projeto). Mudou um, copie para o outro — não edite os dois à mão.
- **Não escreva teste que importe `hoje()`** para exercitar o domínio. Passe a data como
  parâmetro. Importar `hoje()` acopla a suíte à flag `USAR_DATA_REAL`, e é esse acoplamento que
  faz três suítes quebrarem quando a flag virar.

**Vidro e fundo** (regras 3 e 4 do `CLAUDE.md`)

- **O fundo de refração é obrigatório** sob todo o app. Nada de fundo chapado por cima dele.
- **Vidro vem da primitiva `SuperficieVidro`**, nunca remontado na tela. Um nível de vidro por
  camada de profundidade. O anel de refração existe **só** na tab bar.
- **Texto pequeno com transparência sobre o material: nunca.**

**Ferramentas**

- **`npx expo login` é interativo e é da pessoa, nunca do agente.** Se você pedir a uma sessão
  de Claude Code para rodar, ela trava.
- **Não rode `/designer` sem alguém pedir.** Ao terminar mudança em `src/telas/` ou
  `src/componentes/`, sugira em uma linha e pare.
- **Não edite `spec/`, `handoff-ios-glass/`, `tokens/` nem `docs/design/historico/`
  fora de um card que diga explicitamente para editar.** São contrato. O
  [`.claude/settings.json`](.claude/settings.json) **nega** `spec/`, `handoff-ios-glass/`,
  `docs/design/historico/` e `docs/design/redesign-ios-glass/` para as sessões de Claude Code,
  e **pede confirmação** em `tokens/`, `DESIGN.md`, `PRODUCT.md`, `data/seed.json`,
  `IMPLEMENTACAO.md` e `supabase/migrations/` — esses um card legítimo precisa poder mudar.
  A negação cobre as ferramentas de edição, não o shell: um `sed -i` passa, e quem pega é o
  `git diff --name-only`.

---

## 6. Trabalhando com Claude Code

As três pessoas usam Claude Code neste repositório, então vale combinar o básico:

- **Cole o card inteiro.** Os cards das sprints trazem nove seções, incluindo os arquivos
  exatos com número de linha e uma lista de "NÃO faça". Colar o card todo economiza a etapa em
  que o agente procura o arquivo e inventa escopo pelo caminho.
- **A seção "Faixa deste card" não é enfeite.** Um agente solto "conserta" o arquivo vizinho
  por prestatividade. Nomear o dono transforma isso em recusa explícita.
- **Confira o `git diff --name-only` antes do commit.** É a forma mais rápida de pegar um
  agente que saiu da faixa.
- **`/designer <tela>`** roda uma rodada de design sozinho numa branch própria, com screenshots
  antes e depois. É do Rafael; o roteiro está em `.claude/skills/designer/SKILL.md`.
- O catálogo de componentes abre no Expo Web pelo console:
  `__aulaEmDia.catalogo.getState().abrir()`. No aparelho, suba o Metro com
  `EXPO_PUBLIC_CATALOGO=1`. Peça nova entra no catálogo **antes** de entrar numa tela.

---

## 7. Onde a rede de segurança tem buraco

551 testes verdes não significam cobertura completa. Saiba o que não está coberto antes de
confiar:

- **Sem teste próprio:** `dominio/agenda.ts` (o motor de reposição, que é o diferencial do
  produto), `dominio/mensagens.ts`, `dominio/pacote.ts`,
  `dominio/formato.ts`. Em `estado/dados.ts`, o maior arquivo do app, o teste cobre o contrato
  de persistência (`SCRUM-17`); o que cada ação calcula na store segue sem asserção própria.
- **O teste de interface é de fumaça:** monta as 35 telas e afirma que nada lança exceção. Não
  afirma o que aparece escrito.
- **Sem linter** ainda. O teste de integração do banco existe (`npx supabase test db`, RLS com
  dois professores), mas **não roda no CI**: precisa de Docker.

O que **deixou** de ser buraco: o CI roda a cada push e PR, e a `main` só aceita código que
passou por ele (`SCRUM-36` e `SCRUM-49`). O resto continua valendo — portão verde não é o
mesmo que cobertura.

Fechar esses buracos é o épico `SCRUM-9` (Qualidade e CI).
