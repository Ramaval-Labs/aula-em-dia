# Handoff: Aula em Dia — app do professor (mobile)

> **Este arquivo é a especificação de design do pacote original** (era o `README.md` dele).
> O app já foi implementado a partir daqui — veja `README.md` e `mobile/README.md`.

> **Claude Code: comece por `CLAUDE.md`** (regras do projeto e mapa dos arquivos), depois volte a este
> documento para a especificação completa. Plano de execução em `IMPLEMENTACAO.md`;
> tokens prontos em `tokens/`; regras de negócio com testes em `spec/`.
> **Não há capturas neste pacote de propósito** — a fonte visual da verdade é o protótipo:
> sirva a pasta (`python3 -m http.server`) e abra `App - Aula em Dia.dc.html` no navegador.

## Visão geral
App mobile para professores particulares controlarem pacotes de aulas, faltas, reposições e
pagamentos de cada aluno. O protótipo reúne os fluxos B (registrar aula), C (reposição),
D (pacote e financeiro) e E (configurações) em um único app navegável de três abas —
**Alunos**, **Financeiro** e **Ajustes** — com estado compartilhado real: registrar uma aula
debita o saldo, pode gerar uma reposição pendente, lança no extrato e muda o financeiro.

## Sobre os arquivos deste pacote
Os arquivos `.dc.html` são **referências de design feitas em HTML** — protótipos que mostram
aparência e comportamento pretendidos, **não** código de produção para copiar.
A tarefa é **recriar esses designs no ambiente do codebase de destino** (React, Vue, SwiftUI,
Flutter, nativo) usando os padrões e bibliotecas já estabelecidos lá. Se ainda não existe
codebase, escolha o framework mais adequado ao projeto e implemente os designs nele.

Abra os arquivos direto no navegador para ver o protótipo funcionando (o app é clicável e
persiste estado em `localStorage`).

## Fidelidade
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, raios, estados e microinterações
estão definidos e devem ser reproduzidos fielmente. As regras de negócio no protótipo são as
regras pretendidas, não placeholders.

---

## Enquadramento e navegação

- Viewport de referência: **390 × 844** (iPhone 14/15 base). O container do protótipo tem
  `border-radius: 14px` e `overflow: hidden` só para simular o aparelho — na implementação
  real é tela cheia.
- Layout do app: coluna flex de altura total → **cabeçalho** (fixo, fundo escuro) →
  **conteúdo** (`flex:1; overflow-y:auto`) → **navbar** (fixa embaixo).
- Pilha de navegação própria: `ir(tela)` empilha, `voltar()` desempilha, `trocarTab()`
  zera a pilha. Trocar de aba sempre volta à raiz daquela aba.
- Telas (9): `home`, `aluno`, `registrar`, `reposicao`, `resultado`, `financeiro`,
  `inadimplencia`, `ajustes`, `politica`.
- A navbar aparece em `home`, `financeiro` e `ajustes`. Nas telas de tarefa
  (`registrar`, `reposicao`, `resultado`, `politica`, `aluno`, `inadimplencia`)
  ela é **oculta** e o rodapé é ocupado por um botão de ação primária.

### A curva assinatura (obrigatória)
A transição entre o bloco escuro e o conteúdo claro **não é reta**: é uma curva que começa
baixa à esquerda, corre reta no meio e sobe no canto direito. Ela aparece em dois lugares e
sempre na mesma direção.

**Cabeçalho → conteúdo.** SVG absoluto no rodapé do cabeçalho, preenchido com a cor do
conteúdo (`--tela`, ou `--cartao` na tela de resultado):

```html
<svg viewBox="0 0 390 80" preserveAspectRatio="none"
     style="position:absolute;left:0;right:0;bottom:-1px;width:100%;height:80px">
  <path d="M0,80 L0,74 C10,62 34,48 80,46 L316,46 C356,44 378,30 390,12 L390,80 Z"
        fill="var(--tela)"/>
</svg>
```
O cabeçalho leva `padding-bottom: 64px` (62px na variante compacta, 70px na tela de
resultado) para o texto não encostar na curva.

**Conteúdo → navbar.** Faixa própria de **58px** de altura acima da navbar (não é overlay —
ocupa espaço no fluxo, para nunca pintar sobre botões):

```html
<div style="flex:none;height:58px;overflow:hidden;pointer-events:none">
  <svg viewBox="0 0 390 60" preserveAspectRatio="none" style="width:100%;height:60px">
    <path d="M0,55 C10,46 34,36 80,34 L316,34 C356,33 378,22 390,9 L390,61 L0,61 Z"
          fill="var(--topo)"/>
  </svg>
</div>
```

