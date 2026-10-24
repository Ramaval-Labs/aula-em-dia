-- 0005_aplicar_movimento.sql — aluno e lançamento juntos, ou nada (Parte 5)
--
-- Extraído de docs/backend/PLANO-BACKEND.md (Parte 5), com o ramo da proposta,
-- que lá era um stub, escrito aqui. As decisões estão na Parte 5 do plano.
--
-- O supabase-js não abre transação pelo cliente: a transação é esta função.
-- Registrar aula, falta, reposição, pagamento, pacote e proposta passam por ela.
-- Ela NÃO calcula regra (decisão D3). Grava o que `dominio/politica.ts` e
-- `dominio/pacote.ts` já calcularam no app. Se ela recalculasse, haveria duas
-- verdades.
--
-- Trava otimista: o app manda a `versao` que leu. Se outro aparelho gravou o
-- aluno antes, o `update` não acha a linha e a função levanta
-- `conflito_de_versao`. O app avisa e recarrega, em vez de sobrescrever.
--
-- `security invoker`: a RLS da 0002 continua valendo aqui dentro. O aluno de
-- outro professor é invisível, e o `update` dele também não acha linha. A
-- função não tem como saber qual das duas coisas aconteceu, e responde
-- `conflito_de_versao` nos dois casos: em nenhum deles nada foi gravado.

create function public.aplicar_movimento(
  p_aluno      jsonb,             -- o aluno inteiro, convertido por mobile/src/dados/conversor.ts
  p_versao     int,               -- a versão que o app leu
  p_lancamento jsonb default null,
  p_proposta   jsonb default null
) returns int                     -- a nova versão
language plpgsql
security invoker
set search_path = '' as $$
declare
  v_id   uuid := (p_aluno ->> 'id')::uuid;
  v_nova int;
begin
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

-- Só quem tem login chama. Sem isto, o `execute` vem do grant padrão a PUBLIC.
-- A RLS já devolveria conflito para quem não tem login, mas assim a porta nem
-- abre.
revoke execute on function public.aplicar_movimento(jsonb, int, jsonb, jsonb) from public, anon;
grant execute on function public.aplicar_movimento(jsonb, int, jsonb, jsonb) to authenticated;
