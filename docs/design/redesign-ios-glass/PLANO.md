# Plano — troca completa do design system para iOS Glass, executada por agentes

## Contexto

O app `mobile/` (Expo SDK 57, 35 telas) usa hoje a direção "tinta chapada": cabeçalho escuro,
duas curvas obrigatórias, amarelo `#FFD032`, navbar com pílula sem desfoque. O pacote
`C:\Users\rafae\OneDrive\Área de Trabalho\design_handoff_ios_glass` define uma direção nova:
material de vidro sobre fundo de refração, tab bar flutuante, sheets modais, barra de navegação
que aparece com a rolagem, tint `#35577D`/`#9FBEDF`, claro e escuro. O handoff desenha **9 telas**; o app tem 35.

Decisões já tomadas com a pessoa:
- **Migrar as 35 telas.** As 9 seguem o handoff à risca; as 26 restantes são derivadas pelos agentes com os mesmos componentes, e cada decisão fica registrada.
- **Vidro com `expo-blur` + fallback.** Validar numa prova de conceito antes de migrar. No Android o blur está estável desde o SDK 55, exige `BlurTargetView` e é mais lento no Android 11 ou anterior.
- **Substituir e apagar o design antigo**; o histórico fica no git.
- **Branch única `redesign/ios-glass`, em ondas**, com agentes paralelos em worktrees na onda de telas e aprovação da pessoa no fim de cada onda.
- **Base:** mesclar `designer/2026-09-11-tudo` na main (`--no-ff`, testes antes) e só então criar a branch a partir da main.

O que o mapeamento do código mostrou e orienta o plano:
- Toda cor já passa por `useCores()` (`src/tema/TemaProvider.tsx`), e há **0 hex solto nas telas**. O tema escuro já existe e persiste (`CHAVE_TEMA`). Por isso a troca de paleta é centralizada.
- `texto()`/`TIPO`/`comEspaco()` (`src/tema/tipografia.ts`) continuam valendo, porque a fonte continua Satoshi. Muda só o conjunto de papéis do `TIPO`.
- Há cerca de 312 números de layout soltos nas telas. Eles serão reescritos tela a tela.
- A navegação (`src/estado/navegacao.ts`) **não tem conceito de sheet**. `TELAS_COM_NAVBAR` esconde a navbar fora das raízes, e o handoff novo mostra a tab bar em todas as telas não-sheet.
- Faltam no projeto `expo-blur`, Reanimated e gesture-handler. Não é preciso Reanimated: o `Animated` do RN com `Easing.bezier(.32,.72,0,1)` cobre o sheet e a opacidade da barra.
- Nenhum teste depende de visual. `src/telas/__tests__/montagem.test.tsx` só monta as 28 telas dentro de `TemaProvider`.
- `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md`, `.claude/skills/designer/SKILL.md` e `.claude/agents/revisor-design.md` **proíbem** exatamente a nova direção: curvas obrigatórias, sem BlurView, amarelo, navbar que some. Precisam ser reescritos **antes** de qualquer agente rodar, senão os agentes vão reverter o trabalho.

---

## Princípio de execução: coexistência até a limpeza

Para cada commit manter `npm test` e `npm run typecheck` verdes, e para os worktrees paralelos
não se quebrarem:
- **Tokens novos entram ao lado dos antigos** (Onda 1). Os antigos só saem na Onda 4.
- **Componentes novos ficam em arquivos novos** de `src/componentes/`, sem colidir com os antigos. Cada tela migra por inteiro, trocando todos os seus imports de uma vez.
- Os arquivos antigos (`Curva.tsx`, `Navbar.tsx`, `Cabecalho.tsx`, `Base.tsx`, `Botoes.tsx`, `Aluno.tsx`, `Formulario.tsx`, `Tela.tsx`) são apagados quando nenhuma tela os importa mais.
- **Domínio não muda.** `src/dominio/**` fica intocado. Se o handoff contradisser uma regra (ordenação "Urgência", segmentos 48h/26h/10h, janelas fixas × `agenda.ts`), o agente segue o domínio e registra a divergência.

