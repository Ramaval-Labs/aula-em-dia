-- O trigger da 0003: criar o login cria o professor (SCRUM-19).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- Tudo acontece dentro de begin … rollback: os usuários criados aqui somem no fim.

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

-- ── o trigger existe ─────────────────────────────────────────────────────────

select has_trigger('auth', 'users', 'ao_criar_usuario', 'auth.users tem o trigger do professor');
select is(
  (select prosecdef from pg_proc where oid = 'public.criar_professor'::regproc),
  true,
  'a função roda como security definer: o serviço de Auth não escreve em public'
);

-- ── um cadastro novo ─────────────────────────────────────────────────────────

insert into auth.users (id, email)
values ('00000000-0000-4000-8000-0000000000c1', 'novo.professor@exemplo.test');

select is(
  (select email from public.professores where id = '00000000-0000-4000-8000-0000000000c1'),
  'novo.professor@exemplo.test',
  'o perfil nasce com o e-mail do login'
);
select is(
  (select row(nome, iniciais, plano::text) from public.professores
    where id = '00000000-0000-4000-8000-0000000000c1'),
  row(''::text, ''::text, 'gratuito'::text),
  'o resto do perfil fica com os padrões da tabela, para o onboarding preencher'
);
select is(
  (select row(aviso_horas, avisada_devolve, limite_reposicoes, validade_dias)
     from public.politicas where professor_id = '00000000-0000-4000-8000-0000000000c1'),
  row(24, true, 3, 60),
  'a política nasce com os padrões: 24h de aviso, devolve, 3 reposições, 60 dias'
);
select is(
  (select row(blocos, aceita_fora_dos_blocos, sugere_sabado, folgas)
     from public.disponibilidades where professor_id = '00000000-0000-4000-8000-0000000000c1'),
  row('[]'::jsonb, false, false, '[]'::jsonb),
  'a disponibilidade nasce vazia'
);
select is(
  (select count(*)::int from public.alunos where professor_id = '00000000-0000-4000-8000-0000000000c1'),
  0,
  'e nenhum aluno: o trigger não semeia nada'
);

-- ── usuário sem e-mail não derruba o cadastro ────────────────────────────────

select lives_ok(
  $$ insert into auth.users (id, phone) values ('00000000-0000-4000-8000-0000000000c2', '5551900000999') $$,
  'usuário sem e-mail é criado mesmo assim'
);
select is(
  (select email from public.professores where id = '00000000-0000-4000-8000-0000000000c2'),
  '',
  'e o perfil fica com e-mail vazio, porque a coluna não aceita nulo'
);

-- ── o professor de teste do seed convive com o trigger ──────────────────────

select is(
  (select count(*)::int from public.professores where id = '00000000-0000-4000-8000-000000000001'),
  1,
  'o professor do seed tem uma linha só, sem duplicar'
);
select is(
  (select nome from public.professores where id = '00000000-0000-4000-8000-000000000001'),
  'Caio Torres',
  'e o perfil dele é o do seed, gravado por cima do que o trigger criou'
);
select is(
  (select count(*)::int from public.politicas where professor_id = '00000000-0000-4000-8000-000000000001'),
  1,
  'uma política só para ele'
);
select is(
  (select jsonb_array_length(blocos) from public.disponibilidades
    where professor_id = '00000000-0000-4000-8000-000000000001'),
  13,
  'e a disponibilidade do seed, não a vazia do trigger'
);

-- ── apagar o login leva o professor junto ────────────────────────────────────

delete from auth.users where id = '00000000-0000-4000-8000-0000000000c1';
select is(
  (select count(*)::int from public.professores where id = '00000000-0000-4000-8000-0000000000c1'),
  0,
  'apagar o usuário apaga o professor (on delete cascade da 0001)'
);

select * from finish();

rollback;