### Navbar — pílula de vidro (liquid glass "Clear")
- Barra: fundo `--topo`, `padding: 6px 14px 18px`, flex centralizado, `gap: 6px`.
- Aba **inativa**: só ícone, `flex: 0 0 52px`, sem fundo; hover `rgba(255,255,255,.07)`.
- Aba **ativa**: expande para `flex: 1 1 auto`, mostra ícone + rótulo
  (`600 13px`, `#FFFFFF`), `padding: 0 17px 0 14px`. Transição `flex-grow .22s ease`.
- Altura interna do toque: **42px**; `border-radius: 99px`.
- Ícones: 19 × 19, stroke 1.8, linecap/linejoin round.
  Ativo em `#FFD032`, inativo em `--elevado-suave`.
- Vidro da pílula ativa (sem `backdrop-filter` — o efeito é todo de borda; `backdrop-filter`
  quebrava o recorte do container):
  - `background: linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.015) 26%,rgba(255,255,255,.015) 72%,rgba(255,255,255,.10))`
  - `border: 1px solid rgba(255,255,255,.5)`
  - `box-shadow: inset 0 1.5px 1.5px rgba(255,255,255,.7), inset 0 -1.5px 1.5px rgba(255,255,255,.34), inset 1.5px 0 1.5px rgba(255,255,255,.2), inset -1.5px 0 1.5px rgba(255,255,255,.2), 0 3px 10px rgba(0,0,0,.32)`
  - brilho especular: filho absoluto `left:6%; right:6%; top:-46%; height:80%;
    border-radius:99px; filter:blur(5px);
    background: linear-gradient(180deg,rgba(255,255,255,0) 60%,rgba(255,255,255,.5))`
- Rótulos das abas: **Alunos**, **Financeiro**, **Ajustes**.

Paths dos ícones (viewBox 24 × 24):
```
Alunos      M12 10.9a3.35 3.35 0 100-6.7 3.35 3.35 0 000 6.7M5.6 19.8c0-3.55 2.86-5.5 6.4-5.5s6.4 1.95 6.4 5.5
Financeiro  M4.2 9.2h13.3a2.5 2.5 0 012.5 2.5v4.9a2.5 2.5 0 01-2.5 2.5H6.7a2.5 2.5 0 01-2.5-2.5zM4.2 9.2V7.3a2 2 0 012-2h8.6M16 14.1h1.4
Ajustes     M4.6 8.2h8.2M16.6 8.2H19.4M4.6 15.8h2.8M11.4 15.8h8M14.7 6.1v4.2M8.5 13.7v4.2
```

---

## Telas

### 1. Alunos (`home`) — raiz da aba 1
**Objetivo:** ver quem precisa de atenção hoje e entrar no aluno.

Cabeçalho (fundo `--topo`, texto branco, `padding: 14px 20px 64px`):
- status bar simulada: hora `600 12px` tabular + retângulo de bateria 16 × 9, borda 1px, raio 2px;
- data `600 10px`, `letter-spacing:.18em`, uppercase, cor `--topo-fraco` ("Quinta, 28 de agosto");
- título "Meus alunos" `600 24px/1.15`, `letter-spacing:-.02em`;
- à direita, contador de aulas do dia: número `800 30px` em `#FFD032`, tabular,
  `letter-spacing:-.04em`, e rótulo "aulas hoje" `600 9px`, `.16em`, uppercase.

Conteúdo (`padding: 16px 20px 10px`, `gap: 10px`):
- **Chips de filtro** (`gap: 7px`): Urgência · A–Z · Hoje. Ativo: fundo `--texto`,
  texto `--botao-texto`; inativo: fundo `--cartao`, texto `--suave`, borda `--linha`.
