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
| `vermelho` sobre `cartao` | 3.7–4.5 | 5.2–6.1 | valor em atraso (800, ≥15px) |
| `verde` sobre `cartao` | 3.3–4.1 | 8.1–9.6 | valor recebido (800, ≥15px) |
| `ambar` sobre `cartao` | **2.6–3.2** | 9.5–11.2 | saldo baixo, "A receber" |
| `vermelho` sobre `vermelhoSuave` | 3.1–3.7 | 4.1–5.0 | título de bloco e faixa de atraso |
| `verde` sobre `verdeSuave` | 2.9–3.5 | 5.9–7.2 | título de bloco e faixa "marcada" |
| `ambar` sobre `ambarSuave` | **2.4–2.8** | 6.5–7.9 | título de bloco e faixa "pendente" |
| `tint` sobre `tintSuave` | 4.7–5.7 | 5.1–6.1 | bloco tint, selo "MELHOR" |
| `tinta2` sobre qualquer `*Suave` | 5.9–6.9 | 6.3–8.8 | texto dos blocos de status |
| `tinta3` sobre `preenchimento2` | 4.4–4.7 | 4.7–5.4 | botão desabilitado |
| `sobreCor` sobre `vermelho` | 4.8 | 2.9 | glifo do ícone de bloco |
| `sobreCor` sobre `verde` | 4.3 | **1.9** | check da medalha do Resultado |
| `sobreCor` sobre `ambar` | 3.4 | **1.6** | glifo do ícone de bloco âmbar |

Leitura:
- **Texto de leitura passa folgado** nos dois temas (`tinta`, `tinta2`, `tint`, `sobreTint`).
  `tinta3` fica entre 4.4 e 5.1 no claro: serve para legenda e rótulo, não para informação que
  só existe ali.
- **Âmbar no tema claro não chega a 3:1** como texto (bloco "Reposição pendente", faixa
  "pendente", saldo baixo, "A receber"). É valor do handoff (`#C07C00`); o título do bloco é
  700/15px e o número 800, mas nenhum é "texto grande" pela WCAG. Pendência registrada em
  `PROXIMOS-PASSOS.md` — decidir com o design um âmbar de texto mais escuro no claro.
- **Status nunca é só cor:** toda faixa e todo bloco têm texto; o título do bloco repete o que a
  cor diz.
- **Glifo branco (`sobreCor`) sobre verde/âmbar no escuro** fica abaixo de 3:1. O handoff pede
  "glifo branco" nos dois temas; o glifo é decorativo (o título do bloco e o texto do Resultado
  dizem o mesmo), mas vale revisar com o design — `sobreTint` (`#0B1524`) daria 9+:1.

## Alvos de toque
- Botão primário 54px, secundário 52, compacto 50, texto 46. Botão inline (40), segmento
  (34/36/30), switch (32), stepper (34) e ficha (36) recebem `hitSlop` até 44px.
- Aba da tab bar: item de 56px de altura, acima dos 48 exigidos.
- Botão voltar: 44px de altura, com o rótulo tocável.
- Linha de lista inteira é tocável (mínimo 58–76px); `AcaoDoCampo` ocupa 44px do trilho.

## Leitores de tela
- Tab bar: `tablist`, cada aba `tab` com `selected`; o rótulo é sempre visível.
- Sheet: `accessibilityViewIsModal` — o que está atrás não é alcançável; "Cancelar", o toque
  fora do painel e o voltar do Android fecham.
- Saldo: anunciado por inteiro ("4 aulas restantes de 6"), não só "4".
- Medidor do pacote e dos passos, avatares e ícones são **decorativos** (ocultos).
- Faixa de status: entra no rótulo da linha do aluno ("Valentin Klein, Atraso de 12 dias…").
- Delta do extrato (`−1`, `+6`, `✓`): `deltaEmPalavras` ("1 aula debitada", "pagamento
  recebido") — cor não é o único sinal.
- Stepper: o valor falado sai de `rotuloDoValor` ("sem limite" no lugar de "—").
- Toast, `NotaDoBotao` e erro de campo: live region educada.
- Segmentado: grupo de rádios; ficha de escolha: caixa de seleção; switch: `switch` com estado.

## Preferências do sistema
- `prefers-color-scheme` na primeira carga; a escolha manual em Ajustes vence depois.
- Reduzir movimento (`tema/movimento.ts`): sheet, barra de navegação, switch e toast mudam sem
  transição.
- Aumento de fonte: nenhum cartão tem altura fixa; linhas usam altura **mínima**.
