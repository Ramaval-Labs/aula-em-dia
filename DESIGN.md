---
name: Aula em Dia
description: App do professor particular para pacotes de aulas, faltas, reposições e pagamentos — direção iOS Glass.
colors:
  tela: "#E9EEF7"
  tinta: "#0B1220"
  tinta-2: "rgba(11,18,32,.72)"
  tinta-3: "rgba(11,18,32,.62)"
  fio: "rgba(11,18,32,.085)"
  cartao: "rgba(255,255,255,.558)"
  vidro: "rgba(255,255,255,.508)"
  vidro-2: "rgba(255,255,255,.7)"
  sheet: "rgba(244,247,252,.62)"
  borda: "rgba(255,255,255,.88)"
  borda-topo: "#FFFFFF"
  preenchimento: "rgba(118,138,178,.15)"
  preenchimento-2: "rgba(118,138,178,.26)"
  tint: "#35577D"
  tint-suave: "rgba(53,87,125,.14)"
  sobre-tint: "#FFFFFF"
  vermelho: "#DE203A"
  vermelho-suave: "rgba(222,32,58,.12)"
  ambar: "#C07C00"
  ambar-suave: "rgba(224,150,0,.16)"
  verde: "#158A61"
  verde-suave: "rgba(21,138,97,.13)"
  mancha-1: "#8FB6FF"
  mancha-2: "#FFD6A5"
  mancha-3: "#CDB8FF"
  mancha-4: "#9FE3D0"
typography:
  titulo-grande:
    fontFamily: "Satoshi"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  titulo-empilhada:
    fontFamily: "Satoshi"
    fontSize: "29px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  saldo-cartao:
    fontFamily: "Satoshi"
    fontSize: "40px"
    fontWeight: 800
    letterSpacing: "-0.045em"
    fontFeature: "tnum"
  nome-lista:
    fontFamily: "Satoshi"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  botao:
    fontFamily: "Satoshi"
    fontSize: "16.5px"
    fontWeight: 700
    letterSpacing: "-0.015em"
  apoio:
    fontFamily: "Satoshi"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
  cabecalho-grupo:
    fontFamily: "Satoshi"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  tab-bar: "26px"
  cartao: "22px"
  bloco: "20px"
  botao: "18px"
  trilho: "12px"
  segmento: "9px"
  sheet: "40px"
---

# Aula em Dia — sistema visual (provisório)

> **Provisório durante o redesign.** A troca para a direção *iOS Glass* está em andamento na
> branch `redesign/ios-glass` (plano em `docs/design/redesign-ios-glass/PLANO.md`). Até a Onda 4,
> a fonte da verdade do sistema é **`handoff-ios-glass/README.md`** — seções *Componentes* e
> *Design Tokens* — e os valores tipados em `mobile/src/tema/tokens.ts`. Na Onda 4 este arquivo é
> regravado a partir do código entregue, com os dois temas completos.
>
> O frontmatter acima traz só o tema claro e os papéis principais, para o Impeccable ler.

## Overview

Convenções de plataforma iOS com material translúcido. Quatro manchas de cor ficam sob todo o
app; cartões, barras e sheets são vidro sobre elas — blur baixo e saturação alta, para passar a
cor de trás em vez de apagá-la. O conteúdo é direto, com números grandes e tabulares.

## Regras que não mudam

- **Fundo de refração sempre.** Sem ele o vidro colapsa em retângulo cinza.
- **Um nível de vidro por camada de profundidade:** fundo → cartão → barra → sheet.
- **Nunca texto pequeno translúcido sobre o material.**
- **Tint é o único destaque** (`#35577D` claro / `#9FBEDF` escuro). Status em fundo suave com o
  texto na cor cheia.
- **Um primário por tela.**
- **Anel de refração só na tab bar.**
- **Satoshi, números tabulares, dinheiro em pt-BR.**

## Aposentado

Curvas assinatura, cabeçalho escuro, amarelo `#FFD032`, pílula de vidro sem desfoque e wordmark
de quatro barras pertencem à direção *tinta chapada*, documentada em
`docs/design/historico/tinta-chapada/HANDOFF.md`. Não voltam.
