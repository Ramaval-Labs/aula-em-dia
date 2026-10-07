# Jira do Grupo 08

O quadro Scrum do **Aula em Dia** está em
[aulaemdia.atlassian.net](https://aulaemdia.atlassian.net/jira/software/projects/SCRUM/boards/1),
com as três pessoas dentro, os cards atribuídos e quatro janelas criadas: uma semana de
preparação e três sprints de uma semana.

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

## 2. As quatro janelas

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

### Sprint 1 · 07/10 a 14/10 · **ativa** · 18 pontos

Esta é a sprint que está no quadro agora. Numa board Scrum só a ativa aparece no quadro; as
outras duas ficam no Backlog até serem iniciadas.

**As sprints passaram a correr quarta → quarta**, porque foi quando a preparação de fato fechou.
Boundary no meio da semana é melhor que uma data bonita que ninguém cumpre.

O número existe para **ser medido**, não para ser confiado — ninguém sabe quanto o grupo entrega
por semana antes da primeira terminar, e o único dado que existe é que a preparação levou 8 dias
em vez de 3.

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-15` (1) → `SCRUM-14` (8) | 9 |
| Mauro | `SCRUM-55` — inferência de ano (3) + `SCRUM-32` — teste do motor de agenda (5) | 8 |
| Rafael | ~~`SCRUM-45` — licença da Satoshi (1)~~ **fechado em 07/10**, mais PO e review | 1 |

**Regra de corte na segunda 12/10:** se `SCRUM-14` não estiver em review, ninguém puxa mais nada e o
Mauro entrega o teste do agenda cobrindo só descarte e pontuação. O `SCRUM-55` **não** é cortável
— o `SCRUM-16` da sprint 2 depende dele.

### Sprint 2 · 14/10 a 21/10 · 22 pontos

Replanejar com a velocidade real da sprint 1 antes de começar.

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-17` — Parte 1, camada de repositório (8) | 8 |
| Mauro | `SCRUM-16` (3) + `SCRUM-28` (3) + `SCRUM-51` (1) | 7 |
| Rafael | `SCRUM-25` (3) → `SCRUM-26` (2) → `SCRUM-52` (2) | 7 |

**`estado/dados.ts` fica fechado para todos menos o Valentin nesta sprint.** Os cards dos outros
dois foram escolhidos por não abrirem ele.

**Ordem obrigatória dentro da sprint:** `SCRUM-28` antes de `SCRUM-52`; `SCRUM-51` antes de
`SCRUM-29`. Os dois são commits de abertura do Mauro, e estão no board como *blocks*.

### Sprint 3 · 21/10 a 28/10 · 25 pontos

| Dono | Cards | Pts |
|---|---|---|
| Valentin | `SCRUM-18` — Parte 2 completa (8) | 8 |
| Mauro | `SCRUM-33` (3) + `SCRUM-34` (5) + `SCRUM-53` (2) | 10 |
| Rafael | `SCRUM-30` (3) + `SCRUM-27` (2) + `SCRUM-29` (2) | 7 |

**Fora das quatro janelas, de propósito:** `SCRUM-31` (modelo estruturado de horário — atravessa
as três camadas e os três donos de uma vez), os cards de plataforma e publicação, e as Partes 3 a
8 do backend, que dependem em fila.

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

**Profundidade por card:** os das quatro janelas têm as nove seções. Os do backlog mais distante
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
