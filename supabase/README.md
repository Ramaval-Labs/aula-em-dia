# supabase/

O banco do Aula em Dia. O que está aqui é o que roda;
[`docs/backend/PLANO-BACKEND.md`](../docs/backend/PLANO-BACKEND.md) é o que argumenta cada
decisão (ADRs, comparativo de alternativas, riscos). O banco é **só local**, e o app fala com ele no
modo `supabase` (Partes 3 e 4); o padrão do app continua sendo o modo local.

| Arquivo | O que é |
|---|---|
| `config.toml` | Portas e versão do Postgres, iguais para as três pessoas |
| `templates/recuperacao.html` | O e-mail de "Esqueci minha senha", com o link de `token_hash`; o mesmo vai no painel da nuvem |
| `migrations/0001_esquema.sql` | 5 enums, 6 tabelas, 2 índices |
| `migrations/0002_rls.sql` | RLS nas 6 tabelas, com política em todas |
| `migrations/0003_novo_professor.sql` | Trigger: criar o login cria o professor, a política e a disponibilidade |
| `migrations/0004_onboarding.sql` | `professores.onboarding_concluido`: quem fecha o app no meio do onboarding volta a ele |
| `migrations/0005_aplicar_movimento.sql` | A RPC `aplicar_movimento`: aluno + lançamento (+ proposta) juntos, ou nada, com trava de versão |
| `migrations/0006_link_do_aluno.sql` | A RPC `novo_link_do_aluno`: troca o `token_publico`, e o link anterior para de funcionar |
| `migrations/0007_horario_ocupado.sql` | A `aplicar_movimento` recusa o aceite num horário que outro aluno já ocupou, com trava para os aceites simultâneos |
| `migrations/0008_propostas_estrita.sql` | A política de `propostas` exige, na escrita, que o aluno seja do professor |
| `migrations/0009_aula_fixa.sql` | `alunos.aula_fixa`: o horário fixo estruturado (`{ dias, hora }`), nulo na linha antiga, com `check` |
| `migrations/0010_avisos.sql` | Os lembretes: `token_push` e `ultimo_resumo` no professor, `avisos_enviados` para não repetir, e os dois `pg_cron` |
| `functions/aluno-publico/` | A Edge Function do link do aluno: lê o recorte e grava a resposta pelo token, sem login |
| `functions/aluno-publico/cors.mjs` | As origens que o CORS aceita: a Vercel e o Expo Web local. Mudou o domínio? Muda aqui |
| `functions/apagar-conta/` | A Edge Function de apagar a conta: com o JWT do professor, apaga o usuário do Auth, e o cascade leva o resto |
| `functions/avisos/` | A Edge Function dos lembretes: o resumo das 7h e o aviso antes da aula, pelo Expo Push, com o `AVISOS_SEGREDO` |
| `functions/_shared/entrada.ts` | O que a função usa do domínio do app; o `dominio.js` ao lado é **gerado** e fica fora do git |
| `seed.sql` | Os dados de demonstração. **Gerado**: não edite à mão |
| `tests/database/rls.test.sql` | Teste de RLS com dois professores, em pgTAP |
| `tests/database/novo_professor.test.sql` | Teste do trigger da `0003` e da marca da `0004`, em pgTAP |
| `tests/database/aplicar_movimento.test.sql` | Teste da RPC da `0005`: rollback, conflito de versão, proposta e RLS |
| `tests/database/link_do_aluno.test.sql` | Teste da RPC da `0006`: o token muda, o professor B não troca, sem login não chama |
| `tests/database/horario_ocupado.test.sql` | Teste da `0007`: o segundo aceite no mesmo horário é recusado; o professor, o arquivado e o outro professor não bloqueiam |
| `tests/database/apagar_conta.test.sql` | Apagar o usuário do Auth leva tudo do professor, e o professor B segue intacto |
| `tests/database/propostas_estrita.test.sql` | Teste da `0008`: o professor B não cria proposta no aluno do A, nem muda a dele para lá |
| `tests/database/aula_fixa.test.sql` | Teste da `0009`: o `check` aceita a estrutura e o nulo, e recusa hora fora de 0–23, dia que não existe e texto livre |
| `tests/database/avisos.test.sql` | Teste da `0010`: o token é só do dono, o aviso não repete, e os agendamentos sem o Vault não chamam ninguém |
| `tests/funcoes/avisos.test.mjs` | A `avisos` contra um Expo Push falso: um resumo por dia, um aviso por aula, nada repetido |
| `tests/funcoes/recuperacao.test.mjs` | Recuperar a senha de ponta a ponta no Auth local: o e-mail, o link e a senha nova, com o link valendo uma vez só |
| `tests/funcoes/aluno-publico.test.mjs` | A `aluno-publico` servida de verdade só entrega o aluno do link: sentinelas, os 404, a janela inválida e a origem estranha (no CI, o job "Função do aluno") |

