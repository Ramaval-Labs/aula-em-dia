# Redesign iOS Glass — relatório final — 2026-09-19

Branch `redesign/ios-glass` · partiu da `main` em `a004f01` (depois de mesclar a rodada `/designer`
de 11/09) · plano em `docs/design/redesign-ios-glass/PLANO.md` · contrato das telas em
`MAPA-DE-TELAS.md`.

## Resumo

A direção *tinta chapada* (curvas, cabeçalho escuro, amarelo `#FFD032`, pílula sem desfoque) foi
substituída pela *iOS Glass* nas **35 telas**, nos temas claro e escuro. As 9 telas desenhadas pelo
handoff seguem as medidas dele; as outras 26 foram derivadas do mesmo catálogo. O sistema antigo
foi apagado do código, e um teste impede que volte. 303 testes verdes, typecheck limpo.

## Ondas

| Onda | O que fez | Quem |
|---|---|---|
| 0 | handoff novo no repositório, antigo para `docs/design/historico/`, regras do `CLAUDE.md`, `PRODUCT.md`, `/designer` e revisor reescritas, mapa das 35 telas, 3 agentes novos | sessão principal |
| 1 | `expo-blur`, tokens iOS Glass ao lado dos antigos, `FundoRefracao`, `SuperficieVidro` com fallback por plataforma, catálogo de desenvolvimento | `construtor-vidro` |
| 2 | chassi (`TelaVidro`, barra com a rolagem, voltar), `TabBar`, `Sheet`, `Toast`, navegação com sheets (`TIPO_DA_TELA`, `fecharSheet`) · catálogo de componentes | 2 × `construtor-vidro` em paralelo |
| 3 | migração das 35 telas em 5 fatias (Alunos, registro e reposição, Financeiro, Ajustes, entrada) | 5 × `migrador-telas` em worktrees |
| 4 | merges, peças repetidas unificadas, defeitos do catálogo, tokens que faltaram, legado apagado, testes de legado e montagem, `DESIGN.md` regravado do código | `integrador-redesign` + `impeccable-documenter` |
| 5 | revisão das 35 telas (3 revisores) e correção dos 23 achados P0/P1 | 3 × `revisor-design` + `construtor-vidro` |

O Checkpoint 1 (vidro no aparelho) foi pulado a pedido da pessoa: o blur segue o padrão de
`blurLigado()` — iOS e web sempre, Android 12+ na tab bar e no painel do sheet, fallback no resto.

## Revisão final (Onda 5)

Notas antes da correção: audit 13/20 nas três fatias; critique 26–29/40. As 9 telas do handoff
bateram com as medidas do protótipo; os problemas estavam em componentes compartilhados.

| Grupo | Corrigido |
|---|---|
| Contraste | tokens `ambarTexto`/`verdeTexto`/`vermelhoTexto` (≥ 4.5:1 no pior caso das manchas) e `sobreCor` escuro `#0B1524` |
| Acessibilidade | antecedência do Registrar alcançável pelo VoiceOver; sheet modal nos dois sistemas com foco no título; toast, nota do botão e erro de campo anunciados no iOS; stepper `adjustable` com alvo de 44; grade semanal ≥ 44 em 360dp |
| Vidro | um nível de desfoque por camada (`ContextoDeVidro`), `semDesfoque` nos controles pequenos, desabilitado por cor e não por opacidade |
| Teclado e toast | painel do sheet limitado pelo teclado com o rodapé acima dele; `padding` no Android; toast acima do rodapé do sheet e da tab bar |
| Escala de fonte | `ESCALA_FONTE`, `minHeight` em faixa, selo e primário; primário em até 2 linhas |
| Telas | Resultado lê o efeito do próprio registro (`geraReposicao()` no domínio, com teste); plurais; aviso de impacto com todos os campos; "Criar pacote"; Chave Pix pelo pagamento volta à origem; toasts que não mentem nem pedem ação; valor compacto no Financeiro; Registrar sempre com rodapé; `app.json` sem o azul-marinho antigo |

## Tokens que divergem do handoff (por contraste)

| token | claro | escuro | handoff |
|---|---|---|---|
| `ambarTexto` | `#6C4500` | `#FFC24D` | texto em `--ambar` `#C07C00` |
| `verdeTexto` | `#0D563C` | `#33D69F` | texto em `--verde` `#158A61` |
| `vermelhoTexto` | `#8E1425` | `#FF7A8A` | texto em `--verm` `#DE203A` / `#FF5F72` |
| `sobreCor` | `#FFFFFF` | `#0B1524` | glifo branco |

No claro, o âmbar de texto fica visivelmente mais escuro que o do protótipo (quase marrom). É o
preço de passar 4.5:1 com o bloco de status direto sobre as manchas.

## Mudanças de comportamento para revisar

Registradas em `mobile/README.md` → "Onde a implementação diverge do protótipo":
- Resultado: "Fechar" volta para a tela de origem (antes ia sempre para Alunos).
- Prévia da proposta vista pelo aluno: tocar numa alternativa seleciona; o primário confirma.
- Ajustes: saiu o "Zerar dados de demonstração" (andaime de protótipo no handoff).
- Lembrete: saiu "Agendar para amanhã, 9h" (a função não existia).
- Confirmar reposição: "Trocar o horário" volta sempre às sugestões.
- Pagamento aberto da Cobrança conclui voltando à Cobrança.
- "Agosto de 2025": o ano de demonstração é 2025 porque os dias da semana da semente só batem com
  2025; o "2026" do protótipo é que está inconsistente.

## Não verificado

- **Nada foi visto em aparelho.** Blur no iOS e no Android, teclado nos sheets, anúncios do
  VoiceOver/TalkBack e escala de fonte foram conferidos só por código e Expo Web.

## Backlog

`PROXIMOS-PASSOS.md` → "Depois do redesign iOS Glass": resumo do mês no domínio com filtro por
mês, validação do valor por aula, "Marcar folga", saída animada e arrastar-para-fechar do sheet,
`useNativeDriver`, brilho da aba sem `filter` no iOS, 48dp no Android, props novas em
`spec/componentes.md`, ícone do app, e os P2/P3 da revisão.

## Verificação

- testes: 303 passaram · typecheck: ok
- capturas (fora do git): `docs/design/revisoes/capturas/redesign-antes/` (74),
  `redesign-integrado/` (70), `redesign-final/` (34)
