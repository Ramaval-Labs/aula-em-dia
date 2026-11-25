# api — Aula em Dia (backend no Supabase)

É o backend das duas aplicações (`../app` e `../web`), feito no **Supabase**:
- banco **PostgreSQL** com regras de acesso por professor (RLS);
- as funções do banco (a escrita transacional do saldo e a troca do link do aluno);
- três **Edge Functions** em Deno: a página do aluno, os lembretes e apagar a conta;
- o agendamento dos lembretes (`pg_cron`).

O que cada tabela e cada função faz está em `../docs/DADOS.md` (e no PDF ao lado).

## Pré-requisitos

| O quê | Versão | Para quê |
|---|---|---|
| **Docker Desktop**, aberto | qualquer recente | o Supabase local roda em contêineres |
| **Node.js** | **22.x** | rodar a CLI pelo `npx` e gerar o domínio das funções |
| **Supabase CLI** | **2.120.0**, pelo `npx` (não precisa instalar) | subir, testar e publicar |
| A pasta `../app` com `npm install` feito | — | as funções importam as regras do app (passo 2 de "Executar") |

Na primeira vez, o `start` baixa as imagens do Supabase, mais de 1 GB.

## Dependências

Não há `npm install` nesta pasta: tudo roda pela CLI (`npx supabase@2.120.0 …`) e pelo Docker. As
funções importam as regras do app (`../app/src/dominio`). Por isso o `npm install` precisa estar
feito em `../app` (ver `../app/README.md`).

## Variáveis de ambiente

**Para rodar localmente, nenhuma.** O Supabase local gera as próprias chaves, e o `npx
supabase@2.120.0 status` as mostra.

Na nuvem, estes valores ficam **só no painel do Supabase e nos secrets**, nunca no repositório:

| Nome | Onde | Para quê |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | injetadas pelo Supabase nas funções | a função `aluno-publico` e a `avisos` leem o banco por fora da RLS. **A service role nunca vai para o app** |
| `TZ` | `npx supabase@2.120.0 secrets set TZ=America/Sao_Paulo` | o "hoje" das funções em Brasília |
| `AVISOS_SEGREDO` | `secrets set` e o Vault (`avisos_url`, `avisos_segredo`) | só o `pg_cron` consegue chamar a função `avisos` |
| SMTP do Resend | painel: Authentication → SMTP | o e-mail de recuperação de senha |
| Site URL e Redirect URLs | painel: Authentication → URL Configuration | o link de redefinir senha (`https://aula-em-dia-three.vercel.app`) |

O app usa só a **URL** e a **chave pública** (`EXPO_PUBLIC_SUPABASE_URL` e
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, no `.env` do app).

## Executar

Todos os comandos rodam **dentro desta pasta (`api/`)**, onde fica a pasta `supabase/`:

```bash
# 1. Subir o Supabase local (banco, Auth, API e Studio) e criar o banco do zero
npx supabase@2.120.0 start
npx supabase@2.120.0 db reset     # aplica as 10 migrações e o seed (dados de demonstração)

# 2. Gerar o domínio que as funções importam (o arquivo é gerado, não vem no zip)
(cd ../app && npm run bundle:dominio)

# 3. Servir as Edge Functions
npx supabase@2.120.0 functions serve
```

**Os endereços locais:**
- API: http://127.0.0.1:54321
- Studio, para ver as tabelas: http://127.0.0.1:54323
- E-mails de teste: http://127.0.0.1:54324

O seed cria um professor de teste **só no banco local**: `professor@exemplo.test`, senha
`aulaemdia-local`.

**Para o app usar o backend local:** no `.env` do `../app`, ponha
- `EXPO_PUBLIC_BACKEND=supabase`;
- `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`;
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a chave que o `status` mostra.

**Para parar:** `npx supabase@2.120.0 stop`.

## Verificar

```bash
npx supabase@2.120.0 test db
```

Roda os testes pgTAP de `supabase/tests/database/`: a RLS com dois professores, a escrita
transacional, o horário ocupado, o link do aluno, a aula fixa, os avisos, apagar a conta, o
professor novo e as propostas. Todos devem passar.

**A função do aluno**, com as funções servidas, deve dar **404** para um token qualquer:

```bash
curl -i "http://127.0.0.1:54321/functions/v1/aluno-publico?token=00000000-0000-4000-8000-000000000000"
```

---

## Publicar na nuvem

Só a pessoa dona da conta faz isto, porque o login é interativo:

```bash
npx supabase@2.120.0 login
npx supabase@2.120.0 link --project-ref <ref-do-projeto>      # pede a senha do banco
npx supabase@2.120.0 db push                                  # só as migrações
(cd ../app && npm run bundle:dominio)
npx supabase@2.120.0 functions deploy aluno-publico --no-verify-jwt
npx supabase@2.120.0 functions deploy apagar-conta
npx supabase@2.120.0 functions deploy avisos --no-verify-jwt
```

**Nunca rode o `seed.sql` na nuvem.** Ele cria o professor de teste com uma senha que está no
repositório.

## O que tem aqui

```
supabase/
  config.toml        configuração do Supabase local e das funções
  migrations/        0001 a 0010: tabelas, RLS, funções do banco, aula fixa e avisos
  functions/         aluno-publico, apagar-conta, avisos e _shared/ (o domínio importado do app)
  tests/database/    testes pgTAP do banco
  tests/funcoes/     testes das funções servidas
  seed.sql           dados de demonstração (gerado a partir de ../docs/projeto/data/seed.json)
  templates/         o e-mail de recuperação de senha
```
