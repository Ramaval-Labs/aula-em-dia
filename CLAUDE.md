# Instruções para o Claude Code — projeto Aula em Dia

O app **já está implementado** em `mobile/` (React Native + Expo, TypeScript, roda no Expo Go).
**35 telas**: 7 na máquina de entrada (login e onboarding) e 28 no app.
Este repositório é o handoff de design **mais** a implementação. Leia `mobile/README.md`
antes de mexer no código. A especificação de design é **`handoff-ios-glass/README.md`**
(direção *iOS Glass*); a direção anterior (*tinta chapada*: curvas, cabeçalho escuro, amarelo)
foi aposentada e está só como histórico em `docs/design/historico/tinta-chapada/`.
`README.md` na raiz é a apresentação do projeto, e `PROXIMOS-PASSOS.md` traz o backlog priorizado.

## Direção iOS Glass

As 35 telas foram migradas para a direção iOS Glass (plano e registro em
`docs/design/redesign-ios-glass/`). O contrato de cada tela — raiz, empilhada ou sheet, e se é
desenhada pelo handoff ou derivada — está em `docs/design/redesign-ios-glass/MAPA-DE-TELAS.md`.
Das 35, só 9 são desenhadas pelo handoff; as outras 26 foram derivadas do mesmo sistema.

- Os `.dc.html` do histórico continuam sendo a referência de **conteúdo e comportamento** das 26
  telas derivadas (Fluxos A, C, D, E, F) — só o visual deles foi aposentado.
- O catálogo vivo de componentes é `mobile/src/componentes/__catalogo__/` (abre no Expo Web pelo
  gancho, ou no aparelho com `EXPO_PUBLIC_CATALOGO=1`). Peça nova entra nele antes de entrar numa tela.
- `src/tema/__tests__/legado.test.ts` impede a direção aposentada (amarelo, curvas) de voltar.

## Como rodar e verificar

```bash
cd mobile
npm install
npx expo login        # obrigatório desde o SDK 57 (conta gratuita)
npx expo start        # QR Code para o Expo Go
npm test              # 399 testes: regras, navegação, tokens e montagem das 35 telas
npm run typecheck     # tsc --noEmit
```

Rode `npm test` e `npm run typecheck` antes de dar qualquer tarefa por concluída.
Para conferir o visual sem celular: `npx expo start --web` (não exige login).

## Três pessoas, três camadas

O repositório passou a ter três autores (Rafael, Mauro e Valentin), todos usando Claude Code.
**O processo está em [`CONTRIBUTING.md`](CONTRIBUTING.md)**: convenção de commit
(`SCRUM-nn: <imperativo>`), fluxo de PR, review cruzado e a tabela de donos.

A divisão segue as camadas que o código já tem, para que dois cards nunca abram o mesmo arquivo:

| Camada | Dono | Onde |
|---|---|---|
| Apresentação | Rafael | `src/telas/`, `src/componentes/`, `src/tema/`, `tokens/`, `estado/{navegacao,formularios,toast,avisos}.ts` |
| Regra pura e portões | Mauro | `src/dominio/` e seus testes, `.github/`, os testes de montagem e de navegação |
| Persistência | Valentin | `src/dados/`, `estado/{dados,sessao,depuracao}.ts`, `data/seed.json`, `supabase/` |

Antes de editar arquivo fora da faixa do card, leia o protocolo em `CONTRIBUTING.md` § 2: o
**dono** faz a fatia dele num commit separado, e só depois a outra pessoa liga em cima.

Desde o SDK 57 o Expo Go só abre o projeto com a **mesma conta** logada no terminal e no
app; sem isso ele mostra "You need to be signed in to Expo Go and Expo CLI". `npx expo login`
é interativo e pede senha — quem roda é a pessoa usuária, nunca o agente. Outros erros
comuns estão em `mobile/README.md`.

## Agente de design (`/designer`)

`/designer <alvo> [comando] [pedido]` roda o Impeccable sozinho sobre uma tela, fluxo ou
componente: salva o que existia num commit de ponto de partida, abre a branch
`designer/<data>-<alvo>`, avalia pelo subagente `revisor-design`, aplica um commit por comando,
confere com screenshots antes e depois (Expo Web, 390×844), detector e testes, e grava o relatório
em `docs/design/revisoes/`. A pessoa aprova, aprova parte ou descarta. O roteiro inteiro está em
`.claude/skills/designer/SKILL.md`.

