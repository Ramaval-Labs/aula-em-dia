-- Os lembretes no banco (SCRUM-23).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- O `token_push` é do professor: ele grava o próprio, e o outro não lê nem
-- grava. `avisos_enviados` é escrita só pela service role (a função `avisos`)
-- e não repete aluno, dia e hora. Os dois agendamentos existem, e sem o Vault
-- configurado não chamam ninguém. O professor A é o do seed; o B nasce aqui.
-- Tudo some no rollback do fim.

begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

select has_column('public', 'professores', 'token_push', 'professores tem o token_push');
select has_column('public', 'professores', 'ultimo_resumo', 'e o dia do último resumo');
select has_table('public', 'avisos_enviados', 'existe a tabela avisos_enviados');

-- O professor B, com um aluno, e um aviso enviado de cada um (como a função faz).
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');
insert into public.alunos (id, professor_id, nome, disciplina, dia, hora)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
        'Aluno do B', 'Piano', 'sexta', '15h');
insert into public.avisos_enviados (aluno_id, professor_id, dia, hora) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', current_date, 18),
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002', current_date, 15);

-- ── a chave do aviso ─────────────────────────────────────────────────────────

select throws_ok(
  $$ insert into public.avisos_enviados (aluno_id, professor_id, dia, hora)
     values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
             current_date, 18) $$,
  '23505', null,
  'o mesmo aluno, dia e hora não entra duas vezes'
);
select throws_ok(
  $$ insert into public.avisos_enviados (aluno_id, professor_id, dia, hora)
     values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
             current_date, 24) $$,
  '23514', null,
  'a hora vai de 0 a 23'
);

-- ── como o professor A ───────────────────────────────────────────────────────

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

with gravados as (
  update public.professores set token_push = 'ExponentPushToken[a]'
  where id = '00000000-0000-4000-8000-000000000001' returning 1
)
select is((select count(*)::int from gravados), 1, 'A grava o próprio token_push');
select is(
  (select token_push from public.professores where id = '00000000-0000-4000-8000-000000000001'),
  'ExponentPushToken[a]',
  '  e lê o que gravou'
);
select is((select count(*)::int from public.avisos_enviados), 1, 'A vê só os próprios avisos enviados');
select throws_ok(
  $$ insert into public.avisos_enviados (aluno_id, professor_id, dia, hora)
     values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
             current_date, 9) $$,
  '42501', null,
  'A não escreve aviso enviado: isso é da função'
);
with apagados as (delete from public.avisos_enviados returning 1)
select is((select count(*)::int from apagados), 0, 'nem apaga');

-- ── como o professor B ───────────────────────────────────────────────────────

set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select is(
  (select count(*)::int from public.professores where token_push is not null),
  0,
  'B não lê o token_push do A'
);
with gravados as (
  update public.professores set token_push = 'ExponentPushToken[invadido]'
  where id = '00000000-0000-4000-8000-000000000001' returning 1
)
select is((select count(*)::int from gravados), 0, 'B não grava o token_push do A');
select is(
  (select count(*)::int from public.avisos_enviados
    where professor_id = '00000000-0000-4000-8000-000000000001'),
  0,
  'B não vê os avisos do A'
);

reset role;

select is(
  (select token_push from public.professores where id = '00000000-0000-4000-8000-000000000001'),
  'ExponentPushToken[a]',
  'o token do A segue o que ele gravou'
);

-- ── os agendamentos ──────────────────────────────────────────────────────────

select results_eq(
  $$ select jobname::text, schedule::text, command::text from cron.job
      where jobname like 'avisos-%' order by jobname $$,
  $$ values ('avisos-aula', '0 * * * *', 'select public.chamar_avisos(''aula'')'),
            ('avisos-resumo', '0 10 * * *', 'select public.chamar_avisos(''resumo'')') $$,
  'o resumo às 10:00 UTC (7h em Brasília) e o aviso da aula de hora em hora'
);
select is(public.chamar_avisos('resumo'), null, 'sem o Vault configurado, a chamada não faz nada');
select throws_ok(
  $$ select public.chamar_avisos('outro') $$,
  'P0001', null,
  'tipo de aviso que não existe é recusado'
);
select ok(
  not has_function_privilege('authenticated', 'public.chamar_avisos(text)', 'execute'),
  'o professor não dispara os avisos'
);
select ok(
  not has_function_privilege('anon', 'public.chamar_avisos(text)', 'execute'),
  'nem quem não tem login'
);

select * from finish();

rollback;
