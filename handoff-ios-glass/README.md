# Handoff: Aula em Dia — App iOS Glass

## Overview

**Aula em Dia** é um app para professores particulares autônomos controlarem pacotes de aulas pré-pagas: quantas aulas o aluno já usou, o que acontece quando ele falta, quando cabe reposição e o que está em atraso. O problema central do produto é que a política de faltas do professor é hoje informal e, por isso, aplicada de forma inconsistente — o app transforma essa política em regra configurável e a aplica no momento do registro da aula.

Este pacote contém **uma direção visual específica** do produto: a direção *iOS Glass*, construída sobre convenções de plataforma iOS com material translúcido ("liquid glass"). Ela convive no projeto com uma direção anterior (tinta chapada, fonte Outfit), que **não** faz parte deste handoff.

Escopo: 9 telas, 3 abas, 2 temas (claro e escuro), 390 × 844 px.

## About the Design Files

Os dois arquivos `.dc.html` deste pacote são **referências de design criadas em HTML** — protótipos que mostram aparência e comportamento pretendidos. **Não são código de produção para copiar.**

A tarefa é **recriar estes designs no ambiente já existente do codebase de destino** (React, React Native, SwiftUI, Flutter, etc.), usando seus padrões e bibliotecas estabelecidos. Se ainda não existe ambiente, escolha o framework mais apropriado e implemente lá.

Observação sobre o material de vidro: ele foi construído em CSS (`backdrop-filter` + sombras internas). Em plataformas nativas existem primitivas melhores — `UIVisualEffectView` / `Material` no SwiftUI, `BlurView` no React Native. **Use a primitiva nativa e calibre pelos valores documentados na seção Design Tokens**, em vez de reimplementar as quatro camadas de CSS.

Os arquivos abrem direto no navegador. `support.js` é o runtime que os renderiza e **não** deve ser portado — é andaime do ambiente de design.

## Fidelity

**Alta fidelidade (hifi).** Cores, tipografia, espaçamento, raios, sombras e estados estão finalizados e devem ser reproduzidos fielmente. Todos os valores numéricos deste README foram lidos do arquivo, não estimados.

O protótipo é também **funcional**: a regra de negócio da política de faltas está implementada de verdade (não é mock de tela). A lógica na seção State Management é normativa — é o comportamento que o app precisa ter.

## Screens / Views

Sistema: 3 abas (Alunos, Financeiro, Ajustes), cada uma com uma tela empilhada abaixo, mais 3 sheets modais que sobem por cima de qualquer contexto.

### Chrome comum a todas as telas

**Aparelho.** 390 × 844 px, raio 48px, `overflow: hidden`. No documento de design ele está dentro de uma moldura preta (`#0A0D14`, padding 4px, raio 52px) — isso é apresentação, não parte do app.

**Fundo de refração.** Camada em `position: absolute; inset: 0` sob todo o conteúdo, `pointer-events: none`, opacidade 0.85 (claro) / 0.60 (escuro). Quatro gradientes radiais:

```
radial-gradient(58% 44% at 14%  6%, --m1 0%, transparent 70%)
radial-gradient(52% 40% at 96% 14%, --m2 0%, transparent 68%)
radial-gradient(64% 46% at 82% 92%, --m3 0%, transparent 72%)
radial-gradient(50% 34% at  8% 74%, --m4 0%, transparent 70%)
```

Claro: `--m1 #8FB6FF`, `--m2 #FFD6A5`, `--m3 #CDB8FF`, `--m4 #9FE3D0`.
Escuro: `--m1 #1B3A80`, `--m2 #5C3A16`, `--m3 #3A2C73`, `--m4 #164A45`.

**Esta camada não é decoração.** Sem ela o vidro não tem o que refratar e todo o material colapsa em retângulos cinzas translúcidos. É o primeiro item a implementar.

**Status bar.** Altura 52px, `z-index: 22`, `pointer-events: none`, padding `0 30px 0 34px`. Hora à esquerda (Satoshi 700/15px, tabular-nums, `letter-spacing: -.01em`, cor `--ink`); à direita ícones de sinal (19 × 11px) e wi-fi (16 × 12px) em `--ink`, mais bateria (24 × 12px, borda 1.3px `--ink3`, raio 4px, preenchimento 72% em `--ink`). A hora varia por tela no protótipo (14:20 nas telas de aluno, 10:20 no financeiro, 21:05 em ajustes) — detalhe de apresentação.

**Barra de navegação.** `position: absolute; top: 0`, altura 94px, `z-index: 18`, `pointer-events: none`. Fundo `--glass` + `--bf` + borda inferior `.5px solid --hair`. O título (Satoshi 700/16.5px, `-.01em`, `--ink`, elipse em overflow) fica nos 44px inferiores, centralizado, com padding lateral de 60px.

A barra inteira é controlada por **opacidade**, derivada da rolagem: `min(1, max(0, (scrollTop − 16) / 34))`, arredondado a 1 decimal, transição `opacity .18s linear`. Ou seja: invisível no topo, cheia após ~50px de rolagem. Vale para **todas** as telas, incluindo as empilhadas.

**Botão voltar.** Só nas telas empilhadas (Ficha do aluno, Cobrança, Política). `position: absolute; top: 50px; left: 12px`, `z-index: 20`, altura 44px, padding `0 10px`, gap 3px. Chevron de 19px (`stroke-width: 2.6`, linecap/linejoin round) + nome da tela anterior em Satoshi 600/16px, ambos em `--tint`. Fica sempre visível, independente da rolagem — não acompanha a opacidade da barra. Rótulos: "Alunos", "Financeiro", "Ajustes".

**Tab bar.** Ver seção Componentes.

**Padding de conteúdo.** Telas de aba: `54px 16px 126px`. Telas empilhadas: `100px 16px 126px` (abre espaço para o botão voltar). Os 126px inferiores garantem que a tab bar nunca cubra conteúdo.

