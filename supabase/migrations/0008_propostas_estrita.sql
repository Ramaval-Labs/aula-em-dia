-- 0008_propostas_estrita.sql — proposta só no aluno do próprio professor (SCRUM-82)
--
-- O P3-5 da revisão da Parte 6 (docs/backend/revisoes/parte-6.md). A política
-- da 0002 só conferia o `professor_id` da linha: um professor podia gravar uma
-- proposta com o próprio id e o `aluno_id` de um aluno de outra pessoa. Ele
-- não via nada do outro com isso, mas a proposta aberta ocupa a vaga do índice
-- `uma_proposta_aberta`, e o aluno alheio ficava sem poder receber a proposta
-- do professor dele.
--
-- É a "variante mais estrita" que a 0002 deixou comentada: o `with check`
-- também exige que o aluno seja do professor, como o insert de `lancamentos`
-- já faz. Vale para o insert e para o update, que não pode mover a proposta
-- para o aluno de outro. O `using` (o que se lê, altera e apaga) fica igual.
-- Custa uma subconsulta por escrita, pela chave primária de `alunos`.
--
-- A RPC `aplicar_movimento` (0005, 0007) é `security invoker` e passa por
-- aqui, mas não muda de comportamento: ela grava a proposta com o
-- `professor_id` do aluno que a RLS deixou ver, então o aluno já é do
-- professor. A Edge Function do aluno usa a service role e não passa pela RLS.
-- Uma política só, com o mesmo nome: o teste de RLS conta uma por tabela.

drop policy "as próprias propostas" on public.propostas;

create policy "as próprias propostas" on public.propostas
  for all using (professor_id = (select auth.uid()))
  with check (
    professor_id = (select auth.uid())
    and exists (select 1 from public.alunos a
                where a.id = aluno_id and a.professor_id = (select auth.uid()))
  );