---

## Agentes

Três definições novas em `.claude/agents/` e uma atualizada. A orquestração fica na sessão
principal, que também faz os merges, os checkpoints e os relatórios.

| Agente | Tipo | Ferramentas | Usado em |
|---|---|---|---|
| `construtor-vidro` (novo) | implementa fundação, chassi e componentes | Read, Edit, Write, Glob, Grep, Bash | Ondas 1 e 2 (3 instâncias) |
| `migrador-telas` (novo) | migra um fluxo de telas usando só o catálogo | Read, Edit, Write, Glob, Grep, Bash | Onda 3 (5 instâncias paralelas, `isolation: worktree`) |
| `integrador-redesign` (novo) | mescla os worktrees, promove componentes locais, apaga o legado, atualiza testes e docs | Read, Edit, Write, Glob, Grep, Bash | Onda 4 |
| `revisor-design` (atualizado) | só leitura: audit/critique contra o handoff novo | como hoje | Onda 5 (3 paralelos) |
| `impeccable:impeccable-finish-reviewer` (existente) | compara as 9 telas com o comp | existente | Onda 5 |
| `impeccable:impeccable-documenter` (existente) | regrava `DESIGN.md` a partir do que foi entregue | existente | Onda 4 |

Todo agente implementador recebe o mesmo bloco de regras:
- Leia `handoff-ios-glass/README.md` e `docs/design/redesign-ios-glass/MAPA-DE-TELAS.md`.
- Nada de cor ou medida solta: importar de `tokens.ts`.
- Não editar `src/dominio/**`, `spec/politica.ts` nem `data/seed.json`.
- Um commit por unidade lógica (`redesign(<onda>): …`).
- `npm test` e `npm run typecheck` verdes antes de cada commit. Se falhar duas vezes, parar e relatar.
- Terminar com um relatório curto: o que fez, o que derivou sem handoff, divergências, componentes locais criados.

---

## Onda 0 — Preparação (sessão principal, sem agentes)

1. `npm test` e typecheck na branch 11/09. Depois `git checkout main`, `git merge --no-ff designer/2026-09-11-tudo`, testes de novo e push. Isso segue a memória de fluxo: aprovado vai para a main.
2. `git checkout -b redesign/ios-glass`.
3. **Trazer o handoff para dentro do repositório** (worktrees não enxergam o Desktop): copiar `README.md` e os dois `.dc.html` (+ `support.js`) para `handoff-ios-glass/`. Mover o `HANDOFF.md` antigo e os `*.dc.html` da raiz para `docs/design/historico/tinta-chapada/`.
4. **Reescrever as regras que bloqueiam a nova direção**, num commit só:
   - `CLAUDE.md`: saem as regras 3 (curvas), 4 (pílula sem blur) e 5 (amarelo). Entram as regras do vidro: fundo de refração obrigatório, um nível de vidro por camada, nada de texto pequeno sobre transparência, status em fundo Soft com texto na cor cheia, tint muda de valor entre temas e nunca de identidade, anel de refração só na tab bar. A navbar vira tab bar visível em telas não-sheet. A convenção do rodapé muda: sheet tem rodapé fixo em faixa; tela empilhada tem conteúdo com padding inferior de 126.
   - `PRODUCT.md`: Brand Commitments novos.
   - `.claude/skills/designer/SKILL.md` §5 e `.claude/agents/revisor-design.md` ("o que não é problema"): passam a proteger a direção iOS Glass.
   - `DESIGN.md`: stub provisório apontando para o handoff. A versão final sai na Onda 4.