**Barra de rolagem.** Não desenhada dentro do aparelho (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`), como no iOS.

---

### 1. Alunos (`home`) — aba 1, raiz

**Propósito.** Ponto de partida do dia. Responde "quem tem aula hoje" e "quem precisa de atenção" antes de qualquer outra coisa.

**Layout.** Coluna única, rolável.

1. **Cabeçalho**, padding `8px 6px 2px`, flex com `align-items: flex-end; justify-content: space-between`, gap 14px.
   - Esquerda: data ("Quinta, 28 de agosto") em Satoshi 600/13px `--ink2`; abaixo, com 8px, o título grande "Alunos" em Satoshi 800/34px, `line-height: 1.05`, `letter-spacing: -.035em`.
   - Direita (`text-align: right`, `padding-bottom: 4px`): contagem de aulas de hoje em Satoshi 800/26px tabular `-.04em` em `--tint`; abaixo, com 4px, "hoje" em Satoshi 600/11px `--ink2`.
2. **Controle segmentado** (margin-top 18px): Urgência / A–Z / Hoje. Ver Componentes.
3. **Lista agrupada de alunos** (margin-top 16px). Ver Componentes.
4. **Botão primário** "Registrar aula" (margin-top 18px), com ícone de mais (19px, `stroke-width: 2.4`) + rótulo, gap 9px. Ver Componentes.

**Ordenação.** O segmento escolhido define a ordem:
- *Urgência* (padrão): peso 0 = pagamento em atraso, 1 = reposição pendente, 2 = normal, 3 = sem pacote; empate resolvido por saldo crescente.
- *A–Z*: `localeCompare` pelo nome.
- *Hoje*: filtra `aluno.hoje === true` (não reordena).

---

### 2. Ficha do aluno (`aluno`) — empilhada sob Alunos

**Propósito.** Tudo sobre um aluno em uma tela: quanto ainda tem, o que está pendente, o que já aconteceu.

**Layout.**

1. **Identificação**, flex gap 14px, padding lateral 4px. Avatar 62 × 62px, raio 21px, iniciais em Satoshi 800/21px `-.02em`, cores por estado (ver Avatar em Componentes). Ao lado: nome em Satoshi 800/25px `line-height: 1.1` `-.03em`; abaixo, com 5px, "Disciplina · dia, hora" em Satoshi 500/13.5px `--ink2`.
2. **Cartão de saldo** (margin-top 18px) — só se o aluno tem pacote. Cartão de vidro, raio 22px, padding `17px 18px`.
   - Linha superior: flex `align-items: flex-end; justify-content: space-between`, gap 12px. Esquerda: rótulo "SALDO DO PACOTE" (Satoshi 600/12px, `letter-spacing: .04em`, uppercase, `--ink3`); abaixo, com 9px, número em Satoshi 800/40px tabular `-.045em` — `--tint`, ou `--ambar` se saldo ≤ 2 — seguido de "aulas" em Satoshi 600/14px `--ink2`, gap 7px, alinhados por baseline. Direita: duas linhas em Satoshi 500/12px `line-height: 1.5` tabular `--ink2`, `text-align: right` — "validade DD/MM" (mais " · estendida" quando aplicável) e "N de M reposições".
   - **Medidor de pacote** (margin-top 16px): uma barra por aula do pacote, flex gap 4px, cada uma `flex: 1; height: 7px; border-radius: 4px`. Aulas usadas em `--fill2`; restantes em `--tint`, ou `--ambar` se saldo ≤ 2.
   - Rodapé (margin-top 10px): "N de M usadas" em Satoshi 500/12.5px tabular `--ink2`.
3. **Blocos de status** (margin-top 14px cada, na ordem): pausado, pagamento em atraso (clicável → Cobrança), reposição pendente, reposição confirmada. Só aparecem quando o estado existe. Ver Componentes.
4. **Extrato.** Cabeçalho de grupo "EXTRATO" (margin-top 26px, padding lateral 6px, Satoshi 600/12px `.05em` uppercase `--ink3`). Lista agrupada (margin-top 9px), uma linha por lançamento, min-height 62px, padding `12px 15px`:
   - Coluna de data: largura fixa 38px, Satoshi 600/11.5px tabular `--ink3`.
   - Meio: título em Satoshi 700/14px `-.01em`; subtítulo com 3px em Satoshi 500/12px `--ink2`.
   - Direita: delta em Satoshi 800/14px tabular — `--verm` se negativo, `--tint` se positivo, `--verde` se zero, `--verde` + "✓" se é pagamento; abaixo, com 4px, "saldo N" (ou "recebido") em Satoshi 500/11px tabular `--ink3`.
   - Vazio: "Nenhum lançamento ainda." centralizado, padding `30px 20px`, Satoshi 500/13.5px `--ink2`.
5. **Ações** (margin-top 18px, coluna gap 10px): "Registrar aula" (primário) se tem pacote e não está pausado; "Criar pacote de 8 aulas" (primário) se não tem pacote; "Renovar pacote" (secundário) se saldo ≤ 2.

---

### 3. Registrar aula (`registrar`) — sheet

**Propósito.** A tela mais importante do app. É aqui que a política de faltas é aplicada, e o ponto de design é que o **efeito no saldo aparece antes da confirmação**, não depois.

**Layout.** Sheet de 88% de altura. Título = nome do aluno (ou "Registrar aula" se ainda não há aluno). Ação de rodapé: "Confirmar".

**Passo 1 — escolher aluno** (só quando aberto pelo botão da tela Alunos, sem aluno no contexto). Cabeçalho "QUAL ALUNO" + lista agrupada de alunos elegíveis (com pacote, não pausados), min-height 68px: avatar 40 × 40px raio 14px em `--tintSoft`/`--tint`, nome Satoshi 700/15.5px, linha de apoio Satoshi 500/12.5px `--ink2`, e à direita um bloco `padding: 6px 10px; border-radius: 10px; background: --fill` com o saldo em Satoshi 800/14px tabular + "aulas" em Satoshi 600/10.5px `--ink2`.

**Passo 2 — desfecho.** Cabeçalho "O QUE ACONTECEU" + quatro cartões de escolha (coluna gap 9px). Ver Cartão de escolha em Componentes. Cada um mostra título, subtítulo e, à direita, o efeito no saldo no formato `antes → depois` em Satoshi 800/14px tabular (`--verm` se debita, `--verde` se não).

| Escolha | Título | Subtítulo (não selecionado) | Efeito |
|---|---|---|---|
| `realizada` | Aula realizada | Aconteceu como o combinado | −1 |
| `avisada` | Falta avisada | O aluno avisou antes | depende da política |
| `sem_aviso` | Falta sem aviso | Não apareceu e não avisou | −1 |
| `cancelei` | Cancelei a aula | A ausência foi sua | 0, reposição obrigatória |

Quando selecionado, o subtítulo é substituído pela explicação da regra aplicada (ver State Management).

**Sub-controle de antecedência.** Só dentro do cartão `avisada`, e só quando ele está selecionado. Separador `padding-top: 13px; border-top: .5px solid --hair` (margin-top 13px), cabeçalho "ANTECEDÊNCIA DO AVISO" (Satoshi 600/11.5px `.04em` uppercase `--ink3`), segmentado de 48h / 26h / 10h com altura 36px, e abaixo (11px) a nota em Satoshi 500/12.5px `--ink2` explicando o resultado. O efeito exibido no cartão recalcula ao vivo conforme o segmento muda — é a mecânica central da tela.

**Botão.** Desabilitado até haver aluno **e** desfecho escolhidos.

---

### 4. Resultado (`resultado`) — sheet

**Propósito.** Confirmar o que foi lançado e oferecer o próximo passo, quando houver.

**Layout.** Sheet de 74%, sem "Cancelar" no topo, título "Registrado". Conteúdo centralizado (`text-align: center`, padding `10px 4px 0`):

1. Ícone 72 × 72px, raio 26px, check de 34px (`stroke-width: 2.6`). Fundo `--verde` se não debitou, `--tint` se debitou; traço do check em branco sobre verde, `--onTint` sobre tint. Sombra `--gin, 0 10px 28px --sombra`.
2. Título (margin-top 18px): o rótulo do desfecho, Satoshi 800/25px `line-height: 1.15` `-.03em`.
3. Saldo (margin-top 22px): número em Satoshi 800/54px tabular `-.05em` (`--tint`, ou `--ambar` se ≤ 2) + "aulas restam" em Satoshi 600/15px `--ink2`, gap 9px, baseline.
4. Delta (margin-top 8px): "−1 aula" ou "sem debitar", Satoshi 600/13px tabular `--ink3`.
5. Explicação (margin-top 22px): Satoshi 500/14.5px `line-height: 1.55` `--ink2`, `max-width: 300px`, `text-wrap: pretty`.
6. Bloco "Sem reposição" (margin-top 20px), só quando a falta geraria reposição mas o limite do pacote já foi atingido. Fundo `--fill`, raio 20px, `text-align: left`.

**Rodapé.** "Escolher horário" (primário) quando há reposição a marcar; "Fechar" (secundário) sempre.

---

### 5. Escolher horário (`reposicao`) — sheet

**Propósito.** Marcar a reposição sem sair para um calendário: o app já sabe a agenda e propõe janelas com o motivo de cada uma.

**Layout.** Sheet de 88%, título "Escolher horário".

1. Sub-linha (padding `4px 6px 0`): "Nome · validade DD/MM · N de M reposições usadas", Satoshi 500/13px tabular `--ink2`.
2. **Se o limite foi atingido**: bloco âmbar "Limite de reposições atingido" com o texto da contagem e um botão secundário "Rever política" que navega para a tela Política.
3. **Se liberado**: cabeçalho "N HORÁRIOS POSSÍVEIS" (margin-top 16px) + cartões de escolha (gap 9px). Cada cartão: dia em Satoshi 700/15.5px `-.012em` e hora em Satoshi 800/15.5px tabular na mesma linha (gap 8px, `flex-wrap: wrap`, baseline); o primeiro recebe o selo "MELHOR" (altura 19px, padding `0 7px`, raio 6px, `--tintSoft`, Satoshi 700/10px `.04em` uppercase `--tint`); motivo com 4px em Satoshi 500/12.5px `--ink2`, `text-wrap: pretty`.
4. Botão secundário "Estender validade em 15 dias" (margin-top 12px, altura 50px, raio 17px), só se a validade ainda não foi estendida. Ao acionar, acrescenta uma quarta janela à lista ("Quinta, 11/09, 18h — só cabe dentro da validade estendida").

**Janelas propostas** (dados do protótipo):
- Sexta, 29/08, 17h — "Livre na sua agenda e o aluno já teve aula nesse horário"
- Sábado, 30/08, 10h — "Livre, mas fora do horário habitual do aluno"
- Terça, 02/09, 19h — "Emenda na aula do Rafael, sem intervalo entre as duas"

**Rodapé.** "Confirmar e avisar o aluno", desabilitado até escolher uma janela.

---

### 6. Financeiro (`financeiro`) — aba 2, raiz

**Propósito.** Quanto entrou, quanto falta e quem está devendo.

**Layout.**

1. Cabeçalho: "Agosto de 2026" em Satoshi 600/13px `--ink2` + título grande "Financeiro".
2. **Três cartões de resumo** (margin-top 18px, flex gap 9px, `flex: 1` cada): raio 19px, padding `14px 13px`, vidro. Rótulo em Satoshi 600/11px `--ink2`; valor com 10px em Satoshi 800/21px tabular `-.04em`. A receber → `--ambar`; Recebido → `--verde`; Em atraso → `--verm`; zero → `--ink3`. Valores formatados `R$ N.NNN` (pt-BR, sem centavos).
3. **Em atraso** (margin-top 24px): cabeçalho com contagem à direita em Satoshi 700/12px `--verm`. Lista agrupada, min-height 66px, linhas clicáveis → Cobrança. Avatar 38 × 38px raio 13px em `--vermSoft`/`--verm`; nome Satoshi 700/15px `-.012em`; detalhe "Venceu DD/MM · N dias"; valor em Satoshi 800/15px tabular `--verm`; chevron.
4. **A vencer** (margin-top 24px): mesma estrutura, avatar em `--fill`/`--ink2`, valor em `--ink`, sem chevron, não clicável. Detalhe "Vence DD/MM".
5. **Recebido** (margin-top 24px): avatar `--verdeSoft`/`--verde`, valor `--verde`. Detalhe "Pago em DD/MM · Pix".
6. **Cartão de aulas dadas** (margin-top 24px), vidro, raio 22px, padding `17px 18px`: cabeçalho "AULAS DADAS EM AGOSTO"; número com 12px em Satoshi 800/34px tabular `-.045em`, e à direita duas linhas em Satoshi 500/12px `--ink2` com as contagens de reposições e faltas debitadas. Abaixo (15px), uma barra proporcional: três segmentos `height: 7px; border-radius: 4px`, gap 4px, com `flex` = contagem (mínimo 1), nas cores `--tint` (aulas), `--ambar` (reposições), `--verm` (faltas).
7. Botão primário "Cobrar os N em atraso" (margin-top 18px), só se há atrasos.

---

### 7. Cobrança (`inadimplencia`) — empilhada sob Financeiro

**Propósito.** Decidir o que fazer com um aluno inadimplente, com o contexto na mão — inclusive se dá ou não a aula de hoje.

**Layout.**

1. Cabeçalho: linha de apoio (disciplina · horário) em Satoshi 600/13px `--ink2`; nome com 7px em Satoshi 800/29px `line-height: 1.1` `-.035em`.
2. **Cartão de débito** (margin-top 18px), fundo `--vermSoft`, raio 22px, padding 18px, borda `.5px --edge`, sombra `--gin`.
   - Linha superior: "EM ABERTO" (Satoshi 600/12px `.05em` uppercase `--ink3`) + valor com 9px em Satoshi 800/32px tabular `-.045em` `--verm`; à direita, "Pacote de N" e "venceu DD/MM" em Satoshi 500/12px tabular `--ink2`.
   - Separador (`margin-top: 14px; padding-top: 13px; border-top: .5px solid --hair`) e três pares rótulo/valor em coluna gap 8px, Satoshi 500/13px tabular `--ink2` com o valor em 700 `--ink`: "Aulas dadas sem pagamento", "Último lembrete", "Histórico de atrasos".
3. **Cartão de contexto** (margin-top 14px), vidro, raio 20px: "Aula marcada para hoje, 17h" em Satoshi 700/14.5px + "O pagamento venceu há N dias. Você decide se dá a aula." em Satoshi 500/12.5px `--ink2`.
4. **O que fazer** (margin-top 24px): lista agrupada de 4 ações, min-height 62px, título Satoshi 700/14.5px + subtítulo Satoshi 500/12px `--ink2`, chevron à direita.
   - "Enviar lembrete de cobrança" — "Mensagem pronta com a chave Pix"
   - "Registrar pagamento recebido" — "Se ele já pagou por fora"
   - "Pausar/Retomar as próximas aulas" — rótulo e subtítulo alternam conforme o estado
   - "Combinar parcelamento" — "2 × R$ …, registrado à mão"
5. Botão primário "Registrar pagamento recebido" (margin-top 18px).

---

### 8. Ajustes (`ajustes`) — aba 3, raiz

**Layout.** Título grande "Ajustes", depois:

1. **Cartão de perfil** (margin-top 18px), vidro, raio 22px, padding `15px 16px`, flex gap 13px: avatar 48 × 48px raio 17px em `--tint` com iniciais em `--onTint` Satoshi 800/16px; nome Satoshi 700/16.5px; sub-linha "N alunos com pacote · M cadastrados" Satoshi 500/12.5px `--ink2`; chevron.
2. **Grupo "REGRAS DO SEU TRABALHO"** (margin-top 24px), 3 linhas de min-height 64px: "Política de faltas" (clicável → tela 9, sub-linha resumindo a política vigente), "Minha disponibilidade" ("13 blocos · 26h por semana"), "Pacotes e valores padrão" ("8 aulas · R$ 80,00 por aula · N dias").
3. **Grupo "APP"** (margin-top 24px): "Aparência" com segmentado Claro/Escuro embutido à direita (altura 30px, padding `0 14px`); "Avisos e lembretes"; "Chave Pix e cobrança"; "Conta e assinatura" (sub-linha "Plano gratuito"). Linhas de 58px.
4. **Bloco de estado do protótipo** (margin-top 24px), fundo `--fill`, raio 22px: explicação + botão "Zerar dados de demonstração" (altura 40px, padding `0 18px`, raio 13px, fundo `--vermSoft`, texto Satoshi 700/14px `--verm`). **Este bloco é andaime de protótipo — não portar.**
5. Rodapé "Versão 0.5 · protótipo acadêmico", centralizado, Satoshi 500/11.5px `--ink3`.

---

### 9. Política de faltas (`politica`) — empilhada sob Ajustes

**Propósito.** Transformar a regra informal do professor em configuração explícita. É a tela que dá sentido ao resto do app.

**Layout.** Título "Política de faltas" em Satoshi 800/29px, depois quatro cartões de vidro (raio 22px, padding `16px 17px`):

1. **Prazo mínimo de aviso** — segmentado 4h / 12h / 24h / 48h, altura 36px.
2. **Falta avisada devolve a aula** — switch. Sub-linha alterna entre "Dentro do prazo, o saldo não é debitado" e "A aula é debitada mesmo com aviso".
3. **Reposições por pacote** — stepper de 0 a 5. Valor 0 exibe "—" e significa "sem limite". Sub-linha fixa: "Depois do limite, a falta debita".
4. **Validade do pacote** — segmentado 30 dias / 60 dias / sem prazo.

**Aviso de impacto** (margin-top 12px), fundo `--ambarSoft`, raio 22px — aparece só quando há alteração não salva, e o texto depende de **qual** campo mudou. É a peça que informa retroatividade:

| Campo alterado | Título | Texto |
|---|---|---|
| Limite de reposições | "Você mudou o limite de N para M" | "Vale só para pacotes novos. Os N pacotes em andamento seguem com a regra antiga até vencer." |
| Prazo de aviso | "Prazo de aviso muda de Nh para Mh" | "Vale a partir do próximo registro de aula. Os lançamentos já feitos não mudam." |
| Devolve a aula | "Falta avisada volta a devolver a aula" / "… passa a debitar sempre" | "Vale a partir do próximo registro de aula." |
| Validade | "Validade padrão muda para X" | "Aplica-se aos pacotes criados a partir de agora." |

**Rodapé.** "Salvar alterações" (primário, desabilitado sem mudanças, altura 54px) e "Descartar" (texto puro, altura 46px, Satoshi 600/15px `--ink2`, hover → `--ink`).

---

## Componentes

Raios do sistema: **26px** tab bar · **22px** cartões e listas agrupadas · **21px** pílula de aba · **20px** blocos de status e cartões de escolha · **19px** cartões de resumo · **18px** botões · **17px** botão secundário compacto · **15px** avatar 44px · **13px** avatar 38px / botão inline · **12px** trilho de segmentado · **9px** segmento.

### Cartão de vidro (base de tudo)

```
border-radius: 22px
background: var(--card)
backdrop-filter: var(--bf)          /* + -webkit- */
border: .5px solid var(--edge)
box-shadow: var(--gin), var(--gsh)
```

Quatro camadas, nesta ordem, e nenhuma é dispensável:

1. **Fundo colorido** sob tudo (ver Chrome comum) — sem ele o material não tem o que refratar.
2. **Miolo translúcido** — `--card` ou `--glass` com `blur(16px) saturate(190%) brightness(1.08)`. Blur **baixo** e saturação **alta**: o vidro passa a cor de trás, não a apaga. Blur alto é o erro mais comum aqui.
3. **Reflexo especular interno** (`--gin`) — quatro sombras internas de 1.4px (topo forte, base média, laterais suaves) mais um halo interno de 14px. É o que dá espessura à peça.
4. **Anel de refração** (`--bfRim`) — **só na tab bar**. Ver abaixo.

Regras: um nível de vidro por camada de profundidade (fundo → cartão → barra → sheet). Nunca vidro sobre vidro sobre vidro. Nunca texto pequeno com transparência sobre o material.

### Tab bar

```
position: absolute; left: 14px; right: 14px; bottom: 26px; z-index: 19
height: 66px; border-radius: 26px; padding: 5px; display: flex; gap: 4px
background: var(--glass); backdrop-filter: var(--bf)
border: .5px solid var(--edge)
box-shadow: var(--gin), 0 16px 40px var(--sombra), 0 2px 6px rgba(9,15,30,.08)
```

**Anel de refração** — filho absoluto cobrindo a barra, `pointer-events: none`, `border-radius: 26px`, `backdrop-filter: var(--bfRim)`, `padding: 9px` e máscara que deixa só a moldura visível:

```
mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
mask-composite: exclude;
-webkit-mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
-webkit-mask-composite: xor;
```

É isso que faz a borda parecer curvar a luz. **Não replicar em peças pequenas** (fica pequeno demais para ler como lente e come o ícone) **nem onde texto passa por baixo** (pinta sobre o conteúdo). Em plataforma nativa, o equivalente é a borda do material nativo — não vale reimplementar a máscara.

**Item.** `flex: 1`, altura 56px, raio 21px, ícone de 23px (`stroke-width: 1.9`, sem fill) acima do rótulo em Satoshi 700/10.5px, gap 4px, coluna centralizada. Inativo: ícone e rótulo em `--ink3`, sem fundo. Ativo: ícone e rótulo em `--tint`, mais

```
background: linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.03) 44%, rgba(255,255,255,.02) 70%, rgba(255,255,255,.2))
border: .5px solid var(--edgeTop)
box-shadow: var(--gin), 0 4px 12px var(--sombra)
```

mais um brilho: filho absoluto `left: 8%; right: 8%; top: -52%; height: 86%`, raio 99px, `filter: blur(6px)`, `background: linear-gradient(180deg, rgba(255,255,255,0) 56%, rgba(255,255,255,.55))`.

**Indicador de home.** `left: 50%; bottom: 9px; width: 134px; height: 5px; margin-left: -67px`, raio 3px, `background: --ink`, opacidade .28, `z-index: 20`, `pointer-events: none`.

A tab bar (e o indicador) **desaparecem enquanto um sheet está aberto**.

**Abas e seus ícones** (paths de 24 × 24, `stroke-width: 1.9`, round):

```
Alunos      M9.3 11.2a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2M3.7 19.3c0-3.1 2.5-4.9 5.6-4.9s5.6 1.8 5.6 4.9M16.4 11.5a2.6 2.6 0 100-5.2M17.5 14.6c1.9.4 3 1.9 3 4.7
Financeiro  M3.9 9.9A2.4 2.4 0 016.3 7.5h11.4a2.4 2.4 0 012.4 2.4v6.2a2.4 2.4 0 01-2.4 2.4H6.3a2.4 2.4 0 01-2.4-2.4zM3.9 11.7h16.2M6.9 15.5h3.2
Ajustes     M4.4 8.2h6.4M14.2 8.2h5.4M4.4 15.8h5.3M13.4 15.8h6.2M10.8 8.2a1.7 1.7 0 103.4 0 1.7 1.7 0 10-3.4 0M9.7 15.8a1.7 1.7 0 103.4 0 1.7 1.7 0 10-3.4 0
```

A aba fica ativa também nas telas empilhadas sob ela (Alunos ↔ Ficha do aluno, Financeiro ↔ Cobrança, Ajustes ↔ Política).

### Sheet modal

Fundo: `position: absolute; inset: 0; z-index: 30`, `background: rgba(6,10,20,.4)`, animação `fade .2s ease`. Área acima do painel (`flex: 1`, min-height 44px) fecha ao toque.

Painel:

```
border-radius: 40px 40px 0 0
background: var(--sheet); backdrop-filter: var(--bf)
border-top: .5px solid var(--edgeTop)
box-shadow: var(--gin), 0 -18px 50px rgba(6,10,20,.32)
animation: sobe .34s cubic-bezier(.32,.72,0,1)   /* translateY(100%) → 0 */
```

Altura: **88%** para sheets de tarefa, **74%** para o de resultado.

Estrutura em três faixas:
- **Puxador**: `padding: 9px 0 2px`, barra de 38 × 5px, raio 3px, `--ink3`, centralizada.
- **Cabeçalho**: altura 52px, padding lateral 18px. "Cancelar" à esquerda (Satoshi 600/15.5px `--tint`, largura fixa 72px), título centralizado (Satoshi 700/16px `-.015em`, elipse), 72px vazios à direita para equilibrar. O sheet de resultado não tem "Cancelar".
- **Corpo**: `flex: 1; overflow-y: auto`, padding `6px 16px 16px`.
- **Rodapé**: `flex: none`, padding `10px 16px 30px`, `border-top: .5px solid --hair`, com a ação primária.

### Lista agrupada

Contêiner: cartão de vidro com `overflow: hidden` e raio 22px. Linhas empilhadas, separador `.5px solid var(--hair)` em todas menos a última. Hover (onde clicável): `background: var(--fill)`.

**Linha de aluno.** min-height 76px, padding `13px 14px 13px 15px`, flex gap 13px:
- Avatar 44 × 44px, raio 15px, iniciais Satoshi 800/15px `-.02em`.
- Meio: nome Satoshi 700/16px `line-height: 1.2` `-.015em` (elipse); linha de apoio com 3px em Satoshi 500/13px `--ink2` (elipse); faixa de status opcional com 7px.
- Direita: saldo Satoshi 800/17px tabular `-.03em` + unidade com 3px em Satoshi 600/10px `--ink3`, `text-align: right`; chevron de 14px (`stroke-width: 2.6`) em `--ink3`.

**Faixa de status.** `display: inline-flex`, altura 21px, padding `0 8px`, raio 7px, Satoshi 700/10.5px `letter-spacing: .02em` tabular. Prioridade (só uma por linha, nesta ordem):

| Estado | Fundo | Texto | Conteúdo |
|---|---|---|---|
| Pausado | `--fill` | `--ink2` | "Pausado até regularizar" |
| Em atraso | `--vermSoft` | `--verm` | "Atraso de N dias" |
| Reposição pendente | `--ambarSoft` | `--ambar` | "Reposição pendente" / "… há N dias" |
| Reposição marcada | `--verdeSoft` | `--verde` | "Reposição DD/MM · HHh" |

### Avatar

Iniciais = primeira letra do primeiro nome + primeira do segundo, maiúsculas. Cores por estado do aluno:

| Estado | Fundo | Texto |
|---|---|---|
| Normal | `--tintSoft` | `--tint` |
| Saldo ≤ 2 | `--ambarSoft` | `--ambar` |
| Sem pacote | `--fill` | `--ink3` |

### Controle segmentado

Trilho: `display: flex; padding: 3px; border-radius: 12px; background: var(--fill); gap: 2px`. Segmento: `flex: 1`, raio 9px, Satoshi 600/13.5px `-.01em`, centralizado. Altura 34px (filtros), 36px (dentro de cartões), 30px (embutido em linha de lista).

| | Fundo | Texto | Borda | Sombra |
|---|---|---|---|---|
| Ativo | `--glass2` | `--ink` | `.5px solid --edge` | `0 1px 4px --sombra` |
| Inativo | transparente | `--ink2` | `.5px solid transparent` | nenhuma |

### Cartão de escolha (radio)

Raio 20px, padding `14px 15px`, min-height interna 42px, flex gap 12px.

| | Fundo | Borda | Sombra | Marca (24px, círculo) |
|---|---|---|---|---|
| Selecionado | `--tintSoft` | `.5px solid --tint` | `--gin, 0 8px 22px --sombra` | fundo `--tint`, borda `.5px --tint`, check em `--onTint` |
| Não selecionado | `--card` + `--bf` | `.5px solid --edge` | `--gin` | transparente, borda `1.5px --ink3`, check invisível |

Check: path `M6 12.4l4 4L18 8`, 14px, `stroke-width: 3`, round.

### Switch

52 × 32px, raio 16px, padding 2.5px, `display: flex`, `transition: background .2s ease`. Ligado: `background: --tint`, `justify-content: flex-end`. Desligado: `background: --fill2`, `flex-start`. Botão: 27 × 27px, círculo branco, `box-shadow: 0 2px 6px rgba(9,15,30,.28)`.

### Stepper

Trilho `padding: 3px; border-radius: 12px; background: var(--fill)`, gap 4px. Botões 38 × 34px, raio 9px, `background: --glass2`, borda `.5px --edge`, glifo Satoshi 700/19px em `--tint` (ou `--ink3` no limite). Valor entre eles em Satoshi 800/18px tabular, `min-width: 26px`, centralizado.

### Botões

| Tipo | Altura | Raio | Fundo | Texto | Sombra |
|---|---|---|---|---|---|
| Primário | 54px | 18px | `--tint` | `--onTint`, Satoshi 700/16.5px `-.015em` | `--gin, 0 10px 26px --tintSh` |
| Primário desabilitado | 54px | 18px | `--fill2` | `--ink3` | nenhuma |
| Secundário | 52px | 18px | `--glass2` + `--bf`, borda `.5px --edge` | `--tint`, Satoshi 700/16px | nenhuma |
| Secundário compacto | 50px | 17px | `--glass2`, borda `.5px --edge` | `--tint`, Satoshi 600/14.5px | nenhuma |
| Inline em bloco | 40px | 13px | `--tint` ou `--glass2` | `--onTint` / `--tint`, Satoshi 700/14px | nenhuma |
| Texto | 46px | — | nenhum | `--ink2`, Satoshi 600/15px; hover `--ink` | nenhuma |

Hover do primário: `filter: brightness(1.07)`. Largura total, exceto o inline (`display: inline-flex`, padding `0 18px`). **Um primário por tela.**

### Blocos de status

Raio 20px, padding `15px 16px` (com ícone) ou `16px 17px` (só texto), borda `.5px solid --edge`, fundo = a variante Soft da cor. Ícone opcional: 34 × 34px, raio 12px, cor cheia, glifo branco de 17px. Título Satoshi 700/14.5px na cor cheia; texto Satoshi 500/12.5px `line-height: 1.4` `--ink2`, tabular quando tem número. Botão inline opcional com margin-top 13px.

### Toast

```
position: absolute; left: 16px; right: 16px; bottom: 106px; z-index: 40
border-radius: 20px; padding: 14px 16px; display: flex; gap: 11px
background: var(--glass); backdrop-filter: var(--bf)
border: .5px solid var(--edge)
box-shadow: var(--gin), 0 16px 38px var(--sombra)
animation: fade .2s ease
```

Ícone 26 × 26px, raio 9px, `background: --tint`, check de 14px em `--onTint`. Texto Satoshi 600/13px `line-height: 1.4` `--ink`, tabular. Duração **3600ms**. Confirma o que foi feito em uma frase; **nunca pede ação**.

### Alvos de toque

Nunca abaixo de 44px. Segmentos de 34px cumprem isso somando o padding do trilho e a área da linha que os contém.

---

## Interactions & Behavior

### Navegação

Três abas, cada uma com uma tela empilhada. Trocar de aba **zera** a pilha e limpa contexto (aluno selecionado, desfecho, janela, rascunho). Empilhar **empurra** `{tela, alunoId}` na pilha; voltar **desempilha**. Pilha vazia + voltar → Alunos.

Sheets são um terceiro eixo: ao fechar um sheet, o app volta para a última tela **não-sheet** da pilha (ou a ficha do aluno, se havia contexto de aluno; senão Alunos), e remove as entradas de sheet da pilha.

Fluxos:
- Alunos → toque na linha → Ficha do aluno
- Alunos → "Registrar aula" → sheet Registrar (escolhe aluno primeiro)
- Ficha → "Registrar aula" → sheet Registrar (aluno já no contexto)
- Registrar → Confirmar → sheet Resultado
- Resultado → "Escolher horário" → sheet Reposição → Confirmar → Ficha do aluno (com toast)
- Ficha → bloco de atraso → Cobrança
- Financeiro → linha em atraso → Cobrança
- Cobrança → "Registrar pagamento" → volta (com toast)
- Ajustes → "Política de faltas" → Política → Salvar → Ajustes (com toast)
- Reposição bloqueada → "Rever política" → Política

### Rolagem

A opacidade da barra de navegação é calculada da rolagem em degraus de 0.1, como descrito no Chrome comum. Vale em todas as telas; o botão voltar não participa.

### Animações

| O quê | Duração | Easing | Propriedade |
|---|---|---|---|
| Sheet entrando | 340ms | `cubic-bezier(.32,.72,0,1)` | `translateY(100%)` → 0 |
| Fundo do sheet | 200ms | ease | opacidade 0 → 1 |
| Toast | 200ms | ease | opacidade 0 → 1 |
| Barra de nav | 180ms | linear | opacidade |
| Switch | 200ms | ease | background |

### Estados

Não há loading nem erro de rede: o protótipo é local. Em produção, as ações de mutação (registrar, receber, salvar política, marcar reposição) precisam de estado de envio e de falha — o design não os cobre, então siga o padrão do codebase.

Validação: os botões primários de Registrar, Reposição e Política ficam desabilitados até a condição ser satisfeita (aluno + desfecho / janela escolhida / haver mudança). Não há mensagem de erro em nenhum formulário.

### Responsividade

Fora de escopo: o design é fixo em 390 × 844. Ao portar, trate 390 como a largura mínima e deixe o conteúdo esticar — nenhuma medida do layout depende de largura fixa exceto a moldura do aparelho, que é apresentação.

---

## State Management

### Modelo

```
Politicas {
  avisoHoras: number          // 4 | 12 | 24 | 48, padrão 24
  avisadaDevolve: boolean     // padrão true
  limiteReposicoes: number    // 0..5, padrão 3; 0 = sem limite
  validadeDias: number        // 0 | 30 | 60, padrão 60; 0 = sem prazo
}

