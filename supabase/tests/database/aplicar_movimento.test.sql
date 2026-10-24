-- A RPC da 0005: aluno e lançamento juntos, ou nada (SCRUM-21).
--
-- Como rodar, na raiz do repositório, com o Supabase local no ar:
--   npx supabase db reset
--   npx supabase test db
--
-- O professor A é o do seed. O B nasce aqui dentro, como no teste de RLS, e
-- tudo some no rollback do fim. Os alunos do A: val (…0101), raf (…0102, com a
-- proposta aberta do seed) e mar (…0103).

begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

-- Um aluno do jeito que o app manda: a linha inteira, em jsonb.
create function pg_temp.aluno(p_id uuid) returns jsonb language sql as
  $$ select to_jsonb(a) from public.alunos a where a.id = p_id $$;
create function pg_temp.versao(p_id uuid) returns int language sql as
  $$ select versao from public.alunos where id = p_id $$;

-- ── a função ─────────────────────────────────────────────────────────────────

select has_function('public', 'aplicar_movimento', array['jsonb', 'integer', 'jsonb', 'jsonb'],
  'a RPC existe');
select is(
  (select prosecdef from pg_proc where oid = 'public.aplicar_movimento'::regproc),
  false,
  'roda como security invoker: a RLS vale lá dentro'
);
select ok(
  not has_function_privilege('anon', 'public.aplicar_movimento(jsonb, int, jsonb, jsonb)', 'execute'),
  'sem login, não se chama'
);
select ok(
  has_function_privilege('authenticated', 'public.aplicar_movimento(jsonb, int, jsonb, jsonb)', 'execute'),
  'com login, sim'
);

-- O professor B, para a RLS no fim.
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000002', 'professor.b@exemplo.test');

-- ── como o professor A ───────────────────────────────────────────────────────

set local role authenticated;
set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated"}';

-- Uma aula registrada no val: o app manda usadas + 1 e o lançamento.
select is(
  public.aplicar_movimento(
    pg_temp.aluno('00000000-0000-4000-8000-000000000101') || '{"usadas": 3}',
    0,
    '{"tipo": "aula", "data": "2026-10-23", "titulo": "Aula realizada",
      "subtitulo": "Quarta, 17h", "delta": -1, "saldo_depois": 3}'
  ),
  1,
  'gravou e devolveu a versão nova'
);
select is(
  (select row(usadas, versao) from public.alunos where id = '00000000-0000-4000-8000-000000000101'),
  row(3, 1),
  'o aluno mudou'
);
select is(
  (select row(tipo::text, titulo, saldo_depois, professor_id) from public.lancamentos
    where aluno_id = '00000000-0000-4000-8000-000000000101' order by criado_em desc limit 1),
  row('aula'::text, 'Aula realizada'::text, 3, '00000000-0000-4000-8000-000000000001'::uuid),
  'e o lançamento entrou junto, com o professor da linha do aluno'
);

-- O cadastro não é do movimento: o nome que veio no jsonb não é gravado.
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000101')
         || '{"nome": "outro nome", "pagamento_status": "pago", "pausado": false}',
       1) $$,
  'pagamento recebido, sem lançamento'
);
select is(
  (select row(nome, pagamento_status::text, versao) from public.alunos
    where id = '00000000-0000-4000-8000-000000000101'),
  row('Valentin Klein'::text, 'pago'::text, 2),
  'grava o pagamento, não o nome: cadastro é da Parte 4'
);

-- ── a trava de versão ────────────────────────────────────────────────────────

select throws_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000101') || '{"usadas": 5}', 1,
       '{"tipo": "aula", "data": "2026-10-23", "titulo": "Aula realizada",
         "delta": -1, "saldo_depois": 1}') $$,
  'P0001',
  'conflito_de_versao',
  'com a versão velha, conflito'
);
select is(
  (select row(usadas, versao) from public.alunos where id = '00000000-0000-4000-8000-000000000101'),
  row(3, 2),
  'e o aluno ficou como estava'
);
select is(
  (select count(*)::int from public.lancamentos
    where aluno_id = '00000000-0000-4000-8000-000000000101' and saldo_depois = 1),
  0,
  'e nenhum lançamento entrou'
);

-- ── o rollback: o insert falha, e o update vai junto ─────────────────────────

