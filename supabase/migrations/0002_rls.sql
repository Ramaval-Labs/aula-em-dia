-- 0002_rls.sql — Row Level Security do Aula em Dia
--
-- Extraído de docs/backend/PLANO-BACKEND.md (Parte 2). O markdown tinha as políticas de
-- `professores`, `alunos` e `lancamentos` escritas e um comentário no lugar das outras três;
-- as de `politicas`, `disponibilidades` e `propostas` foram escritas aqui seguindo o mesmo
-- padrão. Isso não é detalhe: com RLS ligada e SEM política, a tabela fica muda — o select
-- volta vazio e o update não afeta linha nenhuma, sem erro. A Parte 4 quebraria em silêncio.
--
-- O `(select auth.uid())` está embrulhado de propósito: o Postgres avalia uma vez por query
-- em vez de uma vez por linha.

alter table public.professores      enable row level security;
alter table public.politicas        enable row level security;
alter table public.disponibilidades enable row level security;
alter table public.alunos           enable row level security;
alter table public.lancamentos      enable row level security;
alter table public.propostas        enable row level security;

-- ── o professor só alcança a própria linha ────────────────────────────────────

create policy "o próprio perfil" on public.professores
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "a própria política" on public.politicas
  for all using (professor_id = (select auth.uid()))
  with check (professor_id = (select auth.uid()));

create policy "a própria disponibilidade" on public.disponibilidades
  for all using (professor_id = (select auth.uid()))
  with check (professor_id = (select auth.uid()));

create policy "os próprios alunos" on public.alunos
  for all using (professor_id = (select auth.uid()))
  with check (professor_id = (select auth.uid()));

create policy "as próprias propostas" on public.propostas
  for all using (professor_id = (select auth.uid()))
  with check (professor_id = (select auth.uid()));

-- Variante mais estrita para `propostas`, se o time quiser: trocar o `with check` acima por
-- um que também exija que o aluno seja do professor, como o insert de `lancamentos` faz.
-- Custa uma subconsulta por escrita e impede anexar proposta ao aluno de outra pessoa.
-- Não foi adotada porque o plano pede "o mesmo padrão" das demais; é decisão do time.

-- ── extrato: lê e insere, nunca edita nem apaga ───────────────────────────────
-- A ausência de policy de update/delete é intencional, não esquecimento: o extrato é
-- append-only, como no app. Sem policy, a operação é negada.

create policy "lê o próprio extrato" on public.lancamentos
  for select using (professor_id = (select auth.uid()));

create policy "insere no próprio extrato" on public.lancamentos
  for insert with check (
    professor_id = (select auth.uid())
    and exists (select 1 from public.alunos a
                where a.id = aluno_id and a.professor_id = (select auth.uid()))
  );
