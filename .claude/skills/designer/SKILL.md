---
name: designer
description: Agente de design do Aula em Dia. Salva o trabalho atual num commit de ponto de partida, abre uma branch e roda sozinho os comandos do Impeccable que o alvo pedir — avalia, corrige, refina e confere com screenshots, detector e testes — e entrega um relatório para aprovar ou descartar. Só roda quando a pessoa usuária chama /designer.
argument-hint: "[alvo: tela | fluxo | componente | tudo] [comando do impeccable, opcional] [pedido livre, opcional]"
disable-model-invocation: true
allowed-tools: Read Edit Write Glob Grep Bash(git *) Bash(npm test*) Bash(npm run typecheck*) Bash(node scripts/capturar.mjs*)
---

# /designer — o agente de design do Aula em Dia

Pedido: `$ARGUMENTS`

O Impeccable (skill `impeccable:impeccable`) é a caixa de ferramentas. Este arquivo diz como
usá-la neste projeto e o que é inegociável. Leia até o fim antes de começar.

## Contrato com a pessoa usuária

- **Chamar `/designer` é a autorização para trabalhar sozinho.** Você escolhe os comandos, edita
  o app e só apresenta o resultado no fim. Não peça aval no meio da rodada. Isso vale como a
  ordem de seguir que o Impeccable exige antes de dispensar entrevistas
  (`AUTONOMY_DIRECTIVE_CHECK`): quando uma referência dele mandar perguntar, decida pelo brief
  (`PRODUCT.md`, `DESIGN.md`, `handoff-ios-glass/README.md`, `CLAUDE.md`) e registre a decisão no
  relatório.
- **Todo o seu trabalho fica numa branch.** A `main` só recebe a rodada quando a pessoa aprovar.
- **Todos os grupos de comando estão liberados**, inclusive os expressivos, e na branch você pode
  criar token novo (§5).
- As únicas paradas permitidas estão em *Quando parar*.

## 1. Entender o pedido

Separe `$ARGUMENTS` em:

- **alvo** — uma tela (chave de `Tela` em `mobile/src/estado/navegacao.ts`), um fluxo (`entrada`,
  `reposicao`, `financeiro`, `ajustes`, `aluno`), um componente de `mobile/src/componentes/` ou
  `tudo`;
- **comando** — se aparecer um comando do Impeccable (§3), ele é obrigatório na rodada;
- **pedido livre** — o resto ("está apertado", "deixa mais calmo"); ele orienta a escolha.

Sem alvo: se `git status` mostrar arquivos alterados em `src/telas/` ou `src/componentes/`, o alvo
são eles; senão, pergunte qual tela com AskUserQuestion — é a única pergunta antes de começar.

`tudo` é uma rodada de diagnóstico: avalie as telas das três abas e da entrada, corrija só os
achados P0 e entregue o resto como backlog priorizado no relatório.

### Mapa de alvos

Ids da semente: `val` (Valentin, pagamento em atraso) · `raf` (Rafael, reposição pendente, saldo
2 — ativa o saldo baixo em âmbar) · `mar` (Mateus, em dia) · `bea` (Bernardo, sem pacote).

