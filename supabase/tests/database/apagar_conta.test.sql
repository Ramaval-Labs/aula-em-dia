-- Apagar a conta: o cascade leva tudo do professor (SCRUM-75).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- A Edge Function `apagar-conta` só apaga o usuário do Auth. Este teste prova
-- que o resto é trabalho do banco, numa transação: os `on delete cascade` da
-- 0001 levam professor, política, disponibilidade, alunos, extrato e
-- propostas, e o link do aluno morre junto, porque o token mora na linha do
-- aluno. O professor A é o do seed; o B nasce aqui e precisa ficar intacto.
-- Tudo some no rollback do fim.

begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- O professor B, com um aluno, um lançamento e uma proposta aberta.
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');
insert into public.alunos (id, professor_id, nome, disciplina, dia, hora)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
        'Aluno do B', 'Piano', 'sexta', '15h');
insert into public.lancamentos (aluno_id, professor_id, tipo, data, titulo, delta, saldo_depois)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
        'aula', current_date, 'Aula realizada', -1, 0);
insert into public.propostas (aluno_id, professor_id, janela, alternativas, status, enviada_em)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002',
        '{"dia": "Sexta, 30/10", "hora": "17h"}', '[]', 'enviada', current_date);

-- Antes: o seed do A está lá.
select is(
  (select count(*)::int from public.alunos where professor_id = '00000000-0000-4000-8000-000000000001'),
  4,
  'antes, o A tem os 4 alunos do seed'
);

-- Apagar a conta é apagar o usuário do Auth, que é o que a função faz.
delete from auth.users where id = '00000000-0000-4000-8000-000000000001';

-- ── do A, não sobra nada ─────────────────────────────────────────────────────

select is((select count(*)::int from public.professores
            where id = '00000000-0000-4000-8000-000000000001'), 0, 'o perfil do A sai');
select is((select count(*)::int from public.politicas
            where professor_id = '00000000-0000-4000-8000-000000000001'), 0, 'a política sai');
select is((select count(*)::int from public.disponibilidades
            where professor_id = '00000000-0000-4000-8000-000000000001'), 0, 'a disponibilidade sai');
select is((select count(*)::int from public.alunos
            where professor_id = '00000000-0000-4000-8000-000000000001'), 0,
          'os alunos saem, e com eles os links: o token mora na linha do aluno');
select is((select count(*)::int from public.lancamentos
            where professor_id = '00000000-0000-4000-8000-000000000001'), 0, 'o extrato sai');
select is((select count(*)::int from public.propostas
            where professor_id = '00000000-0000-4000-8000-000000000001'), 0, 'as propostas saem');
select is((select count(*)::int from auth.identities
            where user_id = '00000000-0000-4000-8000-000000000001'), 0,
          'e a identidade de login do seed também');

-- ── o B segue igual ──────────────────────────────────────────────────────────

select is((select count(*)::int from public.professores
            where id = '00000000-0000-4000-8000-000000000002'), 1, 'o perfil do B fica');
select is((select count(*)::int from public.alunos
            where professor_id = '00000000-0000-4000-8000-000000000002'), 1, 'o aluno do B fica');
select is((select count(*)::int from public.lancamentos
            where professor_id = '00000000-0000-4000-8000-000000000002'), 1, 'o extrato do B fica');
select is((select count(*)::int from public.propostas
            where professor_id = '00000000-0000-4000-8000-000000000002' and status = 'enviada'), 1,
          'e a proposta aberta do B também');

select * from finish();

rollback;
