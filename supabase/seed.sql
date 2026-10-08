-- supabase/seed.sql — GERADO. Não edite à mão.
--
-- Fonte: data/seed.json (alunos, extratos e políticas) e
-- mobile/src/dados/semente.ts (perfil e disponibilidade).
-- Para regerar, na raiz do repositório: node scripts/gerar-seed-sql.mjs
--
-- SOMENTE banco local, nunca produção: cria um usuário de teste com senha
-- conhecida.
--
-- As datas são relativas, como na semente do app: "hoje-12" vira
-- pg_temp.hoje() - 12, e quem resolve é o banco, a cada `db reset`. Por isso
-- este arquivo não muda de um dia para o outro.
--
-- Pode rodar mais de uma vez: termina sempre no mesmo estado.

-- Funções de sessão: existem só enquanto o seed roda.
create or replace function pg_temp.hoje() returns date language sql stable as
  $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- "29/08", como o app escreve.
create or replace function pg_temp.ddmm(dias int) returns text language sql stable as
  $$ select to_char(pg_temp.hoje() + dias, 'DD/MM') $$;

-- "Sexta, 29/08": o nome do dia sai da data, nunca é escrito à mão.
create or replace function pg_temp.dia_e_data(dias int) returns text language sql stable as
  $$ select (array['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'])
       [extract(isodow from pg_temp.hoje() + dias)::int] || ', ' || pg_temp.ddmm(dias) $$;

-- Meio-dia da data, menos a posição no extrato em segundos: o extrato do app é
-- uma lista do mais novo para o mais antigo, e no banco a ordem é criado_em desc.
create or replace function pg_temp.momento(dias int, posicao int) returns timestamptz
  language sql stable as
  $$ select ((pg_temp.hoje() + dias) + time '12:00') at time zone 'America/Sao_Paulo'
            - make_interval(secs => posicao) $$;

-- O professor de teste (SCRUM-50). Os quatro tokens vão como '' porque com
-- null o login devolve 500.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated',
  'professor@exemplo.test',
  extensions.crypt('aulaemdia-local', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}', '{}',
  now(), now(),
  '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'email',
  jsonb_build_object(
    'sub',   '00000000-0000-4000-8000-000000000001',
    'email', 'professor@exemplo.test',
    'email_verified', true
  ),
  now(), now(), now()
)
on conflict (provider_id, provider) do nothing;

-- O e-mail é o do login, não o de demonstração que o app mostra no perfil.
insert into public.professores (
  id, nome, iniciais, email, disciplinas, faixa_de_alunos, chave_pix, plano
) values (
  '00000000-0000-4000-8000-000000000001', 'Caio Torres', 'CT', 'professor@exemplo.test',
  array['Matemática', 'Violão', 'Inglês']::text[], '1–5', null, 'gratuito'
)
on conflict (id) do update set
  nome = excluded.nome,
  iniciais = excluded.iniciais,
  email = excluded.email,
  disciplinas = excluded.disciplinas,
  faixa_de_alunos = excluded.faixa_de_alunos,
  chave_pix = excluded.chave_pix,
  plano = excluded.plano;

insert into public.politicas (
  professor_id, aviso_horas, avisada_devolve, limite_reposicoes, validade_dias
) values (
  '00000000-0000-4000-8000-000000000001', 24, true, 3, 60
)
on conflict (professor_id) do update set
  aviso_horas = excluded.aviso_horas,
  avisada_devolve = excluded.avisada_devolve,
  limite_reposicoes = excluded.limite_reposicoes,
  validade_dias = excluded.validade_dias;

insert into public.disponibilidades (
  professor_id, blocos, aceita_fora_dos_blocos, sugere_sabado, folgas
) values (
  '00000000-0000-4000-8000-000000000001',
  '[{"dia":"ter","faixa":"manha"},{"dia":"qui","faixa":"manha"},{"dia":"seg","faixa":"tarde"},{"dia":"ter","faixa":"tarde"},{"dia":"qua","faixa":"tarde"},{"dia":"qui","faixa":"tarde"},{"dia":"sex","faixa":"tarde"},{"dia":"seg","faixa":"fimTarde"},{"dia":"ter","faixa":"fimTarde"},{"dia":"qua","faixa":"fimTarde"},{"dia":"qui","faixa":"fimTarde"},{"dia":"sex","faixa":"fimTarde"},{"dia":"qua","faixa":"noite"}]'::jsonb,
  true, false,
  jsonb_build_array('{"de":"07/09","ate":"07/09","motivo":"feriado"}'::jsonb, jsonb_build_object('de', to_jsonb(pg_temp.ddmm(17)), 'ate', to_jsonb(pg_temp.ddmm(24)), 'motivo', '"viagem"'::jsonb))
)
on conflict (professor_id) do update set
  blocos = excluded.blocos,
  aceita_fora_dos_blocos = excluded.aceita_fora_dos_blocos,
  sugere_sabado = excluded.sugere_sabado,
  folgas = excluded.folgas;

-- Apagar antes de inserir é o que deixa o arquivo rodar duas vezes: o
-- extrato não tem chave natural, e o delete leva junto lançamentos e propostas.
delete from public.alunos where professor_id = '00000000-0000-4000-8000-000000000001';