## Para rodar

**Docker Desktop é pré-requisito** e precisa estar aberto: sem ele o `supabase start` falha no
primeiro passo. Na raiz do repositório:

```bash
npx supabase start      # sobe Postgres, Auth e Studio locais; a primeira vez baixa as imagens
npx supabase db reset   # recria o banco: as migrações, na ordem, e depois o seed.sql
npx supabase test db    # o teste de RLS
npx supabase stop       # desliga, guardando os dados
```

O Studio fica em <http://127.0.0.1:54323> e a API em `http://127.0.0.1:54321`. O
`npx supabase status` mostra as chaves locais. **Nenhuma chave entra em arquivo do repositório**,
nem em comentário.

## O seed é gerado

`seed.sql` sai de [`data/seed.json`](../data/seed.json) e de
[`mobile/src/dados/semente.ts`](../mobile/src/dados/semente.ts) (perfil e disponibilidade), pela
regra que está em [`mobile/src/dados/sementeSql.ts`](../mobile/src/dados/sementeSql.ts). Mudou a
semente? Regere, na raiz:

```bash
node scripts/gerar-seed-sql.mjs             # grava supabase/seed.sql
node scripts/gerar-seed-sql.mjs --conferir  # só confere; sai com 1 se estiver defasado
```

O script usa o TypeScript de `mobile/node_modules`, então precisa de `npm install` em `mobile/`.
Um teste do jest (`sementeSql.test.ts`) compara o arquivo comitado com o que o gerador produz:
esquecer de regerar quebra o CI.

**As datas são relativas.** A semente guarda `hoje-12`, e o `seed.sql` guarda
`pg_temp.hoje() - 12`: quem resolve é o banco, a cada `db reset`. Por isso o arquivo não muda de um
dia para o outro, e o banco de demonstração nunca envelhece. O "hoje" é o de `America/Sao_Paulo`.

**O professor de teste** existe somente no banco local, nunca em produção:

```
uuid  00000000-0000-4000-8000-000000000001
email professor@exemplo.test
senha aulaemdia-local
```

