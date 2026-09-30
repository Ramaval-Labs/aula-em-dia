# supabase/

O banco do Aula em Dia. As migrações aqui são o que roda;
[`docs/backend/PLANO-BACKEND.md`](../docs/backend/PLANO-BACKEND.md) é o que argumenta cada
decisão (9 ADRs, comparativo de alternativas, riscos).

| Arquivo | O que é |
|---|---|
| `migrations/0001_esquema.sql` | 5 enums, 6 tabelas, 2 índices |
| `migrations/0002_rls.sql` | RLS nas 6 tabelas, com política em todas |

## Primeira vez

O `config.toml` **não está versionado ainda** porque quem roda o CLI é que o gera. Rodar:

```bash
npx supabase init     # cria supabase/config.toml — NÃO apaga as migrações que já estão aqui
npx supabase start    # sobe Postgres + Studio local (precisa de Docker Desktop rodando)
npx supabase db reset # aplica 0001 e depois 0002
```

**Docker Desktop é pré-requisito** do `supabase start` e não estava declarado em lugar nenhum
do repositório até agora. Sem ele o comando falha no primeiro passo.

Depois de `init`, comite o `config.toml`: ele fixa portas e versão do Postgres para as três
pessoas.

## Como conferir que a RLS entrou inteira

Este é o teste que importa, porque a falha é silenciosa — com RLS ligada e sem política, o
`select` volta vazio e o `update` não afeta linha nenhuma, **sem erro**:

```sql
select tablename, policyname, cmd from pg_policies where schemaname = 'public'
order by tablename;
```

Tem de aparecer política para **todas as seis** tabelas: `alunos`, `disponibilidades`,
`lancamentos` (duas — select e insert), `politicas`, `professores`, `propostas`.

O plano original trazia só três escritas e um comentário no lugar das outras. As de
`politicas`, `disponibilidades` e `propostas` foram escritas seguindo o mesmo padrão; está
registrado no cabeçalho do `0002_rls.sql`.

## O que falta, e é decisão de quem for fazer a Parte 2

### 1. O professor de teste (bloqueia o seed)

`alunos.professor_id` tem `default auth.uid()` e FK até `auth.users`. Um `seed.sql` rodando
**sem contexto de auth** recebe `null` no default e viola o `not null`. O trigger que cria a
linha de `professores` só chega na Parte 3, então a Parte 2 isolada não tem caminho definido
para inserir uma linha sequer.

O caminho: inserir `auth.users` e `professores` explicitamente no seed, com uuid fixo, sem
depender do default nem do trigger. Proposta para o time confirmar — vale **só no banco
local**, nunca em produção:

```
uuid  00000000-0000-4000-8000-000000000001
email professor@exemplo.test
senha aulaemdia-local
```

### 2. `seed.sql` e `scripts/gerar-seed-sql.mjs`

Nenhum dos dois existe. O plano (Parte 2) diz que o seed é **gerado** de
[`data/seed.json`](../data/seed.json), que segue sendo a fonte. Quatro decisões que o gerador
vai ter de tomar e que não estão escritas em lugar nenhum:

- **Título → `tipo_lancamento`.** O enum tem 10 valores; o `seed.json` tem 6 títulos livres
  ("Aula realizada", "Falta avisada", "Falta sem aviso", "Reposição realizada", "Pacote de 6
  aulas", "Pacote de 8 aulas"). A tabela de conversão não existe.
- **Ano nas datas.** `"26/08"` → `date` precisa de ano. A regra existe (`ANO_DEMO` em
  `mobile/src/dominio/datas.ts`), mas o plano só a enuncia para o adaptador do app.
- **`validade: ""`.** O plano cobre `'sem prazo' → null`, mas `criarAluno` grava string vazia
  e o aluno `bea` não tem validade. O caso da string vazia não está tratado.
- **`perfil` e `disponibilidade` não vêm do JSON.** Nascem em
  `mobile/src/dados/semente.ts` (`PERFIL_PADRAO`, `DISPONIBILIDADE_PADRAO`). O gerador precisa
  ler os dois arquivos, não só o `seed.json`.

### 3. A RPC `aplicar_movimento` (Parte 5)

Está no plano (L546–592) com o **ramo da proposta como stub literal** (`-- detalhado na
implementação` seguido de `null;`). Não foi trazida para cá porque não está pronta: virar
migração agora seria versionar um stub.

## Divergência conhecida no plano

O diagrama ER do `PLANO-BACKEND.md` lista ~16 colunas de `alunos`; o DDL tem **31**. **O DDL é
o autoritativo** — o diagrama omite `telefone`, `email`, `validade_estendida`, `sem_pacote`,
`encerrado`, `valor_por_aula_centavos`, `reposicoes`, `disponibilidade`, `pausado`, `lembretes`,
`ultimo_lembrete`, `atrasos_historicos`, `pagamento_em`, `pagamento_meio`, `arquivado` e
`criado_em`. Em `propostas`, o diagrama não tem `professor_id` nem `respondida_em`; o DDL tem.