Aluno {
  id, name, disciplina, dia, hora
  hoje: boolean
  total: number               // aulas do pacote
  usadas: number
  semPacote?: boolean
  validade?: string
  validadeEstendida?: boolean
  reposicoes: number          // já usadas neste pacote
  pausado?: boolean
  pendencia?: { origem: string, dias: number }     // reposição sem horário
  agendada?: { dia: string, hora: string }
  pagamento: { status: 'pago' | 'aberto' | 'atraso' | 'sem', ... }
  lembretes?, ultimoLembrete?, atrasosHistoricos?
}

Lancamento { d, t, s, delta, saldo, dinheiro? }    // extrato, por aluno
```

Derivados: `saldo = max(0, total − usadas)`; `valor = total × 80`; `podeRepor = limiteReposicoes === 0 || reposicoes < limiteReposicoes`.

Estado de UI: `tela`, `pilha[]`, `alunoId`, `filtro`, `tema`, `desfecho`, `avisoH` (antecedência escolhida no sheet, padrão 26), `janela`, `toast`, `rascunho` (cópia editável da política), `rolagem`.

### A regra de negócio (normativa)

Dado um desfecho, o sistema calcula `{ delta, reposicao, nota }`:

```
realizada   → delta −1, sem reposição
sem_aviso   → delta −1, sem reposição
cancelei    → delta  0, reposição OBRIGATÓRIA
avisada     → se !avisadaDevolve:          delta −1, sem reposição
              senão se avisoH >= avisoHoras: delta  0, reposição gerada
              senão:                        delta −1, sem reposição
