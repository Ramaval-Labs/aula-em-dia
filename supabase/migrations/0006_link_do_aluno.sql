-- 0006_link_do_aluno.sql — "Gerar novo link" (Parte 6, SCRUM-22)
--
-- O link do aluno é `/a/<token_publico>`. O token nasce com o aluno (0001) e
-- não vence (PO, 26/10): ele é revogado por esta função, que o troca por um
-- novo. O link anterior para de funcionar na hora, porque a Edge Function
-- `aluno-publico` só acha o aluno pelo token atual.
--
-- `security invoker`, como a `aplicar_movimento`: a RLS da 0002 vale aqui
-- dentro, então só o dono do aluno troca o token. O aluno de outro professor
-- é invisível, o `update` não acha linha, e a função responde
-- `aluno_nao_encontrado` sem dizer se ele existe.
--
-- Não mexe na `versao`: o token não é dado que um movimento grave, e trocar o
-- link não pode fazer o outro aparelho do professor dar conflito.

create function public.novo_link_do_aluno(p_aluno uuid) returns uuid
language plpgsql
security invoker
set search_path = '' as $$
declare
  v_token uuid;
begin
  update public.alunos
     set token_publico = gen_random_uuid()
   where id = p_aluno
  returning token_publico into v_token;

  if v_token is null then
    raise exception 'aluno_nao_encontrado';
  end if;

  return v_token;
end $$;

-- Só quem tem login chama, como na 0005. A Edge Function não precisa desta:
-- o aluno lê pelo token, não o troca.
revoke execute on function public.novo_link_do_aluno(uuid) from public, anon;
grant execute on function public.novo_link_do_aluno(uuid) to authenticated;
