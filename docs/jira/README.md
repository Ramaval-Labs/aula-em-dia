# Jira do Grupo 08

O quadro Scrum do **Aula em Dia** está em
[aulaemdia.atlassian.net](https://aulaemdia.atlassian.net/jira/software/projects/SCRUM/boards/1),
com as três pessoas dentro e os cards atribuídos. Até agora foram onze janelas: uma semana de
preparação e dez sprints de uma semana. A Sprint 11 está ativa.

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

### Sprint 7 · 26/10 a 04/11 · **fechada, 3 de 3, 10 pontos**

O tema foi a **Parte 6**: o professor copia o link do aluno na ficha, e o aluno abre no navegador do
celular, sem conta e sem instalar nada. Ele vê o saldo, o extrato e a proposta de reposição, e
responde. Fechou em 04/11, dois dias depois do fim previsto, com os três PRs (#25, #26 e #27)
mesclados no mesmo dia. A suíte foi de 850 para **949 testes**.

**Como fechou, para registro:**

- **A ordem obrigatória foi seguida:** `SCRUM-69` → `SCRUM-22` → `SCRUM-70`, e a frase do link
  entrou antes, em 26/10.
- **O `SCRUM-22` foi feito pelo Rafael**, e não pelo Valentin. É a faixa de persistência. O card foi
  reatribuído no quadro.
- **Nenhum dos três PRs teve revisão registrada.** Os três foram mesclados pelo Rafael, inclusive os
  dois dele. A revisão do Mauro, que desta vez estava escrita no card, de novo não aconteceu. Como a
  Edge Function usa a service role, ela virou o `SCRUM-73`, que precisa terminar antes de o link ir
  para a internet.
- **A ponta a ponta foi no Chrome, pelo IP da rede, com 18 de 18 conferências.** O celular de verdade
  ficou para o `SCRUM-74`, no 4G.
- **O PR #27 deixou quatro pontos para o PO:** o rodapé do saldo no link (troca os dois botões da
  prévia por "Ver a proposta de reposição" e "Informar disponibilidade"); a frase de sem rede ("Não
  deu para abrir a página. Confira a conexão e tente de novo."); o `usadas` calculado na tela como
  `total − saldo`; e o 409 (proposta já respondida), que recarrega sem aviso.
- **O plano registra duas pontas da Parte 6:** o `GET` leva o token na query, e o log do gateway pode
  ter a URL; e o extrato com mais de 1000 lançamentos é cortado.

O que foi planejado, como estava no quadro:

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

**Decisões de PO de 26/10**, tomadas na abertura:

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
  gerado. O anterior parou de funcionar." · "Não encontramos esta página. Peça um novo link ao seu
  professor." A terceira mudou em relação à proposta ("Este link não vale mais"). A Edge Function
  devolve o mesmo 404 para o token trocado e para o que nunca existiu, de propósito, então a frase
  não pode afirmar que o link já valeu um dia.

**Se a sua faixa esvaziar:** o `SCRUM-72` (a carga que falha sem cache avisa, 1 ponto), a sobra da
Sprint 5 que estava sem card. O Rafael faz a frase antes, e o Valentin liga depois de terminar o
`SCRUM-22`, porque os dois mexem em `estado/dados.ts`. A frase foi decidida com as outras: "Não deu
para carregar seus alunos. Confira a conexão e abra o app de novo."

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

### Sprint 8 · 04/11 a 05/11 · **fechada, 10 de 10, 21 pontos**

O tema foi **o link sai de casa, com segurança e com saída**.
O banco vai para a nuvem e o Expo Web para a Vercel, e o aluno abre o link no 4G. Antes disso, alguém
que não escreveu a Edge Function a revisa. Junto vai o que a Parte 8 cobra antes de publicar:
apagar a conta de verdade e backup do banco.

| Dono | Cards | Pts |
|---|---|---|
| Mauro | `SCRUM-73` — revisão de segurança da Parte 6 (2) + `SCRUM-77` — o limite gratuito no domínio, commit 1 (1) + `SCRUM-24` — backup semanal pelo Actions (2) | 5 |
| Valentin | `SCRUM-71` — Supabase na nuvem (3) + `SCRUM-75` — apagar a conta, servidor (3) + `SCRUM-72` — a carga sem cache avisa (1) | 7 |
| Rafael | `SCRUM-74` — a Vercel e o link no 4G (2) + `SCRUM-76` — apagar a conta, tela (1) + as frases do `SCRUM-72` e o commit 2 do `SCRUM-77` | 3 |

**15 pontos em 8 cards: mais cards, e menores.** A média das três últimas sprints foi de 11 pontos.
Os cards de 1 ponto são quase todos um commit de abertura e um de ligação. O risco está no
`SCRUM-71`, que é ação externa e segura dois outros cards.

**A revisão é card, e não linha na planning.** Nas Sprints 6 e 7, a revisão do Mauro estava prevista
e não aconteceu. Agora ela tem pontos, entrega um arquivo (`docs/backend/revisoes/parte-6.md`) e
bloqueia a publicação.

**Ordem obrigatória**, com os vínculos *blocks* no board:

- `SCRUM-71` antes do `SCRUM-74` e do `SCRUM-24`
- `SCRUM-73` sem P0 antes do `SCRUM-74`: o link só vai para a internet depois da revisão
- `SCRUM-75` antes do passo 2 do `SCRUM-76`
- o commit 1 do `SCRUM-77` (Mauro) antes do commit 2 (Rafael)
- o Valentin faz o `SCRUM-75` antes do `SCRUM-72`: os dois mexem em `estado/`
- o Rafael abre `Conta.tsx` em dois cards (`SCRUM-77` e `SCRUM-76`), um de cada vez

**Ordem cronológica, por dia:**

| Quando | Mauro | Valentin | Rafael |
|---|---|---|---|
| **Dia 1** (qua 04/11) | `SCRUM-77` commit 1 (`dominio/plano.ts`), push no mesmo dia. Começa o `SCRUM-73`. | Confirma com o PO e cria o projeto do `SCRUM-71`: `link`, `db push`, `secrets`. | As frases: `SCRUM-72` e `SCRUM-76` passo 1, um commit cada. |
| **Dia 2** (qui 05/11) | `SCRUM-73`: os 7 itens e o relatório. P0 ou P1 vira comentário no `SCRUM-71`. | `SCRUM-71`: bundle, deploy da função, conta de teste pelo app. Passa a URL e a chave pública ao Rafael e a connection string ao Mauro. | `SCRUM-77` commit 2 (`Conta.tsx` lê o domínio). Revisa o PR do Mauro. |
| **Dia 3** (sex 06/11) | Revisa o PR do `SCRUM-71`. Começa o `SCRUM-24` com a connection string. | Corrige o que o `SCRUM-73` achar. Começa o `SCRUM-75`: o pgTAP do cascade. | `SCRUM-74` passos 2 e 3: `vercel.json`, `serve dist` local, projeto na Vercel. |
| **Dia 4** (seg 09/11) | `SCRUM-24`: o primeiro backup na mão e a restauração no banco local. | `SCRUM-75`: a Edge Function `apagar-conta` e a sessão. Push e aviso ao Rafael. | `SCRUM-74` passos 4 e 5: o link no 4G (só sem P0 no `SCRUM-73`). |
| **Dia 5** (ter 10/11) | Revisa o PR do `SCRUM-75`. | `SCRUM-72` (o `catch` da carga) e a restauração no plano (`SCRUM-24`). | `SCRUM-76` passo 2: dois toques e o teste. Revisa o PR do `SCRUM-72`. |
| **Dia 6** (qua 11/11) | Review: demo no 4G. | Review. | Review e fechamento da sprint. |

**Decisões de PO para a planning** (propostas, a confirmar):

- **Criar o projeto Supabase na nuvem**, no plano free e na região de São Paulo, sem rodar o
  `seed.sql`, porque ele cria uma conta de teste com senha conhecida.
- **Apagar a conta apaga na hora**, sem carência e sem lixeira, porque a tela pede dois toques.
- **As frases do `SCRUM-76`:** "Apaga você e todos os seus alunos. Não dá para desfazer." · "Toque
  de novo para apagar tudo" · "Não deu para apagar a conta. Confira a conexão e tente de novo."
- **Os quatro pontos do PR #27.** Proposta: aceitar o rodapé e a frase de sem rede como estão; levar
  o `usadas` para o `paginaDoAluno` quando o Mauro mexer no domínio de novo; e o 409 avisar "Esta
  proposta já foi respondida." em vez de recarregar calado.

**Revisado antes de abrir**, contra a `main` de 04/11:

- o `SCRUM-71` perdeu a Vercel, que virou o `SCRUM-74`, e ficou só com a nuvem. Subiu para o
  template, com a regra de não rodar o `seed.sql` e de gerar o bundle antes do deploy.
- o `SCRUM-24` saiu da profundidade média e ficou só com o backup. Ele passou para o Mauro, porque é
  `.github/`. O resto da tabela dele já é critério de pronto de outros cards.
- o `SCRUM-72` subiu para o template.
- o `SCRUM-73`, o `SCRUM-74`, o `SCRUM-75`, o `SCRUM-76` e o `SCRUM-77` nasceram no template.
- **Achado na abertura:** `LIMITE_GRATUITO = 5` estava em `telas/ajustes/Conta.tsx`, uma regra de
  negócio na tela (regra 7 do `CLAUDE.md`). Virou o `SCRUM-77`.

**Fora da sprint, de propósito:** o limite por IP na Edge Function (espera o tamanho do risco que o
`SCRUM-73` medir); o bloqueio do 6º aluno no plano gratuito e o trigger no banco (espera o
`SCRUM-77`); o `SCRUM-23` (o push pede o `SCRUM-47`); o `SCRUM-31`; o `SCRUM-39`, o `SCRUM-40` e o
`SCRUM-41`; e o `SCRUM-56`.

**O que mudou durante a sprint (até 04/11, à noite):**

- **Os oito cards planejados fecharam no primeiro dia, 04/11.** O `SCRUM-77` foi mesclado sem a revisão do
  Mauro, por decisão do PO. O passo 3 do `SCRUM-76` foi feito na nuvem, e não no banco local:
  apagou a conta de teste do `SCRUM-73` em produção.
- **Entrou o `SCRUM-83`** (Valentin, 3 pontos): o ano das datas (P2-3) e o horário duplicado
  (P2-2) da revisão. Ele resolveu o `SCRUM-78` e o `SCRUM-80`, que fecharam como duplicados.
- **Entrou o `SCRUM-85`** (Rafael e Valentin, 3 pontos), com uma subtarefa para cada máquina
  (`SCRUM-86` e `SCRUM-87`). É a apresentação em sala de sex 06/11, com o professor no Expo Go e o
  aluno no navegador. O card só fecha quando as duas máquinas passarem.
- **O teste no 5G do `SCRUM-74` achou o `SCRUM-84`:** o motor sugere a aula fixa do próprio aluno.
  Foi para o backlog e entra na Sprint 9.
- **Fica com o Rafael:** a conferência 3 do `SCRUM-73`, o log do gateway no painel do Supabase.

**Como fechou, para registro:** em 05/11, seis dias antes do fim previsto, com os 8 cards planejados
e os 2 que entraram (`SCRUM-83` e `SCRUM-85`): 10 de 10, 21 pontos. A suíte foi de 949 para
**1002 testes**.

- **O `SCRUM-85` fechou com as duas máquinas** (`SCRUM-86` e `SCRUM-87`), como o card pedia.
- **O ensaio do `SCRUM-85` subiu o projeto para o Expo SDK 58** (PR #39). O Expo Go da loja só
  abre o SDK mais novo, e no iPhone não dá para instalar um Expo Go antigo: o app fechava logo depois
  de ler o QR Code. O PR entrou na `main` com a main já congelada para a apresentação, como exceção
  autorizada pelo PO, porque sem ele não havia apresentação. Junto vieram três ajustes de tipo do
  React Native 0.88 (`tipografia.ts`, `Vidro.tsx` e `Sheet.tsx`) e a seção do erro "Project is
  incompatible with this version of Expo Go" no `mobile/README.md`.
- **A Vercel republicou a partir do merge do PR #39.** O domínio de produção mostrou o "Vercel
  Security Checkpoint" a requisições automáticas depois de uma série de consultas feitas por
  script. Navegador de verdade passa pelo desafio sozinho. Não é regra do projeto, que não tem
  firewall configurado.
- **Continua com o Rafael:** a conferência 3 do `SCRUM-73`, e apagar no GitHub a branch
  `scrum-85-sdk57-alinhado`, que ficou do primeiro ensaio.

### Sprint 9 · 05/11 a 12/11 · **fechada, 6 de 6, 13 pontos**

Abriu em 05/11, logo depois de a Sprint 8 fechar. O tema é **endurecer o que já está na internet e
tirar o "saia e volte" da demonstração**. O `SCRUM-88` já começa com o PR #38 aberto, esperando a
main descongelar.

| Dono | Cards | Pts |
|---|---|---|
| Mauro | `SCRUM-81` — teste da `aluno-publico` no CI (2) + `SCRUM-84` — o motor não sugere a aula fixa do próprio aluno (2) + `SCRUM-79` commit 1 — o recorte não oferece janela vencida | 5 |
| Valentin | `SCRUM-79` commit 2 — o aceite vencido dá 409 (2, com o Mauro) + `SCRUM-82` — limite, CORS e propostas estrita (3) | 4 |
| Rafael | `SCRUM-88` — puxar para atualizar (2) + `SCRUM-41` — alvo de 48dp no Android (2) | 4 |

**A main fica congelada até a apresentação de sex 06/11.** Os dois computadores servem a
apresentação a partir da `main`, e a Vercel publica a cada merge. Então, até o fim da aula de
sexta, PR pode abrir mas não entra, e nenhuma Edge Function é publicada na nuvem.

**Ordem obrigatória**, com os vínculos *blocks* no board:

- o `SCRUM-81` antes do `SCRUM-82`: o teste é a rede de segurança da função que vai mudar
- o commit 1 do `SCRUM-79` (Mauro, domínio) antes do commit 2 (Valentin, função)
- o commit 2 do `SCRUM-79` antes do `SCRUM-82`: os dois mexem em `aluno-publico/index.ts`
- o Mauro abre `dominio/` em dois cards (`SCRUM-84` em `agenda.ts`, `SCRUM-79` em
  `paginaDoAluno.ts`): arquivos diferentes, sem ordem entre eles

**Ordem cronológica, por dia** (escrita em 05/11, na abertura):

| Quando | Mauro | Valentin | Rafael |
|---|---|---|---|
| **Dia 1** (qui 05/11, noite) | Começa o `SCRUM-81` numa branch: o script com as sentinelas, rodando no banco local, e a prova de que ele falha sem o `where token_publico`. Sem merge. | Último ensaio da apresentação na sua máquina. Nenhum deploy de função. | Abre o link do aluno no celular, no 4G, e confere que a página carrega. A conferência 3 do `SCRUM-73` e a branch `scrum-85-sdk57-alinhado`. |
| **Dia 2** (sex 06/11) | Apresentação. **Depois da aula:** abre o PR do `SCRUM-81`, com o job no `ci.yml`. | Apresentação. **Depois da aula:** revisa o PR #38 (`SCRUM-88`). | Apresentação. **Depois da aula:** atualiza o PR #38 sobre a `main` do SDK 58, roda testes e tipos, e põe 1007 testes nos READMEs. |
| **Dia 3** (seg 09/11) | `SCRUM-79` commit 1: o teste que falha e o recorte sem janela vencida. PR, com review do Rafael. | De manhã, revisa o PR do `SCRUM-81`: ele segura todo o resto da sua faixa. Depois, mede a cota de invocações do plano free (P2-4 do `SCRUM-82`), que não toca em código. | Mescla o PR #38 e testa no Expo Go: o aluno aceita no navegador, o professor puxa a ficha e vê "Reposição confirmada". Revisa o PR do `SCRUM-79` commit 1. |
| **Dia 4** (ter 10/11) | `SCRUM-84`: o teste que falha, o descarte da aula fixa do próprio aluno e o bônus na mesma faixa de outro dia. O ajuste em `spec/casos-de-teste.md` é à mão. | `SCRUM-79` commit 2, com o commit 1 já na `main`: `npm run bundle:dominio` e o 409 no aceite vencido. PR; depois do merge, deploy da função. | `SCRUM-41`: a auditoria dos alvos entre 44 e 48, num comentário do card, e depois o token por plataforma. Revisa o PR do `SCRUM-79` commit 2. |
| **Dia 5** (qua 11/11) | Revisa o PR do `SCRUM-82` e o do `SCRUM-41`. | `SCRUM-82`, com o `SCRUM-81` verde a cada passo: P3-1 e P3-4 com `curl`, a migração `0008` com o pgTAP (P3-5) e a decisão do limite no plano. PR. | `SCRUM-41` no Android, pelo Expo Go (lista, ficha e Registrar), e a linha nova em `spec/acessibilidade.md`, à mão. Revisa o PR do `SCRUM-84`. |
| **Dia 6** (qui 12/11) | Review: demo do motor sem a aula fixa. | Mescla o `SCRUM-82` e publica a função. Confere o app do professor e o link no navegador, com o CORS novo. | Review e fechamento da sprint. |

**Decisões de PO de 04/11**, tomadas na planning:

- **`SCRUM-79`:** a proposta vencida **some** para o aluno, e o professor vê a pendência de volta.
  Não existe o estado "expirada".
- **`SCRUM-84`:** o bônus de "mesmo horário" vale para a mesma faixa em **outro dia** da semana,
  com a razão "No mesmo horário da aula dele.". A aula fixa do próprio aluno sai das sugestões.
- **`SCRUM-41`:** piso por plataforma, 44pt no iOS e 48dp no Android. A linha em
  `spec/acessibilidade.md` é escrita à mão.
- **`SCRUM-88`:** puxar para atualizar, e **não** o Realtime, que deixa uma conexão aberta por
  aparelho no plano gratuito.

**Revisado antes de abrir**, contra a `main` de 04/11:

- o `SCRUM-79`, o `SCRUM-81`, o `SCRUM-82` e o `SCRUM-41` subiram da profundidade média para o
  template de nove seções. O `SCRUM-84` e o `SCRUM-88` nasceram nele.
- o `SCRUM-78` e o `SCRUM-80` fecharam como duplicados do `SCRUM-83`.

**Se a sua faixa esvaziar:** Rafael, o `SCRUM-40` (medidas soltas para token, por `/designer`).

**Fora da sprint, de propósito:** o `SCRUM-23` (o push pede o `SCRUM-47`); o `SCRUM-31`; o
`SCRUM-39`; o `SCRUM-56` e o `SCRUM-57`; o `SCRUM-62` e o `SCRUM-63` (fora por decisão de PO); e
os cards de plataforma (`SCRUM-42`, `SCRUM-43`, `SCRUM-44`, `SCRUM-47`).

**Como fechou, para registro:** com os 6 cards planejados, 13 pontos, e nenhum card novo. Cinco
PRs entraram em 12/11 e o sexto (`SCRUM-82`, PR #44) em 13/11, um dia depois do fim previsto. A
suíte foi de 1002 para **1022 testes**.

- **Três PRs entraram sem aprovação, por decisão do PO**, com o check `Testes e tipos` verde: o
  #38 (`SCRUM-88`), o #40 (`SCRUM-41`) e o #42 (`SCRUM-84`). Os outros três (#41, #43 e #44), mesclados
  pelo Valentin, passaram pela review do Rafael.
- **O `SCRUM-84` mudou de dono:** era do Mauro e foi feito pelo Rafael em 12/11, a pedido do PO,
  para não segurar o fechamento. O card no Jira ficou com o Rafael.
- **A `main` ficou congelada até a apresentação de 06/11, como combinado.** Todos os merges
  vieram depois dela.

### Sprint 10 · 13/11 · **fechada, 4 de 4, 12 pontos no dia em que abriu**

O tema é **o horário fixo do aluno deixa de ser texto livre**. Hoje o horário é uma frase
("terça e quinta", "18h") e o motor de reposição, que o Envio 01 chama de diferencial, a lê por
palavra-chave. O `SCRUM-31` esperava desde a preparação por uma sprint em que as três frentes não
estivessem abertas ao mesmo tempo, porque ele atravessa as três camadas. Agora ele foi dividido em
três cards, um por dono.

| Dono | Cards | Pts |
|---|---|---|
| Mauro | `SCRUM-31` — a aula fixa estruturada no domínio, e o motor lendo dela (3) | 3 |
| Valentin | `SCRUM-89` — a coluna `aula_fixa`, o conversor e a `aluno-publico` (3) | 3 |
| Rafael | `SCRUM-40` — medidas soltas para token, por `/designer` (3) + `SCRUM-90` — a ficha do aluno escolhe dias e hora (3) | 6 |

**12 pontos, um a menos que a Sprint 9.** A carga do Rafael é maior, mas o `SCRUM-40` é feito
enquanto ele espera os outros dois: o `SCRUM-90` só começa depois deles.

**Ordem obrigatória**, com os vínculos *blocks* no board:

- o commit de abertura do `SCRUM-31` (`tipos.ts`, só o tipo) antes de tudo, com push no mesmo dia
- o `SCRUM-31` antes do `SCRUM-89`: o conversor usa o `aulaFixaDe` do domínio
- o commit de abertura do `SCRUM-89` (`NovoAluno.aulaFixa?`, em `estado/dados.ts`) antes do passo 3
  do `SCRUM-90`
- o `SCRUM-40` antes do `SCRUM-90`, e o `SCRUM-40` não abre `AlunoForm.tsx` nem `PrimeiroAluno.tsx`

**Ordem cronológica, por dia** (escrita em 13/11, na abertura):

| Quando | Mauro | Valentin | Rafael |
|---|---|---|---|
| **Dia 1** (sex 13/11) | `SCRUM-31` commit de abertura: `AulaFixa` e `aulaFixa?` em `tipos.ts`. Push no mesmo dia. | Lê o `SCRUM-89` e escreve a migração `0009` com o pgTAP, no banco local. Sem merge. | Entrega do dia 13 (vídeo, prints e dump). Depois, o levantamento do `SCRUM-40` num comentário do card. |
| **Dia 2** (seg 16/11) | `SCRUM-31` commit 2: `aulaFixa.ts` com o teste que falha, e `agenda.ts` lendo dele. PR, com review do Valentin. | Commit de abertura do `SCRUM-89` (`NovoAluno`). Push no mesmo dia. Revisa o PR do `SCRUM-31`. | `SCRUM-40`: a primeira rodada de `/designer extract`. |
| **Dia 3** (ter 17/11) | Os casos 44 a 46 em `spec/casos-de-teste.md`. Revisa o PR do `SCRUM-40`. | `SCRUM-89`: o conversor, a semente e o `seed.sql`, com o `SCRUM-31` já na `main`. PR. | `SCRUM-40`: a segunda rodada e o merge. Revisa o PR do `SCRUM-89`. |
| **Dia 4** (qua 18/11) | Revisa o PR do `SCRUM-90`. | Mescla o `SCRUM-89`, faz o `db push` na nuvem, o bundle e o deploy da `aluno-publico`. | `SCRUM-90`: a fileira de dias no catálogo e a ficha do aluno. PR. |
| **Dia 5** (qui 19/11) | Review: o motor com a aula fixa estruturada. | Confere no navegador que a página do aluno mostra o horário igual a antes. | Mescla o `SCRUM-90`, testa no Expo Go e fecha a sprint. |

**Decisões de PO para a planning** (propostas, a confirmar):

- **A estrutura é a fonte, e o texto continua.** `Aluno.aulaFixa` (`{ dias, hora }`) passa a ser o
  que o motor lê. `dia` e `hora` continuam no tipo e no banco, gerados pelo `rotuloDaAulaFixa` na
  hora de salvar. Assim, nenhuma tela de leitura muda e a página do aluno mostra o mesmo texto.
- **Sem subir a chave do estado (`v4`).** O campo é opcional; aluno sem ele é lido do texto pelo
  `aulaFixaDe`. Nada que está no aparelho de alguém é descartado.
- **Sem backfill em SQL.** A linha antiga do banco fica com `aula_fixa` nula e é lida do texto até
  o professor salvar o aluno de novo. Um segundo leitor de "terça e quinta", em SQL, iria divergir
  do domínio.
- **Hora cheia e de segunda a sábado.** O motor trabalha com faixa e hora cheia ("18h30" vira 18),
  e a grade do professor não tem domingo (`DIAS_DA_SEMANA`).

**Revisado antes de abrir**, contra a `main` de 13/11:

- o `SCRUM-31` saiu da profundidade média para o template de nove seções e ficou só com o domínio,
  de 5 para 3 pontos. O `SCRUM-89` e o `SCRUM-90` nasceram no template, com o resto dele.
- o `SCRUM-40` subiu para o template e perdeu as duas telas que o `SCRUM-90` reescreve.
- o pré-requisito do `SCRUM-31`, o `SCRUM-32` (teste do motor), já estava feito.
- **Achado na abertura:** o banco já está na nuvem desde a Sprint 8, então o card guardado não
  previa a migração nem o redeploy da `aluno-publico`. Os dois entraram no `SCRUM-89`.

**Fora da sprint, de propósito:** o `SCRUM-23` (o push pede o `SCRUM-47`); o `SCRUM-39`; o
`SCRUM-56` e o `SCRUM-57`; o `SCRUM-62` e o `SCRUM-63` (fora por decisão de PO, e o `SCRUM-62`
pede o `SCRUM-47`); e os cards de plataforma (`SCRUM-42`, `SCRUM-43`, `SCRUM-44`, `SCRUM-47`).

**Como fechou, para registro:** em 13/11, no mesmo dia em que abriu, seis dias antes do fim
previsto. Os 4 cards, 12 pontos, e nenhum card novo. A suíte foi de 1022 para **1057 testes**.

- **O `SCRUM-31` mudou de dono:** era do Mauro, que não estava disponível, e foi feito pelo Rafael.
  O commit de abertura precisou de uma linha na faixa do Valentin, `aulaFixa: []` no
  `COLUNAS_DO_CAMPO` do conversor, porque o `Record` cobra cada campo novo do `Aluno`. O `SCRUM-89`
  trocou a linha por `['aula_fixa']`, como o comentário no card dele pedia.
- **Dois PRs entraram sem aprovação, por decisão do PO**, com os checks verdes: o #45
  (`SCRUM-31`) e o #47 (`SCRUM-90`). O #46 (`SCRUM-89`) passou pela review do Rafael.
- **O `SCRUM-40` teve o escopo decidido pelo PO na própria sprint:** os vãos entre elementos
  continuam literais, como o `DESIGN.md` já decidia, e o card cobriu o padding interno e as
  medidas do chassi. Foram duas rodadas de `/designer extract` mescladas direto na `main`
  (`153fc39` e `f04fe6c`). O resultado: 39 tokens em `PAD`, 4 em `TAMANHO`, e os paddings soltos
  de 52 para 10, todos comentados.
- **Achado de ferramenta:** com o `mobile/.env` apontando para a nuvem, o `npm run capturar` abria a
  tela de entrada em vez da tela pedida. As primeiras capturas da rodada 1 deram "idêntico" por
  isso. O roteiro do `/designer` passou a subir o Expo Web com `EXPO_PUBLIC_BACKEND=local`.
- **Uma correção no card do `SCRUM-90`:** o `mar` da semente é o Mateus, não a Marina.

### Sprint 11 · 13/11 a 20/11 · **ativa** · 10 pontos

O tema é **os lembretes ganham regra e backend**. A tela de Avisos promete quatro lembretes desde o
redesign, e nenhum é calculado: são só preferências salvas. Esta sprint escreve a regra no domínio,
acrescenta o aviso uma hora antes de cada aula e monta o backend que manda os dois.

| Dono | Cards | Pts |
|---|---|---|
| Mauro | `SCRUM-91` — a regra no domínio: o resumo do dia e o aviso antes da aula (3) | 3 |
| Valentin | `SCRUM-23` — o backend: banco, a função `avisos`, os dois agendamentos e o teste contra um Expo falso (5) | 5 |
| Rafael | `SCRUM-92` — a tela de Avisos ganha "Antes da aula" (2) | 2 |

**10 pontos, dois a menos que a Sprint 10.** A planning começou com o build (`SCRUM-47`) dentro, e o
PO decidiu adiá-lo na mesma tarde (veja as decisões). O que dependia do celular saiu junto.

**Ordem obrigatória**, com os vínculos *blocks* no board:

- o `SCRUM-91` antes da função do `SCRUM-23`: ela chama a regra do bundle
- o commit de abertura do `SCRUM-23` (`antesDaAula` nas preferências) antes do `SCRUM-92`
- o vínculo antigo "`SCRUM-47` bloqueia `SCRUM-23`" ficou no board e não vale mais: o conector do
  Jira não apaga vínculo, então tire à mão

**Ordem cronológica, por dia** (escrita em 13/11, na abertura):

| Quando | Mauro | Valentin | Rafael |
|---|---|---|---|
| **Dia 1** (seg 16/11) | `SCRUM-91`: os testes que falham, um por promessa da tela e o da aula na próxima hora. | Commit de abertura do `SCRUM-23` (`antesDaAula`), push no mesmo dia. A migração `0010` e o pgTAP no banco local. | Espera o commit de abertura. Revisa o PR do `SCRUM-91` quando abrir. |
| **Dia 2** (ter 17/11) | `SCRUM-91`: o `avisosDoDia`, o `resumoDoDia`, o `aulasDaProximaHora` e o `avisoDaAula`. PR. | Revisa o PR do `SCRUM-91`. Começa a função `avisos` com o domínio na `main`. | `SCRUM-92`: o quinto item na tela de Avisos e o teste. PR. |
| **Dia 3** (qua 18/11) | Os casos 47 a 55 em `spec/casos-de-teste.md`. Revisa o PR do `SCRUM-92`. Pede o job no CI. | A função e o teste contra o Expo falso. PR. | Revisa o PR do `SCRUM-23`. |
| **Dia 4** (qui 19/11) | O job "Avisos" no `ci.yml`, como o da `aluno-publico`. | Mescla, faz o `db push`, o deploy da função e os dois agendamentos na nuvem. | Captura da tela de Avisos e `/designer avisos`, se quiser. |
| **Dia 5** (sex 20/11) | Review: o resumo e os avisos da semente. | Confere no painel que os dois agendamentos rodaram. | Review e fechamento da sprint. |

**Decisões de PO de 13/11**, tomadas na planning, escolhidas entre opções:

- **Lembretes: o resumo às 7h e um aviso uma hora antes de cada aula.** O resumo é um push por
  professor por dia ("Hoje: 2 aulas, 1 saldo baixo e 1 reposição sem horário."); sem nada para
  avisar, não há push. O aviso da aula é um por aula, sem repetir. Descartados: um push por
  categoria e um push por aluno, pelo excesso de notificações.
- **O build instalável (`SCRUM-47`) fica para o lançamento.** O app segue no Expo Go até lá. Sem
  build, o push remoto não chega ao Android, então o backend é testado contra um Expo Push falso, e
  gravar o token e pedir a permissão virou o `SCRUM-93`, no backlog.
- **No lançamento, Android e iOS.** O iOS exige a conta Apple Developer (US$ 99 por ano). O
  `SCRUM-47` volta reestimado, maior que os 5 pontos de hoje.
- **Os TTFs da Satoshi ficam no git por enquanto.** O `SCRUM-56` continua no backlog e precisa ser
  resolvido junto com o build, porque o EAS sobe os arquivos versionados.

**Revisado antes de abrir**, contra a `main` de 13/11:

- o `SCRUM-23` subiu da profundidade média para o template de nove seções e foi de 3 para 5
  pontos: agora é o backend inteiro dos dois lembretes, sem a parte do celular.
- o `SCRUM-91` nasceu no template, separando a regra (domínio, Mauro) do disparo (backend,
  Valentin), como o `SCRUM-31` fez na Sprint 10. Com o aviso da aula, foi de 2 para 3 pontos.
- o `SCRUM-92` e o `SCRUM-93` nasceram na planning, quando o build saiu.
- **Achado na abertura:** a tela de Avisos promete os quatro lembretes desde o redesign, mas nenhum
  código os calcula. O `SCRUM-91` implementa exatamente as frases da tela.

**Fora da sprint, de propósito:** o `SCRUM-47` e o `SCRUM-93` (o lançamento); o `SCRUM-62` e o
`SCRUM-63` (precisam do deep link do build); o `SCRUM-39`; o `SCRUM-56` e o `SCRUM-57`; e os cards
de plataforma (`SCRUM-42`, `SCRUM-43`, `SCRUM-44`).

**Se a sua faixa esvaziar:** Rafael, uma fatia do `SCRUM-39` (as 4 telas do Financeiro, por
`/designer`); Mauro, o teste de montagem da tela de Avisos com as preferências desligadas.

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
  **Ele voltou em 23/10**: fechou a Sprint 5, abriu a 6 e, em 26/10, fechou a 6 e abriu a 7. Em 05/11 fechou a 8 e abriu a 9
- **`SCRUM-69` a `SCRUM-72` criados** em 26/10, na abertura da Sprint 7. O `69` e o `70` são o
  recorte e a tela da Parte 6, partida por faixa com o `SCRUM-22`. O `71` é a publicação do link
  (Supabase na nuvem e Vercel), e o `72` é a frase da carga que falha sem cache, a sobra da Sprint 5
  que estava sem card
- **`SCRUM-73` a `SCRUM-77` criados** em 04/11, na abertura da Sprint 8: a revisão de segurança da
  Parte 6 (`73`), a Vercel separada do `SCRUM-71` (`74`), apagar a conta no servidor e na tela (`75`
  e `76`), e o limite gratuito no domínio (`77`). O `SCRUM-24` encolheu para o backup e passou para o
  Mauro
- **`SCRUM-78` a `SCRUM-82` criados** em 04/11, dos achados da revisão do `SCRUM-73`. O `78` e o
  `80` fecharam no mesmo dia como duplicados do **`SCRUM-83`**, que o Valentin abriu e entregou na
  Sprint 8
- **`SCRUM-84` a `SCRUM-88` criados** em 04/11: o motor que sugere a aula fixa do próprio aluno
  (`84`, achado no teste em 5G), a apresentação com dois celulares (`85`, com as subtarefas `86` e
  `87`) e o puxar para atualizar (`88`, na planning da Sprint 9)
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