```

A reposição só é **criada** se `podeRepor(aluno)`. Quando o limite já foi atingido, a tela de resultado informa isso explicitamente em vez de falhar em silêncio — esse é o comportamento esperado, não um caso de borda.

Notas exibidas (texto exato, porque explicar a regra é parte do produto):
- `realizada`: "Aula usada normalmente"
- `sem_aviso`: "Falta sem aviso debita a aula"
- `cancelei`: "Você cancelou, então a reposição é obrigatória"
- `avisada`, política não devolve: "Sua política não devolve a aula em falta avisada"
- `avisada`, dentro do prazo: "Aviso com Nh, dentro do mínimo de Mh"
- `avisada`, fora do prazo: "Aviso com Nh, abaixo do mínimo de Mh"

### Transições

**Confirmar registro.** Se `delta < 0`, `usadas += 1`. Se gera reposição e `podeRepor`, define `pendencia = { origem: hoje, dias: 0 }`. Lança no extrato com o rótulo e o detalhe do desfecho. Navega para Resultado.

**Confirmar reposição.** `reposicoes += 1`, limpa `pendencia`, define `agendada`. Lança "Reposição marcada". Toast e volta para a ficha.

**Registrar pagamento.** `pagamento = { status: 'pago', em: hoje, meio: 'Pix' }`, `pausado = false`. Lança pagamento (flag `dinheiro: true`, aparece como "✓ / recebido" no extrato). Toast com o valor.

**Criar pacote.** `total = 8`, `usadas = 0`, validade conforme `validadeDias`, `pagamento = { status: 'aberto' }`. Lança "Pacote de 8 aulas".

**Renovar pacote.** `total += 8`, nova validade, `validadeEstendida = false`, `pagamento = { status: 'aberto' }`.

**Estender validade.** Empurra a validade 15 dias e marca `validadeEstendida = true`, o que libera uma quarta janela de reposição. Lança no extrato.

**Salvar política.** Copia o rascunho para a política. **Não recalcula lançamentos passados** — as mensagens de retroatividade da tela 9 são a contrapartida dessa decisão, e precisam ser respeitadas na implementação.

**Pausar aluno.** Remove o aluno da lista de seleção do sheet Registrar e exibe a faixa "Pausado até regularizar".

### Persistência

No protótipo, `localStorage`: chave `aulaemdia.ios.v1` para alunos/extratos/políticas, `aulaemdia.ios.v1.tema` para o tema. Ao portar, substitua pela camada de persistência do codebase. Tema também deve persistir.

### Dados de demonstração

Quatro alunos, escolhidos para cobrir os estados do sistema:

| Aluno | Disciplina | Pacote | Estado |
|---|---|---|---|
| Valentin Klein | Matemática, quarta 17h | 6, usadas 2 | Pagamento em atraso há 12 dias (venceu 16/08), 1 lembrete enviado, 3 atrasos em 6 meses. Aula hoje. |
| Rafael Dornelas | Violão, segunda 19h | 8, usadas 6 | Reposição pendente desde 12/08 (há 3 dias), 1 reposição já usada, pagamento a vencer 12/09. |
| Mateus Alves | Inglês, terça e quinta 18h | 8, usadas 3 | Em dia (pago 01/08 via Pix). Aula hoje. Extrato com falta avisada e falta sem aviso, para mostrar os dois resultados. |
| Bernardo Lemos | Inglês, sem horário fixo | — | Sem pacote, último encerrado em 04/07. |

Data de referência: 28/08. Valor da aula: R$ 80,00.

---

## Design Tokens

Declarados uma vez em `[data-tema]` e sobrescritos em `[data-tema="escuro"]`. **Nenhum componente carrega valor de cor próprio** — tudo passa por variável, e é isso que faz os dois temas existirem sem duplicar código. Ao portar, mantenha essa disciplina.

### Material

| Token | Valor |
|---|---|
| `--glassA` | `.62` (fixo nos dois temas) |
| `--bf` | `blur(16px) saturate(190%) brightness(1.08)` — claro |
| `--bf` | `blur(18px) saturate(175%) brightness(1.12)` — escuro |
| `--bfRim` | `blur(9px) saturate(300%) brightness(1.2)` — claro |
| `--bfRim` | `blur(10px) saturate(240%) brightness(1.3)` — escuro |

`--gin` (reflexo especular interno), claro:

```
inset 0  1.4px .8px -.7px rgba(255,255,255,.98)
inset 0 -1.4px .8px -.7px rgba(255,255,255,.66)
inset  1.4px 0 .8px -.7px rgba(255,255,255,.6)
inset -1.4px 0 .8px -.7px rgba(255,255,255,.6)
inset 0 0 14px 5px rgba(255,255,255,.16)
```

escuro:

```
inset 0  1.4px .8px -.7px rgba(255,255,255,.6)
inset 0 -1.4px .8px -.7px rgba(255,255,255,.26)
inset  1.4px 0 .8px -.7px rgba(255,255,255,.22)
inset -1.4px 0 .8px -.7px rgba(255,255,255,.22)
inset 0 0 16px 5px rgba(255,255,255,.07)
```

`--gsh` (sombra de contato + difusa): claro `0 10px 28px var(--sombra), 0 1px 2px rgba(9,15,30,.05)`; escuro `0 12px 32px var(--sombra), 0 1px 2px rgba(0,0,0,.3)`.

### Cor

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--tela` | `#E9EEF7` | `#06080F` | fundo do aparelho |
| `--ink` | `#0B1220` | `#F4F7FC` | títulos e texto de leitura |
| `--ink2` | `rgba(11,18,32,.72)` | `rgba(244,247,252,.78)` | texto de apoio |
| `--ink3` | `rgba(11,18,32,.62)` | `rgba(244,247,252,.64)` | legenda, cabeçalho de grupo, chevron |
| `--hair` | `rgba(11,18,32,.085)` | `rgba(255,255,255,.1)` | separador |
| `--card` | `rgba(255,255,255,calc(.62 * .9))` | `rgba(26,34,52,calc(.62 * .9))` | miolo de cartão |
| `--glass` | `rgba(255,255,255,calc(.62 * .82))` | `rgba(38,48,70,calc(.62 * .8))` | barras e toast |
| `--glass2` | `rgba(255,255,255,.7)` | `rgba(52,64,90,.66)` | botão secundário, segmento ativo |
| `--sheet` | `rgba(244,247,252,.62)` | `rgba(20,26,42,.6)` | painel do sheet |
| `--edge` | `rgba(255,255,255,.88)` | `rgba(255,255,255,.24)` | borda de vidro |
| `--edgeTop` | `rgba(255,255,255,1)` | `rgba(255,255,255,.5)` | reflexo de topo |
| `--fill` | `rgba(118,138,178,.15)` | `rgba(255,255,255,.08)` | trilho, hover, bloco neutro |
| `--fill2` | `rgba(118,138,178,.26)` | `rgba(255,255,255,.15)` | aula usada, botão desabilitado |
| `--tint` | `#35577D` | `#9FBEDF` | destaque do sistema |
| `--tintSoft` | `rgba(53,87,125,.14)` | `rgba(159,190,223,.2)` | fundo de seleção, avatar |
| `--tintSh` | `rgba(53,87,125,.34)` | `rgba(0,0,0,.45)` | sombra do primário |
| `--onTint` | `#FFFFFF` | `#0B1524` | texto sobre o destaque |
| `--verm` | `#DE203A` | `#FF5F72` | atraso, aula debitada |
| `--vermSoft` | `rgba(222,32,58,.12)` | `rgba(255,95,114,.16)` | |
| `--ambar` | `#C07C00` | `#FFC24D` | pendência, saldo baixo, limite |
| `--ambarSoft` | `rgba(224,150,0,.16)` | `rgba(255,194,77,.16)` | |
| `--verde` | `#158A61` | `#33D69F` | pago, confirmado, aula devolvida |
| `--verdeSoft` | `rgba(21,138,97,.13)` | `rgba(51,214,159,.15)` | |
| `--sombra` | `rgba(9,15,30,.13)` | `rgba(0,0,0,.5)` | |

