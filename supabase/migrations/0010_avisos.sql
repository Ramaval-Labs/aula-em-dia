-- 0010_avisos.sql — os lembretes do professor no banco (SCRUM-23, Parte 7)
--
-- Dois lembretes por push (PO, 13/11): o resumo do dia às 7h e o aviso uma
-- hora antes de cada aula. A regra é do domínio (`mobile/src/dominio/avisos.ts`,
-- SCRUM-91); a Edge Function `avisos` só decide para quem mandar e manda. Aqui
-- fica o que ela precisa para não repetir.
--
-- **`professores.token_push`:** o endereço do aparelho no Expo Push. Quem o
-- grava é o app (SCRUM-93, que espera o build); até lá fica nulo, e a função
-- não manda nada. A RLS de `professores` (0002) já o deixa só com o dono.
--
-- **`professores.ultimo_resumo`:** o dia (de Brasília) do último resumo. A
-- função marca antes de mandar, num `update ... where ultimo_resumo is distinct
-- from hoje`: duas chamadas no mesmo dia, mesmo juntas, mandam um resumo só.
--
-- **`avisos_enviados`:** um aviso de aula por aluno, dia e hora. A chave
-- primária faz o papel do `ultimo_resumo`: a função insere com `on conflict do
-- nothing` e só manda se a linha entrou. O professor lê os dele; só a service
-- role escreve.

alter table public.professores
  add column token_push    text,
  add column ultimo_resumo date;

create table public.avisos_enviados (
  aluno_id     uuid not null references public.alunos on delete cascade,
  professor_id uuid not null references public.professores on delete cascade,
  -- o dia e a hora cheia da aula, em Brasília
  dia          date not null,
  hora         smallint not null check (hora between 0 and 23),
  enviado_em   timestamptz not null default now(),
  primary key (aluno_id, dia, hora)
);
create index avisos_enviados_professor on public.avisos_enviados (professor_id);

alter table public.avisos_enviados enable row level security;

-- Só leitura, e só os próprios: a escrita é da função, com a service role.
-- Sem policy de insert, update e delete, a operação é negada (como o extrato).
create policy "lê os próprios avisos" on public.avisos_enviados
  for select using (professor_id = (select auth.uid()));
