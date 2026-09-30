# Aula em Dia

App mobile para professores particulares controlarem **pacotes de aulas, faltas, reposições e
pagamentos** de cada aluno.

O diferencial não é o saldo do pacote — isso todo concorrente já faz, basta subtrair um. É o que
vem **depois da falta**: a política de faltas é definida pelo professor e aplicada sozinha, e a
reposição deixa de ser dez mensagens de WhatsApp para virar horários prontos, calculados contra a
agenda real.

Trabalho da disciplina de Soluções Computacionais — Universidade Católica de Brasília,
turma GPE17M80081, Grupo 08.

---

## Estado atual

O aplicativo está **implementado e navegável**, com as 35 telas do design, as regras de negócio
cobertas por testes e estado persistido no aparelho. Os dados são mock, de propósito.

| Área | Situação |
|---|---|
| 35 telas | prontas na direção visual *iOS Glass*, nos temas claro e escuro |
| Entrada e onboarding | splash, login e 4 passos que gravam dados de verdade |
| Regras de negócio | módulos puros em `src/dominio/`, 303 testes verdes |
| Motor de reposição | **existe**: calcula contra agenda, folgas e aulas fixas |
| Persistência local | AsyncStorage, chave `aulaemdia.app.v4` |
| Backend / sincronização | fora do escopo até aqui — Supabase é a escolha registrada |

O que falta está em **[PROXIMOS-PASSOS.md](PROXIMOS-PASSOS.md)**.

## Rodar no celular

Precisa de Node.js, do app **Expo Go** e de uma conta gratuita em
[expo.dev](https://expo.dev/signup) — desde o SDK 57 o Expo Go só abre o projeto com a
**mesma conta** logada no terminal e no aplicativo.

```bash
cd mobile
npm install
npx expo login    # se a conta for Google/GitHub, use: npx expo login --browser
npx expo start
```

Leia o QR Code com o Expo Go, já logado na mesma conta (aba *Home* → avatar no canto superior
direito). Problemas para conectar? Veja a seção de solução de problemas em
[mobile/README.md](mobile/README.md).

Para só conferir o visual, sem celular e sem conta: `npx expo start --web`.

## Verificar

```bash
cd mobile
npm test           # 303 testes
npm run typecheck  # tsc --noEmit
```

Os testes portam os casos tabelados de [`spec/casos-de-teste.md`](spec/casos-de-teste.md) e
conferem as strings letra a letra, porque elas aparecem na interface. Há também um teste que
monta as 28 telas do app em quatro estados diferentes, as 7 da entrada e o app com um sheet
aberto — é ele que pega tela quebrada antes do aparelho — e um que impede a direção visual
anterior (amarelo, curvas) de voltar ao código.

## Estrutura

```
mobile/            o aplicativo (React Native + Expo + TypeScript)
  src/dominio/       regras de negócio puras, sem UI — comece por aqui
  src/telas/         as 35 telas, agrupadas por fluxo
  src/componentes/   catálogo iOS Glass: vidro, chassi, sheet, tab bar, controles, listas
  src/tema/          tokens tipados e tipografia
  README.md          mapa interno, decisões de stack e solução de problemas

handoff-ios-glass/  especificação de design atual (iOS Glass): README e protótipos em HTML
HANDOFF.md         aponta para a especificação atual
IMPLEMENTACAO.md   plano em 6 fases, com o que ficou pendente
PROXIMOS-PASSOS.md backlog priorizado
CLAUDE.md          regras do projeto para quem for programar com IA

spec/              regras, navegação, componentes e acessibilidade
tokens/            tokens de design em JSON (espelhados em mobile/src/tema/tokens.ts)
data/seed.json     dados-semente (alunos, extratos, políticas)
docs/design/       plano e mapa do redesign, histórico da direção anterior e revisões de design
```

## Como este repositório funciona

Ele guarda **duas coisas**: o pacote de handoff de design (specs, tokens, protótipos em HTML, em
`handoff-ios-glass/`) e a implementação em `mobile/`. Os arquivos `.dc.html` são **referência visual, não código para
copiar** — usam um runtime de prototipagem próprio (`support.js`) que não vai para produção.

Duas regras que valem para qualquer mudança:

1. **Regra de negócio não mora na tela.** Tudo em `mobile/src/dominio/politica.ts`, que é puro e
   testável. Mudou a regra, atualiza o teste junto.
2. **Medida e cor saem do tema**, nunca escritas soltas numa tela. Falta um token? Pergunte antes
   de inventar.

O resto está em [CLAUDE.md](CLAUDE.md).

## Equipe

Grupo 08 — Mauro Schulz, Rafael Dornelas e Valentin Klein Antunes.

## Licença e fontes

Projeto acadêmico, sem licença de uso definida. A tipografia **Satoshi** vem da Fontshare
(licença gratuita) e está self-hospedada em `mobile/assets/fonts/` — **conferir os termos antes de
publicar o app** em qualquer loja.
