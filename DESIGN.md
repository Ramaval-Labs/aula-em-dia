---
name: Aula em Dia
description: App do professor particular para pacotes de aulas, faltas, reposições e pagamentos.
colors:
  amarelo: "#FFD032"
  tinta-sobre-amarelo: "#0E1626"
  topo: "#141E30"
  topo-texto: "#FFFFFF"
  topo-fraco: "#8FA8C4"
  topo-cartao: "#24395B"
  tela: "#F0F3F7"
  caixa: "#F0F3F7"
  cartao: "#FFFFFF"
  linha: "#E2E8F0"
  texto: "#141E30"
  texto-medio: "#35577D"
  suave: "#6E819B"
  fraco: "#B7C0CE"
  inativo: "#D3DAE4"
  elevado: "#141E30"
  elevado-suave: "#A6B6CE"
  botao: "#141E30"
  botao-texto: "#FFFFFF"
  botao-hover: "#24395B"
  desab-fg: "#9AA6B8"
  hover: "#F7FAFD"
  amarelo-fraco: "#FFF6D9"
  vermelho: "#E3001A"
  vermelho-fraco: "#FFF0F2"
  verde: "#1E7A55"
  tinta-sobre-vermelho: "#FFFFFF"
  vermelho-sobre-topo: "#FF4D5E"
typography:
  heroi:
    fontFamily: "Satoshi"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  titulo-tela:
    fontFamily: "Satoshi"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  titulo-interno:
    fontFamily: "Satoshi"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  botao:
    fontFamily: "Satoshi"
    fontSize: "15.5px"
    fontWeight: 600
    lineHeight: 1
  nome:
    fontFamily: "Satoshi"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.25
  saldo:
    fontFamily: "Satoshi"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  aba:
    fontFamily: "Satoshi"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.01em"
  corpo:
    fontFamily: "Satoshi"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
  legenda:
    fontFamily: "Satoshi"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  nota:
    fontFamily: "Satoshi"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1.55
  eyebrow:
    fontFamily: "Satoshi"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.18em"
  micro:
    fontFamily: "Satoshi"
    fontSize: "9px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.16em"
rounded:
  micro: "5px"
  contador: "6px"
  cartao: "8px"
  pastilha: "13px"
  pilula: "99px"
spacing:
  "4": "4px"
  "6": "6px"
  "7": "7px"
  "9": "9px"
  "10": "10px"
  "12": "12px"
  "14": "14px"
  "16": "16px"
  "20": "20px"
  "22": "22px"
  "32": "32px"
components:
  botao-primario:
    backgroundColor: "{colors.botao}"
    textColor: "{colors.botao-texto}"
    typography: "{typography.botao}"
    rounded: "{rounded.cartao}"
    height: "52px"
  botao-primario-hover:
    backgroundColor: "{colors.botao-hover}"
  botao-primario-desabilitado:
    textColor: "{colors.desab-fg}"
  botao-secundario:
    textColor: "{colors.suave}"
    height: "44px"
  chip-ativo:
    backgroundColor: "{colors.texto}"
    textColor: "{colors.botao-texto}"
  chip-inativo:
    backgroundColor: "{colors.cartao}"
    textColor: "{colors.suave}"
  cartao-aluno:
    backgroundColor: "{colors.cartao}"
    rounded: "{rounded.cartao}"
    padding: "13px 15px"
  contador-saldo:
    backgroundColor: "{colors.elevado}"
    textColor: "#FFFFFF"
    typography: "{typography.saldo}"
    rounded: "{rounded.contador}"
    padding: "7px 11px"
  contador-saldo-baixo:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.amarelo}"
  faixa-reposicao-pendente:
    backgroundColor: "{colors.amarelo}"
    textColor: "{colors.tinta-sobre-amarelo}"
  faixa-atraso:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.tinta-sobre-vermelho}"
  faixa-neutra:
    backgroundColor: "{colors.caixa}"
    textColor: "{colors.texto-medio}"
  aba-ativa:
    textColor: "#FFFFFF"
    typography: "{typography.aba}"
    rounded: "{rounded.pilula}"
    height: "42px"
---

# Design System: Aula em Dia

