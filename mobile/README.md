# Aula em Dia — app do professor (React Native + Expo)

Implementação do handoff iOS Glass (`../handoff-ios-glass/`). Roda no **Expo Go**,
sem código nativo customizado.

## Rodar no celular

```bash
cd mobile
npm install
npx expo login   # obrigatório a partir do SDK 57 — conta gratuita em expo.dev
npx expo start
```

Leia o QR Code com o app **Expo Go**. Você precisa estar logado **na mesma conta** no
terminal e no app (aba *Home* → avatar no canto superior direito) — sem isso o Expo Go
recusa o projeto. O celular e o computador também precisam estar na mesma rede; se não
estiverem, use `npx expo start --tunnel`. Detalhes e outros erros comuns na seção
*Se o Expo Go não abrir o projeto*, no fim deste arquivo.

Para revisar lado a lado com o protótipo do handoff, `npx expo start --web` abre a mesma
build no navegador.

## Verificação

```bash
npm test          # 648 testes: regras, navegação, tokens, catálogo e montagem das 35 telas
npm run typecheck # tsc --noEmit
```

Screenshot de qualquer tela sem celular: `npm run capturar -- --tela <chave> [--aluno raf]`
(opções no topo de `scripts/capturar.mjs`).

## Stack e por quê

| Escolha | Motivo |
|---|---|
| **Expo (SDK 57) + React Native + TypeScript** | é a stack declarada no Envio 01 e roda no Expo Go sem build nativa |
| **Zustand** | lojas pequenas (dados, navegação, sessão, rascunhos, toast) sem o boilerplate de reducers |
| **Navegação própria** | `spec/navegacao.md` define um contrato curto e específico (trocar de aba zera a pilha, concluir substitui a pilha, sheet troca de conteúdo em vez de empilhar). São poucas linhas testáveis, contra configurar um navegador inteiro |
| **expo-blur** | o material de vidro do iOS Glass: `BlurView` nativo no iOS e no Android 12+, `backdrop-filter` no web, sempre pela primitiva `SuperficieVidro` |
| **react-native-svg** | o fundo de refração (quatro gradientes radiais) e os ícones são paths, não imagens |
| **expo-linear-gradient** | o miolo e o brilho do item ativo da tab bar |
| **AsyncStorage** | chave versionada `aulaemdia.app.v4` (+ tema em `CHAVE_TEMA`); a tela nunca escreve direto |

## Mapa

```
App.tsx                      Portao (entrada × app, fundo, toast) e App (fundo → tela → tab bar ou sheet)
src/dominio/                 regras puras — sem UI, sem storage, sem rede
  politica.ts                  porte de spec/politica.ts (a fonte da verdade das regras)
  datas.ts                     a data "hoje" do app, num lugar só
  formato.ts                   moeda e números em pt-BR, sem depender de Intl
  tipos.ts                     Aluno, Pagamento, Lancamento, Politicas…
  agenda.ts                    motor de sugestão de reposição
  disponibilidade.ts           grade semanal, folgas, interseção
  pacote.ts                    montagem e cálculo de pacote
  mensagens.ts                 textos gerados da política
  validacao.ts                 validação de formulário
  __tests__/                   os casos de spec/casos-de-teste.md e mais
src/dados/                   semente (cópia de ../data/seed.json) e chaves de storage
src/estado/                  dados persistidos, navegação (TIPO_DA_TELA), sessão, rascunhos, toast
src/tema/                    tokens tipados (espelho de ../tokens/tokens.json), tipografia, tema
src/componentes/             o catálogo iOS Glass (inventário em ../spec/componentes.md)
  Vidro.tsx                    FundoRefracao, SuperficieVidro, alvo de desfoque
  Chassi.tsx                   TelaVidro, barra de navegação, voltar, título de conteúdo
  Sheet.tsx TabBar.tsx Toast.tsx
  Controles.tsx Blocos.tsx Listas.tsx Campos.tsx GradeSemanal.tsx PreviaDeMensagem.tsx Icone.tsx
  useDoisToques.ts             confirmação em dois toques
  __catalogo__/                tela de desenvolvimento com cada peça em todos os estados
src/telas/                   as 35 telas
  comum/                       adaptadores de domínio de várias telas (extrato, frases do aluno)
  entrada/                     login e onboarding (Fluxo A), com o chassi TelaDeEntrada
  reposicao/                   assistente de 3 passos (Fluxo C)
  aluno/                       visão do aluno (Fluxo F)
  ajustes/                     sub-telas de configuração (Fluxo E)
  registro.ts                  o mapa tela → componente
scripts/capturar.mjs         screenshots no Expo Web (390 × 844)
assets/fonts/                Satoshi 400/500/600/700/800
```

