-- A aula fixa estruturada (SCRUM-89).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- A `aula_fixa` da 0009 é nula por padrão, e o `check` só deixa entrar o que
-- o domínio (`mobile/src/dominio/aulaFixa.ts`) sabe ler: `{ dias, hora }`, com
-- os dias de `DiaDaSemana` e a hora cheia de 0 a 23, ou `null`. Os updates
-- são no aluno 101 do seed, como o professor A. Tudo some no rollback do fim.

begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

select has_column('public', 'alunos', 'aula_fixa', 'alunos tem a coluna aula_fixa');
select col_is_null('public', 'alunos', 'aula_fixa', 'e ela aceita nulo: a linha antiga fica sem');

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

-- ── aceita ───────────────────────────────────────────────────────────────────

select lives_ok(
  $$ update public.alunos set aula_fixa = '{"dias": ["ter", "qui"], "hora": 18}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  'terça e quinta às 18h'
);
select is(
  (select aula_fixa from public.alunos where id = '00000000-0000-4000-8000-000000000101'),
  '{"dias": ["ter", "qui"], "hora": 18}'::jsonb,
  '  e volta igual'
);
select lives_ok(
  $$ update public.alunos set aula_fixa = '{"dias": [], "hora": null}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  'sem horário fixo: nenhum dia e sem hora'
);
select lives_ok(
  $$ update public.alunos set aula_fixa = '{"dias": ["seg"], "hora": 0}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  'a hora 0 também é hora'
);
select lives_ok(
  $$ update public.alunos set aula_fixa = null
     where id = '00000000-0000-4000-8000-000000000101' $$,
  'e nula, como a linha antiga'
);

-- ── recusa ───────────────────────────────────────────────────────────────────

select throws_ok(
  $$ update public.alunos set aula_fixa = '{"hora": 25}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  '23514', null,
  'recusa {"hora": 25}: sem dias, e a hora não existe'
);
select throws_ok(
  $$ update public.alunos set aula_fixa = '{"dias": "ter"}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  '23514', null,
  'recusa {"dias": "ter"}: dias não é array'
);
select throws_ok(
  $$ update public.alunos set aula_fixa = '{"dias": ["ter"], "hora": 24}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  '23514', null,
  'recusa a hora 24'
);
select throws_ok(
  $$ update public.alunos set aula_fixa = '{"dias": ["ter"], "hora": 18.5}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  '23514', null,
  'recusa hora quebrada: o domínio guarda a hora cheia'
);
select throws_ok(
  $$ update public.alunos set aula_fixa = '{"dias": ["terça"], "hora": 18}'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  '23514', null,
  'recusa dia que não é chave de DiaDaSemana'
);
select throws_ok(
  $$ update public.alunos set aula_fixa = '"terça e quinta"'
     where id = '00000000-0000-4000-8000-000000000101' $$,
  '23514', null,
  'recusa o texto livre no lugar da estrutura'
);

select * from finish();

rollback;
