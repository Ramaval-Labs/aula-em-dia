# Aula em Dia — app do professor (React Native + Expo)

Implementação do handoff que está na raiz deste repositório. Roda no **Expo Go**,
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
npm test          # 43 testes das regras de negócio (spec/casos-de-teste.md)
npm run typecheck # tsc --noEmit
```

## Stack e por quê

| Escolha | Motivo |
|---|---|
| **Expo (SDK 57) + React Native + TypeScript** | é a stack declarada no Envio 01 e roda no Expo Go sem build nativa |
| **Zustand** | duas lojas pequenas (dados e navegação) sem o boilerplate de reducers |
| **Navegação própria** | `spec/navegacao.md` define um contrato curto e específico (trocar de aba zera a pilha, concluir um fluxo a substitui). São ~90 linhas testáveis, contra configurar um navegador inteiro para nove telas |
| **react-native-svg** | as duas curvas assinatura e os ícones da navbar são paths, não imagens |
| **expo-linear-gradient** | o vidro da pílula e a máscara de scroll são gradientes |
| **AsyncStorage** | mesma chave versionada do protótipo (`aulaemdia.app.v3`) |

## Mapa

```
App.tsx                      composição: tema → área segura → tela → navbar → toast
src/dominio/                 regras puras — sem UI, sem storage, sem rede
  politica.ts                  porte de spec/politica.ts (a fonte da verdade das regras)
  datas.ts                     a data "hoje" do app, num lugar só
  formato.ts                   moeda e números em pt-BR, sem depender de Intl
  tipos.ts                     Aluno, Pagamento, Lancamento, Politicas…
  __tests__/politica.test.ts   os 41 casos de spec/casos-de-teste.md
src/dados/                   semente (cópia de ../data/seed.json) e chaves de storage
src/estado/                  dados persistidos, máquina de navegação e toast
src/tema/                    tokens tipados, tipografia Satoshi, provider de tema
src/componentes/             chassi (curvas, navbar, cabeçalho, Tela) e peças
src/telas/                   as nove telas
assets/fonts/                Satoshi 400/500/600/700/800
```

## Detalhes que não são acidentais

- **As duas curvas** (`src/componentes/Curva.tsx`) usam os paths de `../assets/`, sempre na
  mesma direção. A do cabeçalho é pintada com a cor do **conteúdo**; a da navbar é uma faixa
  de 58px que **ocupa espaço no fluxo**, para nunca cobrir um botão.
- **A pílula de vidro** não usa `backdrop-filter` nem `BlurView`: é gradiente, borda e
  sombras internas (`boxShadow` com `inset`, suportado no RN 0.76+). Isso é intencional.
- **Cor de texto é sempre explícita.** O React Native não herda `color` de um `View` pai;
  sem cor, o texto sai preto e some no cabeçalho escuro.
- **Satoshi** vem do arquivo variável da Fontshare, fatiado em instâncias estáticas
  400/500/600/700/800 com `fonttools` — a Fontshare só serve 300/400/500/700/900 estáticos,
  e o design usa 600 e 800. O RN não interpola eixos de fonte variável, por isso a família
  é escolhida pelo peso em `src/tema/tipografia.ts`.
- **A data "hoje"** está em `src/dominio/datas.ts`. O padrão é `28/08` (a data em que a
  semente foi escrita); `USAR_DATA_REAL = true` passa tudo a usar a data do aparelho.

## Onde a implementação diverge do protótipo

1. **Navbar nas telas de tarefa.** `README.md` e `spec/navegacao.md` dizem que ela só aparece
   em `home`, `financeiro` e `ajustes`; o `App - Aula em Dia.dc.html` também a mostra em
   `aluno`, `inadimplencia` e `politica`. Seguimos a spec.
2. **Saldo na tela de Resultado.** O protótipo aplica o delta duas vezes (mostra 2 quando o
   saldo real é 3). Aqui a tela mostra o saldo já gravado.
3. **Semente com `dias` inconsistente.** Rafael tem `pendencia.origem: "12/08"` e
   `dias: 3` — de 12/08 a 28/08 são 16 dias. Mantivemos os dados do handoff como estão;
   a decisão de qual dos dois vale é do time.

## Pendências que exigem decisão do time

- Backend e sincronização (hoje é tudo local).
- Envio real da mensagem ao aluno (hoje o app só registra e mostra o toast).
- Calendário real para o motor de reposição (as janelas ainda são as fixas do handoff).
- Licença da Satoshi para o app publicado.

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