- `PRODUCT.md` e `DESIGN.md` são o contexto que o Impeccable lê. O `DESIGN.md` espelha
  `tokens.ts` — mudou um token, atualize os dois.
- Os hooks automáticos do Impeccable estão desligados (`IMPECCABLE_HOOK_DISABLED=1` no settings
  global e `.impeccable/config.json` neste projeto); o detector roda dentro do `/designer`.
- **Fora do `/designer`:** ao terminar uma mudança em `src/telas/` ou `src/componentes/`, sugira
  em uma linha rodar `/designer <tela>`. Não rode sem a pessoa pedir.
- Screenshot avulso de qualquer tela: `npm run capturar -- --tela <chave> [--aluno raf]`
  (em `mobile/`; opções no topo de `mobile/scripts/capturar.mjs`).

## Regras deste projeto

1. **Os arquivos `.dc.html` são referência visual, não código para copiar.** Eles usam um
   runtime de prototipagem próprio (`support.js`) que não vai para produção. Leia-os para
   extrair medidas, cores e comportamento.
2. **Fidelidade alta.** Os tokens vivem em `mobile/src/tema/tokens.ts` (espelho tipado de
   `tokens/tokens.json`). Não inventar valores: se faltar um token, pergunte antes de criar.
   Não escreva cor ou medida solta numa tela — importe do tema.
   **Exceção:** numa branch `designer/*`, o `/designer` pode criar token sozinho — em
   `tokens.json`, `tokens.ts` e `DESIGN.md` — listando cada um no relatório. A aprovação
   acontece quando a pessoa decide mesclar a branch.
3. **O fundo de refração é obrigatório** sob todo o app (quatro gradientes radiais, opacidade
   0.85 no claro e 0.60 no escuro). Sem ele o vidro não tem o que refratar e vira retângulo
   cinza. Nada de fundo chapado cobrindo a tela inteira por cima dele.
4. **Vidro com disciplina.** Material = `BlurView` do `expo-blur` (blur baixo, saturação alta)
   + miolo translúcido + reflexo interno (`gin`) + borda de 0,5px, pela primitiva
   `SuperficieVidro`, nunca remontado na tela. Um nível de vidro por camada de profundidade
   (fundo → cartão → barra → sheet), nunca vidro sobre vidro sobre vidro. Nunca texto pequeno
   com transparência sobre o material. O anel de refração existe **só na tab bar**. Onde o blur
   não se sustenta (recorte ou desempenho), a própria primitiva cai no fallback sem blur.
5. **Cor com papel fixo.** O destaque é o tint (`#35577D` no claro, `#9FBEDF` no escuro — muda
   de valor, nunca de identidade), com `onTint` para o texto sobre ele. Status sempre como
   fundo suave (12–16% de alfa) com o texto no token de **texto** do status (`ambarTexto`,
   `verdeTexto`, `vermelhoTexto` — mais escuros que a cor cheia no claro, para passar 4.5:1 sobre
   as manchas); a cor cheia (`ambar`, `verde`, `vermelho`) fica para barras, medidores, avatar
   pequeno e ícone, com `sobreCor` no glifo. **Um primário por tela.** O amarelo `#FFD032` e as
   curvas saíram do sistema.
6. **Números sempre tabulares** e moeda em pt-BR — use `texto()`/`TIPO` de
   `mobile/src/tema/tipografia.ts` e `dinheiro()` de `mobile/src/dominio/formato.ts`.
   Não chame `toLocaleString` direto: o Hermes nem sempre traz ICU completo.
7. **Regras de negócio não são negociáveis e não moram na UI.** Tudo em
   `mobile/src/dominio/`, que é puro e testado: `politica.ts` (saldo e faltas),
   `agenda.ts` (motor de sugestão de reposição), `disponibilidade.ts`, `pacote.ts`,
   `mensagens.ts`, `validacao.ts`. Mudou regra? Atualize o teste junto, e só depois
   ligue na tela.
8. **Copy em português do Brasil**, exatamente como nos arquivos de referência.
   Código e nomes de arquivo também em português, seguindo o que já existe em `mobile/src`.

