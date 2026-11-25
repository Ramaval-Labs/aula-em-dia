# /designer — minhaDisponibilidade — 2026-11-24

Branch `designer/2026-11-24-minhadisponibilidade` · ponto de partida `0bc6acc` (branch `scrum-101-horarios-livres`, PR #59) · pedido: "minhaDisponibilidade"

## Resumo

**O que estava.** A `GradeLivre` do SCRUM-101 tinha três defeitos:
- a prévia do arrasto ficava translúcida por cima de um horário marcado, com texto sobreposto e contraste de 1,2:1;
- a grade pulava sob o dedo quando a pintura começava;
- sobravam valores soltos no código.

Além disso, a tela tinha cerca de 2.150px de altura, porque a lista repetia a grade linha por linha.

**O que mudou.**
- A prévia mostra o resultado e a grade não pula mais.
- A lista fica recolhida numa linha só, e os dois switches sobem para logo abaixo da grade.
- A ajuda cabe em 1 linha e diz que o toque também apaga.
- O rodapé avisa quando o sábado não entra nas sugestões.
- A escala de texto da grade voltou para tamanhos que existem no sistema.

**O que ficou para depois.** Duas mudanças de domínio, o aviso ao sair com mudança não salva e a verificação no aparelho (ver Achados).

## Comandos rodados

| # | comando | por quê | commit | resultado |
|---|---|---|---|---|
| 1 | `harden` | os 3 P0 e o risco do VoiceOver | `c057c5c` | ok |
| 2 | `distill` | a tela longa e a lista que repetia a grade (P1) | `5c00983`, `f1bf368` | ok; o segundo commit corrige a abertura sozinha no navegador |
| 3 | `clarify` | a ajuda em 2 linhas e o sábado ignorado em silêncio (P1) | `7100420` | ok |
| 4 | `typeset` | texto de 10px, hora em `tinta3` e rótulo "14h\n20h" empilhado (P2) | `d8b4837` | ok |

O commit `b3bdb38` não é desta rodada. Ele corrige dois testes do CI do PR #59 (banco e função do aluno) e veio da branch do PR.

## Achados

Revisor: audit 13/20, critique 26/40.

### P0
- **Prévia translúcida sobre um horário marcado** (texto sobreposto, 1,2:1) — corrigido.
  - A coluna do arrasto desenha `pintar()`, ou seja, o resultado.
  - A prévia tem só o contorno e o próprio rótulo: `sobreTint` quando marca, `tint` quando apaga.
- **A grade pula sob o dedo quando o aviso muda de 2 para 1 linha** — corrigido. A caixa do aviso guarda a altura da ajuda, e o texto do arrasto fica sobreposto a ela.
- **Valores soltos** — corrigido.
  - Padding 4/3 → token `PAD.blocoDaGrade`.
  - Borda 1,5 → 1, a do foco do campo.
  - Deslocamento de −6 → metade da entrelinha do rótulo.

### P1
- **A tela era longa demais e a lista repetia a grade** — corrigido.
  - `ListaDeHorarios recolhida` vira a linha "Ajustar pelo teclado", nas 5 telas da grade.
  - No aparelho, ela abre sozinha com o leitor de tela ligado.
  - Economiza cerca de 450px.
- **O sábado pintado era ignorado em silêncio** — corrigido.
  - Com "Sugerir sábados" desligado, o rodapé diz "Sábado e domingo fora" e o cabeçalho SÁB vai para `tinta3`.
  - Os switches ficam colados na grade.
- **A ajuda ficava entre os dias e as colunas, em 2 linhas** — corrigido. Ela sobe para cima do cabeçalho: "Toque marca ou apaga 1 hora. Segure e arraste: 15 em 15 min."
- **O duplo toque do VoiceOver podia marcar uma hora** — corrigido com `onAccessibilityTap` vazio. Falta conferir no aparelho.

### P2
- **Hora em `tinta3`**, uma regressão em relação à grade antiga — corrigido: `tinta2`.
- **Texto de 10px** — corrigido.
  - Dias a 12/600 e horas a 11,5.
  - Rótulo do bloco a 11/700: "14h30" mede cerca de 35px num miolo de 36 a 360dp.
- **Rótulo "14h\n20h" empilhado no topo** — corrigido. O começo fica no topo e o fim ancorado na base.
  - O rótulo usa o trecho recortado.
  - A régua ganhou a marca das 23h.
- **Teto de fonte inconsistente** — corrigido em parte.
  - A ajuda perdeu o teto e segue a fonte do sistema.
  - Os rótulos presos à geometria da grade ficam com o teto de 1,3, e o cabeçalho dos dias ganhou o mesmo teto.
  - O `spec/acessibilidade.md` ainda não registra essa exceção (spec é proibido nesta rodada) — backlog.
- **Cabeçalho da lista** — corrigido: "Horários", como "Folgas e feriados".
- **`intervaloDigitado` aceita fora da janela 6h–23h** ("05:00–07:00") — backlog. É domínio, faixa do Mauro: precisa de um erro novo e de teste.
- **Sair pelo voltar descarta a grade pintada sem aviso** — backlog. Precisa interceptar o voltar da tela e o do Android, num padrão que as outras telas de Ajustes também adotariam.
- **Documentação** ainda descreve a `GradeSemanal` — backlog:
  - `DESIGN.md` §componentes;
  - `spec/componentes.md` e `spec/acessibilidade.md` (proibidos nesta rodada);
  - `MAPA-DE-TELAS.md`.

### P3
- **"14h—20h" parecia travessão** — falso positivo. É a meia-risca U+2013; o glifo é que é largo na Satoshi.
- **"14h às 20h" no rótulo acessível** — backlog. Mudaria o contrato que o teste de componente confere.
- **Entrada "14h30" no lugar de "14:30"** — backlog. A máscara está coberta por teste.
- **Retorno tátil quando o arrasto liga** — backlog. Pede `expo-haptics`, que é dependência nova.
- **"0 horários marcados" na página do aluno vazia** — backlog. `resumoDosMarcados` está no domínio. Sugestão: "Nenhum horário marcado".

### Detector
- 162 achados antes, 54 depois.
- Sobram só os falsos positivos já conhecidos:
  - o rótulo da tab bar a 10,5px, que vem do handoff;
  - os pesos da Satoshi;
  - Views de layout sem fundo;
  - o recorte da coluna;
  - a sonda do safe-area.

## Tokens novos

| token | claro | noturno | onde | por quê |
|---|---|---|---|---|
| `PAD.blocoDaGrade` | 3 · 4 | (o mesmo) | `GradeLivre`: bloco marcado, prévia e rótulo do fim ancorado na base | o padding do bloco era um valor solto (4/3) |

O token foi registrado em `tokens/tokens.json`, `mobile/src/tema/tokens.ts` e `DESIGN.md`.

## Decisões tomadas sem perguntar
- **A rodada partiu da branch do PR #59**, e não da `main`. A pessoa escolheu isso, porque a grade só existe lá.
  - Aprovada, a rodada volta para a branch do PR, e não para a `main`.
- **A lista recolhida vale nas 5 telas que usam a grade**, não só na Minha disponibilidade. É o mesmo componente com o mesmo problema, e um padrão diferente por tela seria pior.
- **O rodapé "Sábado e domingo fora"** vale também no passo 2 do onboarding, que grava `sugereSabado: false`.
- **"Sugerir sábados" não liga sozinho** quando há horário no sábado. Isso mudaria a regra do motor (domínio), e o rodapé resolve o silêncio.
- **No navegador a lista não abre sozinha.** O react-native-web responde sempre "leitor de tela ligado".

## Descartado (stash) e por quê
Nada.

## Verificação
- **Testes:** 1212 passaram; typecheck ok; lint ok. O CI do PR #59 está verde (função, banco, testes e Vercel).
- **Detector:** 162 → 54 achados.
- **Arrasto no Expo Web** (script com mouse):
  - "Apagar terça, 9h–11h" aparece sem sobreposição;
  - "Marcar sábado, 8h30–11h" aparece;
  - a página não rolou durante a pintura;
  - a prévia começa onde o mouse desceu.
- **Capturas:** `docs/design/revisoes/capturas/2026-11-24-minhadisponibilidade/` (fora do git):
  - antes e depois do topo, do meio e do fim;
  - topo no escuro;
  - lista aberta;
  - arrasto ao marcar e ao apagar;
  - DispAluno, onboarding 2 e a disponibilidade do aluno.
- **Falta, no aparelho:**
  - o toque longo contra a rolagem;
  - o VoiceOver e o TalkBack sobre a grade;
  - a lista abrindo sozinha com o leitor de tela.

## Como decidir
- **aprovar tudo** → "aprovado". A rodada é mesclada na branch `scrum-101-horarios-livres` e entra no PR #59.
- **aprovar parte** → "tira o <comando>"
- **recusar** → "descarta"
