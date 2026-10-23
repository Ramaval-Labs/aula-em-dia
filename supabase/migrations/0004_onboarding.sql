-- 0004_onboarding.sql — o banco lembra se o professor terminou o onboarding (Parte 4)
--
-- O "O que fica em aberto" da Parte 3: no modo supabase, quem fecha o app no meio
-- do onboarding tem sessão, mas o onboarding não deixava marca no banco, e ao
-- reabrir a pessoa caía direto no app, sem perfil nem política. Com a coluna, a
-- sessão (mobile/src/estado/sessao.ts) manda de volta para o passo 1 quem ainda
-- não terminou, e o último passo grava `true`. A decisão está em
-- docs/backend/PLANO-BACKEND.md, Parte 4.
--
-- O padrão é `false` porque o trigger da 0003 cria o professor no cadastro, antes
-- do primeiro passo.

alter table public.professores
  add column onboarding_concluido bool not null default false;

-- Quem já existia quando a coluna nasceu já tinha passado pelo app: sem isto, o
-- próximo login de cada um voltaria para o onboarding.
update public.professores set onboarding_concluido = true;