## Convenções da implementação

- **Cor de texto é sempre explícita.** O React Native não herda `color` de um `View` pai;
  sem cor o texto sai preto e some no cabeçalho escuro.
- **Métrica de texto sai inteira de `texto()`.** A entrelinha do handoff (`altura`) é CSS,
  onde o glifo transborda da linha; no React Native ele é encaixado, então `texto()` nunca
  desce abaixo da tinta do Satoshi (1.25em, medida nos TTFs) e devolve o excedente como
  margem negativa simétrica. Por isso **não escreva `marginTop`/`marginBottom` soltos no
  `style` de um texto** — isso apaga a compensação e desalinha o glifo; use
  `comEspaco(estilo, { topo, base })`. Do mesmo jeito, não sobrescreva `fontSize` nem
  `lineHeight` em cima de um `TIPO.*`: chame `texto()` com o tamanho que você quer.
- **Data "hoje"** só sai de `mobile/src/dominio/datas.ts`. Nunca escreva `'28/08'` numa tela.
- **A semente guarda deslocamento, não data.** Decisão de PO de 30/09/2026, registrada em
  `SCRUM-13`: em `data/seed.json`, toda data é escrita como `hoje±N` dias — `"venceu": "hoje-12"`,
  `"validade": "hoje+32"` — e `dados/semente.ts` resolve na carga com `somarDias(hoje(), N)`.
  Data absoluta em `dd/mm` continua aceita para o que é fixo de calendário (feriado).
  Os tipos **não mudam**: depois de resolvida, `Aluno.validade` segue sendo `dd/mm`.
  O gerador de `supabase/seed.sql` resolve a mesma notação, com ano completo.
  A alternativa (app sem dados de demonstração) foi recusada por agora: o teste de montagem
  das 35 telas, a review e o `seed.sql` do backend saem todos desta fonte. Abrir vazio vale
  para publicar, e pode virar um interruptor depois.
- **O ano de uma data `dd/mm` é inferido, não fixo.** `lerDdMm` assume o ano de `hoje` e
  desloca ±1 ano quando a data cai a mais de 183 dias dele. Sem isso,
  `diasEntre('28/12', '05/01')` devolve −357 em vez de +8, porque nenhum chamador passa ano e
  o padrão era um `ANO_DEMO` congelado. Ao comparar ou somar datas, use `datas.ts` — não
  construa `new Date(...)` na tela nem no domínio.
- **São duas máquinas de navegação.** `estado/sessao.ts` cuida da entrada (splash,
  login, 4 passos de onboarding) e `estado/navegacao.ts` cuida do app, com o contrato
  de `spec/navegacao.md`: `ir` empilha, `voltar` desempilha, `trocarTab` zera a pilha,
  `concluir` substitui a pilha ao terminar um fluxo. `App.tsx` escolhe entre elas.
  Toda tela nova entra em quatro lugares: a união `Tela`, os mapas `ABA_DA_TELA` e
  `TIPO_DA_TELA` (raiz, empilhada ou sheet) e o `telas/registro.ts` — há teste que cobra os
  quatro. Sheet não empilha: `ir` de um sheet para outro troca o conteúdo do painel, e
  `fecharSheet()` volta para a última tela que não é sheet.
- **Formulário não usa `useState` quando o valor atravessa telas.** O chassi desmonta
  a tela ao navegar, então rascunho de assistente mora em `estado/formularios.ts`
  (`useRascunho`). `useState` só para o que morre com a tela.
- **Seletor de store nunca cria objeto novo.** `useDados((s) => s.x ?? [])` devolve um
  array diferente a cada chamada e trava o app em loop de render. Use uma constante
  estável fora do seletor.
- **Três tipos de tela.** Raiz de aba (Alunos, Financeiro, Ajustes), empilhada sob uma raiz
  (com botão voltar) e sheet modal (tarefa com ação de confirmar, 88% da altura; o de
  resultado, 74%). A tab bar flutua sobre toda tela que não é sheet e some com sheet aberto; o
  conteúdo reserva 126px embaixo para ela nunca cobrir nada. A barra de navegação do topo
  aparece com a rolagem; o botão voltar não. No sheet, a ação primária mora no rodapé fixo.