5. **Escrever `docs/design/redesign-ios-glass/MAPA-DE-TELAS.md`**, o contrato compartilhado pelos agentes. Para cada uma das 35 telas: tipo (raiz de aba / empilhada / sheet 88% / sheet 74% / entrada), seção do handoff ou "derivada", componentes do catálogo, rótulo do voltar. Proposta:
   - **Raízes:** `home`, `financeiro`, `ajustes`.
   - **Empilhadas:** `aluno`, `inadimplencia`, `politica`, `aguardandoAceite`, `verComoAluno`/`alunoSaldo`/`alunoProposta`/`alunoDisponibilidade`, e as 6 sub-telas de Ajustes.
   - **Sheets 88%:** `registrar`, `reposicao`, `outroHorario`, `semHorario`, `dispAluno`, `confirmarReposicao`, `pacote`, `pagamento`, `lembrete`, `alunoForm`.
   - **Sheet 74%:** `resultado`.
   - **Entrada** (7 telas, sem tab bar): fundo de refração, título grande, cartões de vidro, primário no rodapé.
6. Criar as 3 definições de agente acima.
7. **Capturas "antes"**: as 35 telas nos dois temas, em `docs/design/revisoes/capturas/redesign-antes/`, com `npm run capturar`.
8. Commit "Ponto de partida do redesign iOS Glass".

## Onda 1 — Fundação e prova do material (1 × `construtor-vidro`)

- `npx expo install expo-blur`. Conferir se o `jest-expo` transforma o pacote; se não, incluí-lo em `transformIgnorePatterns`.
- **Tokens novos**, lado a lado com os antigos, em `tokens/tokens.json` e `src/tema/tokens.ts`:
  - `CORES_VIDRO.{claro,escuro}` com todos os tokens de cor do handoff (`tela`, `ink`, `ink2`, `ink3`, `hair`, `card`, `glass`, `glass2`, `sheet`, `edge`, `edgeTop`, `fill`, `fill2`, `tint`, `tintSoft`, `tintSh`, `onTint`, `verm*`, `ambar*`, `verde*`, `sombra`, `m1`–`m4`). Os nomes ficam em português, seguindo o código (ex.: `tinta`, `tinta2`, `tinta3`, `fio`, `vermelho`, `vermelhoSuave`...).
  - `MATERIAL.{claro,escuro}`: intensidade do BlurView calibrada a partir de `blur(16px) saturate(190%)`, strings `gin` e `gsh` para `boxShadow` inset, opacidade do fundo (0.85/0.60).
  - `RAIO_VIDRO`, `TAMANHO_VIDRO` (barra de nav 94, tab bar 66, conteúdo 54/100/126, botões 54/52/50/40/46) e `MOVIMENTO_VIDRO` (sheet 340, fundo 200, toast 3600, barra 180, switch 200).
  - Papéis novos no `TIPO`, tirados da tabela Tipografia do handoff (`tituloGrande`, `tituloEmpilhada`, `saldoResultado`, `saldoCartao`, `resumo`, `tituloSheet`, `nomeLista`, `tituloBloco`, `botao`, `apoio`, `textoBloco`, `cabecalhoGrupo`, `faixa`, `rotuloAba`), sempre via `texto()`.
- **`TemaProvider`**: mesma API, mais `useVidro()` → `{ cores, material, tema }`. `useCores()` fica intocado até a Onda 4.
- **Primitivas** em `src/componentes/Vidro.tsx`:
  - `FundoRefracao`: 4 `RadialGradient` do `react-native-svg`, elípticos via `gradientTransform`, `pointerEvents="none"`.
  - `SuperficieVidro({ nivel: 'card'|'glass'|'glass2'|'sheet', raio, anel? })`: BlurView + miolo translúcido + `gin` + borda de 0,5px. Tem um modo `fallback` (sem BlurView), escolhido por plataforma ou versão do Android e forçável por constante.
  - `AlvoDeDesfoque`: envolve o conteúdo com `BlurTargetView` no Android.
- **Prova de conceito**: `src/componentes/__catalogo__/Catalogo.tsx`, uma tela só de desenvolvimento, fora do `registro.ts`. Abre pelo gancho `__aulaEmDia` e por uma flag nova `--catalogo` em `scripts/capturar.mjs`. Mostra fundo + cartão + barra + sheet estático nos dois temas, com texto passando por baixo e **recorte com `overflow: hidden` + raio**, justamente o que quebrava antes.