## Detalhes que não são acidentais

- **O fundo de refração fica sob tudo.** Quatro gradientes radiais (`FundoRefracao`, opacidade
  0.85 no claro e 0.60 no escuro). O `Portao` o desenha sob a entrada; o `App` desenha o seu
  dentro do `AlvoDeDesfoque`, porque no Android o `BlurView` só desfoca o que está no alvo.
  Nada de fundo chapado por cima — nem na espera de carregamento.
- **Vidro só por `SuperficieVidro`.** `BlurView` + miolo translúcido + reflexo `gin` + borda de
  0,5px. Onde o blur não se sustenta (Android < 12, vidro dentro do próprio alvo de desfoque),
  a primitiva cai sozinha no fallback, que engrossa o miolo (`material.alfaExtraFallback`).
  Um nível de vidro por camada: fundo → cartão → barra → sheet. O anel de refração existe só
  na tab bar.
- **Três tipos de tela, um contrato.** `TIPO_DA_TELA` (`estado/navegacao.ts`) diz se a tela é
  raiz, empilhada ou sheet; teste cobra que toda chave tem tipo e que só sheet desenha o painel
  modal. A tab bar aparece em toda tela não-sheet e some com o painel aberto; o conteúdo
  reserva 126px embaixo para ela nunca cobrir nada.
- **A barra de navegação aparece com a rolagem; o voltar não.** Opacidade
  `min(1, max(0, (y − 16) / 34))` em degraus de 0.1 (`useBarraComRolagem`). O botão voltar é
  fixo, em tint, com o título curto da última tela não-sheet.
- **No sheet, a ação primária mora no rodapé fixo;** na tela empilhada, no fim do conteúdo.
- **Cor com papel fixo.** O tint muda de valor entre temas (`#35577D` / `#9FBEDF`), nunca de
  identidade; `sobreTint` inverte junto. Status é fundo suave com o texto na cor cheia; cor
  cheia no fundo só em avatar pequeno, ícone de bloco e medalha do Resultado (glifo em
  `sobreCor`).
- **Cor de texto é sempre explícita.** O React Native não herda `color` de um `View` pai.
- **Métrica de texto sai inteira de `texto()`.** A entrelinha nunca desce abaixo da tinta do
  Satoshi (1.25em) e o excedente volta como margem negativa; espaço vertical num texto é
  `comEspaco()`, nunca `marginTop` solto.
- **Satoshi** vem do arquivo variável da Fontshare, fatiado em instâncias estáticas
  400/500/600/700/800 — o RN não interpola eixos de fonte variável, por isso a família é
  escolhida pelo peso em `src/tema/tipografia.ts`.
- **A data "hoje"** está em `src/dominio/datas.ts` e é a do aparelho (`USAR_DATA_REAL = true`,
  desde o SCRUM-16). `USAR_DATA_REAL = false` congela o app em `28/08`, a âncora de onde os
  deslocamentos da semente foram derivados.
- **Reduzir movimento** (`tema/movimento.ts`) zera as transições do sheet, da barra, do switch
  e do toast em vez de deixá-las lentas.

## Onde a implementação diverge do protótipo

Protótipo = `../handoff-ios-glass/`. Nas 26 telas que ele não desenha, a referência de
conteúdo e comportamento é o histórico em `../docs/design/historico/tinta-chapada/`.

1. **Saldo na tela de Resultado.** O protótipo aplica o delta duas vezes. Aqui a tela mostra o
   saldo já gravado.
2. **Semente com `dias` inconsistente — resolvido no `SCRUM-15`.** O handoff trazia Rafael com
   `pendencia.origem: "12/08"` e `dias: 3`, mas de 12/08 a 28/08 são 16 dias. O valor errado
   era o `dias`: o extrato dele tem a "Falta avisada" em 12/08, que confirma a origem. A semente
   agora diz `origem: "hoje-16"` e `dias: 16`, e os dois seguem concordando com a data real
   ligada, porque a origem é relativa. Fica em aberto que `dias` é gravado e não derivado:
   `registrarAula` grava `dias: 0` e nada o atualiza depois, então a pendência criada no app
   mostra o número do dia em que nasceu. O banco já não guarda esse campo
   (`pendencia_origem` em `0001_esquema.sql`); derivar no domínio é mudança em `tipos.ts` e
   `politica.ts`.
3. **Reposição: janelas do motor `agenda.ts`**, com o motivo calculado, não as três fixas do
   protótipo.
4. **Resultado: "Voltar aos alunos" virou "Fechar"** (`fecharSheet()`), como em H§4 — volta
   para a última tela não-sheet, não sempre para Alunos.
5. **Confirmar reposição: "Trocar o horário" vai sempre para as sugestões**
   (`ir('reposicao')`).