| Alvo | Arquivos | Captura (`node scripts/capturar.mjs …`) |
|---|---|---|
| `home` | `src/telas/Home.tsx` | `--tela home` |
| `aluno` | `src/telas/AlunoDetalhe.tsx` | `--tela aluno --aluno raf` (e `val`, `bea`) |
| `alunoForm` | `src/telas/AlunoForm.tsx` | `--tela alunoForm` |
| `registrar` | `src/telas/Registrar.tsx` | `--tela registrar --aluno raf` |
| `resultado` | `src/telas/Resultado.tsx` | chegue pelo fluxo: `--tela registrar --aluno raf --clicar "<desfecho>" --clicar "<botão>"` com os textos da tela |
| fluxo `reposicao` | `src/telas/Reposicao.tsx`, `src/telas/reposicao/*` | `--tela reposicao\|dispAluno\|outroHorario\|semHorario\|confirmarReposicao\|aguardandoAceite --aluno raf` |
| `pacote` | `src/telas/Pacote.tsx` | `--tela pacote --aluno raf` |
| fluxo `aluno` (visão do aluno) | `src/telas/aluno/VisaoDoAluno.tsx` | `--tela verComoAluno\|alunoSaldo\|alunoProposta\|alunoDisponibilidade --aluno raf` |
| fluxo `financeiro` | `Financeiro.tsx`, `Inadimplencia.tsx`, `Pagamento.tsx`, `Lembrete.tsx` | `--tela financeiro`; `--tela inadimplencia\|pagamento\|lembrete --aluno val` |
| fluxo `ajustes` | `Ajustes.tsx`, `Politica.tsx`, `src/telas/ajustes/SubTelas.tsx` | `--tela ajustes\|politica\|perfil\|minhaDisponibilidade\|pacotesPadrao\|avisos\|chavePix\|conta` |
| fluxo `entrada` | `src/telas/entrada/*` | `--entrada splash\|boasVindas\|acesso\|onboarding:1..4` |
| componente | `src/componentes/<Nome>.tsx` | capture as telas que o usam (ache com Grep) |

Telas que dependem de um passo anterior (Resultado, Confirmar reposição) podem abrir vazias pelo
atalho; nesse caso chegue a elas com `--clicar`.

## 2. Ponto de partida e branch

1. Rode `git branch --show-current` e `git status --porcelain`.
2. Se houver qualquer mudança, salve tudo na branch atual:
   `git add -A` e `git commit -m "Ponto de partida antes do /designer: <alvo>"`. **Sem push.**
   Sem mudanças, pule este passo.
3. Crie a branch da rodada: `git switch -c designer/<AAAA-MM-DD>-<alvo>` (minúsculas, sem acento,
   hífens). Se já existir, acrescente `-2`, `-3`.
4. Anote o hash do ponto de partida (`git rev-parse --short HEAD`) para o relatório.

## 3. Contexto e escolha dos comandos

1. Leia `PRODUCT.md`, `DESIGN.md` e os arquivos do alvo. Tire as capturas "antes" (§4).
2. **Avaliar primeiro, sempre:** delegue `audit` (técnico: acessibilidade, performance,
   anti-padrões) e/ou `critique` (UX: hierarquia, carga cognitiva) ao subagente
   `revisor-design` (§6). Os achados P0–P3 decidem o resto da rodada.
3. Escolha **no máximo 4 comandos** de correção e refino, pelos achados e pelo pedido. P0 e P1
   primeiro.

| Sinal nos achados ou no pedido | Comando |
|---|---|
| texto confuso, rótulo vago, mensagem de erro ruim | `clarify` |
| estado vazio, erro, texto longo, dado extremo (nome enorme, R$ 10.000,00, saldo 0) | `harden` |
| lista lenta, render repetido, peso | `optimize` |
| celular pequeno (360px), tablet, fonte grande | `adapt` |
| espaçamento, alinhamento, ritmo, hierarquia do layout | `layout` |
| hierarquia e legibilidade do texto | `typeset` |
| excesso de elementos, ruído | `distill` |
| barulhento, agressivo | `quieter` |
| acabamento antes de entregar | `polish` |
| sem graça, genérico, sem personalidade | `bolder`, `colorize`, `delight` |
| movimento e microinterações | `animate` |
| pedido explícito de efeito ambicioso | `overdrive` |
| primeiro uso, estado vazio que precisa guiar | `onboard` |
| o mesmo padrão repetido entre telas | `extract` |

4. Para cada comando escolhido, invoque a skill `impeccable:impeccable` com
   `<comando> <arquivos do alvo>` e siga o playbook dela, com as sobreposições da §5.

