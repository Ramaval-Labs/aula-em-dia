-- 0007_horario_ocupado.sql — um horário aceita uma reposição só (SCRUM-83)
--
-- O P2-2 da revisão da Parte 6 (docs/backend/revisoes/parte-6.md): a mesma
-- janela proposta a dois alunos era aceita pelos dois, e as duas reposições
-- ficavam no mesmo horário. O motor de agenda passa a não sugerir o horário
-- de uma reposição já marcada, mas dois aceites que chegam juntos, cada um
-- pelo link do seu aluno, só se resolvem aqui.
--
-- A regra (PO, 04/11): o ACEITE (`p_proposta.status = 'aceita'`) é recusado
-- com `horario_ocupado` quando outro aluno do mesmo professor, não arquivado,
-- já tem `agendada` no mesmo dia e hora. Só o aceite: o professor marcando a
-- reposição direto, ou confirmando por conta própria, decide sabendo da agenda
-- e não é bloqueado.
--
-- Os aceites de um mesmo professor passam por uma trava de transação
-- (`pg_advisory_xact_lock`): o segundo espera o primeiro terminar e, como cada
-- comando do plpgsql lê o que já foi confirmado, enxerga a reposição que o
-- primeiro gravou. Sem a trava, os dois confeririam ao mesmo tempo e passariam.
-- A trava é por professor, então alunos de professores diferentes não esperam
-- uns pelos outros, e ela se solta sozinha no fim da transação.
--
-- O resto da função é o da 0005, igual. `create or replace` mantém os grants
-- de lá (execute só para `authenticated`, além do service_role da Edge Function).

create or replace function public.aplicar_movimento(
  p_aluno      jsonb,             -- o aluno inteiro, convertido por mobile/src/dados/conversor.ts
  p_versao     int,               -- a versão que o app leu
  p_lancamento jsonb default null,
  p_proposta   jsonb default null
) returns int                     -- a nova versão
language plpgsql
security invoker
set search_path = '' as $$
declare
  v_id        uuid := (p_aluno ->> 'id')::uuid;
  v_nova      int;
  v_professor uuid;
begin
  -- O aceite confere o horário antes de gravar. Com RLS, o aluno de outro
  -- professor é invisível: o select não acha o professor, a conferência é
  -- pulada, e o `update` abaixo responde `conflito_de_versao` como antes.
  if p_proposta ->> 'status' = 'aceita' and jsonb_typeof(p_aluno -> 'agendada') = 'object' then
    select a.professor_id into v_professor from public.alunos a where a.id = v_id;

    if v_professor is not null then
      perform pg_advisory_xact_lock(hashtextextended('horario:' || v_professor::text, 0));

      if exists (
        select 1
          from public.alunos o
         where o.professor_id = v_professor
           and o.id <> v_id
           and not o.arquivado
           and o.agendada ->> 'dia'  = p_aluno -> 'agendada' ->> 'dia'
           and o.agendada ->> 'hora' = p_aluno -> 'agendada' ->> 'hora'
      ) then
        raise exception 'horario_ocupado'
          using hint = 'Outro aluno já tem reposição neste horário.';
      end if;
    end if;
  end if;

  -- Só as colunas que um movimento muda. Cadastro (nome, dia, telefone…), pausa
  -- manual, arquivo, lembretes e disponibilidade são gravados direto pelo app
  -- (Parte 4) e ficam de fora, para um movimento não desfazer o que outro
  -- aparelho editou. `pausado` entra porque receber o pagamento tira a pausa.
  -- A lista é a de CAMPOS_DO_MOVIMENTO em conversor.ts, e um teste do app
  -- confere que as duas batem.
  update public.alunos a set
    total                   = n.total,
    usadas                  = n.usadas,
    validade                = n.validade,
    validade_estendida      = n.validade_estendida,
    sem_pacote              = n.sem_pacote,
    encerrado               = n.encerrado,
    valor_por_aula_centavos = n.valor_por_aula_centavos,
    reposicoes              = n.reposicoes,
    pendencia_origem        = n.pendencia_origem,
    agendada                = n.agendada,
    pausado                 = n.pausado,
    pagamento_status        = n.pagamento_status,
    pagamento_em            = n.pagamento_em,
    pagamento_meio          = n.pagamento_meio,
    pagamento_vencimento    = n.pagamento_vencimento,
    versao                  = a.versao + 1
  from jsonb_populate_record(null::public.alunos, p_aluno) n
  where a.id = v_id and a.versao = p_versao
  returning a.versao into v_nova;

  if v_nova is null then
    raise exception 'conflito_de_versao'
      using hint = 'Este aluno mudou em outro aparelho. Recarregue.';
  end if;

  -- O professor e o aluno saem da linha que acabou de ser gravada, não do que o
  -- app mandou: o lançamento não tem como cair no extrato de outro.
  if p_lancamento is not null then
    insert into public.lancamentos
      (aluno_id, professor_id, tipo, data, titulo, subtitulo, delta, saldo_depois, dinheiro)
    select v_id, a.professor_id, l.tipo, l.data, l.titulo, coalesce(l.subtitulo, ''),
           l.delta, l.saldo_depois, coalesce(l.dinheiro, false)
    from jsonb_populate_record(null::public.lancamentos, p_lancamento) l, public.alunos a
    where a.id = v_id;
  end if;

  -- A proposta. `p_proposta ->> 'status'` diz o que fazer:
  --   'enviada' → uma proposta nova. A aberta, se houver, é fechada antes como
  --               'recusada', porque o índice uma_proposta_aberta só deixa uma.
  --   outro     → a aberta é fechada com esse status: a resposta do aluno
  --               ('aceita', 'recusada'), a confirmação do professor, ou a
  --               reposição marcada direto, que encerra a proposta sem aceite.
  --               Sem proposta aberta, não há o que fechar, e não é erro.
  if p_proposta is not null then
    update public.propostas
       set status = case when p_proposta ->> 'status' = 'enviada'
                         then 'recusada'::public.status_proposta
                         else (p_proposta ->> 'status')::public.status_proposta end,
           respondida_em = now()
     where aluno_id = v_id and status = 'enviada';

    if p_proposta ->> 'status' = 'enviada' then
      insert into public.propostas (aluno_id, professor_id, janela, alternativas, status, enviada_em)
      select v_id, a.professor_id, p_proposta -> 'janela',
             coalesce(p_proposta -> 'alternativas', '[]'::jsonb), 'enviada',
             (p_proposta ->> 'enviada_em')::date
      from public.alunos a
      where a.id = v_id;
    end if;
  end if;

  return v_nova;
end $$;
