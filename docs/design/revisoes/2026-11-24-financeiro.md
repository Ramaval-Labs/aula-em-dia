# /designer — financeiro — 2026-11-24

Branch `designer/2026-11-24-financeiro` · ponto de partida `93faadd` (a `main`) · pedido: rodada 3
do `SCRUM-100`, validar com design os 2 sheets derivados do Financeiro, Registrar pagamento e Lembrete
de cobrança. Ela vem antes do congelamento do código para o vídeo da entrega final (24/11, 22h).

## Resumo

Os dois sheets seguiam o contrato do mapa: um primário no rodapé, o fundo de refração nos dois temas
e nada da direção aposentada. Os problemas eram de ordem e de texto:
- no Lembrete, o aviso do 2º lembrete ficava escondido sob o rodapé;
- no Pagamento, o valor vinha depois do meio de pagamento;
- a nota final prometia "uma fase futura, com o backend", e o backend já existe.

Os três comandos corrigiram isso. Ficou para depois o espaço não separável no "R$", que é do domínio.

## Comandos rodados

| # | comando | por quê | commit | resultado |
|---|---|---|---|---|
| 1 | `layout` (Lembrete, Pagamento) | P1: o 2º lembrete abaixo da dobra; P2: a ordem e o par DATA/VALOR desalinhado | `2eb2fbb` | o bloco âmbar logo após a sub-linha; o cartão de débito antes de "Como você recebeu"; "DATA" alinhada no topo com "VALOR" |
| 2 | `clarify` (Pagamento) | P2: a nota prometia o backend e repetia a nota do cartão | `983df9a` | "O app não confere o pagamento: confirme no seu banco antes de registrar." |
| 3 | `polish` (Pagamento) | P2: papel tipográfico | `4b4a284` | "Sua chave Pix" em `TIPO.rotuloCartao` |

## Achados

Do `revisor-design` (audit 17/20; critique 29/40; nenhum P0):

| prioridade | achado | situação |
|---|---|---|
| P1 | Lembrete: o bloco âmbar do 2º lembrete fica abaixo da dobra, escondido pelo rodapé | corrigido (`layout`) |
| P2 | Pagamento: "DATA" 13px abaixo de "VALOR" (o `linhaDebito` alinha pela base) | corrigido (`layout`, só na tela, sem mexer no componente) |
| P2 | Pagamento: o meio vinha antes do que se confirma; o bloco do Pix empurrava o valor | corrigido (`layout`) |
| P2 | Pagamento: a nota "…numa fase futura, com o backend" era falsa e repetida | corrigido (`clarify`) |
| P2 | Pagamento: "Sua chave Pix" com o cabeçalho de grupo dentro de cartão | corrigido (`polish`) |
| P2 | "Data" no cartão de débito com o cabeçalho de grupo | mantido: casa com o "VALOR" que o próprio `CartaoDeDebito` desenha (H§7) |
| P2 | `dinheiro()` usa espaço comum depois de "R$", e na prévia a linha quebra em "R$ / 480,00" | backlog do Mauro (`dominio/formato.ts`, U+00A0) |
| P3 | Lembrete: "Agendar o envio ainda não existe nesta versão" responde a uma pergunta que ninguém fez | backlog (opcional) |

Falsos positivos do detector:
- `low-contrast` (99): todos nas capturas escuras, com a tinta do escuro medida contra o branco;
- `design-system-font`: os pesos da Satoshi;
- `design-system-font-size`: os 32px do cartão de débito de H§7 e a tela de baixo;
- `cramped-padding`: as `View`s de layout sem fundo próprio;
- `layout-transition`: o chassi do Expo Web.

## Tokens novos

Nenhum.

## Decisões tomadas sem perguntar

- **O alinhamento do par DATA/VALOR fica no estilo local da tela**, e não no `CartaoDeDebito`. O
  alinhamento pela base do componente serve às notas de H§7, e mexer nele mudaria a Cobrança.
- **A frase nova da nota diz só o que o app faz** (não confere o pagamento) e não promete fase futura.

## Descartado (stash) e por quê

Nada.

## Verificação

- Testes: 1139 passaram, 43 suítes. Typecheck ok e lint ok, depois de cada comando.
- Detector: 147 → 131. O "antes" inclui as duas capturas `-fim`, e nenhum achado novo apareceu.
- Capturas: `docs/design/revisoes/capturas/2026-11-24-financeiro/` (fora do git), com `antes-*`,
  `passo-layout-*` e `depois-*`, no claro e no escuro. Nenhum erro de console.

## Como decidir

- **aprovar tudo** → "aprovado"
- **aprovar parte** → "tira o <comando>"
- **recusar** → "descarta"