- **Cartão de aluno** (`--cartao`, borda `--linha`, raio 8px, `padding: 13px 15px`):
  - nome `600 15px/1.25`;
  - linha 2 `400 12px` `--suave`: `"{disciplina} · hoje, {hora}"` ou `"{disciplina} · {dia}, {hora}"`;
  - linha 3: `"{usadas} usadas · validade {dd/mm}"`, ou `"Pacote encerrado em {dd/mm}"`;
  - **contador de saldo** à direita: caixa `--elevado`, raio 6px, `padding: 7px 11px`,
    número `800 15px` tabular em `#FFFFFF` — **`#FFD032` quando saldo ≤ 2** —, unidade
    "aulas" `600 9px` uppercase;
  - **pontos do pacote**: um ponto por aula do pacote; usadas em `--linha`, restantes em
    `--texto` (ou `#FFD032` se saldo ≤ 2);
  - **faixa de status** (uma só, nesta precedência):
    1. `Aulas pausadas` — fundo `--caixa`, texto `--texto-medio`, sufixo "até regularizar";
    2. `Pagamento em atraso` — fundo `--vermelho`, texto `#FFFFFF`, sufixo "{n} dias";
    3. `Reposição pendente` — fundo `#FFD032`, texto `#0E1626`, sufixo "há {n} dias" / "hoje";
    4. `Reposição marcada` — fundo `--caixa`, texto `--texto-medio`, sufixo "{dia} · {hora}".
  - **aluno sem pacote**: borda tracejada `1px dashed var(--fraco)`, nome em `--texto-medio`,
    contador mostra "—" / "sem pacote" com fundo `--caixa`.
- Ordenação por **Urgência**: atraso (0) → reposição pendente (1) → normal (2) → sem pacote (3);
  desempate por saldo crescente. **A–Z** ordena por nome; **Hoje** filtra `aluno.hoje`.

### 2. Detalhe do aluno (`aluno`)
Cabeçalho escuro com voltar, nome, disciplina/horário, saldo grande, `usadas de total`,
validade (com sufixo " · estendida" quando aplicável) e contagem de reposições
(`"{n} de {limite} reposições"`, ou `"{n} reposições"` se limite = 0 / sem limite).

Contextos condicionais (cartões acima do extrato), quando existirem:
- **em atraso:** "{valor} venceu em {dd/mm}, há {n} dias." + ações receber / cobrar / pausar;
- **reposição pendente:** "Falta avisada em {dd/mm}. Sem horário escolhido há {n} dias."
  + ação escolher horário;
- **reposição marcada:** "{dia}, {hora}. Mensagem enviada ao aluno.";
- **pausado:** aviso de aulas pausadas até regularizar.

**Extrato** (lista cronológica, mais recente primeiro): data `dd/mm`, título, subtítulo,
delta (`-1`, `+6`, `0`, ou `✓` para dinheiro) e `saldo {n}` / `recebido`.
Cores do delta: negativo `--vermelho`, positivo `--texto`, neutro e dinheiro `--verde`.
Estado vazio quando o aluno não tem lançamentos.

Rodapé: botão primário **Registrar aula** (52px, raio 8px, `600 15.5px`, fundo `--botao`,
texto `--botao-texto`) — desabilitado se não há pacote ou o aluno está pausado.
Gradiente de máscara sobre a lista: `linear-gradient(to top,var(--tela) 72%,transparent)`.

### 3. Registrar aula (`registrar`) — Fluxo B
Quatro desfechos em cartões selecionáveis:
1. **Aula realizada** — "Aconteceu como o combinado";
2. **Falta avisada** — com **slider de antecedência do aviso** (horas, default 26);
3. **Falta sem aviso**;
4. **Aula cancelada por você**.

O cartão selecionado mostra em tempo real o **efeito no saldo** calculado pela política ativa
(ver Regras). Rodapé: **Confirmar**.

### 4. Resultado (`resultado`)
Confirmação do que aconteceu: saldo novo, se a aula foi debitada ou não, e se gerou reposição.
Fundo do conteúdo é `--cartao` (a curva do cabeçalho usa `--cartao` nesta tela).
Ações: escolher horário da reposição (quando gerada) ou voltar ao aluno.

### 5. Reposição (`reposicao`) — Fluxo C
Lista de **janelas sugeridas**, cada uma com dia, hora e **motivo da sugestão**:
- Sexta, 29/08 · 17h — "Livre na sua agenda e o aluno já teve aula nesse horário"
- Sábado, 30/08 · 10h — "Livre, mas fora do horário habitual do aluno"
- Terça, 02/09 · 19h — "Emenda na aula do Rafael, sem intervalo entre as duas"
- **Quinta, 11/09 · 18h** — "Só cabe dentro da validade estendida" — aparece **apenas** se o
  pacote do aluno teve a validade estendida.

Confirmar: incrementa `reposicoes`, limpa `pendencia`, grava `agendada`, lança no extrato
e mostra toast "Reposição de {primeiro nome} em {dia}, {hora}. Mensagem enviada."

### 6. Financeiro (`financeiro`) — raiz da aba 2, Fluxo D3
Três totais no topo: **A receber**, **Recebido**, **Em atraso** (moeda pt-BR, tabular).
Lista de alunos com valor do pacote e situação de pagamento (pago / aberto com vencimento /
em atraso com dias). Aluno em atraso abre `inadimplencia`.