-- saldo_depois negativo esbarra no check da 0001. O update do aluno já tinha
-- rodado quando o insert falhou.
select throws_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000101') || '{"usadas": 6}', 2,
       '{"tipo": "aula", "data": "2026-10-23", "titulo": "Aula realizada",
         "delta": -1, "saldo_depois": -1}') $$,
  '23514',
  null,
  'o lançamento que viola o check derruba a chamada'
);
select is(
  (select row(usadas, versao) from public.alunos where id = '00000000-0000-4000-8000-000000000101'),
  row(3, 2),
  'rollback: o aluno não mudou, nem a versão'
);

-- ── a proposta ───────────────────────────────────────────────────────────────

-- Uma proposta nova para o raf, que já tem uma aberta no seed.
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102'), 0,
       '{"tipo": "proposta", "data": "2026-10-23", "titulo": "Proposta de reposição enviada",
         "subtitulo": "Sexta, 30/10, 17h · aguardando resposta", "delta": 0, "saldo_depois": 2}',
       '{"status": "enviada", "janela": {"dia": "Sexta, 30/10", "hora": "17h"},
         "alternativas": [], "enviada_em": "2026-10-23"}') $$,
  'proposta nova com uma já aberta'
);
select is(
  (select count(*)::int from public.propostas
    where aluno_id = '00000000-0000-4000-8000-000000000102' and status = 'enviada'),
  1,
  'continua uma aberta só: a de antes foi fechada (uma_proposta_aberta)'
);
select is(
  (select janela ->> 'dia' from public.propostas
    where aluno_id = '00000000-0000-4000-8000-000000000102' and status = 'enviada'),
  'Sexta, 30/10',
  'e a aberta é a nova'
);
select is(
  (select row(status::text, respondida_em is not null) from public.propostas
    where aluno_id = '00000000-0000-4000-8000-000000000102' and status <> 'enviada'),
  row('recusada'::text, true),
  'a de antes ficou recusada, com a data da resposta'
);

-- O aluno aceita: a reposição é marcada, e a proposta fecha como aceita.
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000102')
         || '{"reposicoes": 2, "pendencia_origem": null,
              "agendada": {"dia": "Sexta, 30/10", "hora": "17h"}}',
       1,
       '{"tipo": "reposicao", "data": "2026-10-23", "titulo": "Reposição marcada",
         "subtitulo": "Sexta, 30/10, 17h", "delta": 0, "saldo_depois": 2}',
       '{"status": "aceita"}') $$,
  'proposta aceita'
);
select is(
  (select row(reposicoes, pendencia_origem is null, agendada ->> 'dia') from public.alunos
    where id = '00000000-0000-4000-8000-000000000102'),
  row(2, true, 'Sexta, 30/10'::text),
  'a reposição ficou marcada no aluno'
);
select is(
  (select count(*)::int from public.propostas
    where aluno_id = '00000000-0000-4000-8000-000000000102' and status = 'enviada'),
  0,
  'e nenhuma proposta ficou aberta'
);

-- Marcar a reposição sem proposta aberta: não há o que fechar, e não é erro.
select lives_ok(
  $$ select public.aplicar_movimento(
       pg_temp.aluno('00000000-0000-4000-8000-000000000103') || '{"reposicoes": 1}', 0,
       '{"tipo": "reposicao", "data": "2026-10-23", "titulo": "Reposição marcada",
         "subtitulo": "Sábado, 24/10, 10h", "delta": 0, "saldo_depois": 5}',
       '{"status": "recusada"}') $$,
  'fechar a proposta de quem não tem nenhuma aberta não falha'
);

-- ── como o professor B ───────────────────────────────────────────────────────

set local "request.jwt.claims" to
  '{"sub": "00000000-0000-4000-8000-000000000002", "role": "authenticated"}';

-- B monta o jsonb à mão: ele não enxerga a linha do A para copiá-la.
select throws_ok(
  $$ select public.aplicar_movimento(
       '{"id": "00000000-0000-4000-8000-000000000103", "nome": "x", "disciplina": "x",
         "dia": "x", "hora": "x", "total": 99, "usadas": 0}', 1,
       '{"tipo": "aula", "data": "2026-10-23", "titulo": "plantado", "delta": 0, "saldo_depois": 99}') $$,
  'P0001',
  'conflito_de_versao',
  'B não grava no aluno do A: a RLS deixa o update sem linha'
);

-- ── de volta sem RLS: nada do A mudou pela mão do B ──────────────────────────

reset role;

select is(
  (select row(total, versao) from public.alunos where id = '00000000-0000-4000-8000-000000000103'),
  row(8, 1),
  'o aluno do A continua com o pacote dele'
);

select * from finish();

rollback;
