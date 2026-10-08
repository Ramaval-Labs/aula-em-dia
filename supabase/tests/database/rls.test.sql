-- Teste de RLS com dois professores, e de integridade do seed (SCRUM-18).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- Este é o teste da Parte 2. Com RLS ligada e SEM política, o select volta
-- vazio e o update não afeta linha nenhuma, sem erro: `db reset` passar não
-- prova nada. O que prova é um professor não enxergar o que é do outro.
--
-- O professor A é o do seed. O professor B nasce aqui dentro e some no
-- rollback do fim: o seed.sql continua com um professor só.

begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

-- ── estrutura ────────────────────────────────────────────────────────────────

select is(
  (select count(*)::int from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
  6,
  'RLS está ligada nas seis tabelas'
);

select results_eq(
  -- `tablename` é do tipo name, com outra collation: sem o collate o pgTAP não compara.
  $$ select tablename::text collate "default", count(*)::int from pg_policies
      where schemaname = 'public' group by tablename order by tablename $$,
  $$ values ('alunos', 1), ('disponibilidades', 1), ('lancamentos', 2),
            ('politicas', 1), ('professores', 1), ('propostas', 1) $$,
  'toda tabela tem política, e o extrato tem duas (ler e inserir)'
);

-- ── o seed, visto sem RLS ────────────────────────────────────────────────────

select is((select count(*)::int from public.alunos), 4, 'seed: 4 alunos');
select is((select count(*)::int from public.lancamentos), 13, 'seed: 13 lançamentos');
select is(
  (select count(*)::int from public.lancamentos where tipo = 'legado'),
  0,
  'seed: todo título virou um tipo, nenhum ficou como legado'
);
select is(
  (select count(*)::int from public.propostas where status = 'enviada'),
  1,
  'seed: uma proposta aberta'
);
select is(
  (select pagamento_vencimento from public.alunos
    where id = '00000000-0000-4000-8000-000000000101'),
  (now() at time zone 'America/Sao_Paulo')::date - 12,
  'seed: a data é relativa a hoje (o pagamento do val venceu há 12 dias)'
);
select ok(
  (select validade is null and sem_pacote from public.alunos
    where id = '00000000-0000-4000-8000-000000000104'),
  'seed: aluno sem pacote fica com validade nula'
);
select is(
  (select titulo from public.lancamentos
    where aluno_id = '00000000-0000-4000-8000-000000000102'
    order by criado_em desc limit 1),
  'Proposta de reposição enviada',
  'seed: o extrato sai na ordem do app, do mais novo para o mais antigo'
);
select is(
  (select janela ->> 'dia' from public.propostas),
  (array['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'])
    [extract(isodow from (now() at time zone 'America/Sao_Paulo')::date + 1)::int]
    || ', ' || to_char((now() at time zone 'America/Sao_Paulo')::date + 1, 'DD/MM'),
  'seed: o dia da semana da proposta bate com a data'
);

-- ── o professor B, só para este teste ────────────────────────────────────────

insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');

insert into public.professores (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');

insert into public.alunos (id, professor_id, nome, disciplina, dia, hora)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
        'Aluno do B', 'Piano', 'sexta', '15h');

-- ── como o professor A ───────────────────────────────────────────────────────

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select is((select count(*)::int from public.alunos), 4, 'A vê os 4 alunos dele');
select is(
  (select count(*)::int from public.alunos
    where professor_id = '00000000-0000-4000-8000-000000000002'),
  0,
  'A não vê o aluno do B'
);
select is((select count(*)::int from public.lancamentos), 13, 'A vê o próprio extrato');
select is((select count(*)::int from public.propostas), 1, 'A vê a própria proposta');
select is((select count(*)::int from public.professores), 1, 'A vê só o próprio perfil');
select is((select count(*)::int from public.politicas), 1, 'A vê só a própria política');

-- O extrato só recebe inserção: sem política de update nem de delete.
with mexidos as (
  update public.lancamentos set titulo = 'x' returning 1
)
select is(
  (select count(*)::int from mexidos),
  0,
  'A não edita lançamento, nem o próprio'
);
with apagados as (
  delete from public.lancamentos returning 1
)
select is(
  (select count(*)::int from apagados),
  0,
  'A não apaga lançamento, nem o próprio'
);

-- ── como o professor B ───────────────────────────────────────────────────────

set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select is((select count(*)::int from public.alunos), 1, 'B vê só o aluno dele');
select is((select count(*)::int from public.lancamentos), 0, 'B não vê o extrato do A');
select is((select count(*)::int from public.propostas), 0, 'B não vê a proposta do A');

with mexidos as (
  update public.alunos set nome = 'invadido'
  where id = '00000000-0000-4000-8000-000000000101' returning 1
)
select is(
  (select count(*)::int from mexidos),
  0,
  'B não altera aluno do A'
);
with apagados as (
  delete from public.alunos
  where professor_id = '00000000-0000-4000-8000-000000000001' returning 1
)
select is(
  (select count(*)::int from apagados),
  0,
  'B não apaga aluno do A'
);
select throws_ok(
  $$ insert into public.alunos (professor_id, nome, disciplina, dia, hora)
     values ('00000000-0000-4000-8000-000000000001', 'plantado', 'x', 'seg', '10h') $$,
  '42501',
  'new row violates row-level security policy for table "alunos"',
  'B não cria aluno em nome do A'
);
select throws_ok(
  $$ insert into public.lancamentos
       (aluno_id, professor_id, tipo, data, titulo, delta, saldo_depois)
     values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000002',
             'aula', current_date, 'plantado', -1, 0) $$,
  '42501',
  'new row violates row-level security policy for table "lancamentos"',
  'B não lança no extrato de um aluno do A'
);
select lives_ok(
  $$ insert into public.lancamentos
       (aluno_id, professor_id, tipo, data, titulo, delta, saldo_depois)
     values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
             'aula', current_date, 'Aula realizada', -1, 0) $$,
  'B lança no extrato do próprio aluno'
);
select lives_ok(
  $$ insert into public.alunos (nome, disciplina, dia, hora)
     values ('Sem dono informado', 'Piano', 'sexta', '16h') $$,
  'B cria aluno sem informar o professor: o default é o próprio login'
);
select is((select count(*)::int from public.alunos), 2, 'e o aluno novo ficou com o B');

-- ── sem login ────────────────────────────────────────────────────────────────

set local role anon;
set local "request.jwt.claims" to '{"role": "anon"}';

select is((select count(*)::int from public.alunos), 0, 'sem login não se vê aluno nenhum');

-- ── de volta sem RLS: nada do A mudou ────────────────────────────────────────

reset role;

select is(
  (select nome from public.alunos where id = '00000000-0000-4000-8000-000000000101'),
  'Valentin Klein',
  'o aluno do A continua como estava'
);

select * from finish();

rollback;