- **Estado persistido** em `mobile/src/estado/dados.ts` (chave `aulaemdia.app.v4`).
  A tela nunca escreve no AsyncStorage direto.
- **Acessibilidade** conforme `spec/acessibilidade.md`: alvo de toque nunca abaixo de 44px (aba
  com 48px), pontos e barras do pacote são decorativos, delta do extrato tem texto alternativo,
  toast é `live region`, sheet é modal para o leitor de tela.
- `mobile/src/dados/seed.json` é **cópia** de `data/seed.json` (o Metro não resolve fora da
  raiz do projeto). Ao mudar o handoff, copie de novo em vez de editar os dois.

## Onde está o quê

```
mobile/                        o app (ver mobile/README.md para o mapa interno)
  src/telas/entrada/             login e onboarding (Fluxo A)
  src/telas/reposicao/           o assistente de 3 passos (Fluxo C)
  src/telas/aluno/               a visão do aluno (Fluxo F)
  src/telas/ajustes/             as sub-telas de configuração (Fluxo E)
README.md                      apresentação do projeto (é a página inicial no GitHub)
CONTRIBUTING.md                processo do time: donos, branch, commit, PR e armadilhas
CODEOWNERS                     quem o GitHub chama para revisar cada caminho
.github/workflows/ci.yml       CI: typecheck e testes a cada push e PR
supabase/                      migrações do banco (esquema + RLS) e o que falta na Parte 2
.env.example                   variáveis de ambiente; copie para mobile/.env
docs/jira/                     o quadro Scrum: papéis, sprints e o backlog importado
handoff-ios-glass/             especificação de design atual: README + protótipos iOS Glass
HANDOFF.md                     aponta para handoff-ios-glass/README.md
PRODUCT.md, DESIGN.md          contexto de produto e sistema visual que o Impeccable lê
docs/design/redesign-ios-glass/ plano e mapa de telas da troca de design system
docs/design/historico/         direção visual aposentada (tinta chapada) e seus protótipos
docs/design/revisoes/          relatórios das rodadas do /designer (capturas ficam fora do git)
docs/backend/                  plano do backend (Supabase) em 8 partes — nada construído ainda
.claude/                       skill /designer, revisor-design, permissões e agentes do redesign
PROXIMOS-PASSOS.md             backlog priorizado do que vem depois
IMPLEMENTACAO.md               HISTÓRICO: plano da direção aposentada — não seguir
tokens/                        tokens em JSON (fonte dos tokens, espelhada em tokens.ts)
spec/politica.ts               regras de negócio como módulo puro (referência do porte)
spec/casos-de-teste.md         casos de teste tabelados das regras
spec/componentes.md            inventário de componentes com props
spec/navegacao.md              máquina de navegação (telas, transições, pilha)
spec/acessibilidade.md         contraste, alvos de toque, leitores de tela
data/seed.json                 dados-semente (alunos, extratos, políticas)
Envio01-AulaEmDia (1).pdf      proposta do projeto: problema, concorrência, escopo do MVP
```

## Divergências conhecidas entre protótipo e spec

Documentadas em `mobile/README.md`. Em resumo: a tela de Resultado corrige um cálculo
duplicado do protótipo, e a semente tem `pendencia.dias` inconsistente com `pendencia.origem`
— mantido como está no handoff. Onde o protótipo iOS Glass simplifica uma regra que o domínio já
implementa (janelas fixas × motor `agenda.ts`, por exemplo), vale o domínio.

## Decisões que ainda exigem confirmação do time

- Backend e sincronização (o app é local-only).
- Envio real de mensagem ao aluno (hoje só registra e mostra o toast).
- Calendário real para sugerir janelas de reposição (as janelas ainda são as fixas do
  handoff, em `data/seed.json`) — é o motor que o Envio 01 aponta como o diferencial.
- Satoshi em app publicado: **a licença permite** (ITF FFL 2.0, lida em 07/10/2026 — ver
  `README.md`). O que falta decidir é o `SCRUM-56`: os TTFs daqui são instâncias fatiadas do
  variável (Derivative Work, § 05) e estão versionados num repositório público (§ 02). A
  métrica de `tipografia.ts` não muda com a troca pelos oficiais; os pesos 600 e 800 é que
  não existem como arquivo oficial.
