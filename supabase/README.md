# supabase/

O banco do Aula em Dia. O que está aqui é o que roda;
[`docs/backend/PLANO-BACKEND.md`](../docs/backend/PLANO-BACKEND.md) é o que argumenta cada
decisão (ADRs, comparativo de alternativas, riscos). O banco é **só local**, e o app fala com ele no
modo `supabase` (Partes 3 e 4); o padrão do app continua sendo o modo local.

| Arquivo | O que é |
|---|---|
| `config.toml` | Portas e versão do Postgres, iguais para as três pessoas |
| `migrations/0001_esquema.sql` | 5 enums, 6 tabelas, 2 índices |
| `migrations/0002_rls.sql` | RLS nas 6 tabelas, com política em todas |
| `migrations/0003_novo_professor.sql` | Trigger: criar o login cria o professor, a política e a disponibilidade |
| `migrations/0004_onboarding.sql` | `professores.onboarding_concluido`: quem fecha o app no meio do onboarding volta a ele |
| `migrations/0005_aplicar_movimento.sql` | A RPC `aplicar_movimento`: aluno + lançamento (+ proposta) juntos, ou nada, com trava de versão |
| `seed.sql` | Os dados de demonstração. **Gerado**: não edite à mão |
| `tests/database/rls.test.sql` | Teste de RLS com dois professores, em pgTAP |
| `tests/database/novo_professor.test.sql` | Teste do trigger da `0003` e da marca da `0004`, em pgTAP |
| `tests/database/aplicar_movimento.test.sql` | Teste da RPC da `0005`: rollback, conflito de versão, proposta e RLS |

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
outro, e é isso que `npx supabase test db` confere, em 30 casos (mais 16 do trigger da `0003` e da marca da `0004`, e 24 da RPC da `0005`):

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

## O app no modo supabase (Partes 3 e 4)

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
[`PLANO-BACKEND.md`, Parte 3](../docs/backend/PLANO-BACKEND.md#decisões-tomadas-na-parte-3) e
[Parte 4](../docs/backend/PLANO-BACKEND.md#decisões-tomadas-na-parte-4).

## Tipos do banco

`mobile/src/dados/banco.ts` é gerado a partir do banco local. Mudou o esquema? Com o banco no ar:

```bash
npx supabase gen types typescript --local > mobile/src/dados/banco.ts
```

O arquivo sai sem formatação e não é editado à mão. `sementeSql.ts` já tira dele o tipo do
lançamento, então um enum que mude no banco aparece no `npm run typecheck`.

## Versões em que isto foi testado

Em 08/10/2026, e de novo em 23/10/2026 com a `0004`: Supabase CLI 2.120.0, PostgreSQL 17.11,
Auth (GoTrue) v2.197.0. O `npx supabase`
não fixa versão, e a forma de `auth.users` muda entre versões do CLI: se o `db reset` começar a
falhar no bloco do professor de teste depois de uma atualização, é por aí.

## O que ainda não está aqui

- **A regra do plano gratuito** (limite de alunos): o limite não foi decidido.
- **Migração aplicada não se edita.** Se o seed revelar um problema no esquema, crie a próxima
  (`0006`).

## Divergência conhecida no plano

O diagrama ER do `PLANO-BACKEND.md` lista ~16 colunas de `alunos`; o DDL tem **31**. **O DDL é
o autoritativo** — o diagrama omite `telefone`, `email`, `validade_estendida`, `sem_pacote`,
`encerrado`, `valor_por_aula_centavos`, `reposicoes`, `disponibilidade`, `pausado`, `lembretes`,
`ultimo_lembrete`, `atrasos_historicos`, `pagamento_em`, `pagamento_meio`, `arquivado` e
`criado_em`. Em `propostas`, o diagrama não tem `professor_id` nem `respondida_em`; o DDL tem.
