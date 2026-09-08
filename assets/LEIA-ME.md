# Assets

## Curvas
- `curva-cabecalho.svg` — transição cabeçalho escuro → conteúdo.
  `viewBox="0 0 390 80"`, `preserveAspectRatio="none"`. O `fill` é a cor do **conteúdo**
  (`var(--tela)`, ou `var(--cartao)` na tela de resultado). Posicionar absoluto no rodapé do
  cabeçalho: `left:0; right:0; bottom:-1px; width:100%; height:80px`.
  O cabeçalho leva `padding-bottom: 64px` para o texto não encostar na curva.
- `curva-navbar.svg` — transição conteúdo → navbar.
  `viewBox="0 0 390 60"`, `fill: var(--topo)`. Vai dentro de uma faixa de **58px** de altura
  com `overflow:hidden` que **ocupa espaço no fluxo** (não é overlay) — assim nunca cobre o
  botão primário das telas de tarefa.

Nos dois casos: mesma direção (baixa à esquerda, reta no meio, subindo à direita),
`preserveAspectRatio="none"` para esticar em qualquer largura, e `aria-hidden="true"`.

## Ícones da navbar
`icone-alunos.svg`, `icone-financeiro.svg`, `icone-ajustes.svg` —
24 × 24, `stroke: currentColor`, largura 1.8, cantos round. Renderizar a 19 × 19.
Ativo: `#FFD032`. Inativo: `var(--elevado-suave)`.

## Marca
Wordmark tipográfico (Satoshi 600) + quatro barras verticais de 3 × 18px com `gap: 3px`:
as três primeiras em `var(--texto)`, a quarta em `#FFD032`.
