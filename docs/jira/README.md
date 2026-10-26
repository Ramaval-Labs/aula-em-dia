# Jira do Grupo 08

O quadro Scrum do **Aula em Dia** está em
[aulaemdia.atlassian.net](https://aulaemdia.atlassian.net/jira/software/projects/SCRUM/boards/1),
com as três pessoas dentro e os cards atribuídos. Até agora foram oito janelas: uma semana de
preparação e sete sprints de uma semana.

O processo de código (branch, commit, PR, donos, armadilhas) está em
[`CONTRIBUTING.md`](../../CONTRIBUTING.md). Este arquivo é o quadro.

> **Chave do projeto: `SCRUM`**, não `AED`. O projeto foi criado pelo template antes da
> importação, e trocar a chave depois reescreve todos os links já compartilhados.

---

## 1. Os três papéis

A divisão segue **as três camadas que o código já tem**, não perfil técnico. É isso que torna os
conjuntos de arquivos quase disjuntos — dois cards da mesma sprint nunca abrem o mesmo arquivo.

| Pessoa | Papel no Scrum | Camada | Onde trabalha |
|---|---|---|---|
| **Rafael** (`dornelasXz`) | Product Owner **e** Scrum Master | Apresentação | `src/telas/`, `src/componentes/`, `src/tema/`, `tokens/`, `estado/{navegacao,formularios,toast,avisos}.ts`, `DESIGN.md`, o board |
| **Mauro Schulz** | Time de desenvolvimento | Regra pura e portões | `src/dominio/` e seus testes, `.github/`, eslint, `CONTRIBUTING.md`, `.claude/settings.json`, os testes de montagem e navegação |
| **Valentin Klein Antunes** | Time de desenvolvimento | Persistência | `src/dados/`, `estado/{dados,sessao,depuracao}.ts`, `data/seed.json`, `supabase/`, `docs/backend/` |

A tabela completa de donos, incluindo os arquivos de alta contenção e o protocolo para tocar
arquivo alheio, está em [`CONTRIBUTING.md`](../../CONTRIBUTING.md) § 2.

**Duas coisas que valem dizer em voz alta na primeira reunião:**

- **O Jira não tem papel de "Scrum Master" nem de "Product Owner".** Ele conhece Admin / Membro /
  Visualizador. PO e SM são papéis de processo, não permissão — quem registra isso é o time.
- **Acumular PO e SM é um desvio conhecido do Scrum**, porque o PO puxa escopo e o SM protege o
  time desse puxão. Em grupo de três com prazo de disciplina é o arranjo normal, mas
  "o PO decidiu" e "o SM decidiu" não podem virar a mesma frase sem discussão.

**O risco mais concreto do arranjo** é o Rafael acumular PO, dev e review, virando fila única de
aprovação numa sprint de cinco dias. Duas mitigações já estão no lugar:

- **Review cruzado:** Mauro revisa os PRs de Valentin e vice-versa. O `CODEOWNERS` faz o Rafael
  ser revisor obrigatório só de `tema/`, `componentes/` e `telas/`.
- **Ele entra nas sprints com os menores pontos de dev de propósito**, e nunca com card de
  caminho crítico.

---

## 2. As janelas

### Preparação · 30/09 a 07/10 · **fechada, 6 de 6** · não contou para a velocidade

Não era sprint de verdade: era o que impedia as três pessoas de se atrapalharem. Ficou fora da
conta de velocidade porque medir setup contamina a primeira medição.

**Durou 8 dias, não 3.** Estava planejada para 30/09–02/10 e os dois últimos cards fecharam em
07/10. É o primeiro dado real de ritmo do grupo, e vale lembrar dele na planning: a estimativa
inicial de uma janela de setup errou por mais de duas vezes.

O que a semana rendeu além dos cards: o CI pegou um problema de verdade no primeiro uso — uma
animação que não parava ao desmontar (`f3e7528`) —, o `CODEOWNERS` ganhou os três usuários reais
do GitHub, e a quebra do `SubTelas.tsx` saiu melhor que o card pedia, com um `pecas.tsx` para o
molde comum das seis telas de Ajustes.

Todos os seis fecharam:

| Card | Dono | Fechado |
|---|---|---|
| `SCRUM-13` | Rafael | 30/09 — decisão de datas, ver § 3 |
| `SCRUM-36` | Mauro | 01/10 — CI, e já pegou um bug no primeiro uso (`f3e7528`) |
| `SCRUM-49` | Rafael | 01/10 — `main` protegida, GitHub for Jira ligado, `CODEOWNERS` com os três usuários |
| `SCRUM-48` | Rafael | 01/10 — `SubTelas.tsx` em seis arquivos (`d2a1ef8`); destravou `SCRUM-29` e `SCRUM-30` |
| `SCRUM-54` | Mauro | 07/10 — processo revisado e mesclado |
| `SCRUM-50` | Valentin | 07/10 — professor de teste definido; destravou o `seed.sql` do `SCRUM-18` |

A ordem que importava foi respeitada: `SCRUM-36` antes de `SCRUM-49`, porque o status check só
aparece na lista do GitHub depois de o workflow ter rodado uma vez.

### Sprint 1 · 07/10 · **fechada, 5 de 5, 18 pontos num dia**

| Dono | Cards | Pts | PR |
|---|---|---|---|
| Valentin | `SCRUM-15` (1) → `SCRUM-14` (8) | 9 | #5, #4 |
| Mauro | `SCRUM-55` — inferência de ano (3) + `SCRUM-32` — teste do motor de agenda (5) | 8 | #6, #7 |
| Rafael | `SCRUM-45` — licença da Satoshi (1), mais PO e review | 1 | direto (`5480e32`) |

**Planejada para uma semana, fechada no mesmo dia em que começou.** A preparação errou para
mais (8 dias em vez de 3); a Sprint 1 errou para menos, por um fator ainda maior. As duas
medições juntas dizem que o grupo ainda **não sabe estimar**, não que é rápido: os cards da
Sprint 1 eram os mais bem especificados do quadro, com arquivo e linha, e quase não tinham
decisão em aberto. Os da Sprint 2 têm mais decisão (o formato da interface na Parte 1, o
`reposicoes` do Financeiro, o código do país no WhatsApp). Não extrapole 18 pontos por dia.

A suíte saiu de 303 para **399 testes**, todos do Mauro (`agenda.test.ts` e `datas.test.ts`).

### Sprint 2 · 07/10 · **fechada, 7 de 7, 21 pontos na mesma noite**

Abriu às 20h de 07/10 e o último PR (#11) entrou às 21h26. Fechada no Jira em 08/10. É a
segunda sprint seguida que termina no dia em que começa, e desta vez com cards que **tinham**
decisão em aberto (o contrato do `SCRUM-28`, o `55` do WhatsApp). Então "os cards eram os mais
bem especificados" não explica tudo. A estimativa em semanas continua sem bater com o ritmo
real, que hoje se mede em horas.

A suíte foi de 399 para **496 testes**.

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-17` — Parte 1, camada de repositório (8) | 8 |
| Mauro | `SCRUM-16` (2) + `SCRUM-28` (3) + `SCRUM-51` (1) | 6 |
| Rafael | ~~`SCRUM-25` (3)~~ → ~~`SCRUM-26` (2)~~ → ~~`SCRUM-52` (2)~~ **os três em 07/10** | 7 |

**`estado/dados.ts` fica fechado para todos menos o Valentin nesta sprint.** Os cards dos outros
dois foram escolhidos por não abrirem ele.

**Ordem obrigatória dentro da sprint:** `SCRUM-28` antes de `SCRUM-52`; `SCRUM-25` antes de
`SCRUM-26` (mesmo arquivo). Os vínculos estão no board como *blocks*.

**Se a sua faixa esvaziar antes de 14/10**, puxe da Sprint 3, **só da sua faixa** e nesta ordem.
Está escrito no objetivo da sprint, no quadro:

| Dono | Puxa | Por quê nessa ordem |
|---|---|---|
| Valentin | `SCRUM-18` | Parte 2. Não depende da Parte 1 e não abre `estado/dados.ts` |
| Mauro | `SCRUM-53`, depois `SCRUM-33` | `SCRUM-53` é o commit de abertura do `SCRUM-30` do Rafael |
| Rafael | `SCRUM-29` (depois do `SCRUM-51`), depois `SCRUM-27` (depois do `SCRUM-26`) | os dois esperam um commit que já está nesta sprint |

Puxar da faixa de outra pessoa é o que a divisão por camadas existe para evitar. Se a sua faixa
inteira acabou, avise na daily em vez de abrir o arquivo de outra pessoa.

**Revisado antes de abrir.** Os sete cards foram conferidos contra a `main` de 07/10. Dois tinham
premissa errada, e quatro, referência velha:

- **`SCRUM-16` desceu de 3 para 2 pontos.** A flag foi virada numa cópia local: quebram **2
  testes**, não 3 suítes. A montagem das 35 telas passa, porque o seed relativo do `SCRUM-14` já
  resolveu essa parte. O card agora tem os dois testes, a linha e o conserto de cada um
- **`SCRUM-28` tinha o contrato errado.** Pedia "valor recebido e a receber" no resumo do mês,
  mas esses números vêm de `totaisFinanceiro(alunos)`, que lê o status de pagamento e não o
  extrato. O contrato encolheu para o que vem do extrato, e a decisão sobre `reposicoes`, que hoje
  é o contador do pacote e não um número do mês, ficou explícita para o Mauro
- **`SCRUM-52`, `SCRUM-26` e `SCRUM-51`** ganharam comentário com as linhas que mudaram
  (`Financeiro.tsx`, `ChavePix.tsx` l.87, contagem de 399), e o **`SCRUM-25`** uma nota sobre o
  `55` que o `wa.me` exige e os números do seed não trazem

### Sprint 3 · 08/10 · **fechada, 7 de 7, 26 pontos no dia em que abriu**

Estava planejada para 14/10 a 21/10, recuou seis dias porque a Sprint 2 fechou na noite em que
abriu, e terminou em 08/10, como as duas anteriores. Fechada no Jira em 14/10. Abriu com 25
pontos; o `SCRUM-29` cresceu de 2 para 3. A suíte foi de 496 para **648 testes**.

Os três cards da faixa do Mauro foram feitos por outras pessoas: o `SCRUM-53` pelo Rafael e o
`SCRUM-33` e o `SCRUM-34` pelo Valentin (PRs #13 e #14). Os dois PRs deixaram defeitos marcados como
`it.failing`, sem card. Viraram o `SCRUM-64` e o `SCRUM-65` em 14/10 (ver § 5).

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-18` — Parte 2 completa (8) | 8 |
| Mauro | `SCRUM-33` (3) + `SCRUM-34` (5), os dois feitos pelo Valentin — o `SCRUM-53` passou para o Rafael | 8 |
| Rafael | ~~`SCRUM-29` (3)~~ + ~~`SCRUM-27` (2)~~ + ~~`SCRUM-53` (2)~~ + ~~`SCRUM-30` (3)~~ **os quatro em 08/10** | 10 |

**Ordem obrigatória:** `SCRUM-53` antes de `SCRUM-30`. O `SCRUM-53` é o commit de abertura no
domínio, e o `SCRUM-30` só consome.

**Não há lista de puxar.** Depois desta não existe sprint planejada. Se uma faixa esvaziar,
avise na daily: o que vem a seguir é decisão de PO, não de quem ficou livre.

**Revisado antes de abrir**, contra a `main` de 08/10. Cada card ganhou um comentário de revisão:

- **`SCRUM-27` encolheu, sem mudar de pontos.** O `SCRUM-25` já faz o fallback que o card pedia:
  sem telefone a prévia copia, e se o `openURL` lança, ela copia e chama `aoCopiar`. Sobraram
  três coisas: um toast que diga que o WhatsApp não abriu (hoje sai o mesmo "copiada" nos dois
  casos), o atalho para cadastrar telefone e uma armadilha nova. Como o link é `https://wa.me`,
  sem WhatsApp o navegador abre e provavelmente nada lança erro, então o `catch` pode nunca
  rodar no aparelho
- **`SCRUM-18` tem duas das quatro decisões resolvidas.** A tabela título → `tipo_lancamento` o
  `SCRUM-17` já escreveu no plano, e a do ano envelheceu com o seed em `hoje±N`. No lugar entrou
  outra: o `seed.sql` é comitado, então as datas dele congelam no dia em que foi gerado
- **`SCRUM-33`** não listava `resumoDoPacote`; **`SCRUM-29`** e **`SCRUM-34`** tinham linha
  velha e dependência já fechada. **`SCRUM-30`** e **`SCRUM-53`** conferem sem mudança

### Sprint 4 · 14/10 a 20/10 · **fechada, 6 de 6, 17 pontos**

O tema foi **login de verdade** (Parte 3) e o teste de RLS rodando no CI. Foi a primeira das
sprints de uma semana que não fechou no dia em que abriu: os dois últimos cards (`SCRUM-59` e
`SCRUM-60`) terminaram em 20/10. A suíte foi de 648 para **695 testes**.

Duas sobras viraram card. O `SCRUM-46` deixou o splash para o `SCRUM-66`, porque ligar o plugin
`expo-splash-screen` mexe no `package.json` que estava reservado ao `SCRUM-19` e ao `SCRUM-35`. E o
`SCRUM-59` fechou sem a ponta a ponta contra o banco local, porque a máquina não tinha Docker; ela
virou o `SCRUM-67`.

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-19` — Parte 3, autenticação do professor | 5 |
| Mauro | `SCRUM-58` — mensagens de erro do login (1) + `SCRUM-60` — CI roda o teste de RLS (3) + `SCRUM-35` — eslint (2) | 6 |
| Rafael | `SCRUM-59` — tela de Acesso com login de verdade (3) + `SCRUM-46` — ícone e splash (3) | 6 |

**A Parte 3 foi partida em três, por faixa.** Hoje `criarConta` recebe só o e-mail e `entrar` é
síncrono, e as duas são chamadas por `Acesso.tsx`, que é da apresentação. Então: o Mauro publica as
frases de erro no domínio (`SCRUM-58`), o Valentin troca a sessão por uma API nova com a senha
**opcional** (`SCRUM-19`), para `Acesso.tsx` e `Conta.tsx` continuarem compilando sem ele abri-los,
e o Rafael liga a tela (`SCRUM-59`). A sessão também expõe um `loginReal`, para a tela saber o modo
sem ler `process.env`.

**Ordem obrigatória**, com os vínculos *blocks* no board:

- `SCRUM-58` antes de `SCRUM-19`, e `SCRUM-19` antes de `SCRUM-59`
- o primeiro commit do `SCRUM-19` (só a dependência `@supabase/supabase-js`) antes do `SCRUM-35`:
  os dois mexem em `mobile/package.json` e no lock

**Decisões de PO de 14/10:**

- **Google e recuperação de senha ficam fora da Parte 3.** Os dois precisam de deep link, que no
  Expo Go é frágil (`SCRUM-47`). Viraram o `SCRUM-62` e o `SCRUM-63`, no backlog. No modo supabase o
  "Continuar com Google" some e o "Esqueci minha senha" mantém o aviso, com texto novo: o de hoje
  promete a recuperação "junto com o login de verdade"
- **A Parte 4 é lista de puxar, não compromisso.** As três sprints anteriores fecharam no dia em que
  abriram, mas a Parte 4 é a de maior risco da fila (rede, cache e importação dos dados locais)
- **O projeto Supabase na nuvem não é pré-requisito.** A Parte 3 roda contra o banco local do
  `SCRUM-18`; no celular, pelo IP da máquina na rede

**Se a sua faixa esvaziar**, puxe só da sua:

| Dono | Puxa | Por quê |
|---|---|---|
| Valentin | `SCRUM-20` — Parte 4 | depende do `SCRUM-19`; já está no template completo |
| Rafael | `SCRUM-61` — Parte 4 na tela | o **primeiro** commit dele (a frase de falha de gravação em `avisos.ts`) vai **antes** do `SCRUM-20`; o segundo (a pergunta de importar), depois |

**Revisado antes de abrir**, contra a `main` de 14/10. Os cards que entraram estão no template de
nove seções; o `SCRUM-35` ganhou um comentário: só começa depois do commit de dependência do
`SCRUM-19`, e conserta a classe (a) só na faixa do Mauro, listando o resto por dono. O item "teste
de banco no CI" saiu do `SCRUM-24` e virou o `SCRUM-60`. O `SCRUM-46` registra que o ícone na
gaveta só aparece num build (`SCRUM-47`): o Expo Go mostra o dele.

**Fora da sprint, de propósito:** `SCRUM-31` (modelo estruturado de horário — atravessa as três
camadas e os três donos de uma vez; e fica mais caro a cada parte do backend, porque o horário vira
coluna no banco), os cards de plataforma e publicação, e as Partes 5 a 8 do backend, que dependem em
fila.

### Sprint 5 · 21/10 a 23/10 · **fechada, 5 de 5, 14 pontos**

O tema foi a **Parte 4**: com `EXPO_PUBLIC_BACKEND=supabase`, o app lê e grava no banco o que não
mexe em saldo. Junto foram os defeitos que os testes deixaram como `it.failing`, e dois deles saem
para o aluno pelo WhatsApp. Fechou em 23/10, a dois dias de começar. A suíte foi de 695 para
**811 testes**, e nenhum `it.failing` sobrou.

**Como fechou, para registro:**

- **A ordem obrigatória não foi seguida.** O `SCRUM-20` mesclou antes do `SCRUM-65` e do commit
  de abertura do `SCRUM-64`. Não deu conflito, e o Rafael fechou o `SCRUM-65` em cima.
- **O `SCRUM-64` foi marcado "Concluído" com os commits fora da `main`.** Eles estavam numa branch
  sem merge, e o PR não podia mesclar até o `SCRUM-65` tirar o `it.failing` do `fluxo.test.tsx`.
  Para cumprir o prazo, o Rafael mesclou a branch junto com o `SCRUM-65` e terminou o que faltava:
  a frase de cobrança aprovada, o § 7 do `CONTRIBUTING.md` e a contagem de testes.
- **A Parte A do `SCRUM-67` rodou contra o banco local**, depois de instalar o Docker Desktop na
  máquina do Rafael. Do A2 ao A8, tudo passou.
- **Duas sobras viraram card:** o "Agora não" definitivo da pergunta de importar (`SCRUM-68`) e,
  ainda sem card, a frase para a carga que falha sem cache.

**Decisões de PO de 23/10:**

- A cobrança de quem ainda vai vencer diz "que vence em", e a de quem não tem data termina no
  valor. No formal, o atraso diz "vencido em" e o "a vencer" mantém "com vencimento em". O
  fechamento do tom direto fica igual nos dois casos.
- "Alterar senha" com o login de verdade: "Ainda não disponível".
- A pergunta "Levar seus alunos para a conta?" é um bloco no topo da tela de Alunos, e não uma
  tela nova.

O que foi planejado, como estava no quadro:

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-65` — agendar direto fecha a proposta (2) + `SCRUM-20` — Parte 4 (5) | 7 |
| Mauro | `SCRUM-64` — os cinco defeitos do domínio | 3 |
| Rafael | `SCRUM-61` — Parte 4 na tela (2) + `SCRUM-67` — login ponta a ponta e as sobras do `SCRUM-59` (2) | 4 |

**14 pontos, abaixo das quatro sprints anteriores (18, 21, 26 e 17), de propósito.** A Parte 4 é a
de maior risco da fila (rede, cache e importação dos dados locais), e por isso foi lista de puxar
na Sprint 4, não compromisso. O Mauro fica com a menor carga porque a faixa dele não tem outro card
pronto: o `SCRUM-31` continua fora.

**Ordem obrigatória.** O *blocks* `SCRUM-65` → `SCRUM-20` está no board; as outras duas são de
commit, não de card, e estão escritas nos cards:

- o **primeiro commit** do `SCRUM-64` (`marcarReposicao` devolve `proposta: null`) antes do
  `SCRUM-65`
- o `SCRUM-65` antes do `SCRUM-20`: os dois mexem em `estado/dados.ts`, então em sequência, nunca em
  paralelo
- o primeiro commit do `SCRUM-61` (a frase de falha de gravação em `avisos.ts`) antes do `SCRUM-20`,
  e o segundo (a pergunta de importar) depois

**Decisão de faixa de 21/10:** a regra "marcar a reposição fecha a proposta aberta" vai para o
domínio. O `SCRUM-65` foi escrito como card só do Valentin, em `estado/dados.ts`, mas a store já
fazia isso por conta própria no `responderProposta` (`proposta: null`), e regra de negócio mora em
`dominio/`. Então o Mauro põe a regra em `politica.marcarReposicao` num commit de abertura do
`SCRUM-64`, e o Valentin só consome e apaga a cópia da store.

**Decisões de PO no caminho da sprint:**

- a frase de cobrança de quem ainda **vai** vencer e de quem não tem data (`SCRUM-64`, passo 4).
  Vai para o aluno pelo WhatsApp; o card traz um ponto de partida, ainda não aprovado
- o subtítulo de "Alterar senha" com o login de verdade (`SCRUM-67`, § 4)

**Risco conhecido:** a Parte A do `SCRUM-67` (a ponta a ponta contra o `npx supabase start`) precisa
de uma máquina com Docker. Sem ela, a Parte B fecha e a A não.

**Se a sua faixa esvaziar**, avise na daily: o que vem depois é decisão de PO. O candidato natural
do Rafael é o `SCRUM-66` (splash, 1 ponto), que só se confere de verdade num build (`SCRUM-47`).

**Revisado antes de abrir**, contra a `main` de 21/10. O `SCRUM-64` e o `SCRUM-65` subiram para o
template de nove seções e ganharam pontos (3 e 2). O `SCRUM-20` tinha as linhas do plano velhas (a
Parte 4 desceu de L759 para L836 com as decisões da Parte 3) e ganhou dois itens: usar o cliente de
`dados/supabase.ts` e responder o "onboarding concluído" que a Parte 3 deixou em aberto. O
`SCRUM-61` tinha a linha do plano velha. O `SCRUM-67` confere sem mudança.

**Fora da sprint, de propósito:** `SCRUM-31`, `SCRUM-66`, os outros cards de plataforma e
publicação, e as Partes 5 a 8 do backend, que esperam a Parte 4.

### Sprint 6 · 23/10 a 26/10 · **fechada, 3 de 3, 10 pontos**

O tema foi a **Parte 5**: com o modo supabase, aula, falta, reposição, pagamento e pacote gravam
aluno + lançamento juntos, por uma RPC transacional com trava de versão. Junto foi o acabamento do
que a Sprint 5 deixou. Fechou em 26/10, quatro dias antes do fim previsto. A suíte foi de 811 para
**850 testes**.

**Como fechou, para registro:**

- **A ordem obrigatória foi seguida.** O commit de abertura do `SCRUM-21` (`174b2b3`) entrou no
  primeiro dia. O commit 1 do `SCRUM-68` (PR #23) mesclou antes do commit 2 (PR #24), e o Valentin
  fez a Parte 5 (PR #21) antes do `SCRUM-68`.
- **A revisão da Parte 5 não ficou com o Mauro.** A planning a previa para ele, porque a RPC grava
  o que o `dominio/` calculou. O PR #21 foi aprovado pelo Rafael, e não há revisão do Mauro
  registrada nele.
- **O commit 2 do `SCRUM-68` foi feito pelo Valentin**, e não pelo Rafael. Ele mexe em
  `telas/comum/perguntaDeImportar.ts`, que é da faixa de apresentação, e o Rafael aprovou o PR.
- **Fora do quadro**, o PR #22 documentou como rodar no celular com o banco local, inclusive num
  hotspot só IPv6.
- **A Parte 5 deixou duas pontas**, registradas no plano: a Edge Function do aluno tem de chamar a
  mesma RPC, com a versão (entrou no `SCRUM-22`), e as gravações diretas ainda não mandam versão.

O que foi planejado, como estava no quadro:

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-21` — Parte 5, RPC `aplicar_movimento` (8) | 8 |
| Valentin e Rafael | `SCRUM-68` — "Agora não" vale de vez (1) | 1 |
| Rafael | `SCRUM-66` — splash no `app.json` (1) + o commit de abertura do `SCRUM-21` | 1 |
| Mauro | revisão do `SCRUM-21`: a RPC grava o que o `dominio/` calculou e não pode discordar dele | — |

**10 pontos, com um card só de 8.** É a entrega final, e a Parte 5 é o card de maior risco que
sobrou na fila: SQL transacional, o ramo da proposta, que no plano ainda é um stub, e a trava de
versão. O PO escolheu levá-la mesmo assim, para o modo supabase ficar completo. O resto é pequeno
de propósito.

**Ordem:**

- o commit de abertura do `SCRUM-21` (Rafael: a frase do conflito de versão em `avisos.ts`) no
  primeiro dia, depois da resposta do PO
- o commit 1 do `SCRUM-68` (Valentin: `dispensarImportacao()`) antes do commit 2 (Rafael: o
  "Agora não" chama a função)
- o `SCRUM-21` e o `SCRUM-68` mexem os dois em `mobile/src/dados/`, então o Valentin faz um de
  cada vez

**Decisão de PO no caminho:** a frase do conflito de versão (`SCRUM-21`, § 4). Proposta: "Este
aluno mudou em outro aparelho. Recarreguei os dados: confira e faça de novo."

**Fora da Parte 5, de propósito:** a regra do plano gratuito (trigger de limite de alunos), porque
o limite não foi decidido.

**Revisado antes de abrir**, contra a `main` de 23/10:

- o `SCRUM-21` subiu do formato curto para o template de nove seções. As linhas do plano estavam
  velhas: a Parte 5 desceu de L539 para L983. O card ganhou a frase do conflito como commit de
  abertura e o pgTAP de rollback como critério.
- o `SCRUM-68` nasceu no template.
- o `SCRUM-66` confere sem mudança.

**Fora da sprint, de propósito:** `SCRUM-31`; as Partes 6 a 8, que esperam a Parte 5; `SCRUM-39`,
`SCRUM-40` e `SCRUM-41` (acabamento de design); e os cards de plataforma e publicação.

### Sprint 7 · 26/10 a 02/11 · **ativa** · 10 pontos

Esta é a sprint que está no quadro agora. O tema é a **Parte 6**: o professor copia o link do aluno
na ficha, e o aluno abre no navegador do celular, sem conta e sem instalar nada. Ele vê o saldo, o
extrato e a proposta de reposição, e responde. É o item do MVP que ainda não existia de forma
nenhuma.

| Dono | Cards | Pts |
|---|---|---|
| Mauro | `SCRUM-69` — o recorte do que o aluno vê (`dominio/paginaDoAluno.ts`) + a revisão do `SCRUM-22` | 2 |
| Valentin | `SCRUM-22` — Parte 6 no servidor: Edge Function `aluno-publico`, a RPC do link novo, o bundle do domínio e o repositório público | 5 |
| Rafael | `SCRUM-70` — Parte 6 na tela: a página em `/a/:token` e o link na ficha | 3 |

**A Parte 6 foi partida em três, por faixa**, como a Parte 3. O `SCRUM-22` atravessava as três
camadas: o recorte é regra, a Edge Function é persistência, e a página e o botão são apresentação.
A peça que segura o resto é o recorte. A proposta do aluno hoje chama `candidatos()` com **todos**
os alunos e a grade do professor, que não podem chegar ao navegador do aluno. Então o domínio
calcula a página inteira, e a Edge Function e a prévia "Ver como o aluno vê" leem a mesma função. O
que o professor confere na prévia é o que o aluno recebe.

**Ordem obrigatória**, com os vínculos *blocks* no board:

- o `SCRUM-69` no primeiro dia: ele bloqueia o `SCRUM-22` e o passo 1 do `SCRUM-70`
- o `SCRUM-22` antes dos passos 3 a 5 do `SCRUM-70`. Antes disso, o Rafael adianta a troca da prévia
  para o recorte e as frases
- o commit do `bundle:dominio` sozinho, por causa do `mobile/package.json`

**Decisões de PO para a planning** (propostas, a confirmar):

- **O link não vence.** Ele é revogado por "Gerar novo link", que derruba o anterior, como prevê a
  D5. Um token de 122 bits não se adivinha; o risco é o link repassado, e a resposta a isso é a
  revogação.
- **O que o aluno vê:** o primeiro nome dele, o saldo, a validade, o horário, a regra combinada, o
  extrato dele (com os próprios pagamentos) e a proposta. Do professor, só o primeiro nome e a
  disciplina. Não saem o telefone, o e-mail, o `valorPorAula` nem nada de outro aluno.
- **A demonstração é contra o banco local**, com o celular na mesma rede, como na Parte 3. O projeto
  na nuvem e a Vercel viraram o `SCRUM-71`.
- **O limite de requisições por IP fica para a Parte 8** (`SCRUM-24`).
- **As frases do `SCRUM-70`:** "Link copiado. Mande para o aluno pelo WhatsApp." · "Link novo
  gerado. O anterior parou de funcionar." · "Este link não vale mais. Peça um novo ao seu professor."

**Se a sua faixa esvaziar:** o `SCRUM-72` (a carga que falha sem cache avisa, 1 ponto), a sobra da
Sprint 5 que estava sem card. O Rafael faz a frase antes, e o Valentin liga depois de terminar o
`SCRUM-22`, porque os dois mexem em `estado/dados.ts`.

**Revisado antes de abrir**, contra a `main` de 26/10:

- o `SCRUM-22` subiu da profundidade média para o template de nove seções. As linhas do plano
  estavam velhas: a Parte 6 desceu de L620 para L1185. O card ficou só com o servidor, e o recorte e
  a tela viraram o `SCRUM-69` e o `SCRUM-70`, que nasceram no template.
- **A revisão do Mauro vai no card**, e não só aqui. Na Sprint 6 ela ficou só na planning e não
  aconteceu.

**Fora da sprint, de propósito:** o `SCRUM-23` (Parte 7: o WhatsApp já sai desde o `SCRUM-25` e o
`SCRUM-26`, e o push pede development build, o `SCRUM-47`); o `SCRUM-24` (Parte 8), que recebe o que
a Parte 6 deixar; o `SCRUM-31`; o `SCRUM-39`, o `SCRUM-40` e o `SCRUM-41`; o `SCRUM-71`; e os outros
cards de plataforma e publicação.

---

## 3. A decisão de datas (`SCRUM-13`)

Decidida em 30/09 e escrita no [`CLAUDE.md`](../../CLAUDE.md), na seção de convenções de
implementação. **Opção (a): a semente guarda deslocamento, não data.**

Em `data/seed.json`, toda data passa a ser escrita como deslocamento em dias relativo a hoje —
`"venceu": "hoje-12"`, `"validade": "hoje+32"` — e `dados/semente.ts` resolve na carga com
`somarDias(hoje(), N)`. Data absoluta em `dd/mm` continua aceita para o que é fixo de calendário.

**Os tipos não mudam.** Depois de resolvida, `Aluno.validade` segue sendo `dd/mm`, então
`dominio/tipos.ts` — 22 importadores, e o único arquivo que só aceita commit de abertura — fica
intacto. Foi esse o critério que decidiu entre as formas possíveis de escrever isso.

A opção (b), app sem dados de demonstração, foi recusada por agora: o teste de montagem das 35
telas, a review da disciplina e o `supabase/seed.sql` saem todos desta fonte. Abrir vazio vale
para um app publicado, e pode virar um interruptor depois.

### O bug que a decisão revelou

Analisar a decisão expôs algo que não estava no card. `lerDdMm(ddmm, ano = ANO_DEMO)` assume
**2025 em todas as chamadas** — nenhum chamador passa ano, e `diasEntre`, `somarDias`,
`dataPorExtenso` e `mesPorExtenso` todos passam por ele. Com data real ligada:

```
diasEntre('28/12', '05/01')  →  -357   (o certo é +8)
```

Hoje é 30/09, então uma validade de 60 dias cai em 29/11 e passa. **A partir de novembro,
qualquer pacote cruza a virada do ano** e o app mostra "venceu há 357 dias". Virou o `SCRUM-55`,
do Mauro, na Sprint 1, e ele **bloqueia o `SCRUM-16`** — ligar a data real sem isso entrega um app
que quebra em dezembro.

---

## 4. O template de card

Os cards das sprints trazem nove seções, escritas para serem **coladas inteiras no Claude Code**:

```
1. Objetivo            uma frase, do ponto de vista do professor
2. Leia antes          os arquivos que importam, e o que NÃO ler
3. Faixa deste card    meus arquivos / de outra pessoa + a decisão / não abra mais nada
4. Arquivos exatos     tabela arquivo → linha → mudança
5. Passos              cada um termina com npm test passando
6. NÃO faça            as armadilhas específicas, com a razão
7. Pronto quando       observável, não "funciona"
8. Verificação         comandos colados, com a saída esperada
9. Commit              SCRUM-nn: <imperativo minúsculo>
```

Por que as três seções menos óbvias:

- **§2 e §6** existem porque há cinco fontes de documentação concorrentes no repositório e uma
  delas está errada (`IMPLEMENTACAO.md` descreve a direção visual aposentada). Sem elas, o agente
  acha o documento errado e reconstrói o que foi jogado fora. Várias armadilhas do repo têm teste
  que cobra: descobrir por teste vermelho custa um ciclo, ler custa dez segundos.
- **§3** é o que faz a divisão de propriedade funcionar. Um agente solto "conserta" o arquivo
  vizinho por prestatividade; nomear o dono transforma isso em recusa explícita.
- **§4** com caminho e número de linha remove a etapa de grep, que é onde o agente inventa escopo.

**Profundidade por card:** os que entram numa sprint têm as nove seções. Os do backlog mais distante
têm profundidade média (objetivo, arquivos prováveis, atenção, pronto quando) e sobem para o
template completo quando entrarem numa sprint — escrever em detalhe um card de cinco sprints à
frente produz detalhe que envelhece antes de ser lido.

**Dois cards trazem decisão de escopo já tomada**, porque decisão de PO no meio da sprint é o que
transforma gargalo de review em gargalo de projeto: `SCRUM-30` (folga inline, não sheet novo) e
`SCRUM-28` (partido em domínio e tela).

---

## 5. Histórico do backlog

Criado em 26/09/2026 pela API: 8 épicos e 35 stories, 132 pontos, tirados de
[`PROXIMOS-PASSOS.md`](../../PROXIMOS-PASSOS.md) e de
[`docs/backend/PLANO-BACKEND.md`](../backend/PLANO-BACKEND.md). Depois:

- **8 cards novos** (`SCRUM-48` a `SCRUM-55`), a maioria da semana de preparação
- **`SCRUM-28` partido em dois**, domínio e tela, por terem donos diferentes
- **`SCRUM-14` reestimado de 5 para 8** e com escopo maior: o seed também não tinha `telefone`,
  sem o qual os dois cards de WhatsApp não podiam ser demonstrados
- **`SCRUM-37` e `SCRUM-38` fechados como já feitos.** Os dois saíram dos achados P2 da revisão
  do redesign, mas a Onda 5 já os havia resolvido no commit `4c5a22e` — `ambarTexto: #6C4500`
  mede 4.53:1 e `sobreCor` no escuro já é `#0B1524`. A razão está comentada em cada card
- **`SCRUM-13` decidido e fechado** em 30/09, com a razão comentada no card — ver § 3
- **`SCRUM-48` fechado** em 01/10 (`d2a1ef8`): as seis telas de Ajustes passam a ter arquivo
  próprio, com `pecas.tsx` para o molde comum e `SubTelas.tsx` reduzido a re-export, então
  `SCRUM-29` e `SCRUM-30` já podem rodar na mesma sprint. O comentário do card registra duas
  anotações que ficaram de fora por serem outra faixa: o `faixaDeAlunos` sem campo no
  `PerfilProfessor` e o caminho velho das seis telas no `MAPA-DE-TELAS.md`
- **`SCRUM-45` fechado** em 07/10 (`5480e32`), e **`SCRUM-56` aberto** no lugar da dúvida que
  sobrou. A ITF Free Font License **2.0, de 17/08/2026** permite a Satoshi em app publicado e
  permite embutir o arquivo no bundle — as duas perguntas do card. O que não está em
  conformidade é o nosso arquivo: os cinco TTFs são instâncias fatiadas do variável
  (Derivative Work, § 05) e estão versionados num repositório público (§ 02). A métrica de
  `tipografia.ts` não muda com a troca pelos oficiais — a suposição do card estava errada;
  o que precisa de decisão de PO são os pesos 600 e 800, que não existem como arquivo
  oficial. Resposta escrita no `README.md` da raiz
- **`SCRUM-25` fechado** em 07/10 (`2190e51`): o botão da prévia abre o WhatsApp em vez de
  copiar, quando há telefone. A nota do card sobre o `55` se confirmou e virou código — sem o
  país na frente, o `wa.me` lê o `51` do DDD como Peru. A prévia ganhou duas rotas no mesmo
  botão, então `ChavePix.tsx`, `Lembrete.tsx` e o catálogo seguiram copiando sem precisar de
  mudança, e o `SCRUM-26` herda o componente pronto. Verificado no aparelho em 07/10
- **`SCRUM-26` fechado** em 07/10 (`bf80d83`), logo depois: a cobrança abre o WhatsApp pelo
  mesmo botão. Do lado da lógica foi passar a prop, como o card previa; o que ele não previa
  era a nota, que é escrita pela tela porque carrega a limitação de agendamento — daí o
  `abreNoWhatsApp` exportado, para a tela não prometer o que o botão não faz. A chave Pix já
  ia inteira desde o `SCRUM-25`, que codifica a mensagem toda
- **`SCRUM-52` fechado** em 07/10 (`bc9dbfc`), logo depois do `SCRUM-28` entrar: o Financeiro
  não soma mais o extrato, e o cartão do mês cai de 6 para 2 na semente. A barra precisou de
  mais que trocar o campo — no contrato novo `reposicoes` é subconjunto de `aulasDadas`, então
  o segmento azul virou `aulasDadas - reposicoes` e o rótulo dele, que é o que o leitor de
  tela anuncia, passou a dizer "aulas regulares". A contagem de testes dos três READMEs foi
  a 416 num commit à parte: tinha ficado em 408 porque o `SCRUM-25` e o `SCRUM-26` não a
  atualizaram
- **`SCRUM-27` fechado** em 08/10 (`0e1b1b3`), **sem o teste no aparelho**, que o card pedia,
  por decisão de PO. A armadilha do comentário de revisão se confirmou no código: com
  `https://wa.me` o `catch` era inalcançável, então o link do aparelho virou `whatsapp://send`
  (na web segue o `wa.me`). O toast distingue "não abriu" de "copiou", e o aluno sem telefone
  ganhou o atalho que abre a edição e volta para a tarefa ao salvar. De passagem, a ficha
  deixou de reaproveitar o rascunho de uma edição cancelada, que podia salvar os dados de um
  aluno por cima de outro. Fica em aberto: confirmar no Expo Go o `whatsapp://` com e sem o app
  e com só o WhatsApp Business, o que o `SCRUM-47` também vai precisar rever
- **`SCRUM-29` fechado** em 08/10 (`ea7ac72`, `4753744`), **sem a conferência no aparelho**
  registrada. O escopo cresceu de 2 para 3 pontos: o sheet Novo/Renovar pacote (`Pacote.tsx`)
  tinha o mesmo `\D` comendo a vírgula, e as duas telas passaram a usar uma peça nova,
  `CampoDeDinheiro`, com teclado decimal (o `number-pad` do iOS não tem vírgula). O
  `valorPorAula` segue em reais, com a conversão de centavos num lugar só e comentada; centavos
  no tipo fica para o backend. As cinco decisões estão no comentário do card. Fica em aberto:
  ver no iOS que o teclado mostra a vírgula, e quem já gravou `6250` corrige à mão
- **`SCRUM-53` fechado** em 08/10 (`2a48632`) **pelo Rafael**, não pelo Mauro: assumiu o commit
  de abertura para destravar o `SCRUM-30` na mesma sprint. A faixa de `dominio/` segue do Mauro,
  e o comentário do card pede a ele uma revisão do diff. Duas decisões fora do card: `ate` é
  lido a partir de `de`, então "28/12 a 05/01" é uma folga válida que atravessa a virada do ano;
  e as duas funções ganharam um terceiro parâmetro opcional, `referencia`, que só fixa o ano no
  teste, como em `diaDaSemanaDe`. Folga no passado continua válida. A suíte foi a 573 testes
- **`SCRUM-30` fechado** em 08/10 (`4df7e9d`), **sem a conferência no aparelho** registrada. A
  decisão de escopo se sustentou: folga inline, nenhum arquivo-gargalo aberto, dois arquivos no
  diff. Três escolhas fora do card: o "Adicionar" é secundário, porque o "Salvar" já é o primário
  da tela; os campos de data têm máscara dd/mm, porque o teclado numérico do iOS não tem barra; e
  a tela descarta o rascunho ao desmontar, porque o `voltar` não limpava e uma folga não salva
  reaparecia na visita seguinte. Conferido no Expo Web: uma folga amanhã tira o dia do "Escolher
  outro horário" (74 → 70 horários). Fica em aberto: teclado e máscara no Expo Go
- **`SCRUM-18` fechado** em 08/10 (PR #12). As datas ficam relativas também no banco: o
  `seed.sql` guarda `pg_temp.hoje() - 12`, e quem resolve é o Postgres a cada `db reset`, então o
  arquivo comitado não envelhece. Isso respondeu a decisão que a revisão de abertura tinha deixado
  aberta. O teste de RLS tem 30 casos em pgTAP, e as nove decisões estão no plano do backend
- **`SCRUM-33` e `SCRUM-34` fechados** em 08/10 (PRs #13 e #14), feitos pelo Valentin. A suíte foi
  a 620 e depois a 648. Os dois acharam defeitos e os deixaram como `it.failing`, como os cards
  mandavam, sem tocar nos módulos
- **`SCRUM-58` a `SCRUM-63` criados** em 14/10, na abertura da Sprint 4: a Parte 3 partida por
  faixa (`58`, `59`), o CI de RLS que saiu do `SCRUM-24` (`60`), a fatia de tela da Parte 4 (`61`), e
  recuperar senha e Google (`62`, `63`), que ficaram fora da Parte 3 por decisão de PO e dependem do
  `SCRUM-47`
- **`SCRUM-64` e `SCRUM-65` criados** em 14/10, a partir dos `it.failing` que ninguém tinha levado
  para o quadro. O `64` (Mauro) junta cinco defeitos do domínio. Dois deles saem para o aluno pelo
  WhatsApp: a cobrança de quem não tem vencimento escreve "undefined", e a de um pagamento ainda a
  vencer diz "que venceu em". O `65` (Valentin) é a proposta que fica aberta quando a reposição é
  marcada direto, e vale corrigir antes da Parte 4, porque o banco só aceita uma proposta aberta
  por aluno
- **`SCRUM-66` e `SCRUM-67` criados** durante a Sprint 4, em 15/10 e 20/10: as sobras do
  `SCRUM-46` (o splash, que pede o plugin `expo-splash-screen`) e do `SCRUM-59` (a ponta a ponta
  contra o banco local, que pede Docker)
- **A operação de sprint saiu do conector da Atlassian** entre 14/10 e 21/10. O `manageJiraSprint`,
  que criou, iniciou e fechou as sprints até a 4, agora devolve "Unknown operation", e o `discover`
  não o lista mais. O conector ainda move card para uma sprint que já existe
  (`transitionJiraIssue`), mas criar, iniciar e fechar sprint voltou a ser feito pelo navegador.
  **Ele voltou em 23/10**: fechou a Sprint 5, abriu a 6 e, em 26/10, fechou a 6 e abriu a 7
- **`SCRUM-69` a `SCRUM-72` criados** em 26/10, na abertura da Sprint 7. O `69` e o `70` são o
  recorte e a tela da Parte 6, partida por faixa com o `SCRUM-22`. O `71` é a publicação do link
  (Supabase na nuvem e Vercel), e o `72` é a frase da carga que falha sem cache, a sobra da Sprint 5
  que estava sem card
- **`SCRUM-57` criado e adiado** em 07/10, por decisão de PO: pedir autorização à ITF primeiro
  e, sem ela, trocar 600 e 800 pelos pesos oficiais. Fica fora das sprints até alguém ir
  publicar em loja. O card explica por que tirar os TTFs do git agora não resolve: quebra o CI e
  o app dos três (`tipografia.ts` faz `require` deles) e o histórico público continua
  distribuindo os arquivos
- **27 vínculos *blocks***, seguindo a tabela de dependências do plano do backend. O CSV original
  dizia que a Parte 1 era pré-requisito de todas; **estava errado** — as Partes 1 e 2 não
  dependem uma da outra

[`backlog-inicial.csv`](backlog-inicial.csv) fica como registro do que foi criado e plano B caso
o quadro precise ser remontado. Ele é uma versão sem acentos e com as dependências do backend
descritas como fila; o que está no Jira é mais fiel ao plano.

**As sobras do template**, preparadas para apagar no `SCRUM-49`: a API do Atlassian não apaga
item nem sprint, só move, renomeia e fecha. Então `SCRUM-1` a `SCRUM-4` foram para o backlog,
voltaram para "A fazer", ganharam o título `APAGAR — sobra do template` e a etiqueta **`apagar`**
— filtre por ela no Backlog e apague os quatro de uma vez. A sprint vazia `SCRUM Sprint 0`, que
estava **ativa**, foi fechada; a outra (`APAGAR — sprint do template`) some pelo menu `···` do
Backlog.

---

## 6. As cerimônias, no tamanho de um grupo de três

Com sprint de uma semana, o ritual precisa ser curto ou come a sprint.

| Cerimônia | Quando | Quanto |
|---|---|---|
| Planning | segunda, início da sprint | 30 min — puxar do backlog e confirmar as decisões de PO |
| Daily | 2 ou 3 vezes na semana, não todo dia | 10 min, por chat, com o quadro aberto |
| Review | sexta | demo do app rodando, não slide |
| Retrospectiva | logo depois da review | 20 min |

Daily diária em grupo de três que não trabalha em horário comum vira teatro. E numa sprint de
cinco dias, uma planning de uma hora é 2,5% da sprint gasta em reunião.
