-- 0009_aula_fixa.sql — a aula fixa estruturada (SCRUM-89)
--
-- O horário fixo do aluno nasceu como texto livre em `dia` e `hora` ("terça e
-- quinta", "18h"), e o motor de reposição o lia por palavra-chave. O SCRUM-31
-- deu ao domínio a estrutura `{ dias, hora }` (`mobile/src/dominio/aulaFixa.ts`),
-- e esta coluna a guarda: `{"dias": ["ter", "qui"], "hora": 18}`.
--
-- **Nula, e sem backfill.** A linha antiga fica com `aula_fixa` nula, e o app
-- lê o horário do texto (`aulaFixaDe`) até o professor salvar o aluno de novo.
-- Interpretar "terça e quinta" aqui em SQL seria um segundo leitor do texto,
-- fora do domínio, e iria divergir do `lerAulaFixa`.
--
-- **`dia` e `hora` ficam.** A lista e a página do aluno mostram o texto, que
-- passa a ser gerado da estrutura (`rotuloDaAulaFixa`) na hora de salvar.
--
-- O `check` recusa o que o domínio não sabe ler:
--   - um objeto, com as duas chaves;
--   - `dias`: um array só com as chaves de `DiaDaSemana` (`<@` confere cada
--     elemento contra a lista); vazio é "sem horário fixo";
--   - `hora`: `null`, ou um inteiro de 0 a 23 (a hora cheia do começo).
-- O `case` garante a ordem: só converte `hora` em número depois de saber que é
-- um número.
--
-- A RPC `aplicar_movimento` não muda: ela grava só os campos do movimento, e o
-- horário fixo não é um deles. Quem grava a coluna é o insert do aluno novo e
-- o update da ficha.

alter table public.alunos add column aula_fixa jsonb;

alter table public.alunos add constraint aula_fixa_valida check (
  aula_fixa is null
  or case
    when jsonb_typeof(aula_fixa) <> 'object' then false
    when not (aula_fixa ? 'dias' and aula_fixa ? 'hora') then false
    when jsonb_typeof(aula_fixa -> 'dias') <> 'array' then false
    when not (aula_fixa -> 'dias' <@ '["seg", "ter", "qua", "qui", "sex", "sab", "dom"]'::jsonb) then false
    when jsonb_typeof(aula_fixa -> 'hora') = 'null' then true
    when jsonb_typeof(aula_fixa -> 'hora') <> 'number' then false
    else (aula_fixa ->> 'hora')::numeric between 0 and 23
         and (aula_fixa ->> 'hora')::numeric = trunc((aula_fixa ->> 'hora')::numeric)
  end
);
