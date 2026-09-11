# Product

<!-- impeccable:product-schema 1 -->

> Derivado de `HANDOFF.md`, `README.md`, `PROXIMOS-PASSOS.md`, `spec/acessibilidade.md` e da
> proposta `Envio01-AulaEmDia (1).pdf`. Fonte da verdade continua sendo esses arquivos; este é o
> resumo que o Impeccable lê antes de agir.

## Platform

adaptive

App React Native + Expo que roda no iOS e no Android com **uma linguagem visual própria, igual
nos dois sistemas** — ver *Brand Commitments*. Das diretrizes nativas valem as garantias do
sistema (área segura, alvos de toque de 44pt / 48dp, voltar do sistema, reduzir movimento,
escala de fonte), não a troca dos componentes da marca pelos nativos de cada plataforma.

## Users

**Professor particular autônomo** de idiomas, reforço escolar ou instrumento musical, que vende
pacotes de aulas pagos antecipadamente. Usa o app no celular, quase sempre logo ao fim de uma aula
ou entre uma aula e outra — com pressa e com uma mão. O trabalho dele no app: saber quem precisa
de atenção hoje, registrar o que aconteceu na aula, remarcar a aula perdida e receber.

**Aluno (ou responsável)**, público secundário: enxerga saldo, extrato e propostas de reposição
pela visão do aluno (Fluxo F). No MVP isso é um link público, não um app nativo.

Expansão prevista, fora do escopo atual: escolas de música e de idiomas, depois escolinhas
esportivas.

## Product Purpose

Controlar pacotes de aulas, faltas, reposições e pagamentos de cada aluno. O professor define uma
vez a própria **política de faltas** — antecedência mínima do aviso, se a falta avisada devolve a
aula, limite de reposições por pacote, validade do pacote — e o app passa a aplicá-la sozinho,
registrando o motivo de cada débito num extrato que o aluno também enxerga.

Sucesso é o fim de duas cenas: a discussão mensal em que ninguém consegue provar quantas aulas
restam, e a reposição esquecida (aula paga e não dada, pacote que expira).

## Positioning

Os concorrentes (Mensio, EnsinaApp, eClasse, iProfe e outros) resolvem o saldo do pacote — "basta
subtrair um". O Aula em Dia resolve **o que vem depois da falta**: a política é definida pelo
professor e aplicada automaticamente, e a reposição deixa de ser dez mensagens de WhatsApp para
virar as melhores janelas prontas, calculadas contra a agenda real (disponibilidade dos dois
lados, aulas fixas dos outros alunos, reposições já marcadas, validade do pacote), cada uma com o
motivo em texto. É um produto vertical de ensino: um produto horizontal, que atende de manicure a
locação de equipamentos, não pode construir essa regra.

## Operating Context

- Três abas: **Alunos**, **Financeiro**, **Ajustes**. A tela inicial abre no saldo, não na
  agenda: quem está com o pacote acabando ou devendo aparece primeiro, porque é onde está o
  dinheiro do professor.
- Fluxos: A entrada e onboarding · B registrar aula (quatro desfechos, com o efeito no saldo
  mostrado antes de confirmar) · C reposição (assistente de três passos) · D pacote e financeiro ·
  E configurações · F visão do aluno.
- Registrar aula é a tela mais usada e precisa se resolver em dois toques.
- Mensagens ao aluno saem pelo WhatsApp; hoje o app monta o texto e copia para a área de
  transferência.
- Dinheiro em reais, Pix como meio principal. Datas no formato `dd/mm`.

## Capabilities and Constraints

- React Native + Expo SDK 57 + TypeScript, rodando no Expo Go, sem código nativo customizado.
  Também roda no navegador pelo Expo Web, usado para conferência visual.
- 35 telas implementadas (7 de entrada e onboarding, 28 no app), temas claro e noturno.
- Regras de negócio são módulos puros e testados em `mobile/src/dominio/` e não moram na UI.
- Estado local (AsyncStorage). Dados de demonstração com "hoje" fixo em 28/08.
- Copy, código e nomes de arquivo em português do Brasil.
- **Terminologia:** saldo, pacote, validade (estendida), aula realizada, falta avisada, falta sem
  aviso, aula cancelada, reposição (pendente, marcada), política de faltas, extrato, janela,
  atraso, pausar aulas.
- **Em aberto, decisão do time:** backend e sincronização (Supabase é a escolha registrada); envio
  real da mensagem ao aluno; calendário real para as janelas de reposição; datas reais no lugar
  de 28/08; licença da fonte Satoshi para app publicado.

## Brand Commitments

- **Handoff de alta fidelidade aprovado** (`HANDOFF.md`, `tokens/`). Cores, tipografia,
  espaçamentos, raios e estados vêm dele; os valores vivem em `mobile/src/tema/tokens.ts`.
- **As duas curvas assinatura** entre o bloco escuro e o conteúdo claro — baixa à esquerda, reta no
  meio, subindo à direita, sempre na mesma direção — são obrigatórias.
- **Navbar com pílula de vidro** na aba ativa, feita de gradiente, borda e sombras internas, sem
  desfoque.
- **Amarelo `#FFD032` é só ênfase**, nunca fundo de área grande.
- **Satoshi** em todo o app; números sempre tabulares.
- **Wordmark** tipográfico com quatro barras verticais, a quarta em amarelo.
- **Voz:** direta, concreta e com números, em pt-BR. Ex.: "Reposição de Rafael em Sexta, 17h.
  Mensagem enviada."

## Evidence on Hand

- Dados de demonstração em `data/seed.json` (professor fictício e quatro alunos).
- Análise competitiva, tamanho de mercado (CNAE 8599-6/99 com cerca de 685 mil empresas; 92 mil em
  idiomas; 42 mil em música) e escopo do MVP na proposta `Envio01-AulaEmDia (1).pdf`.
- **Não existem:** depoimentos, clientes reais, métricas de uso, fotografias ou ilustrações. Não
  inventar nenhum deles.

## Product Principles

1. **A regra decide, não a discussão.** Todo débito de aula tem motivo registrado e visível ao
   aluno.
2. **O efeito aparece antes da ação.** O professor vê o que acontece com o saldo antes de confirmar.
3. **Atenção primeiro onde está o dinheiro.** Atraso, reposição pendente e saldo baixo sobem para
   o topo.
4. **Rápido no fim da aula.** O caminho mais usado cabe em dois toques.
5. **Toda sugestão tem motivo.** Uma janela de reposição sempre diz por que foi sugerida.

## Accessibility & Inclusion

Requisitos em `spec/acessibilidade.md`: contrastes medidos (`--suave` só para legenda não
essencial, `--texto-medio` para informação), alvo de toque da aba estendido para 48px e chips com
44px tocáveis, contador de saldo anunciado por inteiro ("4 aulas restantes de 6"), pontos do
pacote decorativos, delta do extrato com texto alternativo (cor nunca é o único sinal), toast como
região viva, tema do sistema na primeira carga, reduzir movimento e aumento de fonte do sistema
(nenhuma altura de cartão fixa).
