-- 0001_esquema.sql — esquema do Aula em Dia
--
-- Extraído de docs/backend/PLANO-BACKEND.md (Parte 2), que segue sendo a explicação
-- de cada decisão. Este arquivo é o que roda; o markdown é o que argumenta.
--
-- Os enums de faixa_de_alunos usam travessão (–, U+2013) para casar com
-- mobile/src/dominio/tipos.ts. Este arquivo TEM de ficar em UTF-8.
--
-- Colunas deliberadamente ausentes de `alunos`, porque são derivadas e não guardadas:
--   `hoje` (vem de dominio/datas.ts) e `pendencia.dias` (calculado de pendencia_origem).

create type faixa_de_alunos  as enum ('1–5', '6–15', '16+');
create type plano            as enum ('gratuito', 'pago');
create type status_pagamento as enum ('pago', 'aberto', 'atraso', 'sem');
create type status_proposta  as enum ('enviada', 'aceita', 'recusada', 'confirmadaPeloProfessor');
create type tipo_lancamento  as enum (
  'aula', 'falta_avisada', 'falta_sem_aviso', 'cancelada_professor',
  'reposicao', 'pagamento', 'pacote', 'validade', 'proposta', 'legado'
);

create table public.professores (
  id                 uuid primary key references auth.users on delete cascade,
  nome               text not null default '',
  iniciais           text not null default '',
  email              text not null,
  disciplinas        text[] not null default '{}',
  faixa_de_alunos    faixa_de_alunos,
  chave_pix          text,
  plano              plano not null default 'gratuito',
  pacote_padrao      jsonb,
  preferencias_aviso jsonb,
  criado_em          timestamptz not null default now()
);

create table public.politicas (
  professor_id      uuid primary key references public.professores on delete cascade,
  aviso_horas       int  not null default 24 check (aviso_horas >= 0),
  avisada_devolve   bool not null default true,
  limite_reposicoes int  not null default 3  check (limite_reposicoes >= 0),
  validade_dias     int  not null default 60 check (validade_dias >= 0)
);

create table public.disponibilidades (
  professor_id           uuid primary key references public.professores on delete cascade,
  blocos                 jsonb not null default '[]',
  aceita_fora_dos_blocos bool  not null default false,
  sugere_sabado          bool  not null default false,
  folgas                 jsonb not null default '[]'
);

create table public.alunos (
  id                      uuid primary key default gen_random_uuid(),
  professor_id            uuid not null default auth.uid() references public.professores on delete cascade,
  nome                    text not null,
  disciplina              text not null,
  dia                     text not null,
  hora                    text not null,
  telefone                text,
  email                   text,
  -- pacote
  total                   int  not null default 0 check (total >= 0),
  usadas                  int  not null default 0 check (usadas >= 0),
  validade                date,
  validade_estendida      bool not null default false,
  sem_pacote              bool not null default false,
  encerrado               date,
  valor_por_aula_centavos int  check (valor_por_aula_centavos >= 0),
  -- reposição
  reposicoes              int  not null default 0,
  pendencia_origem        date,
  agendada                jsonb,
  disponibilidade         jsonb,
  -- cobrança
  pausado                 bool not null default false,
  lembretes               int  not null default 0,
  ultimo_lembrete         date,
  atrasos_historicos      int  not null default 0,
  pagamento_status        status_pagamento not null default 'sem',
  pagamento_em            date,
  pagamento_meio          text,
  pagamento_vencimento    date,
  -- controle
  arquivado               bool not null default false,
  token_publico           uuid not null unique default gen_random_uuid(),
  versao                  int  not null default 0,
  criado_em               timestamptz not null default now(),
  constraint saldo_nao_negativo check (usadas <= total)
);

create table public.lancamentos (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references public.alunos on delete cascade,
  professor_id  uuid not null references public.professores on delete cascade,
  tipo          tipo_lancamento not null,
  data          date not null,
  titulo        text not null,
  subtitulo     text not null default '',
  delta         int  not null,
  saldo_depois  int  not null check (saldo_depois >= 0),
  dinheiro      bool not null default false,
  criado_em     timestamptz not null default now()
);
create index lancamentos_do_aluno on public.lancamentos (aluno_id, criado_em desc);

create table public.propostas (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references public.alunos on delete cascade,
  professor_id  uuid not null references public.professores on delete cascade,
  janela        jsonb not null,
  alternativas  jsonb not null default '[]',
  status        status_proposta not null default 'enviada',
  enviada_em    date not null,
  respondida_em timestamptz
);
-- no máximo uma proposta aberta por aluno, como no app
create unique index uma_proposta_aberta on public.propostas (aluno_id) where status = 'enviada';