**Checkpoint 1 (pessoa):** capturas web do catálogo nos dois temas. A pessoa abre no Expo Go, em iOS e, se possível, em Android, e decide onde o blur fica e onde entra o fallback. O agente não roda `expo login`.

## Onda 2 — Chassi e componentes (2 × `construtor-vidro` em paralelo, worktrees)

Os conjuntos de arquivos não se sobrepõem, então o merge é limpo.

**2A — Chassi e navegação**
- `src/estado/navegacao.ts`:
  - Criar `TIPO_DA_TELA: Record<Tela, 'raiz'|'empilhada'|'sheet'>`, lido do mapa, e a derivação `sheetAberto`.
  - Semântica do handoff: `ir` de sheet para sheet troca o conteúdo do sheet sem fechá-lo. Criar `fecharSheet()`, que remove as entradas de sheet da pilha e volta para a última tela não-sheet (ou para a ficha, se houver `alunoId`, ou para `home`). O `voltar` do Android fecha o sheet.
  - `TELAS_COM_NAVBAR` sai; a tab bar aparece em toda tela não-sheet.
  - Atualizar `src/estado/__tests__/navegacao.test.ts` e `spec/navegacao.md` **no mesmo commit**.
- Componentes novos:
  - `Chassi.tsx`: `TelaVidro({ tipo, titulo, voltarPara, children })`, com ScrollView, padding 54/100 + 126 e `onScroll` → opacidade da `BarraNavegacao` em degraus de 0.1 (`Animated`, 180ms).
  - `BotaoVoltar`: chevron + rótulo em tint, sempre visível.
  - `TabBar.tsx`: vidro, anel, item ativo com gradiente + `edgeTop` + brilho, alvo ≥ 48px. Não se desenha indicador de home nem status bar falsa, porque o sistema já os tem.
  - `Sheet.tsx`: fundo `rgba(6,10,20,.4)` com fade de 200ms; painel com raio 40, animação de subida de 340ms com bezier, puxador, cabeçalho de 52 com "Cancelar"; corpo rolável e rodapé com fio. `accessibilityViewIsModal`.
  - `Toast` novo: vidro, bottom 106, live region.
- `App.tsx`: `FundoRefracao` sob tudo, `StatusBar` conforme o tema (`dark` no claro, `light` no escuro), tab bar escondida com sheet aberto, sheet renderizado por cima da última tela não-sheet. O `FaixaCurvaNavbar` sai daqui.

Estado intermediário aceito: as telas antigas ainda desenham o próprio cabeçalho escuro dentro do chassi novo.

**2B — Catálogo de componentes** (`Controles.tsx`, `Listas.tsx`, `Blocos.tsx`, `Icone.tsx`)
- Botões: primário, primário desabilitado, secundário, compacto, inline, texto; hover/pressed pelo `Pressable`.
- `Segmentado` (34/36/30), `Switch`, `Stepper`, `CartaoEscolha` (radio), `CartaoVidro`.
- `ListaAgrupada`, `LinhaLista`, `LinhaAluno`, `LinhaExtrato`, `CabecalhoGrupo`.
- `FaixaStatus`, `Avatar` (3 estados), `MedidorPacote`, `BlocoStatus`, `CartaoResumo`, `BarraProporcional`.
- `Icone`: chevron, check, mais, alerta e os 3 ícones de aba.
- Derivados sem handoff, no mesmo idioma: `CampoDeTexto` (trilho `fill`, foco em tint, erro em vermelho), `GradeSemanal` restilizada, `PreviaDeMensagem`.
- Tudo aparece no `Catalogo` nos dois temas.

**Checkpoint 2 (pessoa):** a sessão principal mescla 2A e 2B, roda testes e typecheck, captura catálogo + home no chassi novo. A pessoa aprova o catálogo **antes** das 35 telas.

## Onda 3 — Telas (5 × `migrador-telas` em paralelo, `isolation: worktree`)