> **Fonte da verdade:** `mobile/src/tema/tokens.ts` (espelho tipado de `tokens/tokens.json`) e
> `mobile/src/tema/tipografia.ts`. Este arquivo é o resumo que o Impeccable lê. Em conflito,
> o código vence — e quem mudar um token atualiza os três arquivos juntos.
> Medidas e comportamento detalhados estão em `HANDOFF.md`.

## Overview

**Creative North Star: "A Testemunha Neutra"**

O app fica entre o professor e o aluno como uma testemunha que não toma partido: registra o que
aconteceu, aplica a regra que o professor escolheu e mostra o motivo de cada débito. A estética
serve a isso. Um painel de tinta quase preta no topo carrega o que é do professor (título, número
herói, data); abaixo, uma folha clara e calma carrega os fatos (cartões, extrato, janelas). Entre
os dois, a curva assinatura — baixa à esquerda, reta no meio, subindo à direita — é a única
gestualidade da interface.

A cor quase não fala. Tinta e papel fazem a hierarquia; o amarelo aparece como marca-texto só no
que exige leitura ou ação, e o vermelho só no que venceu. É uma interface densa e de canto curto,
feita para ser lida de relance, com uma mão, entre uma aula e outra.

**Key Characteristics:**
- Cabeçalho escuro, conteúdo claro, curva entre os dois.
- Hierarquia por peso e tamanho, não por cor.
- Amarelo como marca-texto, vermelho só para o que venceu.
- Números tabulares que não dançam quando o saldo muda.
- Cartões planos com borda fina; profundidade por camada tonal, não por sombra.

## Colors

Tinta azul-noite e papel frio, com dois sinais de consequência: amarelo para atenção e vermelho
para atraso.

### Primary
- **Marca-Texto Amarelo** (`amarelo`): igual nos dois temas. Número herói do cabeçalho, saldo
  baixo (≤ 2) no contador e nos pontos do pacote, ícone da aba ativa, faixa de reposição
  pendente e a barra lateral do toast. Tinta sobre ele é sempre `tinta-sobre-amarelo`.

### Neutral
- **Tinta Azul-Noite** (`topo`, `texto`, `elevado`, `botao`): o painel do cabeçalho e da navbar, o
  texto principal, a caixa do contador e o botão primário.
- **Papel Frio** (`tela`, `caixa`): o fundo do conteúdo e das caixas neutras.
- **Folha** (`cartao`): cartões e superfícies de leitura.
- **Fio** (`linha`): bordas de cartão e divisórias; pontos já usados do pacote.
- **Tinta Média** (`texto-medio`): texto secundário que ainda carrega informação (8.6:1).
- **Tinta Suave** (`suave`): legendas não essenciais, 12px ou mais (4.0:1 — nunca para
  informação crítica).
- **Tinta Fraca** (`fraco`, `inativo`, `desab-fg`): tracejado do aluno sem pacote, estados
  desabilitados, polegar da rolagem.
- **Névoa do Painel** (`topo-fraco`, `topo-cartao`, `elevado-suave`): texto e caixas secundárias
  dentro do cabeçalho escuro e ícones inativos da navbar.

### Secondary
- **Vermelho Vencido** (`vermelho`, `vermelho-fraco`): pagamento em atraso, delta negativo do
  extrato, vencimento.
- **Verde Confirmado** (`verde`): delta neutro e dinheiro recebido no extrato.
- **Tinta Sobre Vermelho** (`tinta-sobre-vermelho`): texto da faixa "Pagamento em atraso".
  Branco no claro; tinta escura `#0E1626` no noturno, onde branco sobre `#FF4D5E` não passa.
- **Vermelho Sobre o Painel** (`vermelho-sobre-topo`): número grande em vermelho dentro do
  cabeçalho escuro (total "Em atraso" do Financeiro) — o `vermelho` do claro some sobre
  `topo-cartao`.

### Tema noturno
Mesmos nomes, outros valores (em `CORES.escuro` de `tokens.ts`): `tela` `#141E30`, `cartao`
`#1B2740`, `caixa` `#22304C`, `linha` `#2C3E5C`, `texto` `#E9EDF4`, `texto-medio` `#C2CCDD`,
`suave` `#93A2BC`, `topo` `#0E1626`, `botao` `#E9EDF4` com `botao-texto` `#0E1626`, `vermelho`
`#FF4D5E`, `verde` `#35B37E`. O amarelo não muda.

