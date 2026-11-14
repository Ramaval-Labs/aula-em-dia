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

-- ── os dois agendamentos ─────────────────────────────────────────────────────
-- O `pg_cron` chama a função `avisos` pelo `pg_net`. O endereço e o segredo
-- moram no Vault, não aqui: a migração vai para o git, e o segredo não. Em cada
-- ambiente, uma vez (ver `supabase/README.md`):
--
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/avisos', 'avisos_url');
--   select vault.create_secret('<o mesmo AVISOS_SEGREDO da função>', 'avisos_segredo');
--
-- Sem os dois, a `chamar_avisos` não faz nada: os agendamentos rodam no banco
-- local e no CI sem chamar ninguém. Na nuvem, sem token gravado (SCRUM-93),
-- a função roda e não manda nada.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.chamar_avisos(p_tipo text)
returns bigint                    -- o id do pedido no pg_net, ou null sem o Vault
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url     text;
  v_segredo text;
begin
  if p_tipo not in ('resumo', 'aula') then
    raise exception 'tipo de aviso desconhecido: %', p_tipo;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'avisos_url';
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'avisos_segredo';
  if v_url is null or v_segredo is null then
    return null;
  end if;

  return net.http_post(
    url                  := v_url || '?tipo=' || p_tipo,
    headers              := jsonb_build_object(
                              'Authorization', 'Bearer ' || v_segredo,
                              'Content-Type', 'application/json'),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

-- Só o agendador (o postgres) chama: lê o segredo do Vault.
revoke execute on function public.chamar_avisos(text) from public, anon, authenticated;

-- O resumo às 10:00 UTC, que é 7h em Brasília (UTC−3 o ano todo). O aviso da
-- aula de hora em hora, no minuto 0: às 17h saem os das aulas das 18h. O
-- `cron.schedule` com nome substitui o agendamento de mesmo nome.
select cron.schedule('avisos-resumo', '0 10 * * *', $$select public.chamar_avisos('resumo')$$);
select cron.schedule('avisos-aula', '0 * * * *', $$select public.chamar_avisos('aula')$$);