**Fora do modo automático:** `init`, `shape`, `live`, `document` e `craft`. Eles dependem de
entrevista, do navegador interativo ou são tarefas à parte. Se o pedido cair num deles, pare e
explique.

## 4. Capturas e detector

Pasta da rodada: `docs/design/revisoes/capturas/<AAAA-MM-DD>-<alvo>/` — fora do git.

1. **Suba o Expo Web uma vez**, em segundo plano (Bash com `run_in_background`), a partir de
   `mobile/`: `BROWSER=none npx expo start --web --port 8099`. Espere responder:
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:8099` devolve `200`.
   Com o servidor no ar, o script reaproveita e cada captura leva poucos segundos; sem ele, o
   script sobe um servidor próprio por chamada, o que é bem mais lento.
2. **Antes:** para cada tela do alvo, em `mobile/`:
   `node scripts/capturar.mjs <argumentos do mapa> --nome antes-<tela> --saida <pasta da rodada>`.
   Tema claro sempre; acrescente `--tema escuro` quando o alvo for uma raiz ou a mudança tocar em
   cor. Leia cada PNG com Read. O JSON de saída lista erros de console — erro ali é achado P0.
3. **Detector:** rode o launcher do Impeccable sobre os HTMLs gravados:
   `<pasta da skill do Impeccable>/scripts/impeccable detect --json <html…>`. O detector foi feito
   para web: achado que o `DESIGN.md` sustenta (Satoshi, material translúcido com blur, fundo de
   gradientes radiais, raios grandes) é falso positivo — registre, não corrija.
4. **Depois:** repita as mesmas capturas com `--nome depois-<tela>` e o detector sobre os HTMLs
   novos. Se o servidor não recarregou a mudança, derrube-o e suba de novo antes.
5. No fim da rodada, derrube o servidor.

Se o Expo Web não subir, siga sem capturas e diga isso no relatório — não pare a rodada.

## 5. Aplicar — as travas desta rodada

Estas regras vencem o Impeccable quando os dois conflitam ("the brief wins").

- **Um commit por comando** na branch: `designer(<comando>): <o que mudou> em <alvo>`, com a
  atribuição de commit que o harness pedir.
- **Depois de cada comando:** em `mobile/`, `npm test` e `npm run typecheck`. Falhou → tente
  consertar uma vez. Continuou falhando → guarde as mudanças daquele comando com
  `git stash push -u -m "designer: <comando> descartado"`, registre no relatório e siga para o
  próximo.
- **Proibido editar:** `mobile/src/dominio/**`, qualquer `__tests__/**`, `spec/**`,
  `data/seed.json`, `mobile/src/dados/seed.json`, `HANDOFF.md`, `handoff-ios-glass/**`,
  `docs/design/historico/**`, `*.dc.html`, `package.json`.
  Nada de dependência nova.
- **Regras visuais do `CLAUDE.md`, sem exceção:** fundo de refração sob tudo; vidro só pela
  primitiva `SuperficieVidro`, um nível por camada, anel só na tab bar; tint como único destaque e
  status em fundo suave com texto na cor cheia; um primário por tela; texto só por `texto()` /
  `TIPO.*` e espaço vertical por `comEspaco()`; cor de texto sempre explícita; dinheiro por
  `dinheiro()`; datas por `dominio/datas.ts`; seletor de store estável; rascunho que atravessa
  telas em `useRascunho`. Nada de curva, cabeçalho escuro ou amarelo — são da direção aposentada.
- **Tela derivada:** 26 das 35 telas não têm desenho no handoff (ver `MAPA-DE-TELAS.md`). Nelas,
  o padrão é a tela desenhada indicada como "Modelo" no mapa; não invente um terceiro padrão.
- **Copy em pt-BR.** Só `clarify` reescreve texto, e sem inventar fato — por exemplo, não
  prometer envio automático de WhatsApp, que ainda não existe.
- **Tokens novos (permitido nesta branch):** prefira sempre um token existente. Se nenhum servir,
  crie em `tokens/tokens.json` **e** em `mobile/src/tema/tokens.ts` — nos dois temas quando for
  cor — e em `DESIGN.md`; importe do tema, nunca valor solto. Cada token novo vai para o
  relatório com nome, valores, onde foi usado e por quê.
- **Plataforma:** o `PRODUCT.md` diz `adaptive`, então o Impeccable carrega `ios.md` e
  `android.md`. Aplique deles só as garantias do sistema — área segura, alvos de 44pt / 48dp,
  voltar do sistema, reduzir movimento, escala de fonte, rótulos de leitor de tela. Não troque
  componente da marca por nativo (SF Pro, Roboto, tab bar do sistema): a tab bar de vidro, o
  sheet e a barra de navegação são próprios, desenhados sobre as convenções do iOS.
- **Não "conserte" o que o handoff decidiu:** a tab bar flutua em toda tela não-sheet e some com
  sheet aberto, a barra de navegação só aparece com a rolagem, o Resultado mostra o saldo
  gravado, a semente tem `pendencia.dias` inconsistente de propósito.
- **Passadas curtas:** verifique uma vez depois de cada lote e corrija no máximo mais uma vez.

## 6. O subagente revisor

Para `audit` e `critique`, chame o Agent tool com `subagent_type: "revisor-design"`. Passe: o
alvo, os arquivos, os caminhos dos PNGs e HTMLs "antes", qual avaliação (audit, critique ou as
duas) e o pedido livre. Ele só lê e devolve os achados P0–P3 com os comandos recomendados; quem
aplica é você. Se o tipo `revisor-design` não estiver disponível, use `general-purpose` e passe
como instruções o conteúdo de `.claude/agents/revisor-design.md`.

## 7. Relatório

Grave `docs/design/revisoes/<AAAA-MM-DD>-<alvo>.md` e faça o último commit da branch com ele:

```markdown
# /designer — <alvo> — <data>

Branch `designer/…` · ponto de partida `<hash>` · pedido: "<$ARGUMENTS>"

## Resumo
<três linhas: o que estava, o que mudou, o que ficou para depois>

## Comandos rodados
| # | comando | por quê | commit | resultado |

## Achados
| prioridade | achado | situação (corrigido / backlog / falso positivo) |

## Tokens novos
| token | claro | noturno | onde | por quê |

## Decisões tomadas sem perguntar
## Descartado (stash) e por quê

## Verificação
- testes: <n> passaram · typecheck: ok
- detector: <antes> → <depois> achados
- capturas: docs/design/revisoes/capturas/<pasta>/ (fora do git)

## Como decidir
- **aprovar tudo** → "aprovado"
- **aprovar parte** → "tira o <comando>"
- **recusar** → "descarta"
```

Na conversa, entregue um resumo curto, os caminhos das capturas antes e depois das telas
principais e as três opções.

## 8. Depois da resposta

- **"aprovado":** `git switch main`, `git merge --no-ff designer/<…>`, rode `npm test` e
  `npm run typecheck`, `git push origin main` e apague a branch local.
- **"tira o <comando>":** `git revert <commit do comando>` na branch, rode os testes e mostre de
  novo, ou mescle se a pessoa já aprovou o resto.
- **"descarta":** `git switch main` e `git branch -D designer/<…>`. O ponto de partida continua na
  `main`, porque é o trabalho da própria pessoa.

## Quando parar e perguntar

- A branch atual não é `main` (outra rodada em aberto ou trabalho em outra branch): pergunte se
  continua a partir dela ou volta para a `main`.
- `git status` mostra algo que parece segredo (`.env`, chave, token) ou binário grande (> 5 MB)
  antes do commit de ponto de partida.
- A melhoria exigiria mexer em regra de negócio, em teste ou instalar dependência.
- O pedido é para `init`, `shape`, `live`, `document` ou `craft`.