Os quatro alunos têm uuid fixo, de `…-000000000101` (`val`) a `…-000000000104` (`bea`). O porquê
de cada escolha está em
[`PLANO-BACKEND.md`, Parte 2 § Decisões tomadas na Parte 2](../docs/backend/PLANO-BACKEND.md#decisões-tomadas-na-parte-2).

O arquivo pode rodar mais de uma vez e termina sempre no mesmo estado.

## O teste que importa: RLS com dois professores

`db reset` passar não prova a segurança. Com RLS ligada e **sem** política, o `select` volta vazio e
o `update` não afeta linha nenhuma, **sem erro**. O que prova é um professor não enxergar o que é do
outro, e é isso que `npx supabase test db` confere, em 30 casos (mais 16 do trigger da `0003` e da marca da `0004`, 24 da RPC da `0005`, 12 da `0006`, 14 da `0007` e 12 do cascade de apagar a conta):

- RLS ligada nas seis tabelas e política em todas (`lancamentos` tem duas: ler e inserir);
- o professor A, do seed, vê os 4 alunos dele e nenhum do professor B;
- o professor B, criado dentro do teste, vê só o aluno dele, não altera nem apaga aluno do A, e não
  lança no extrato de um aluno do A;
- o extrato não aceita `update` nem `delete`, nem do dono;
- sem login não se vê nada.

O professor B nasce e some dentro do teste. O CI roda esta suíte num job próprio (`SCRUM-60`), mas rode
antes de abrir PR que mexa em `migrations/`.

Para ver as políticas à mão:

```sql
select tablename, policyname, cmd from pg_policies where schemaname = 'public'
order by tablename;
```

## Demonstrar no Studio com dois professores

O seed tem um professor só. Para a demonstração, crie o segundo no SQL Editor do Studio:

```sql
-- Professor B, só para a demonstração. Some no próximo `db reset`.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000002',
  'authenticated', 'authenticated',
  'professor.b@exemplo.test',
  extensions.crypt('aulaemdia-local', extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(), '', '', '', ''
);

-- O trigger da 0003 já criou o perfil; aqui só o nome.
update public.professores set nome = 'Professor B'
where id = '00000000-0000-4000-8000-000000000002';

insert into public.alunos (professor_id, nome, disciplina, dia, hora)
values ('00000000-0000-4000-8000-000000000002', 'Aluno do B', 'Piano', 'sexta', '15h');
```

Depois rode a mesma consulta como cada um, trocando só o final do `sub` (`…0001` é o A, `…0002` é
o B):

```sql
begin;
set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select nome from public.alunos order by nome;
rollback;
```

Como A aparecem os quatro alunos da semente; como B, só "Aluno do B". Os dois também entram pela
API com a senha `aulaemdia-local`.

## O app no modo supabase (Partes 3 a 5)

Com o banco local no ar, o app pode entrar, criar conta e ler e gravar no banco. Em `mobile/.env` (copie de
[`.env.example`](../.env.example)):

```bash
EXPO_PUBLIC_BACKEND=supabase
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321           # no celular: o IP do computador na rede
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<a PUBLISHABLE_KEY do npx supabase status>
```

Criar conta pelo app passa pelo trigger da `0003`, que cria a linha em `professores`,
`politicas` e `disponibilidades`. A confirmação de e-mail está desligada no local
(`enable_confirmations = false` no `config.toml`), então o cadastro segue direto para o
onboarding. O professor de teste do seed entra com a senha `aulaemdia-local`.

O que o modo `supabase` faz desde as Partes 4 e 5:

- **Carrega tudo do banco**, mostrando antes o cache do aparelho, que também é o que abre sem rede.
- **Grava o que não mexe em saldo**: perfil, política, disponibilidade, pacote padrão, avisos, aluno
  novo, edição, pausa, arquivo e lembretes.
- **Grava o que mexe em saldo pela RPC `aplicar_movimento`** (a `0005`): aula, falta, reposição,
  pagamento, pacote e proposta, com o aluno e o lançamento juntos, ou nada.
- **Dois aparelhos no mesmo aluno não se sobrescrevem.** Quem gravar com a versão velha vê "Este
  aluno mudou em outro aparelho…", e a tela recarrega.
- **Quem parou no meio do onboarding volta ao passo 1** (a `0004`).

Para ver a política editada num lugar aparecer no outro, sem celular: `npx expo start --web` em
`mobile/` com o `.env` acima, uma janela normal e uma anônima, o mesmo login nas duas. Salve a
política numa, recarregue a outra.

As decisões estão em
[`PLANO-BACKEND.md`, Parte 3](../docs/backend/PLANO-BACKEND.md#decisões-tomadas-na-parte-3),
[Parte 4](../docs/backend/PLANO-BACKEND.md#decisões-tomadas-na-parte-4) e
[Parte 5](../docs/backend/PLANO-BACKEND.md#decisões-tomadas-na-parte-5).

## O link do aluno: a Edge Function (Parte 6)

O aluno abre `/a/<token>` sem login, e a página lê e grava pela função `aluno-publico`. Ela roda
no `edge-runtime` local, que é mais uma imagem: o `supabase start` a baixa se ela não estiver
no `-x`. Na raiz do repositório, com o banco no ar:

```bash
(cd mobile && npm run bundle:dominio)   # gera functions/_shared/dominio.js; refaça quando o domínio mudar
npx supabase functions serve            # serve a função em http://127.0.0.1:54321/functions/v1/aluno-publico
```

O `config.toml` já desliga o JWT dessa função (`verify_jwt = false`: o token do link é a
credencial) e põe o fuso de Brasília no runtime (`TZ`), porque o `hoje()` do domínio lê a hora
local. Para conferir à mão, com um token lido do banco (`select token_publico from alunos`):

```bash
curl "http://127.0.0.1:54321/functions/v1/aluno-publico?token=<token>"      # 200 e o recorte
curl -i "http://127.0.0.1:54321/functions/v1/aluno-publico?token=<outro>"   # 404 sem corpo
```

Sem o `dominio.js`, a função não sobe. É de propósito: melhor do que rodar com uma regra velha.

**O teste automatizado** (`SCRUM-81`) faz essa conferência sozinho, e o CI roda a cada PR, no job
"Função do aluno". Ele cria dois professores e três alunos com valores-sentinela em tudo que não
pode sair (sobrenomes, e-mails, telefone, chave Pix, valor da aula, o outro aluno e o outro
professor) e confere:
- o recorte do aluno do link, com exatamente as chaves dele e nenhuma sentinela;
- os 404 sem corpo: UUID inexistente, mal formado, link velho e aluno arquivado;
- a proposta vencida (`SCRUM-79`): ela some da página, e aceitá-la dá 409 sem gravar nada.

No fim, apaga o que criou. Com a função servida, como acima:

```bash
set -a; eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY|PUBLISHABLE_KEY)=')"; set +a
node supabase/tests/funcoes/aluno-publico.test.mjs
```

Ele só roda contra o banco local e não imprime token nem chave. **Mexeu na função? Rode o
teste.** Tirar o filtro pelo token ou devolver um campo a mais o deixa vermelho.

## Os lembretes: a função avisos (Parte 7)

Dois pushes para o professor (`SCRUM-23`): o resumo do dia às 7h e o aviso uma hora antes de
cada aula. A regra é do domínio (`mobile/src/dominio/avisos.ts`); a função só decide para quem
mandar e manda pela API do Expo.

- **Quem chama** é o `pg_cron` da 0010, pela `chamar_avisos`, que lê o endereço e o segredo do
  Vault. A função recusa com 401 quem não manda `Authorization: Bearer <AVISOS_SEGREDO>`.
- **O relógio** é o de Brasília (UTC−3), calculado na função.
- **Nada repete:** o resumo marca `professores.ultimo_resumo`, e o aviso da aula, a tabela
  `avisos_enviados`, antes de mandar. Se o Expo recusa, a marca é desfeita.
- **Sem token, nada sai.** O app grava o `token_push` no `SCRUM-93`, que espera o build.

**O teste** roda a função contra um Expo falso, um servidor em Node na porta de
`EXPO_PUSH_URL`, que a função alcança por `host.docker.internal`:

```bash
(cd mobile && npm run bundle:dominio)
printf 'AVISOS_SEGREDO=%s\nEXPO_PUSH_URL=http://host.docker.internal:54399\n' "$(openssl rand -hex 16)" > /tmp/avisos.env
npx supabase functions serve --env-file /tmp/avisos.env &
set -a; . /tmp/avisos.env; eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY)=')"; set +a
node supabase/tests/funcoes/avisos.test.mjs
```

O `functions serve` sem nome serve as três funções; o teste da `aluno-publico` roda no mesmo
servidor.

**Na nuvem, uma vez,** depois do `db push` e do deploy. O segredo é gerado na sua máquina e
nunca vai para o git nem para o chat:

```bash
openssl rand -hex 32                                   # o segredo; guarde para os dois passos
npx supabase secrets set AVISOS_SEGREDO=<o segredo>    # a função passa a aceitar quem o tem
```

E no SQL Editor do painel, para o `pg_cron` saber aonde ir e com que segredo:

```sql
select vault.create_secret('https://<ref>.supabase.co/functions/v1/avisos', 'avisos_url');
select vault.create_secret('<o mesmo segredo>', 'avisos_segredo');
```

Para conferir: `select * from cron.job_run_details order by start_time desc limit 5;` mostra as
rodadas, e `select status_code, content from net._http_response order by id desc limit 5;` as
respostas da função, que só contam quantos pushes saíram.

## Recuperar a senha (SCRUM-62)

O professor toca em "Esqueci minha senha", recebe um e-mail e abre o link em qualquer navegador.
O link leva ao app do professor na web, em `/redefinir-senha`, onde ele escolhe a senha nova.
As telas são do `SCRUM-96`. A sessão (`estado/sessao.ts`) tem as duas ações:
- `pedirRecuperacao(email)` chama o `resetPasswordForEmail`, com o retorno em
  `<EXPO_PUBLIC_URL_DO_APP>/redefinir-senha`. Responde igual para quem tem conta e quem não tem.
  O limite de envio (429) também responde igual.
- `redefinirSenha(tokenHash, senha)` chama o `verifyOtp({ type: 'recovery', token_hash })` e o
  `updateUser({ password })`, e a pessoa entra.

**O fluxo é o do `token_hash`, não o PKCE.** O verificador do PKCE fica no aparelho que pediu,
e o link aberto em outro navegador falharia. Por isso o modelo do e-mail monta o link à mão:
`{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`. O `detectSessionInUrl` continua
desligado: quem lê o `token_hash` é a tela.

**No local**, o e-mail cai no Inbucket (`http://127.0.0.1:54324`), e o `config.toml` já tem o
modelo (`templates/recuperacao.html`) e o retorno para o Expo Web (`localhost:8081`). O teste de
ponta a ponta precisa do Inbucket no ar, então rode o `start` sem `-x inbucket`:

```bash
set -a; eval "$(npx supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY|PUBLISHABLE_KEY|INBUCKET_URL)=')"; set +a
node supabase/tests/funcoes/recuperacao.test.mjs
```

**Na nuvem, uma vez, pelo painel.** O `config.toml` só vale no local. **Não rode
`supabase config push`:** ele levaria o `site_url` do `localhost` para a nuvem.

1. **Resend** (resend.com, plano gratuito): crie uma API key com permissão de envio. Ela vai
   só no painel do Supabase, nunca no git nem em `EXPO_PUBLIC_*`.
   - **Atenção ao domínio.** Sem um domínio verificado no Resend, o remetente de teste
     (`onboarding@resend.dev`) só manda para o e-mail da própria conta do Resend. Para mandar a
     qualquer professor, é preciso verificar um domínio próprio, com os registros DNS que o
     Resend mostra. O `*.vercel.app` não serve, porque não dá para pôr DNS nele.
2. **Authentication → Emails → SMTP Settings:** ligue o SMTP próprio.
   - Host `smtp.resend.com`, porta `465`, usuário `resend` e, como senha, a API key.
   - O remetente é `onboarding@resend.dev` no teste, ou um endereço do domínio verificado, e o
     nome do remetente é `Aula em Dia`.
3. **Authentication → Emails → Templates → Reset Password:** o assunto
   `Redefinir a senha do Aula em Dia`, e o corpo é o HTML de `templates/recuperacao.html`.
4. **Authentication → URL Configuration:**
   - **Site URL:** `https://aula-em-dia-three.vercel.app`.
   - **Redirect URLs:** `https://aula-em-dia-three.vercel.app/redefinir-senha` e, para testar
     do computador, `http://localhost:8081/redefinir-senha`.
5. **Vercel → Settings → Environment Variables:** `EXPO_PUBLIC_URL_DO_APP` =
   `https://aula-em-dia-three.vercel.app`, e um novo deploy. No `mobile/.env` de cada pessoa, o
   mesmo valor, para o Expo Go pedir o link certo.

Para conferir: peça o link pelo app e veja o e-mail chegar. Abrir o link e trocar a senha só
funciona com as telas do `SCRUM-96`, que leem o `/redefinir-senha`.

## Rodar no celular com o banco local

O Expo Go precisa alcançar duas portas do computador: a do Metro (`8081`), que entrega o app, e a
da API do banco (`54321`). Por isso **o celular e o computador precisam estar na mesma rede**, e no
`.env` vai o endereço do computador nessa rede, nunca `127.0.0.1` (no celular, isso é o próprio
celular).

### Num Wi-Fi comum

Computador no Wi-Fi ou no cabo, celular no Wi-Fi do **mesmo roteador**, fora da rede de convidados,
que isola os aparelhos:

```bash
ipconfig getifaddr $(route -n get default | awk '/interface/ {print $2}')   # o IP do Mac, ex.: 192.168.0.15
```

No `mobile/.env`, `EXPO_PUBLIC_SUPABASE_URL=http://192.168.0.15:54321`, e o app sobe com
`npx expo start -c`. O `-c` limpa o cache: sem ele, o Expo segue com o `.env` antigo.

### No hotspot do celular (rede só IPv6)

Testado em 24/10/2026, com o Mac no Acesso Pessoal de um iPhone na Vivo 5G. Nessa rede o Mac recebe
o IPv4 `192.0.0.2`, que o celular não alcança: a operadora só entrega IPv6, e esse endereço é
interno do Mac. Dá para ver com `ifconfig en0 | grep inet`: aparece `inet 192.0.0.2` e endereços
`inet6 2804:…`, sem nenhum `172.20.10.x`.

**O que dá errado, e por quê:**

| Sintoma | Causa |
|---|---|
| O Expo Go carrega sem fim | O Metro não está rodando, ou o `.env` ainda tem o endereço de outra conexão. **Cada vez que o Mac reconecta no hotspot, o IPv6 muda.** |
| O Expo Go tenta abrir e fecha sozinho | O endereço usa o IPv6 entre colchetes (`exp://[2804:…]:8081`). O Safari entende, mas a parte nativa do React Native no Expo Go separa host e porta pelo `:`, e um IPv6 cheio de `:` a quebra. |

**A solução é dar um nome ao IPv6.** O serviço público [sslip.io](https://sslip.io) responde
qualquer nome no formato `2804-18-105-….sslip.io` com o IPv6 que está escrito nele, sem cadastro.
Com um nome no lugar do IPv6 literal, não há colchetes e o Expo Go abre normalmente. O `sslip.io`
só traduz o nome: os dados vão direto do celular para o Mac, pela mesma rede.

Com o Docker Desktop aberto e o banco no ar (`npx supabase@2.120.0 start` na raiz):

```bash
cd mobile
# o IPv6 de agora vira o nome (troca os ":" por "-")
NOME="$(ifconfig en0 | awk '/inet6 2804/ && /autoconf secured/ {print $2; exit}' | tr ':' '-').sslip.io"
# o app no celular fala com o banco pelo mesmo nome
sed -i '' "s#^EXPO_PUBLIC_SUPABASE_URL=.*#EXPO_PUBLIC_SUPABASE_URL=http://$NOME:54321#" .env
# o QR Code leva o nome, não o IPv6
REACT_NATIVE_PACKAGER_HOSTNAME="$NOME" npx expo start --lan -c
```

Rode os três comandos a cada nova conexão no hotspot: o nome sai do IPv6 do momento.

- **O `2804` é o prefixo da Vivo.** Em outra operadora o IPv6 começa diferente. Troque o
  `/inet6 2804/` do `awk` pelo começo do endereço que o `ifconfig` mostrar (a linha que tem
  `autoconf secured`).
- **Se não abrir, teste a rede antes do app.** No Safari do celular, abra
  `http://<NOME>:8081/status`. Se aparecer `packager-status:running`, a rede está certa e o problema
  é no app ou no `.env`. Se não abrir, o celular não alcança o Mac.
- **Feche o Expo Go de vez entre uma tentativa e outra,** deslizando para cima no seletor de apps.
  Ele guarda o último endereço.

**Celular no 5G e computador em outra rede (no cabo de casa, por exemplo):** os dois não se
enxergam. Ou o celular entra no Wi-Fi do mesmo roteador, ou o Metro vai por túnel
(`npx expo start --tunnel`) e o banco precisa de um túnel à parte, que deixa o banco local
acessível pela internet enquanto estiver aberto. Para mostrar o app sem banco nenhum, ponha
`EXPO_PUBLIC_BACKEND=local` e use só o `--tunnel`.

## Backup

O banco da nuvem tem um backup semanal cifrado, feito pelo Actions (`.github/workflows/backup.yml`,
`SCRUM-24`): toda segunda às 06:00, ou na mão pela aba Actions. Para abrir e restaurar no banco local,
em três comandos, veja [`PLANO-BACKEND.md`, "Restaurar um backup"](../docs/backend/PLANO-BACKEND.md#restaurar-um-backup-scrum-24).
Sem a `BACKUP_SENHA`, nenhum backup abre.

## Tipos do banco

`mobile/src/dados/banco.ts` é gerado a partir do banco local. Mudou o esquema? Com o banco no ar:

```bash
npx supabase gen types typescript --local > mobile/src/dados/banco.ts
```

O arquivo sai sem formatação e não é editado à mão. `sementeSql.ts` já tira dele o tipo do
lançamento, então um enum que mude no banco aparece no `npm run typecheck`.

## Versões em que isto foi testado

Em 08/10/2026, e de novo em 23/10/2026 com a `0004`: Supabase CLI 2.120.0, PostgreSQL 17.11,
Auth (GoTrue) v2.197.0. A `0006` e a Edge Function, em 04/11/2026: CLI 2.121.0 e
`edge-runtime` 1.77.4 (Deno 2.1.4). O `npx supabase`
não fixa versão, e a forma de `auth.users` muda entre versões do CLI: se o `db reset` começar a
falhar no bloco do professor de teste depois de uma atualização, é por aí.

## O que ainda não está aqui

- **A regra do plano gratuito** (limite de alunos): o limite não foi decidido.
- **Migração aplicada não se edita.** Se o seed revelar um problema no esquema, crie a próxima
  (`0007`).
- **A função na nuvem** e o Expo Web publicado com `/a/*`: é o `SCRUM-71`. Lá o fuso vai por
  `supabase secrets set TZ=America/Sao_Paulo`, porque o `config.toml` só vale no local.
- **O limite de requisições por IP** na função fica para a Parte 8 (`SCRUM-24`), por decisão de PO.

## Divergência conhecida no plano

O diagrama ER do `PLANO-BACKEND.md` lista ~16 colunas de `alunos`; o DDL tem **31**. **O DDL é
o autoritativo** — o diagrama omite `telefone`, `email`, `validade_estendida`, `sem_pacote`,
`encerrado`, `valor_por_aula_centavos`, `reposicoes`, `disponibilidade`, `pausado`, `lembretes`,
`ultimo_lembrete`, `atrasos_historicos`, `pagamento_em`, `pagamento_meio`, `arquivado` e
`criado_em`. Em `propostas`, o diagrama não tem `professor_id` nem `respondida_em`; o DDL tem.
