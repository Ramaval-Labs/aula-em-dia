-- 0003_novo_professor.sql — o professor nasce junto com o login (Parte 3)
--
-- Extraído de docs/backend/PLANO-BACKEND.md (Parte 3). Quando o Supabase Auth
-- cria um usuário (o `signUp` do app), este trigger cria as três linhas que o
-- app precisa para funcionar: o perfil, a política e a disponibilidade, com
-- os padrões das próprias tabelas.
--
-- `security definer` porque quem insere em auth.users é o serviço de Auth, que
-- não tem permissão nas tabelas de public; `search_path = ''` obriga a
-- qualificar cada nome e fecha a porta para um objeto homônimo em outro schema.
--
-- `coalesce` no e-mail: professores.email é not null, e um usuário criado sem
-- e-mail (por telefone, ou anônimo) faria o cadastro inteiro falhar aqui.
--
-- O seed.sql convive com isto: ele insere o usuário de teste, o trigger cria as
-- três linhas, e o seed grava o perfil por cima com `on conflict ... do update`
-- (Parte 2, decisão 7).

create function public.criar_professor() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.professores (id, email) values (new.id, coalesce(new.email, ''));
  insert into public.politicas (professor_id) values (new.id);
  insert into public.disponibilidades (professor_id) values (new.id);
  return new;
end $$;

create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_professor();
