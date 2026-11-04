-- O "Gerar novo link" da 0006 (SCRUM-22).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- O professor A é o do seed. O B nasce aqui dentro, como nos outros testes, e
-- tudo some no rollback do fim. Os alunos do A: val (…0101) e mar (…0103).

begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- ── a função ─────────────────────────────────────────────────────────────────

select has_function('public', 'novo_link_do_aluno', array['uuid'], 'a RPC existe');
select is(
  (select prosecdef from pg_proc where oid = 'public.novo_link_do_aluno'::regproc),
  false,
  'roda como security invoker: a RLS vale lá dentro'
);
select ok(
  not has_function_privilege('anon', 'public.novo_link_do_aluno(uuid)', 'execute'),
  'sem login, não se chama'
);
select ok(
  has_function_privilege('authenticated', 'public.novo_link_do_aluno(uuid)', 'execute'),
  'com login, sim'
);
-- A Edge Function grava a resposta do aluno pela RPC da 0005, com a service
-- role. O `revoke ... from public, anon` de lá não pode tê-la deixado de fora.
select ok(
  has_function_privilege('service_role', 'public.aplicar_movimento(jsonb, int, jsonb, jsonb)', 'execute'),
  'a service role da Edge Function chama a aplicar_movimento'
);

-- Os tokens de antes, para comparar depois da troca. Num `do`, para não
-- imprimir linha fora do TAP.
do $$ begin
  perform set_config('teste.token_val', token_publico::text, true)
     from public.alunos where id = '00000000-0000-4000-8000-000000000101';
  perform set_config('teste.token_mar', token_publico::text, true)
     from public.alunos where id = '00000000-0000-4000-8000-000000000103';
end $$;

-- O professor B, para a RLS no fim.
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');

-- ── como o professor A ───────────────────────────────────────────────────────

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

do $$ begin
  perform set_config('teste.token_novo',
    public.novo_link_do_aluno('00000000-0000-4000-8000-000000000101')::text, true);
end $$;

select isnt(
  current_setting('teste.token_novo'),
  current_setting('teste.token_val'),
  'o token mudou'
);
select is(
  (select token_publico::text from public.alunos where id = '00000000-0000-4000-8000-000000000101'),
  current_setting('teste.token_novo'),
  'e o que a função devolve é o que ficou gravado'
);
select is(
  (select count(*)::int from public.alunos
    where token_publico = current_setting('teste.token_val')::uuid),
  0,
  'o token velho não acha mais ninguém: o link anterior parou de funcionar'
);
select is(
  (select versao from public.alunos where id = '00000000-0000-4000-8000-000000000101'),
  0,
  'a versão não mudou: trocar o link não dá conflito no outro aparelho'
);

-- ── como o professor B ───────────────────────────────────────────────────────

set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.novo_link_do_aluno('00000000-0000-4000-8000-000000000103') $$,
  'P0001',
  'aluno_nao_encontrado',
  'B não troca o link do aluno do A: a RLS deixa o update sem linha'
);

-- ── sem login ────────────────────────────────────────────────────────────────

set local role anon;
set local "request.jwt.claims" to '{"role": "anon"}';

select throws_ok(
  $$ select public.novo_link_do_aluno('00000000-0000-4000-8000-000000000103') $$,
  '42501',
  null,
  'sem login, o execute é negado'
);

-- ── de volta sem RLS: o link do A continua o mesmo ───────────────────────────

reset role;

select is(
  (select token_publico::text from public.alunos where id = '00000000-0000-4000-8000-000000000103'),
  current_setting('teste.token_mar'),
  'o link do mar não mudou pela mão do B nem de quem não tem login'
);

select * from finish();

rollback;