### 7. Aluno em atraso (`inadimplencia`) — Fluxo D4
Contexto da dívida (valor, vencimento, dias, histórico de atrasos, lembretes enviados e data do
último) e ações: **registrar pagamento**, **enviar lembrete**, **pausar aulas**,
**estender validade**.
- *Registrar pagamento*: status → pago (Pix, hoje), remove pausa, lança no extrato, toast.
- *Estender validade*: grava a nova data no aluno, marca o pacote como estendido
  (mostra " · estendida"), lança no extrato e libera a janela extra na reposição.

### 8. Ajustes (`ajustes`) — raiz da aba 3, Fluxo E1
Perfil do professor (**Caio Torres**, iniciais CT), alternador **Claro / Noturno**,
entrada para **Política de faltas**, e ação de **zerar o estado** do protótipo.

### 9. Política de faltas (`politica`) — Fluxo E2
Painel de edição real, com rascunho (`rascunho`) e diff antes de salvar:
- **Antecedência mínima do aviso** (horas, default **24**);
- **Falta avisada devolve a aula** (boolean, default **true**);
- **Limite de reposições por pacote** (default **3**; 0 = sem limite);
- **Validade padrão do pacote** (dias, default **60**).

Rodapé: **Salvar alterações** (desabilitado sem mudanças) e **Descartar**.
O que é salvo aqui muda imediatamente o cálculo da tela Registrar aula.

---

## Regras de negócio

`VALOR_AULA = 80` (R$ por aula; valor do pacote = `total × 80`).
`HOJE = '28/08'` (data fixa do protótipo — trocar por data real).

Efeito de cada desfecho no saldo:

| Desfecho | Condição | Debita | Gera reposição |
|---|---|---|---|
| Aula realizada | — | sim (−1) | não |
| Falta avisada | política **não** devolve | sim (−1) | não |
| Falta avisada | aviso ≥ mínimo (24h) | **não** (0) | **sim** |
| Falta avisada | aviso < mínimo | sim (−1) | não |
| Falta sem aviso | — | sim (−1) | não |
| Cancelada por você | — | não (0) | sim (obrigatória) |

- Saldo nunca fica negativo: `max(0, total − usadas)`.
- Reposição só é criada se `limiteReposicoes === 0` ou `reposicoes < limiteReposicoes`.
- Saldo ≤ 2 dispara o destaque amarelo (`#FFD032`) no contador e nos pontos, e libera renovar.

## Estado

```
politicas   { avisoHoras, avisadaDevolve, limiteReposicoes, validadeDias }
alunos[]    { id, name, disciplina, dia, hora, hoje, total, usadas, validade,
              validadeEstendida?, reposicoes, pendencia?{origem,dias},
              agendada?{dia,hora}, pausado?, semPacote?, encerrado?,
              lembretes?, ultimoLembrete?, atrasosHistoricos?,
              pagamento{ status: 'pago'|'aberto'|'atraso'|'sem', em?, meio?, vence?, venceu?, dias? } }
extratos    { [alunoId]: [ { d, t, s, delta, saldo, dinheiro? } ] }
navegação   tela, pilha[], alunoId, filtro, tema
efêmero     desfecho, avisoH, janela, toast, rascunho
```

Persistência: `localStorage` — `aulaemdia.app.v3` (alunos, extratos, políticas) e
`aulaemdia.app.v3.tema`. Toast desaparece em **3600ms**.

Alunos-semente: Valentin Klein (Matemática, quarta 17h, 6 aulas, 2 usadas, **em atraso 12 dias**),
Rafael Dornelas (Violão, segunda 19h, 8/6, **reposição pendente**), Mateus Alves
(Inglês, terça e quinta 18h, 8/3, pago), Bernardo Lemos (Inglês, **sem pacote**, encerrado 04/07).

## Design tokens

**Tipografia:** Satoshi (Fontshare), pesos 300–900 variável.
`https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900,variable&display=swap`
Números sempre com `font-variant-numeric: tabular-nums`.

Escala em uso: 24/1.15 (600, `-.02em`) título de tela · 30 (800, `-.04em`) número herói ·
15.5 (600) botão · 15/1.25 (600) nome · 13 (600) rótulo de aba · 12.5/1.5 (400) corpo ·
12/1.4 (400) legenda · 11.5/1.55 (400) nota · 10 (600, `.18em`, uppercase) eyebrow ·
9 (600, `.16em`, uppercase) micro-rótulo.