**A cor de destaque é fixa em #35577D.** No tema escuro ela vira `#9FBEDF` — mesma matiz, clareada. O motivo: `#35577D` tem luminância baixa demais para funcionar como cor de *tinta* sobre fundo quase preto (ícone de aba ativa, chevrons, "Cancelar", links desaparecem). A cor da marca muda de valor, nunca de identidade. Consequentemente o texto sobre o destaque também inverte: branco no claro, `#0B1524` no escuro — é o que `--onTint` resolve.

**Status sempre como fundo suave** (12–16% de alfa) **com o texto na cor cheia.** Cor cheia no fundo só em avatares de 34px e ícones.

### Tipografia — Satoshi

Fonte: **Satoshi** (Fontshare, licença gratuita). Pesos usados: 500, 600, 700, 800. Carregada via `https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900,variable&display=swap`. Nenhum peso 300/400/900 é usado na interface — pode reduzir o subset.

| Papel | Especificação |
|---|---|
| Título grande | 800 · 34px · 1.05 · −.035em |
| Título de tela empilhada | 800 · 29px · 1.1 · −.035em |
| Saldo destacado (resultado) | 800 · 54px · tabular · −.05em |
| Saldo (cartão) | 800 · 40px · tabular · −.045em |
| Número de resumo | 800 · 21–34px · tabular · −.04em |
| Título de sheet / nav | 700 · 16–16.5px · −.015em |
| Nome em lista | 700 · 16px · 1.2 · −.015em |
| Título de bloco | 700 · 14.5–15.5px · −.01em |
| Botão primário | 700 · 16.5px · −.015em |
| Texto de apoio | 500 · 13px · 1.3 · `--ink2` |
| Texto de bloco | 500 · 12.5px · 1.4–1.45 · `--ink2` |
| Cabeçalho de grupo | 600 · 12px · .05em · uppercase · `--ink3` |
| Faixa de status | 700 · 10.5px · .02em |
| Rótulo de aba | 700 · 10.5px |

