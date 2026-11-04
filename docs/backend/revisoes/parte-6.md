# Revisão de segurança da Parte 6 (SCRUM-73)

Revisão da Edge Function `aluno-publico` antes de o link do aluno sair para a internet.

- **Autor:** Mauro, que não escreveu a função. Escreveu o recorte `paginaDoAluno`, então esse módulo foi
  conferido por quem o fez.
- **Data e versão:** 04/11/2026, na `main` em `3dc6402`. Até `5e199ae` (`SCRUM-71`, `SCRUM-74`), nada mudou
  em `supabase/`, `mobile/src/dados/` nem `mobile/src/dominio/`, então os achados continuam valendo.

## Resultado

**Nenhum P0 e nenhum P1.** Não apareceu vazamento de dado de outro aluno ou de outro professor, nem
escrita fora do aluno do token.

Há 5 achados P2 e 6 P3. Três deles gravam dado errado, mas sempre no próprio aluno do token: a
proposta vencida, a janela dupla e o ano das datas.

**A revisão não está completa.** Esta máquina não tem Docker, então a função não rodou contra o banco
real. Três conferências continuam abertas e estão em [O que falta conferir](#o-que-falta-conferir).
Sem P0, o `SCRUM-74` pode seguir, mas elas precisam estar feitas antes de o link ir para um aluno de
verdade.

## Como foi conferido

| Método | O que prova | O que não prova |
|---|---|---|
| Leitura de `index.ts`, `entrada.ts`, `0001`, `0002`, `0005`, `0006`, `paginaDoAluno.ts` e `repositorioPublico.ts` | o que o código diz | o comportamento em execução |
| O `index.ts` real, com o bundle real do domínio, sobre um banco falso em memória | status, cabeçalhos, corpo, consultas feitas, log e o que vai para a RPC | Postgres, RLS, gateway e tempo de resposta |
| `expo export -p web` com a service role no ambiente, e busca no `dist/` | o que entra no bundle | o que a Vercel vai ter configurado |
| CI da `main` em `3dc6402`: "Testes e tipos" e "RLS do banco" verdes | os testes pgTAP da RLS, da `aplicar_movimento` e da `novo_link_do_aluno` | a função, que o CI não roda |

O banco falso tem linhas com valores-sentinela em todos os campos sensíveis (telefone, e-mail, Pix,
sobrenomes, outro aluno, outro professor). O teste procura esses valores na resposta inteira. Ele ficou
fora do repositório, porque este card só escreve este arquivo. Veja o P2-5.

## Os 7 itens

| # | Item | Resultado | Como |
|---|---|---|---|
| 1 | Todo `select`, `update` e `rpc` filtra pelo token | **Passa, com ressalva** | execução |
| 2 | O 404 é idêntico | **Passa em corpo e cabeçalhos; tempo não medido** | execução |
| 3 | O `responder` só aceita janela do recorte e grava com a versão lida | **Passa** | execução + pgTAP no CI |
| 4 | Do professor, só primeiro nome e disciplina; de outro aluno, nada | **Passa no banco falso; `curl` real pendente** | execução |
| 5 | Token fora do log, service role fora do app | **Passa na função e no bundle; gateway pendente** | execução + busca |
| 6 | Força bruta | **Inviável; o risco é custo** (P2-4) | conta |
| 7 | CORS | **Qualquer origem, sem dano hoje** (P3-4) | leitura + execução |

### 1. Filtro pelo token

A primeira consulta é `alunos` por `token_publico` (`index.ts:95`). As outras seis filtram pelo
`professor_id` ou pelo `id` da linha achada (`index.ts:102-112`), e nada do outro professor foi
consultado. O `update` de disponibilidade filtra por token e por `arquivado = false` (`index.ts:216-217`).
Campos forjados no corpo (`id`, `aluno_id`, `professor_id`) não mudam o alvo da RPC.

**Ressalva:** a `aplicar_movimento` filtra por `id` e `versao`, não pelo token (`0005:58`). E "Gerar novo
link" não mexe na versão (`0006:13`). Veja o P3-6.

### 2. O 404

Foram 12 casos: token inexistente, malformado, ausente, velho e de aluno arquivado, por `GET` e `POST`.
Todos devolvem 404, corpo vazio e os mesmos cabeçalhos. JSON quebrado e corpo que não é objeto também.

Consultas ao banco por caso, que é o que dá para medir sem o banco real:

| Caso | Consultas |
|---|---|
| Malformado ou ausente | 0 |
| Inexistente, velho ou arquivado | 1 |

Isso só revela se o texto tem formato de UUID, o que quem chama já sabe. Para distinguir um token velho
de um inexistente, a pessoa já precisaria ter o token, e mesmo assim não sairia dado nenhum.

### 3. Responder

- **Recusadas com 400, sem gravar:** janela inventada, dia certo com hora errada, janela gravada além das
  três mostradas, `confirmadaPeloProfessor` e `janela` como texto, número, lista ou objeto vazio.
- **Janela aceita:** a RPC recebe os valores da janela ofertada, não os do pedido (`index.ts:179`). Campo
  extra enviado no corpo não chega nela.
- **Versão:** a RPC recebe a versão lida. Se o professor grava depois da primeira leitura, ou depois de
  todas, a resposta é 409 e o movimento dele fica intacto.
- **Segunda resposta:** 409 sem gravar.
- **`janela: null`:** dá 500, em vez de 400 (P3-1). Nada é gravado.

### 4. O que sai

As chaves da resposta são exatamente `nome`, `disciplina`, `dia`, `hora`, `saldo`, `total`, `temPacote`,
`validade`, `agendada`, `regra`, `extrato`, `professor`, `proposta` e `disponibilidade`.

- Nenhuma sentinela apareceu na resposta.
- O `motivo` gravado, que nos dados de teste citava outro aluno, não sai.
- As `razoes` do motor são frases fixas, sem nome de ninguém (`agenda.ts:155-170`).
- O extrato é só o do aluno do token.
- O aluno de outro professor não vê nada do primeiro.

Faltou comparar com o `curl` real, como o card pede.

### 5. Log e service role

- **Função:** nos caminhos normais e nos 404, ela não escreve log nenhum. Com falha simulada em
  quatro pontos, ela loga só a mensagem, sem o token (`index.ts:257`).
- **App:** `telas/aluno/` e `repositorioPublico.ts` não usam `console`, e `ErroDoLink` não leva o token na
  mensagem. O cache do professor guarda os tokens, e sair da conta o apaga (`sessao.ts:280`, `dados.ts:271`).
- **Bundle web:** exportado com a service role no ambiente, com 0 ocorrências do valor, de
  `SUPABASE_SERVICE_ROLE` e de `service_role`. Há uma ocorrência de `sb_secret`, que é a checagem de
  prefixo da biblioteca do Supabase, não uma chave. Não há source map no `dist/`.
- **Repositório:** nenhuma chave versionada. O `seed.sql` não fixa `token_publico`.

### 6. Força bruta

O token é um UUID v4 de `gen_random_uuid()` (`0001:84`, `0006:24`), com 122 bits aleatórios, ou cerca de
5,3 × 10³⁶ valores.

Num caso exagerado, com 10 mil links válidos e 10 mil pedidos por segundo, acertar um link leva em média
cerca de **1,7 × 10²¹ anos**. Adivinhar não é o risco, com ou sem limite por IP. O que o limite evitaria é
custo e indisponibilidade (P2-4).

### 7. CORS

`Access-Control-Allow-Origin: *` (`index.ts:43`). A função não usa cookie: a credencial é o token, que vai
no pedido. Um site de terceiros só consegue ler a página se já tiver o token, e nesse caso nem precisaria
do navegador da vítima. Veja o P3-4.

## Achados

**Como foram classificados:**

| Nível | Critério |
|---|---|
| **P0** | Sem o token do aluno, alguém lê ou grava dado que não é dele |
| **P1** | Dano sério em uso normal, que tem de ser corrigido antes de publicar |
| **P2** | Dano real, mas em situação específica, ou um risco de custo ou de falta de proteção |
| **P3** | Robustez, ou risco baixo já conhecido |

### P2

#### P2-1. Proposta sem prazo: o aluno aceita uma data que já passou

- **Onde:** `paginaDoAluno.ts:127-130` e `index.ts:170-179`.
- **Cenário:** o professor propõe "Terça, 20/10" e o aluno não responde. Em 04/11 ele abre o link e aceita.
- **Resultado medido:** 200, `agendada` em 20/10, `reposicoes` de 0 para 1 e a pendência apagada. O aluno
  gasta uma reposição numa aula que não pode acontecer. O link não vence (decisão de PO), o que torna isso
  mais provável.
- **Correção sugerida:** o recorte não oferece janela passada, e a proposta nessa situação volta como
  `null`. A função responde 409.
- **Dono:** Mauro, com o PO confirmando a regra.

#### P2-2. Dois alunos aceitam a mesma janela

- **Onde:** `agenda.ts:103-104` promete descartar "colisão com reposição já marcada", mas `ocupados`
  (`agenda.ts:119-121`) só traz aula fixa. `index.ts:170-179` também não confere.
- **Cenário:** a janela "Terça, 10/11, 17h" é proposta a dois alunos, e os dois aceitam.
- **Resultado medido:** 200 e 200, com as duas reposições marcadas no mesmo horário. O teste gravou a mesma
  janela nas duas propostas. Que o motor sugere essa janela aos dois vem da leitura de `agenda.ts`.
- **Correção sugerida:** o motor passa a contar a reposição marcada dos outros alunos, e o aceite confere
  de novo. Dois aceites simultâneos só se resolvem no banco.
- **Dono:** Mauro (motor) e Valentin (banco). O PO decide se o horário duplo é aceitável.

#### P2-3. Qualquer movimento reescreve o ano de datas com mais de 183 dias

- **Onde:** `conversor.ts:81-89` e `alunoParaBanco` (`conversor.ts:340`), gravados por `0005:43-55`.
- **Cenário:** a data sai do banco como `dd/mm` e volta com o ano inferido. Basta o aluno recusar uma
  proposta.

  | Coluna | No banco | Enviado à RPC |
  |---|---|---|
  | `pagamento_em` | 2026-02-07 | 2027-02-07 |
  | `encerrado` | 2026-04-18 | 2027-04-18 |
  | `validade` | 2027-08-31 | 2026-08-31 |

- **Alcance:** `pagamento_em`, `encerrado` e `pendencia_origem` antigos acontecem em uso normal. Uma
  `validade` tão distante não sai pelas opções de hoje (30 dias, 60 dias ou sem prazo, mais 15 de extensão).
  Não é exclusivo do link: o app do professor usa a mesma conversão (`repositorioSupabase.ts:346`). A tela
  não mostra o ano, então o erro é silencioso, e o dado original se perde.
- **Correção sugerida:** o movimento grava só as colunas que mudou, ou a data atravessa com o ano.
- **Dono:** Valentin.

#### P2-4. Sem limite de pedidos, o risco é custo e indisponibilidade

- **Onde:** `index.ts:232-260`.
- **Cenário:** um script em loop chama a função. Cada pedido conta como invocação. Com UUID qualquer, faz 1
  consulta. Com um token válido, 7. Um aceite faz 14 e mais a RPC.
- **Quanto pesa:** não ajuda a adivinhar link (item 6), mas pode gastar a cota do plano gratuito e derrubar
  a função para todos os professores. O número da cota não foi conferido.
- **Recomendação:** a decisão de PO de deixar para a Parte 8 se sustenta numa demonstração. Vale fazer antes
  de divulgar o link a alunos de verdade em volume.
- **Dono:** PO decide o momento.

#### P2-5. A única barreira não tem teste automatizado

- **Onde:** `.github/workflows/ci.yml` não roda a função, e `repositorioPublico.test.ts` simula o `fetch`.
- **Cenário:** alguém troca um `select` e tira o filtro, ou devolve um campo a mais em `index.ts`. O CI fica
  verde. A prova que existe é o `curl` manual registrado no plano.
- **Correção sugerida:** levar o teste com sentinelas desta revisão para o CI, primeiro no banco falso e
  depois no Supabase local, como a Parte 8 já prevê.
- **Dono:** Mauro.

### P3

| # | Achado | Onde | Sugestão | Dono |
|---|---|---|---|---|
| P3-1 | `janela: null` dá 500 em vez de 400, e escreve `Cannot read properties of null` no log. Nada é gravado e o token não aparece. | `index.ts:172-176` | conferir o tipo antes de comparar | Valentin |
| P3-2 | O token vai na query do `GET` (decisão 14). O log da função está limpo, mas o do gateway não foi visto. Quem lê esse log já tem acesso à service role. O caminho `/a/<token>` também passa pela Vercel, então o `POST` não eliminaria o token de todos os logs. | `index.ts:239` | conferir na nuvem e manter, se só a equipe vê | Valentin |
| P3-3 | O `noindex` só existe depois que o JavaScript roda, e o `index.html` exportado não o tem. O `SCRUM-74` pede o `noindex` "no HTML publicado", o que hoje não passaria. O `vercel.json` de `5e199ae` não tem esses cabeçalhos. | `AppDoAluno.tsx:66-75` | no `vercel.json`, para `/a/(.*)`: `X-Robots-Tag: noindex` e `Referrer-Policy: no-referrer` | Rafael |
| P3-4 | CORS aberto a qualquer origem (item 7). | `index.ts:43` | restringir quando o domínio da Vercel existir, sem esquecer o Expo Web local | Valentin |
| P3-5 | Professor B consegue criar proposta no aluno do A, se souber o UUID dele, e o índice `uma_proposta_aberta` passa a travar o A. O id não sai no recorte. Conclusão só por leitura. | `0002:36-43`, `0001:116` | adotar a variante estrita que a própria `0002` descreve | Valentin |
| P3-6 | Quem usa o link velho nos milissegundos entre a leitura e a RPC ainda grava uma última resposta, porque a RPC não confere o token e a troca não muda a versão. Vale o mesmo para o arquivamento. | `0005:58`, `0006:13` | aceitar o risco | — |

## Riscos de decisão de PO

Estas decisões não foram reabertas. Fica registrado o que cada uma implica:

- **Link sem validade.** Quem receber o link encaminhado vê o extrato e pode aceitar ou recusar a proposta
  e trocar a disponibilidade, sem nenhuma confirmação. Hoje, a saída é o professor gerar um novo link.
- **Valor no extrato.** O campo `valorPorAula` não sai, mas o lançamento traz "R$ 987,65 · Pix" e a página
  traz o `total` de aulas, então dá para deduzir o preço. É o dado do próprio aluno. A pergunta está sem
  resposta no `SCRUM-69`.
- **Razões escritas para o professor.** O aluno lê "Está fora dos seus blocos habituais", e `VisaoDoAluno.tsx:424`
  lista todas as razões. Não vaza dado, mas o texto está na pessoa errada. Também está sem resposta no
  `SCRUM-69`.

## O que falta conferir

A função já está na nuvem (`SCRUM-71`), então dá para conferir lá, antes do teste no 4G do `SCRUM-74`. O
`curl` registrado no `SCRUM-71` já cobre em parte o item 4: 200, `no-store`, só primeiros nomes e sem o
e-mail do professor. Esta revisão não repetiu essa chamada. Falta:

1. **O JSON real (item 4).** Compare a resposta com a lista de chaves deste documento:
   ```bash
   curl -s "$URL/functions/v1/aluno-publico?token=<token>"
   ```
2. **O tempo do 404 (item 2).** Compare o token inexistente e o de aluno arquivado:
   ```bash
   curl -s -o /dev/null -w "%{time_total}\n" "$URL/functions/v1/aluno-publico?token=<token>"
   ```
3. **Os logs do gateway (P3-2).** No painel, confira se a URL com o token aparece, e para quem.

Também não foi conferido o limite de invocações do plano gratuito (P2-4).