As fatias são por pasta ou fluxo, para não haver conflito de arquivo. Cada agente trabalha numa branch `redesign/ios-glass-tN` que sai da Onda 2.

| Agente | Telas | Handoff |
|---|---|---|
| T1 Alunos | `Home`, `AlunoDetalhe`, `AlunoForm`, `Pacote`, `aluno/VisaoDoAluno` (4 telas) | §1, §2 |
| T2 Registro e reposição | `Registrar`, `Resultado`, `Reposicao`, `reposicao/*` (5) | §3, §4, §5 |
| T3 Financeiro | `Financeiro`, `Inadimplencia`, `Pagamento`, `Lembrete` | §6, §7 |
| T4 Ajustes | `Ajustes`, `Politica`, `ajustes/SubTelas` (6) | §8, §9 |
| T5 Entrada | `entrada/*` (7 telas + `PassoDoOnboarding`) | derivada |

Regras específicas da Onda 3:
- As 9 telas do handoff seguem medidas e copy do README novo. O que o app tem a mais é mantido e vestido com o catálogo; o protótipo não vale como teto de funcionalidade. Exemplos: o motor `agenda.ts` no lugar das janelas fixas, `aguardandoAceite`, arquivar aluno.
- Não editar `src/componentes/*` compartilhado. Se faltar peça, criar componente local no arquivo da tela e listá-lo no relatório para o integrador promover.
- Não tocar `navegacao.ts` nem `registro.ts`. Se o `MAPA-DE-TELAS.md` estiver errado para uma tela, relatar em vez de mudar.
- Cada agente captura suas telas depois de migrar (web, dois temas, alunos `val`/`raf`/`mar`/`bea` onde se aplicam).
- O bloco "Zerar dados de demonstração" do handoff **não** é portado.

## Onda 4 — Integração e limpeza (1 × `integrador-redesign` + `impeccable-documenter`)

- Mesclar T1–T5 na `redesign/ios-glass`, na ordem T5, T4, T3, T1, T2, com testes e typecheck a cada merge.
- Promover os componentes locais repetidos para `src/componentes/`.
- **Apagar o legado:**
  - Componentes: `Curva.tsx`, `Navbar.tsx`, `Cabecalho.tsx`, antigos `Base`/`Botoes`/`Aluno`/`Formulario`/`Tela` e `Marca.tsx` (o wordmark das 4 barras com amarelo precisa de versão nova ou sai).
  - Tokens: `MARCA`, `CORES` antigo, `VIDRO`, `CURVAS`, `ICONES_ABA` antigo, `ESPACO` não usado.
  - Renomear `CORES_VIDRO` → `CORES` e `useVidro` → `useCores`; tirar os sufixos `_VIDRO`.
  - Remover os SVGs de curva em `assets/` e os derivados `tokens.css`/`tokens.scss`/`tailwind.config.js`, que nada no RN consome.
- **Trava contra regressão:** um teste novo em `src/tema/__tests__/legado.test.ts` falha se algum arquivo de `src/` contiver `#FFD032`, `CurvaCabecalho` ou `MARCA.`.
- Estender `montagem.test.tsx` para montar também as 7 telas de entrada e o `Sheet` aberto. Somar um teste que cobre `TIPO_DA_TELA` para as 28 chaves, como já acontece com `ABA_DA_TELA`.
- `scripts/capturar.mjs`: sheets pelo gancho, a lista `RAIZES` derivada de `TIPO_DA_TELA`, e a flag `--catalogo` mantida.
- Docs:
  - `DESIGN.md` regravado pelo `impeccable-documenter` a partir do código entregue, com os dois temas no frontmatter.
  - `mobile/README.md`: seções "Detalhes que não são acidentais" e "Stack" (expo-blur entra, as curvas saem).
  - `README.md` na raiz, versão final do `CLAUDE.md`, `PROXIMOS-PASSOS.md` com o backlog do redesign.
  - `HANDOFF.md` passa a apontar para `handoff-ios-glass/README.md`.
  - Chave de persistência do tema: continua a mesma, porque os nomes `claro`/`escuro` não mudam.