Todo número de saldo, data, hora, contagem e valor monetário usa `font-variant-numeric: tabular-nums`. Valores em `R$ N.NNN,NN` (pt-BR); nos cartões de resumo, sem centavos.

### Espaçamento

Escala observada: **3 · 4 · 5 · 7 · 8 · 9 · 10 · 12 · 13 · 14 · 16 · 18 · 22 · 24 · 26px**. Padrões: 16px de margem lateral do conteúdo; 18px entre cabeçalho e primeiro bloco; 24px antes de um cabeçalho de grupo; 9–10px entre cabeçalho de grupo e seu conteúdo; 12–14px entre cartões irmãos.

### Raios

`3 · 6 · 7 · 8.5 · 9 · 11 · 12 · 13 · 14 · 15 · 17 · 18 · 19 · 20 · 21 · 22 · 26 · 40 · 48px` — ver a lista por componente na seção Componentes.

---

## Assets

Nenhuma imagem, nenhuma fonte de ícone, nenhum SVG externo. Todos os ícones são paths inline em viewBox 24 × 24, sem fill, `stroke-width` 1.9 (aba), 2.4–2.6 (chevron, check, mais), linecap e linejoin `round`. Os paths das abas estão transcritos na seção Tab bar; os demais (chevron `M9 5.5l6.5 6.5L9 18.5`, check `M6 12.4l4 4L18 8`, mais `M12 5.6v12.8M5.6 12h12.8`, alerta `M12 7v6.4M12 16.6v.4`) estão no corpo do arquivo do app.