### Named Rules
**A Regra do Marca-Texto.** O amarelo só marca o que exige leitura ou ação — as cinco posições
acima. Nunca é fundo de área grande e nunca é texto pequeno sobre fundo claro.

**A Regra do Vermelho Vencido.** Vermelho significa que algo venceu ou foi debitado. Não é cor de
destaque, de botão nem de erro de formulário genérico.

## Typography

**Display Font:** Satoshi (Fontshare), instâncias estáticas 400/500/600/700/800
**Body Font:** Satoshi
**Label/Mono Font:** Satoshi com números tabulares — não há fonte mono

**Character:** uma grotesca geométrica só, trabalhada por peso: 800 para o número que importa,
600 para títulos, nomes e rótulos, 400 para o corpo. Rótulos pequenos em caixa alta com tracking
aberto fazem o papel de legenda técnica.

### Hierarchy
- **Herói** (800, 30px, 1, -0.04em): o número do cabeçalho — aulas hoje, saldo do aluno.
- **Título de tela** (600, 24px, 1.15, -0.02em): "Meus alunos" e títulos das raízes.
- **Título interno** (600, 22px, 1.2, -0.02em): títulos das telas de tarefa.
- **Botão** (600, 15.5px, 1): rótulo do botão primário.
- **Nome** (600, 15px, 1.25): nome do aluno no cartão.
- **Saldo** (800, 15px, 1, -0.03em): número do contador do cartão.
- **Aba** (600, 13px, 1, 0.01em): rótulo da aba ativa.
- **Corpo** (400, 12.5px, 1.5): texto corrido e motivos das janelas.
- **Legenda** (400, 12px, 1.4): meta do cartão (disciplina, horário).
- **Nota** (400, 11.5px, 1.55): observações e rodapés de cartão.
- **Eyebrow** (600, 10px, 0.18em, caixa alta): data no cabeçalho.
- **Micro** (600, 9px, 0.16em, caixa alta): unidade do contador ("aulas"), rótulos mínimos.

### Named Rules
**A Regra do Número Que Não Dança.** Todo número é tabular. O saldo não pode mudar de largura
quando passa de 10 para 9.

**A Regra da Tinta Inteira.** No React Native, a métrica de texto sai inteira de `texto()` ou
`TIPO.*`: a entrelinha nunca fica abaixo da tinta do glifo (1.25em). Espaço vertical em texto se
soma com `comEspaco()`, nunca com `marginTop` solto.

## Layout

Referência de 390 × 844 (iPhone base), em tela cheia. Coluna de altura total: **cabeçalho**
escuro fixo (padding 14px 20px e 64px na base para a curva — 62px na variante compacta, 70px no
Resultado) → **conteúdo** rolável (padding 16px 20px 10px, gap 10px) → **faixa da curva** de 58px
no fluxo → **navbar**, só nas três raízes (Alunos, Financeiro, Ajustes).

Nas telas de tarefa a navbar some e o rodapé é a ação primária, que **flutua** sobre a lista com
uma máscara em gradiente da cor do fundo; o conteúdo recebe padding inferior do tamanho do rodapé.

Espaçamento numa grade de 4, usando só os passos do handoff (4, 6, 7, 9, 10, 12, 14, 16, 20, 22,
32). Alturas de toque: botão primário 52px, secundário 44px, aba 42px visual com 48px tocáveis,
chips com 44px tocáveis. Nenhuma altura de cartão é fixa, para suportar aumento de fonte.

## Elevation & Depth

Plano por padrão. A profundidade vem da camada tonal — painel escuro sobre folha clara, cartão
branco com fio de 1px sobre papel frio — e não de sombra. A única sombra do sistema é a da pílula
de vidro da navbar (`VIDRO.sombra` em `tokens.ts`: sombras internas de luz nas quatro bordas e uma
externa suave de 3px 10px).

### Named Rules
**A Regra do Vidro Sem Desfoque.** A pílula da aba ativa é gradiente, borda e sombras internas.
Sem `backdrop-filter` e sem `BlurView` — o desfoque quebrava o recorte do container.

## Shapes

