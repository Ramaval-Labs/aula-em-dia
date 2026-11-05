-- A 0007: um horário aceita uma reposição só (SCRUM-83).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- O professor A é o do seed: val (…0101), raf (…0102, com a proposta aberta do
-- seed), mar (…0103) e bea (…0104). O B nasce aqui dentro. Tudo some no
-- rollback do fim.
--
-- Aqui se prova a regra numa sessão só. Os dois aceites ao mesmo tempo, que é
-- o que a trava resolve, foram provados com duas sessões do psql em paralelo:
-- docs/backend/PLANO-BACKEND.md, decisões do SCRUM-83.

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

create function pg_temp.aluno(p_id uuid) returns jsonb language sql as
  $$ select to_jsonb(a) from public.alunos a where a.id = p_id $$;

-- ── o cenário, sem RLS ───────────────────────────────────────────────────────

-- O mar já tem reposição na sexta, 30/10, às 17h.
update public.alunos set agendada = '{"dia": "Sexta, 30/10", "hora": "17h"}'
 where id = '00000000-0000-4000-8000-000000000103';

-- O professor B, com um aluno marcado na segunda, 02/11, às 15h.
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');
insert into public.alunos (id, professor_id, nome, disciplina, dia, hora, agendada)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
        'Aluno do B', 'Piano', 'sexta', '15h', '{"dia": "Segunda, 02/11", "hora": "15h"}');

-- ── como o professor A ───────────────────────────────────────────────────────

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

-- O aceite do raf no horário do mar.
select throws_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102')
         || '{"reposicoes": 2, "agendada": {"dia": "Sexta, 30/10", "hora": "17h"}}',
       0, null, '{"status": "aceita"}') $$,
  'P0001',
  'horario_ocupado',
  'o aceite no horário de outro aluno é recusado'
);
select is(
  (select row(versao, agendada) from public.alunos where id = '00000000-0000-4000-8000-000000000102'),
  row(0, null::jsonb),
  'e o raf ficou como estava'
);
select is(
  (select count(*)::int from public.propostas
    where aluno_id = '00000000-0000-4000-8000-000000000102' and status = 'enviada'),
  1,
  'e a proposta continua aberta: o aluno pode escolher outra janela'
);

-- Mesmo dia, outra hora: livre.
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102')
         || '{"reposicoes": 2, "agendada": {"dia": "Sexta, 30/10", "hora": "18h"}}',
       0, null, '{"status": "aceita"}') $$,
  'no mesmo dia, outra hora é aceita'
);

-- O professor decide sabendo da agenda: confirmar e marcar direto passam.
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000101'), 0, null,
       '{"status": "enviada", "janela": {"dia": "Sexta, 30/10", "hora": "17h"},
         "alternativas": [], "enviada_em": "2026-10-28"}') $$,
  'proposta nova para o val'
);
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000101')
         || '{"agendada": {"dia": "Sexta, 30/10", "hora": "17h"}}',
       1, null, '{"status": "confirmadaPeloProfessor"}') $$,
  'o professor confirmando no horário ocupado não é bloqueado'
);
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000104')
         || '{"reposicoes": 1, "agendada": {"dia": "Sexta, 30/10", "hora": "17h"}}',
       0, null, '{"status": "recusada"}') $$,
  'nem marcando a reposição direto'
);

-- O aluno arquivado não ocupa o horário.
reset role;
update public.alunos
   set agendada = '{"dia": "Sábado, 31/10", "hora": "10h"}', arquivado = true
 where id = '00000000-0000-4000-8000-000000000103';
set local role authenticated;

select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102'), 1, null,
       '{"status": "enviada", "janela": {"dia": "Sábado, 31/10", "hora": "10h"},
         "alternativas": [], "enviada_em": "2026-10-28"}') $$,
  'proposta nova para o raf'
);
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102')
         || '{"agendada": {"dia": "Sábado, 31/10", "hora": "10h"}}',
       2, null, '{"status": "aceita"}') $$,
  'o horário do aluno arquivado é aceito'
);

-- O aluno de outro professor não ocupa o horário do A.
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102'), 3, null,
       '{"status": "enviada", "janela": {"dia": "Segunda, 02/11", "hora": "15h"},
         "alternativas": [], "enviada_em": "2026-10-28"}') $$,
  'mais uma proposta para o raf'
);
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102')
         || '{"agendada": {"dia": "Segunda, 02/11", "hora": "15h"}}',
       4, null, '{"status": "aceita"}') $$,
  'o horário de um aluno do professor B não conta para o A'
);

-- ── a função continua como a 0005 a deixou ───────────────────────────────────

reset role;

select ok(
  not has_function_privilege('anon', 'public.aplicar_movimento(jsonb, int, jsonb, jsonb)', 'execute'),
  'sem login, não se chama'
);
select ok(
  has_function_privilege('authenticated', 'public.aplicar_movimento(jsonb, int, jsonb, jsonb)', 'execute'),
  'com login, sim'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.aplicar_movimento'::regproc),
  false,
  'e segue security invoker'
);

select * from finish();

rollback;
