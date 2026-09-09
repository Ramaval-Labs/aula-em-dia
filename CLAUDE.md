# Instruções para o Claude Code — projeto Aula em Dia

O app **já está implementado** em `mobile/` (React Native + Expo, TypeScript, roda no Expo Go).
Este repositório é o handoff de design **mais** a implementação. Leia `mobile/README.md`
antes de mexer no código; `HANDOFF.md` é a especificação de design (era o `README.md` do
pacote original). `README.md` na raiz agora é a apresentação do projeto, e
`PROXIMOS-PASSOS.md` traz o backlog priorizado.

## Como rodar e verificar

```bash
cd mobile
npm install
npx expo login        # obrigatório desde o SDK 57 (conta gratuita)
npx expo start        # QR Code para o Expo Go
npm test              # 43 testes das regras de negócio
npm run typecheck     # tsc --noEmit
```

Rode `npm test` e `npm run typecheck` antes de dar qualquer tarefa por concluída.
Para conferir o visual sem celular: `npx expo start --web` (não exige login).

Desde o SDK 57 o Expo Go só abre o projeto com a **mesma conta** logada no terminal e no
app; sem isso ele mostra "You need to be signed in to Expo Go and Expo CLI". `npx expo login`
é interativo e pede senha — quem roda é a pessoa usuária, nunca o agente. Outros erros
comuns estão em `mobile/README.md`.

## Regras deste projeto

1. **Os arquivos `.dc.html` são referência visual, não código para copiar.** Eles usam um
   runtime de prototipagem próprio (`support.js`) que não vai para produção. Leia-os para
   extrair medidas, cores e comportamento.
2. **Fidelidade alta.** Os tokens vivem em `mobile/src/tema/tokens.ts` (espelho tipado de
   `tokens/tokens.json`). Não inventar valores: se faltar um token, pergunte antes de criar.
   Não escreva cor ou medida solta numa tela — importe do tema.
3. **As duas curvas são obrigatórias** e sempre na mesma direção (baixa à esquerda, reta no
   meio, subindo à direita). Já implementadas em `mobile/src/componentes/Curva.tsx`.
   Não substituir por `borderRadius`. A faixa da navbar ocupa espaço no fluxo, não é overlay.
4. **A pílula de vidro da aba ativa não usa `backdrop-filter` nem `BlurView`** — é gradiente,
   borda e sombras internas. Intencional: o desfoque quebrava o recorte do container.
5. **Amarelo `#FFD032` é só ênfase.** Nunca como fundo de área grande nem em texto pequeno
   sobre claro. Tinta sobre amarelo é sempre `#0E1626`.
6. **Números sempre tabulares** e moeda em pt-BR — use `texto()`/`TIPO` de
   `mobile/src/tema/tipografia.ts` e `dinheiro()` de `mobile/src/dominio/formato.ts`.
   Não chame `toLocaleString` direto: o Hermes nem sempre traz ICU completo.
7. **Regras de negócio não são negociáveis e não moram na UI.** Tudo em
   `mobile/src/dominio/politica.ts`, que é puro. Mudou regra? Atualize o teste em
   `mobile/src/dominio/__tests__/politica.test.ts` junto, e só depois ligue na tela.
8. **Copy em português do Brasil**, exatamente como nos arquivos de referência.
   Código e nomes de arquivo também em português, seguindo o que já existe em `mobile/src`.

## Convenções da implementação

- **Cor de texto é sempre explícita.** O React Native não herda `color` de um `View` pai;
  sem cor o texto sai preto e some no cabeçalho escuro.
- **Métrica de texto sai inteira de `texto()`.** A entrelinha do handoff (`altura`) é CSS,
  onde o glifo transborda da linha; no React Native ele é encaixado, então `texto()` nunca
  desce abaixo da tinta do Satoshi (1.25em, medida nos TTFs) e devolve o excedente como
  margem negativa simétrica. Por isso **não escreva `marginTop`/`marginBottom` soltos no
  `style` de um texto** — isso apaga a compensação e desalinha o glifo; use
  `comEspaco(estilo, { topo, base })`. Do mesmo jeito, não sobrescreva `fontSize` nem
  `lineHeight` em cima de um `TIPO.*`: chame `texto()` com o tamanho que você quer.
- **Data "hoje"** só sai de `mobile/src/dominio/datas.ts`. Nunca escreva `'28/08'` numa tela.
- **Navegação** é a máquina de `mobile/src/estado/navegacao.ts`, com o contrato de
  `spec/navegacao.md`: `ir` empilha, `voltar` desempilha, `trocarTab` zera a pilha,
  `concluir` substitui a pilha ao terminar um fluxo.
- **Estado persistido** em `mobile/src/estado/dados.ts` (chave `aulaemdia.app.v3`).
  A tela nunca escreve no AsyncStorage direto.
- **Acessibilidade** conforme `spec/acessibilidade.md`: aba com alvo de 48px, pontos do
  pacote são decorativos, delta do extrato tem texto alternativo, toast é `live region`.
- `mobile/src/dados/seed.json` é **cópia** de `data/seed.json` (o Metro não resolve fora da
  raiz do projeto). Ao mudar o handoff, copie de novo em vez de editar os dois.

## Onde está o quê

```
mobile/                        o app (ver mobile/README.md para o mapa interno)
README.md                      apresentação do projeto (é a página inicial no GitHub)
HANDOFF.md                     especificação de design (telas, medidas, tokens, estado)
PROXIMOS-PASSOS.md             backlog priorizado do que vem depois
IMPLEMENTACAO.md               plano em 6 fases — as seis estão concluídas
tokens/                        tokens em JSON, CSS, SCSS e Tailwind (fonte dos tokens)
spec/politica.ts               regras de negócio como módulo puro (referência do porte)
spec/casos-de-teste.md         casos de teste tabelados das regras
spec/componentes.md            inventário de componentes com props
spec/navegacao.md              máquina de navegação (telas, transições, pilha)
spec/acessibilidade.md         contraste, alvos de toque, leitores de tela
data/seed.json                 dados-semente (alunos, extratos, políticas)
assets/                        SVGs das curvas e dos ícones da navbar
*.dc.html                      protótipos abríveis no navegador
Envio01-AulaEmDia (1).pdf      proposta do projeto: problema, concorrência, escopo do MVP
```

## Divergências conhecidas entre protótipo e spec

Documentadas em `mobile/README.md`. Em resumo: a navbar segue a spec (some nas telas de
tarefa), a tela de Resultado corrige um cálculo duplicado do protótipo, e a semente tem
`pendencia.dias` inconsistente com `pendencia.origem` — mantido como está no handoff.

## Decisões que ainda exigem confirmação do time

- Backend e sincronização (o app é local-only).
- Envio real de mensagem ao aluno (hoje só registra e mostra o toast).
- Calendário real para sugerir janelas de reposição (as janelas ainda são as fixas do
  handoff, em `data/seed.json`) — é o motor que o Envio 01 aponta como o diferencial.
- Licença da fonte Satoshi para app publicado.
