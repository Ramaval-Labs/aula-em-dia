-- Proposta só no aluno do próprio professor (SCRUM-82, P3-5).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- A política da 0008 exige, na escrita, que o aluno da proposta seja do
-- professor. Antes dela, o B gravava uma proposta com o próprio id no aluno
-- do A e ocupava a vaga de proposta aberta dele. O professor A é o do seed; o
-- B nasce aqui. Tudo some no rollback do fim.

begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

-- O professor B e um aluno dele.
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');
insert into public.alunos (id, professor_id, nome, disciplina, dia, hora)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
        'Aluno do B', 'Piano', 'sexta', '15h');

-- Um aluno do A sem proposta aberta: sem a 0008, o B ocuparia a vaga dele.
select is(
  (select count(*)::int from public.propostas
    where aluno_id = '00000000-0000-4000-8000-000000000101' and status = 'enviada'),
  0,
  'o aluno 101 do A não tem proposta aberta'
);

-- ── como o professor B ───────────────────────────────────────────────────────

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.propostas (aluno_id, professor_id, janela, status, enviada_em)
     values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000002',
             '{"dia": "Sexta, 30/10", "hora": "17h"}', 'enviada', current_date) $$,
  '42501',
  'new row violates row-level security policy for table "propostas"',
  'B não cria proposta, com o próprio id, no aluno do A'
);

select lives_ok(
  $$ insert into public.propostas (id, aluno_id, professor_id, janela, status, enviada_em)
     values ('00000000-0000-4000-8000-000000000301',
             '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
             '{"dia": "Sexta, 30/10", "hora": "17h"}', 'enviada', current_date) $$,
  'B cria proposta no aluno dele'
);

select throws_ok(
  $$ update public.propostas set aluno_id = '00000000-0000-4000-8000-000000000101'
     where id = '00000000-0000-4000-8000-000000000301' $$,
  '42501',
  'new row violates row-level security policy for table "propostas"',
  'B não muda a proposta dele para o aluno do A'
);

select lives_ok(
  $$ update public.propostas set status = 'recusada', respondida_em = now()
     where id = '00000000-0000-4000-8000-000000000301' $$,
  'B responde a proposta dele'
);

-- ── como o professor A ───────────────────────────────────────────────────────

set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.propostas (aluno_id, professor_id, janela, status, enviada_em)
     values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
             '{"dia": "Sexta, 30/10", "hora": "17h"}', 'enviada', current_date) $$,
  'A cria proposta no aluno dele, que segue com a vaga livre'
);

reset role;

select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'propostas'),
  1,
  'propostas segue com uma política só'
);

select * from finish();

rollback;