Canto curto e consistente: 8px em cartões e botões, 6px na caixa do contador, 5px em
micro-rótulos, 13px em pastilhas, 99px em pílulas e barras de rolagem. A única forma livre é a
curva assinatura, desenhada em SVG com os paths de `CURVAS` e redimensionada — nunca recortada —
na altura da faixa. Aluno sem pacote ganha borda tracejada de 1px em `fraco`.

### Named Rules
**A Regra da Curva Única.** Há duas curvas, sempre na mesma direção: baixa à esquerda, reta no
meio, subindo à direita. Nunca substituídas por `borderRadius`, nunca espelhadas.

## Components

### Buttons
- **Shape:** canto curto (8px).
- **Primary:** tinta sobre folha — fundo `botao`, texto `botao-texto`, 52px de altura; hover em
  `botao-hover`. Desabilitado (sem pacote ou aluno pausado) com texto `desab-fg`.
- **Secundário / texto:** 44px, texto `suave`, sem fundo.

### Chips
- **Style:** filtros Urgência · A–Z · Hoje, gap de 7px. Ativo em tinta (`texto` / `botao-texto`);
  inativo em folha com fio (`cartao`, texto `suave`, borda `linha`).

### Cards / Containers
- **Cartão de aluno:** folha branca, fio `linha`, 8px, padding 13px 15px. Nome, duas linhas de
  meta, contador de saldo à direita, pontos do pacote e no máximo uma faixa de status. O cartão
  inteiro é tocável.
- **Contador de saldo:** caixa de tinta (`elevado`), 6px, número branco — amarelo quando o saldo é
  ≤ 2 — e a unidade "aulas" em micro. Sem pacote: "—" / "sem pacote" em `caixa`.
- **Pontos do pacote:** um por aula; usadas em `linha`, restantes em `texto` (amarelo com saldo
  baixo). Decorativos para leitor de tela.
- **Faixa de status:** uma só, por precedência — pausadas (neutra), atraso (vermelho, texto
  branco), reposição pendente (amarelo, tinta escura), reposição marcada (neutra).

### Navigation
- **Navbar:** fundo `topo`, três abas. Inativa: só ícone, 52px, `elevado-suave`. Ativa: expande
  com ícone amarelo e rótulo branco na pílula de vidro, 42px, transição de 220ms (desligada com
  reduzir movimento).
- **Cabeçalho:** voltar, eyebrow, título e número herói, com a curva na base pintada na cor do
  conteúdo (`tela`, ou `cartao` no Resultado).

### Toast
- Fundo `elevado`, barra amarela de 4px à esquerda, some em 3600ms, anunciado como região viva.

### Cartão de desfecho e cartão de janela
- Cartões selecionáveis do Registrar e da Reposição. O selecionado mostra o efeito no saldo antes
  de confirmar; toda janela mostra o motivo da sugestão — o motivo é parte do design.

### Extrato
- Linhas com data `dd/mm`, título, subtítulo, delta e saldo. Delta negativo em vermelho, positivo em
  tinta, neutro e dinheiro em verde, sempre com texto alternativo.

## Do's and Don'ts

### Do:
- **Do** importar toda cor e medida de `tokens.ts` / `tipografia.ts`; valor solto numa tela é bug.
- **Do** dar cor explícita a todo texto — o React Native não herda `color` do `View` pai.
- **Do** manter a faixa da curva (58px) no fluxo, acima da navbar.
- **Do** formatar dinheiro com `dinheiro()` e datas a partir de `dominio/datas.ts`.
- **Do** mostrar o efeito no saldo antes da ação e o motivo de cada sugestão.

### Don't:
- **Don't** usar amarelo como fundo de área grande nem como texto pequeno sobre claro.
- **Don't** trocar a curva por `borderRadius`, recortar o SVG ou inverter a direção.
- **Don't** usar `backdrop-filter` ou `BlurView` na navbar.
- **Don't** trocar a Satoshi pela fonte do sistema (SF Pro, Roboto) nem a navbar pela tab bar
  nativa.
- **Don't** escrever `marginTop`/`marginBottom` solto num texto nem sobrescrever `fontSize` de um
  `TIPO.*`.
- **Don't** usar `suave` para informação crítica; use `texto-medio`.