**Cores — tema claro**
```
--tela #F0F3F7   --caixa #F0F3F7   --cartao #FFFFFF   --linha #E2E8F0
--texto #141E30  --texto-medio #35577D  --suave #6E819B  --fraco #B7C0CE  --inativo #D3DAE4
--topo #141E30   --topo-texto #FFFFFF   --topo-fraco #8FA8C4  --topo-cartao #24395B
--elevado #141E30  --elevado-suave #A6B6CE
--botao #141E30  --botao-texto #FFFFFF  --botao-hover #24395B  --desab-fg #9AA6B8
--hover #F7FAFD  --amarelo-fraco #FFF6D9
--vermelho #E3001A  --vermelho-fraco #FFF0F2  --verde #1E7A55
```

**Cores — tema noturno** (`[data-tema="escuro"]`)
```
--tela #141E30   --caixa #22304C   --cartao #1B2740   --linha #2C3E5C
--texto #E9EDF4  --texto-medio #C2CCDD  --suave #93A2BC  --fraco #46587A  --inativo #33456A
--topo #0E1626   --topo-texto #FFFFFF   --topo-fraco #8299B8  --topo-cartao #24365A
--elevado #24365A  --elevado-suave #A6B6CE
--botao #E9EDF4  --botao-texto #0E1626  --botao-hover #FFFFFF  --desab-fg #5D6E8C
--hover #22304C  --amarelo-fraco #33301C
--vermelho #FF4D5E  --vermelho-fraco #3A1A20  --verde #35B37E
```

**Amarelo de marca:** `#FFD032` (fixo nos dois temas) — usado só para ênfase: número herói,
saldo baixo, ícone da aba ativa, faixa de reposição pendente, barra do toast.
**Tinta sobre amarelo:** `#0E1626`.

**Raios:** 5px micro-rótulo · 6px caixa de contador · 8px cartão e botão · 13px pastilha ·
99px pílula e barra de rolagem · 14px moldura do aparelho.
**Espaçamento:** grade de 4 (usados: 4, 6, 7, 9, 10, 12, 14, 16, 20, 22, 32).
**Alturas de toque:** botão primário 52px · botão secundário 44px · aba 42px.
**Barra de rolagem:** 5px, trilha transparente, polegar `--fraco` (hover `--suave`),
raio 99px.

## Assets
Nenhuma imagem ou ícone de terceiros. Todos os ícones são SVG inline (paths acima).
A marca é um wordmark tipográfico com quatro barras verticais (3 × 18px), as três primeiras em
`--texto` e a quarta em `#FFD032`. Fonte Satoshi vem da Fontshare (licença gratuita —
conferir termos antes de embutir em app publicado).

## Arquivos deste pacote

### Kit de implementação
- `CLAUDE.md` — instruções e regras do projeto para o agente
- `IMPLEMENTACAO.md` — plano em 6 fases com checklist e decisões pendentes
- `tokens/tokens.json` · `tokens.css` · `tokens.scss` · `tailwind.config.js` — os mesmos tokens em 4 formatos
- `spec/politica.ts` — regras de negócio como módulo puro tipado, pronto para portar
- `spec/casos-de-teste.md` — 41 casos tabelados cobrindo política, saldo, ordenação e faixas
- `spec/navegacao.md` — telas, transições e contrato da pilha de navegação
- `spec/componentes.md` — inventário de componentes com props sugeridas
- `spec/acessibilidade.md` — contrastes medidos, alvos de toque e leitores de tela
- `data/seed.json` — dados-semente e chaves de storage
- `assets/` — SVGs das duas curvas e dos 3 ícones da navbar (+ `LEIA-ME.md` de uso)

### Protótipos de referência
- `App - Aula em Dia.dc.html` — **o app navegável completo** (fonte principal; abra no navegador)
- `support.js` — runtime que o arquivo acima carrega (necessário para o protótipo rodar localmente)
- `Design System - Aula em Dia.dc.html` — tokens, tipografia e componentes base
- `Style Tile - Aula em Dia.dc.html` — direção visual
- `Fluxo A - Entrada e configuracao.dc.html` — onboarding (não integrado ao app)
- `Fluxo C - Reposicao.dc.html`, `Fluxo D - Pacote e financeiro.dc.html`,
  `Fluxo E - Configuracoes.dc.html` — boards por fluxo, com as telas em estado estático
- `Fluxo F - Visao do aluno (web).dc.html` — visão web do aluno (não integrada ao app)

## Fora de escopo do protótipo
Autenticação, backend/sincronização, envio real de mensagens ao aluno, calendário real
(as janelas de reposição são fixas), múltiplos professores e internacionalização.
Datas são fixas em agosto/setembro de 2025.
