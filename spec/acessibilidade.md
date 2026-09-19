# Acessibilidade

## Contraste (medido nos tokens iOS Glass, `tokens/tokens.json`)

Como foi medido: WCAG 2.x, com o vidro composto por alfa sobre o fundo de refração — a cor
`tela` e cada uma das quatro manchas na opacidade do fundo (0.85 claro, 0.60 escuro). A faixa
é pior–melhor caso entre as manchas. O desfoque e o `brightness()` do material não entram na
conta; no aparelho eles clareiam um pouco o miolo (ajudam no claro, atrapalham no escuro).

| par | claro | escuro | uso |
|---|---|---|---|
| `tinta` sobre o fundo | 10.0–16.1 | 13.2–18.6 | título grande |
| `tinta` sobre `cartao` | 14.4–17.5 | 14.1–16.7 | texto de leitura |
| `tinta2` sobre `cartao` | 6.6–7.3 | 9.1–10.5 | apoio, sub-linha |
| `tinta3` sobre `cartao` | 4.8–5.1 | 6.6–7.4 | legenda, cabeçalho de grupo, chevron |
| `tinta2` sobre `sheet` | 6.6–7.2 | 9.6–10.7 | sub-linha do sheet |
| `tinta` sobre `vidro` (barra, toast) | 14.0–17.4 | 12.8–15.9 | título da barra, toast |
| `tint` sobre `cartao` | 5.7–7.0 | 7.9–9.3 | voltar, "Cancelar", links, saldo |
| `sobreTint` sobre `tint` | 7.5 | 9.5 | botão primário, avatar de perfil |
| `vermelhoTexto` sobre `cartao` | 7.1–8.6 | 6.1–7.2 | valor em atraso, delta negativo, erro de campo |
| `verdeTexto` sobre `cartao` | 6.7–8.1 | 8.1–9.6 | valor recebido, delta de devolução |
| `ambarTexto` sobre `cartao` | 6.5–7.9 | 9.5–11.2 | saldo baixo, "A receber" |
| `vermelhoTexto` sobre `vermelhoSuave` | 5.9–7.2 | 4.9–5.8 | título de bloco e faixa de atraso |
| `verdeTexto` sobre `verdeSuave` | 5.8–6.9 | 5.9–7.2 | título de bloco e faixa "marcada" |
| `ambarTexto` sobre `ambarSuave` | 5.8–6.9 | 6.5–7.9 | título de bloco e faixa "pendente" |
| `tint` sobre `tintSuave` | 4.7–5.7 | 5.1–6.1 | bloco tint, selo "MELHOR" |
| `tinta2` sobre qualquer `*Suave` | 5.9–6.9 | 6.3–8.8 | texto dos blocos de status |
| `tinta3` sobre `preenchimento2` | 4.4–4.7 | 4.7–5.4 | botão desabilitado |
| `sobreCor` sobre `vermelho` | 4.8 | 6.2 | glifo do ícone de bloco |
| `sobreCor` sobre `verde` | 4.3 | 9.8 | check da medalha do Resultado |
| `sobreCor` sobre `ambar` | 3.4 | 11.4 | glifo do ícone de bloco âmbar |

Leitura:
- **Texto de leitura passa folgado** nos dois temas (`tinta`, `tinta2`, `tint`, `sobreTint`).
  `tinta3` fica entre 4.4 e 5.1 no claro: serve para legenda e rótulo, não para informação que
  só existe ali.
- **Status como texto usa os tokens `*Texto`** (`ambarTexto`, `verdeTexto`, `vermelhoTexto`).
  As cores cheias do handoff (`#C07C00`, `#158A61`, `#DE203A`) ficam em 1.8–2.4:1 no claro
  sobre o próprio `*Suave` com as manchas por trás, então só pintam barra, medidor,
  preenchimento e ícone. Os tokens de texto são a mesma matiz escurecida até o **pior caso**
  passar 4.5:1: o `*Suave` composto direto sobre o fundo de refração, amostrado na área visível
  (a conta está no comentário de `CORES`, em `tokens.ts`). No escuro âmbar e verde de texto são
  as próprias cores cheias; o vermelho clareia um degrau (`#FF7A8A`), porque o `#FF5F72` fica em
  3.9:1 sobre o `vermelhoSuave` no pior caso.
- **Status nunca é só cor:** toda faixa e todo bloco têm texto; o título do bloco repete o que a
  cor diz.
- **Glifo sobre cor cheia (`sobreCor`)** é branco no claro e `#0B1524` (o `sobreTint`) no
  escuro: o branco do handoff ficava em 1.6–1.9:1 sobre verde e âmbar claros.

## Alvos de toque
- Botão primário 54px, secundário 52, compacto 50, texto 46. Botão inline (40), segmento
  (34/36/30), switch (32), stepper (34) e ficha (36) recebem `hitSlop` até 44px. O botão do
  stepper (38 de largura) ganha 3px de cada lado, que cabem no padding do trilho e no vão até o
  valor.
- Grade semanal: célula ≥ 44px de largura em 360dp (conta em `GradeSemanal.tsx`).
- Aba da tab bar: item de 56px de altura, acima dos 48 exigidos.
- Botão voltar: 44px de altura, com o rótulo tocável.
- Linha de lista inteira é tocável (mínimo 58–76px); `AcaoDoCampo` ocupa 44px do trilho.

## Leitores de tela
- Tab bar: `tablist`, cada aba `tab` com `selected`; o rótulo é sempre visível.
- Sheet: `accessibilityViewIsModal` no painel (iOS) e, nos dois sistemas, a tela de fundo
  com `importantForAccessibility="no-hide-descendants"` e `accessibilityElementsHidden`. Ao
  abrir, o foco vai para o título do painel. "Cancelar", o toque fora do painel e o voltar do
  Android fecham.
- Saldo: anunciado por inteiro ("4 aulas restantes de 6"), não só "4".
- Medidor do pacote e dos passos, avatares e ícones são **decorativos** (ocultos).
- Faixa de status: entra no rótulo da linha do aluno ("Valentin Klein, Atraso de 12 dias…").
- Delta do extrato (`−1`, `+6`, `✓`): `deltaEmPalavras` ("1 aula debitada", "pagamento
  recebido") — cor não é o único sinal.
- Stepper: um controle `adjustable` com `accessibilityValue` e as ações `increment`/`decrement`;
  o valor falado sai de `rotuloDoValor` ("sem limite" no lugar de "—").
- Toast, `NotaDoBotao`, erro de campo e o aviso de impacto da Política (`BlocoStatus vivo`):
  live region educada no Android e `announceForAccessibility` no iOS, onde a live region não
  existe (`componentes/anunciar.ts`).
- Cartão de escolha: o rádio é só a linha do título; o sub-controle (antecedência do aviso) é
  irmão dele, alcançável pelo leitor de tela.
- Segmentado: grupo de rádios; ficha de escolha: caixa de seleção; switch: `switch` com estado.

## Preferências do sistema
- Texto dinâmico: o app escala com a preferência do sistema. Só têm teto (`ESCALA_FONTE`) o
  rótulo de aba, a faixa de status e o selo (1,3) e os rótulos de controle — segmento, botões,
  "Cancelar" e título do sheet (1,6). Faixa, selo e botão primário crescem em altura em vez de
  cortar, e o primário aceita duas linhas.
- `prefers-color-scheme` na primeira carga; a escolha manual em Ajustes vence depois.
- Reduzir movimento (`tema/movimento.ts`): sheet, barra de navegação, switch e toast mudam sem
  transição.
- Aumento de fonte: nenhum cartão tem altura fixa; linhas usam altura **mínima**.