Ao portar, prefira o conjunto de ícones já usado no codebase e case a espessura de traço — a leveza do traço de 1.9px na tab bar é parte do caráter do desenho.

Fonte Satoshi: baixar de fontshare.com e servir localmente, ou manter o CDN.

## Files

| Arquivo | O que é |
|---|---|
| `App - Aula em Dia (iOS Glass).dc.html` | O app completo: 9 telas, 3 abas, 2 temas, regra de negócio funcional. Abre no navegador e é navegável de verdade. |
| `Design System - Aula em Dia (iOS Glass).dc.html` | O sistema em 8 seções: material nos dois temas, receita do vidro, cor, tipografia, componentes sobre o fundo real, regras de tela, tabela de tokens. Consulte-o para ver os valores aplicados, não só descritos. |
| `support.js` | Runtime do ambiente de design. Necessário para os dois arquivos abrirem; **não portar**. |

Ambos os `.dc.html` guardam estado em `localStorage` — o botão "Zerar dados de demonstração" em Ajustes restaura os quatro alunos originais.

### O que deliberadamente não está no design

Cadastro e edição de aluno, autenticação, tela de disponibilidade, integração de pagamento, envio real de mensagem, notificações, visão do aluno. Os pontos de entrada existem (linhas de Ajustes, ações de cobrança) mas levam a nada. Se o escopo do codebase incluir esses fluxos, eles precisam de design antes da implementação.