## Onda 5 — Revisão e acabamento

1. **3 × `revisor-design`** em paralelo (Alunos + Registro; Financeiro + Ajustes; Entrada + chassi), sobre as capturas "depois" das 35 telas nos dois temas + detector do Impeccable. Cada um devolve achados P0–P3.
2. **`impeccable-finish-reviewer`** compara as 9 telas do handoff com o `App - Aula em Dia (iOS Glass).dc.html` aberto no Playwright, lado a lado com a captura do app.
3. **1 × `construtor-vidro`** corrige todos os P0/P1, um commit por achado agrupado. P2/P3 vão para backlog.
4. Relatório `docs/design/revisoes/2026-09-XX-redesign-ios-glass.md` no formato do `/designer`: ondas, commits, telas derivadas e decisões, divergências handoff × domínio, tokens, fallback de blur por plataforma, antes/depois.

**Checkpoint final (pessoa):** Expo Go no iOS e no Android, nos dois temas. Aprovado: `merge --no-ff` na main e push. Rejeitar uma parte: `git revert` do commit específico.

---

## Riscos e respostas

| Risco | Resposta |
|---|---|
| Blur quebra o recorte, repetindo o problema antigo, ou pesa no Android | Prova no Checkpoint 1; `SuperficieVidro` com fallback por plataforma e versão, decidido antes da Onda 2 |
| Blur sobre ScrollView no Android sem `BlurTargetView` | `AlvoDeDesfoque` no chassi desde a Onda 1 |
| Radial gradient no RN | SVG `RadialGradient` (lib já instalada) em vez de `experimental_backgroundImage` |
| Worktrees divergem da semântica de sheet | 2A mescla antes da Onda 3; o `MAPA-DE-TELAS.md` é o contrato |
| Agente "corrige" regra de negócio para bater com o protótipo | `src/dominio/**` proibido no prompt; a divergência vai para o relatório |
| Fonte e copy | Satoshi continua. A copy das 9 telas segue o handoff novo; as outras mantêm a atual |

## Verificação

- A cada commit: `npm test` e `npm run typecheck` (em `mobile/`).
- A cada onda: `npm run capturar` das telas tocadas nos dois temas (Expo Web 390×844), sem erro de console. Erro de console conta como P0.
- Onda 4: o teste de legado passa e `grep` por `Curva|MARCA|#FFD032` em `mobile/src` volta vazio.
- Final: fluxos do handoff percorridos à mão no Expo Go:
  - Alunos → Ficha → Registrar (sheet) → Resultado → Escolher horário → Ficha com toast.
  - Financeiro → Cobrança → pagamento com toast.
  - Ajustes → Política → aviso de impacto → Salvar com toast.
  - Trocar de tema.
  - Voltar do Android fechando o sheet.
  - Opacidade da barra de navegação ao rolar.
  - VoiceOver/TalkBack na tab bar e no sheet.

## Arquivos críticos

- `mobile/src/tema/tokens.ts`, `mobile/src/tema/tipografia.ts`, `mobile/src/tema/TemaProvider.tsx`, `tokens/tokens.json`
- `mobile/src/estado/navegacao.ts` + `__tests__/navegacao.test.ts`, `spec/navegacao.md`
- `mobile/App.tsx`, `mobile/src/componentes/*` (novos: `Vidro`, `Chassi`, `TabBar`, `Sheet`, `Controles`, `Listas`, `Blocos`, `Icone`)
- `mobile/src/telas/**` (35 telas), `mobile/src/telas/__tests__/montagem.test.tsx`
- `mobile/scripts/capturar.mjs`, `mobile/src/estado/depuracao.ts`
- `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md`, `.claude/skills/designer/SKILL.md`, `.claude/agents/revisor-design.md`, `.claude/agents/{construtor-vidro,migrador-telas,integrador-redesign}.md`
- `docs/design/redesign-ios-glass/MAPA-DE-TELAS.md`, `handoff-ios-glass/`
