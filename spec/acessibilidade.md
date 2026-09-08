# Acessibilidade

## Contraste (medido no protótipo)
- Texto branco sobre `--topo` `#141E30`: **15.9:1** — ok.
- `--suave` `#6E819B` sobre `--cartao` branco: **4.0:1** — só para legendas de 12px+
  em conteúdo não essencial. **Não usar em informação crítica**; prefira `--texto-medio`
  `#35577D` (**8.6:1**).
- `#FFD032` sobre `--topo`: **11.4:1** para o número herói (escala grande) — ok.
- `#FFD032` **não** serve como cor de texto sobre fundo claro. Em faixa amarela, a tinta é
  `#0E1626` (**14.8:1**).
- `--vermelho` `#E3001A` com texto branco na faixa de atraso: **5.3:1** — ok.
- No tema noturno, `--suave` `#93A2BC` sobre `--cartao` `#1B2740`: **5.9:1** — ok.

## Alvos de toque
- Botão primário 52px, secundário 44px, aba 42px de altura interna — a área tocável da aba
  deve ser estendida para **48px** com padding, mantendo o visual de 42px.
- Cartão de aluno inteiro é tocável (não só o nome).
- Chips de filtro: garantir 44px de altura tocável mesmo com visual mais baixo.

## Leitores de tela
- Navbar: `role="tablist"`, cada aba `role="tab"` com `aria-selected`. O rótulo textual
  aparece só na aba ativa — as inativas precisam de `aria-label` ("Alunos", "Financeiro", "Ajustes").
- Contador de saldo: anunciar "4 aulas restantes de 6", não só "4".
- Pontos do pacote são **decorativos** — `aria-hidden`, a informação está no contador.
- Faixa de status: anunciar junto do nome do aluno ("Valentin Klein, pagamento em atraso, 12 dias").
- Delta do extrato (`-1`, `+6`, `✓`): dar texto alternativo ("uma aula debitada",
  "seis aulas adicionadas", "pagamento recebido") — cor não pode ser o único sinal.
- Toast: `role="status"`, `aria-live="polite"`.
- Curvas SVG: `aria-hidden="true"`, `pointer-events: none`.

## Preferências do sistema
- Respeitar `prefers-color-scheme` na primeira carga (o token CSS já traz o bloco), com a
  escolha manual em Ajustes vencendo depois.
- Respeitar `prefers-reduced-motion`: desligar a transição de expansão da aba ativa.
- Suportar aumento de fonte do sistema: nenhuma altura de cartão deve ser fixa.