6. **Prévia da proposta do aluno: tocar numa alternativa seleciona; o primário confirma.**
   Antes o toque na alternativa já aceitava.
7. **Ajustes: o bloco "Zerar dados de demonstração" saiu**, e o rodapé mostra só a versão — o
   handoff classifica os dois como andaime de protótipo. No Lembrete, saiu também o botão
   "Agendar para amanhã, 9h": o app não tem agendamento, e o botão prometia uma função inexistente.
8. **Pagamento aberto da Cobrança conclui voltando para a Cobrança** (antes ia sempre para o
   Financeiro), como no fluxo do handoff.
9. **Registrar: o efeito da "Falta avisada" só aparece depois de escolhida**, porque depende
   da antecedência do aviso, escolhida dentro do cartão.
10. **Registrar: as antecedências 48h/26h/10h são as do handoff, mas quem decide o efeito é a
    política salva** (`politica.ts`).
11. **A escolha de aluno no Registrar diz "hoje"** como as outras listas (a linha de apoio é a
    mesma `linhaDeHorario` da Home).
12. **"13 blocos · 26h por semana":** o protótipo conta 2h por bloco; o app usa a duração real.
13. **"Agosto de 2025", não 2026.** O `ANO_DEMO` de `dominio/datas.ts` é 2025 porque os dias da
    semana da semente (Valentin na quarta 17h, Rafael na segunda 19h, com a data de referência
    28/08) só batem em 2025; o "2026" escrito no protótipo é que é inconsistente com os próprios
    dados dele.
14. **Status como texto usa os tokens `*Texto`, e `sobreCor` no escuro é `#0B1524`.** As cores
    cheias do handoff (`#C07C00`, `#158A61`, `#DE203A`) ficam em 1,8–2,4:1 no claro sobre o
    próprio `*Suave` com as manchas por trás, e o glifo branco sobre verde/âmbar escuros fica em
    1,6–1,9:1. Os valores novos são a mesma matiz ajustada até passar 4,5:1 no pior caso — a
    conta está no comentário de `CORES` (`tema/tokens.ts`) e a tabela em
    `../spec/acessibilidade.md`.

## Pendências que exigem decisão do time

- Backend e sincronização (hoje é tudo local).
- Envio real da mensagem ao aluno (hoje o app só registra e mostra o toast).
- Calendário real para o motor de reposição (as janelas partem da disponibilidade salva).
- Licença da Satoshi para o app publicado.
- As 26 telas derivadas (sem desenho no handoff iOS Glass) precisam de validação de design —
  lista em `../PROXIMOS-PASSOS.md`.

## Se o Expo Go não abrir o projeto

### "You need to be signed in to Expo Go and Expo CLI"

A partir do **SDK 57**, o Expo Go exige que você esteja logado **na mesma conta** no terminal
e no aplicativo. Não é problema de rede nem de porta — é uma mudança de política do Expo.
Vale hoje para o Expo Go do iOS e está sendo estendida ao Android.
A conta é gratuita (<https://expo.dev/signup>).

1. **No terminal:** `npx expo login` (abre o navegador para autenticar).
2. **No Expo Go:** aba *Home* → toque no avatar no canto superior direito → entre com a
   **mesma conta**.
3. Rode `npx expo start` de novo e leia o QR Code.

Confira com `npx expo whoami` — tem que aparecer o seu usuário, não "Not logged in".

**Alternativa sem conta:** *development build* (`npx expo run:android`) não exige login, mas
precisa do Android Studio instalado e compila o app nativo. Para só conferir o visual,
`npx expo start --web` roda no navegador sem conta nenhuma.

### Se, já logado, o projeto ainda não carregar

1. **Celular e computador na mesma rede.** Se o PC está no cabo e o celular no Wi-Fi, os dois
   precisam estar no mesmo roteador e na mesma faixa de IP. Para digitar a URL na mão no
   Expo Go, use *Enter URL manually* com `exp://SEU_IP:8081` (o IP sai do `ipconfig` e
   também aparece embaixo do QR Code no terminal).
2. **Firewall do Windows.** Na primeira execução o Windows pergunta se libera o Node.js —
   marque **Redes particulares**. Se você negou antes, libere em
   *Firewall do Windows → Permitir um aplicativo*.
3. **Porta ocupada.** Se o CLI avisar que a 8081 está em uso, feche o processo antigo em vez
   de aceitar outra porta: `netstat -ano | findstr :8081` e depois `taskkill /PID <pid> /F`.
4. **Redes diferentes ou Wi-Fi corporativo/público** (que costuma isolar os aparelhos):
   use `npx expo start --tunnel`. É mais lento, mas não depende da rede local.
