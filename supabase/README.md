# supabase/

O banco do Aula em Dia. O que está aqui é o que roda;
[`docs/backend/PLANO-BACKEND.md`](../docs/backend/PLANO-BACKEND.md) é o que argumenta cada
decisão (ADRs, comparativo de alternativas, riscos). Por enquanto o banco é **só local**: o app
ainda não fala com ele.

| Arquivo | O que é |
|---|---|
| `config.toml` | Portas e versão do Postgres, iguais para as três pessoas |
| `migrations/0001_esquema.sql` | 5 enums, 6 tabelas, 2 índices |
| `migrations/0002_rls.sql` | RLS nas 6 tabelas, com política em todas |
| `seed.sql` | Os dados de demonstração. **Gerado**: não edite à mão |
| `tests/database/rls.test.sql` | Teste de RLS com dois professores, em pgTAP |

## Para rodar

**Docker Desktop é pré-requisito** e precisa estar aberto: sem ele o `supabase start` falha no
primeiro passo. Na raiz do repositório:

```bash
npx supabase start      # sobe Postgres, Auth e Studio locais; a primeira vez baixa as imagens
npx supabase db reset   # recria o banco: 0001, 0002 e depois o seed.sql
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
outro, e é isso que `npx supabase test db` confere, em 30 casos:

- RLS ligada nas seis tabelas e política em todas (`lancamentos` tem duas: ler e inserir);
- o professor A, do seed, vê os 4 alunos dele e nenhum do professor B;
- o professor B, criado dentro do teste, vê só o aluno dele, não altera nem apaga aluno do A, e não
  lança no extrato de um aluno do A;
- o extrato não aceita `update` nem `delete`, nem do dono;
- sem login não se vê nada.

O professor B nasce e some dentro do teste. O teste **não roda no CI**, que não tem Docker: rode
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

insert into public.professores (id, nome, email)
values ('00000000-0000-4000-8000-000000000002', 'Professor B', 'professor.b@exemplo.test');

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

## Tipos do banco

`mobile/src/dados/banco.ts` é gerado a partir do banco local. Mudou o esquema? Com o banco no ar:

```bash
npx supabase gen types typescript --local > mobile/src/dados/banco.ts
```

O arquivo sai sem formatação e não é editado à mão. `sementeSql.ts` já tira dele o tipo do
lançamento, então um enum que mude no banco aparece no `npm run typecheck`.

## Versões em que isto foi testado

Em 08/10/2026: Supabase CLI 2.120.0, PostgreSQL 17.11, Auth (GoTrue) v2.197.0. O `npx supabase`
não fixa versão, e a forma de `auth.users` muda entre versões do CLI: se o `db reset` começar a
falhar no bloco do professor de teste depois de uma atualização, é por aí.

## O que ainda não está aqui

- **A RPC `aplicar_movimento` (Parte 5).** Está no plano (Parte 5 § A função) com o ramo da proposta
  como stub literal. Virar migração agora seria versionar um stub.
- **O trigger que cria o professor a partir do login (Parte 3).** O seed já convive com ele: foi
  testado com o trigger instalado só no banco local.
- **Migração aplicada não se edita.** Se o seed revelar um problema no esquema, crie a `0003`.

## Divergência conhecida no plano

O diagrama ER do `PLANO-BACKEND.md` lista ~16 colunas de `alunos`; o DDL tem **31**. **O DDL é
o autoritativo** — o diagrama omite `telefone`, `email`, `validade_estendida`, `sem_pacote`,
`encerrado`, `valor_por_aula_centavos`, `reposicoes`, `disponibilidade`, `pausado`, `lembretes`,
`ultimo_lembrete`, `atrasos_historicos`, `pagamento_em`, `pagamento_meio`, `arquivado` e
`criado_em`. Em `propostas`, o diagrama não tem `professor_id` nem `respondida_em`; o DDL tem.