-- Ficam de fora, por serem derivados: `hoje`, `pendencia.dias` e `pagamento.dias`.
insert into public.alunos (
  id, professor_id, nome, disciplina, dia, hora, telefone, email,
  total, usadas, validade, validade_estendida, sem_pacote, encerrado, valor_por_aula_centavos,
  reposicoes, pendencia_origem, agendada, disponibilidade,
  pausado, lembretes, ultimo_lembrete, atrasos_historicos,
  pagamento_status, pagamento_em, pagamento_meio, pagamento_vencimento,
  arquivado
) values
  -- val
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Valentin Klein', 'Matemática', 'quarta', '17h', '51900000101', 'valentin.klein@exemplo.test', 6, 2, pg_temp.hoje() + 63, false, false, null, 8000, 0, null, null, null, false, 1, pg_temp.hoje() - 6, 3, 'atraso', null, null, pg_temp.hoje() - 12, false),
  -- raf
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Rafael Dornelas', 'Violão', 'segunda', '19h', '51900000202', 'rafael.dornelas@exemplo.test', 8, 6, pg_temp.hoje() + 33, false, false, null, 8000, 1, pg_temp.hoje() - 16, null, null, false, 0, null, 0, 'aberto', null, null, pg_temp.hoje() + 15, false),
  -- mar
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Mateus Alves', 'Inglês', 'terça e quinta', '18h', '51900000303', 'mateus.alves@exemplo.test', 8, 3, pg_temp.hoje() + 94, false, false, null, 8000, 0, null, null, null, false, 0, null, 0, 'pago', pg_temp.hoje() - 27, 'Pix', null, false),
  -- bea
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Bernardo Lemos', 'Inglês', 'sem horário fixo', '', '51900000404', 'bernardo.lemos@exemplo.test', 0, 0, null, false, true, pg_temp.hoje() - 55, null, 0, null, null, null, false, 0, null, 0, 'sem', null, null, null, false);

insert into public.lancamentos (
  aluno_id, professor_id, tipo, data, titulo, subtitulo, delta, saldo_depois, dinheiro, criado_em
) values
  -- val · Aula realizada
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'aula', pg_temp.hoje() - 2, 'Aula realizada', 'Quarta, 17h', -1, 4, false, pg_temp.momento(-2, 0)),
  -- val · Aula realizada
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'aula', pg_temp.hoje() - 9, 'Aula realizada', 'Quarta, 17h', -1, 5, false, pg_temp.momento(-9, 1)),
  -- val · Pacote de 6 aulas
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'pacote', pg_temp.hoje() - 27, 'Pacote de 6 aulas', 'Aguardando pagamento', 6, 6, false, pg_temp.momento(-27, 2)),
  -- raf · Proposta de reposição enviada
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'proposta', pg_temp.hoje() - 2, 'Proposta de reposição enviada', pg_temp.dia_e_data(1) || ', 17h · aguardando resposta', 0, 2, false, pg_temp.momento(-2, 0)),
  -- raf · Falta avisada
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'falta_avisada', pg_temp.hoje() - 16, 'Falta avisada', 'Aviso com 30h · reposição gerada', 0, 2, false, pg_temp.momento(-16, 1)),
  -- raf · Aula realizada
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'aula', pg_temp.hoje() - 23, 'Aula realizada', 'Segunda, 19h', -1, 2, false, pg_temp.momento(-23, 2)),
  -- raf · Reposição realizada
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'reposicao', pg_temp.hoje() - 30, 'Reposição realizada', 'Sábado, 10h', -1, 3, false, pg_temp.momento(-30, 3)),
  -- raf · Pacote de 8 aulas
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'pacote', pg_temp.hoje() - 58, 'Pacote de 8 aulas', 'Pago em ' || pg_temp.ddmm(-58) || ' · Pix', 8, 8, false, pg_temp.momento(-58, 4)),
  -- mar · Aula realizada
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'aula', pg_temp.hoje() - 2, 'Aula realizada', 'Terça, 18h', -1, 5, false, pg_temp.momento(-2, 0)),
  -- mar · Aula realizada
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'aula', pg_temp.hoje() - 7, 'Aula realizada', 'Quinta, 18h', -1, 6, false, pg_temp.momento(-7, 1)),
  -- mar · Falta sem aviso
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'falta_sem_aviso', pg_temp.hoje() - 9, 'Falta sem aviso', 'Política: debita a aula', -1, 7, false, pg_temp.momento(-9, 2)),
  -- mar · Falta avisada
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'falta_avisada', pg_temp.hoje() - 14, 'Falta avisada', 'Aviso com 26h · reposição realizada', 0, 8, false, pg_temp.momento(-14, 3)),
  -- mar · Pacote de 8 aulas
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'pacote', pg_temp.hoje() - 27, 'Pacote de 8 aulas', 'Pago em ' || pg_temp.ddmm(-27) || ' · Pix', 8, 8, false, pg_temp.momento(-27, 4));

-- No app a proposta mora dentro do aluno; no banco é uma tabela.
insert into public.propostas (
  aluno_id, professor_id, janela, alternativas, status, enviada_em
) values
  -- raf
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', jsonb_build_object('dia', to_jsonb(pg_temp.dia_e_data(1)), 'hora', '"17h"'::jsonb), jsonb_build_array(jsonb_build_object('dia', to_jsonb(pg_temp.dia_e_data(2)), 'hora', '"10h"'::jsonb, 'motivo', '"Livre, mas fora do horário habitual do aluno"'::jsonb)), 'enviada', pg_temp.hoje() - 2);
