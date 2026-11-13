# /designer — padding dos cartões — 13/11/2026

Branch `designer/2026-11-13-padding-dos-cartoes` · ponto de partida `43c384d` (a `main` estava
limpa, sem commit de ponto de partida) · pedido: SCRUM-40, rodada 1, `extract` sobre os componentes
compartilhados.

Rodada feita à mão, com as travas do `/designer`, porque a skill só roda quando a pessoa a chama.

## Resumo

- **Como estava:** o tema não tinha nenhum grupo de espaçamento. O padding de cada cartão e bloco
  era número solto, repetido entre componentes e telas.
- **O que mudou:** o padding interno que o handoff mede virou o grupo `PAD`, com o nome do
  componente, e 12 arquivos passaram a importar dele. Nenhum valor mudou.
- **Para depois:** os vãos entre blocos (`gap`, `margin`, `comEspaco`), o chassi e o sheet. Antes
  disso, há uma decisão a tomar (veja *Decisões*).

## Comandos rodados

| # | comando | por quê | commit | resultado |
|---|---|---|---|---|
| 1 | `extract` | o mesmo padding repetido entre componentes e telas | `33fa7d0` | 12 tokens novos, 0 mudança visual |

Sem `audit` nem `critique`: a rodada não muda nada visível, então não há achado de UX para medir.

## Tokens novos

Todos no grupo `PAD` (`mobile/src/tema/tokens.ts`) e `padding` (`tokens/tokens.json`), com a
tabela em `DESIGN.md`, seção Layout. São iguais nos dois temas, porque não são cor.

| token | valor | onde | por quê |
|---|---|---|---|
| `cartao` | 17 · 18 | `Blocos` (cartão de saldo e de aulas dadas), catálogo | handoff, cartão de vidro |
| `cartaoDeAjuste` | 16 · 17 | `Blocos`, `ajustes/estilos.ts`, `PacotesPadrao` | handoff, cartão de ajuste |
| `blocoTexto` | 16 · 17 | `Blocos`, catálogo | handoff, bloco âmbar |
| `cartaoComIcone` | 15 · 16 | `Blocos`, `Ajustes` (perfil), `PerfilProfessor` | handoff, bloco vermelho; o perfil abre com avatar como ele |
| `cartaoEscolha` | 14 · 15 | `Controles` (padding e a margem do corpo expandido) | handoff, cartão de escolha |
| `resumo` | 14 · 13 | `Blocos` | handoff, cartões de resumo do Financeiro |
| `debito` | 18 | `Blocos` | handoff, cartão de débito |
| `toast` | 14 · 16 | `Toast` | handoff, toast |
| `vazio` | 30 · 20 | `Blocos` | handoff, "Nenhum lançamento ainda." |
| `linhaLista` | 12 · 15 | `Listas` | handoff, linha do extrato |
| `faixa` | 0 · 8 | `Blocos` | handoff, faixa de status |
| `caixaValor` | 6 · 10 | `Listas` | handoff, caixa do saldo na linha |

## Decisões tomadas sem perguntar

- **Tokens por papel, não por escala.** Os valores do handoff variam muito (9, 13, 15, 17…). Uma
  escala numérica não daria nome a nada, e arredondar mudaria o visual, o que o card proíbe. O
  objetivo do card é "o próximo ajuste mudar num lugar só", e isso pede um nome por papel.
- **O nome `space` está vetado.** `tokens.test.ts` cobra que a seção `space` da direção aposentada
  não volte. O grupo novo chama `padding` no JSON e `PAD` no TS.
- **Componentes que medem igual continuam separados.** `blocoTexto` e `cartaoDeAjuste` valem
  16 · 17 hoje, mas são componentes diferentes no `DESIGN.md`.
- **O teste de tokens ganhou a paridade de `PAD`.** Sem ela, o JSON e o TS poderiam divergir sem
  ninguém ver. É arquivo da camada de apresentação (`tema/`).
- **Fora desta rodada:** a linha de aluno (`Listas`, os portes `lista`, `sheet` e `cobranca`), que
  já tem a medida numa tabela por porte; e a fileira de onboarding da `BoasVindas` (14 · 15), que
  fica para a rodada da entrada.

### A decisão que fica para você

O `DESIGN.md` diz, desde o redesign: **"Esses vãos são literais no código, não tokens"**, sobre o
ritmo vertical (18px entre o cabeçalho e o primeiro bloco, 24px antes de um cabeçalho de grupo, 9px
entre o cabeçalho e a lista). O "Pronto quando" do SCRUM-40 pede o contrário: que o `grep` só ache
número com comentário. As próximas rodadas do card esbarram nisso. As saídas:

1. **Manter a regra do `DESIGN.md`** e fechar o SCRUM-40 com o padding (esta rodada) mais o chassi
   e o sheet. O critério do card muda para "padding interno sai do tema; vão entre blocos é literal".
2. **Tokenizar o ritmo vertical** (`VAO.antesDoGrupo = 24`, `VAO.grupoParaLista = 9`…) e reescrever
   o parágrafo do `DESIGN.md`. São umas 190 ocorrências de `gap` e `margin`, em mais três ou quatro
   rodadas.

## Descartado (stash) e por quê

Nada.

## Verificação

- testes: 1044 passaram (37 suítes, EXIT=0) · typecheck: ok
- **capturas, HTML antes × depois: idêntico nas 10 telas** — home, ficha (`raf` e `bea`),
  financeiro, cobrança (`val`), registrar, ajustes, perfil, pacotes padrão e catálogo. O bundle
  servido foi conferido nos dois lados (com e sem `PAD`), para o idêntico não ser cache do Metro.
- o toast ficou sem captura: o atalho até ele não passa do clique em Registrar. A mudança nele é uma
  linha, com o mesmo valor.
- detector: não rodado, porque a rodada não muda o HTML.
- medidas soltas em `src/telas` e `src/componentes`: 270 → 248.
- capturas: `docs/design/revisoes/capturas/2026-11-13-padding-dos-cartoes/` (fora do git).

**Achado de ferramenta:** com o `mobile/.env` apontando para a nuvem, o `npm run capturar` abre a
tela de entrada em vez da tela pedida, porque a sessão injetada pelo script é local. As capturas
desta rodada subiram o Expo Web com `EXPO_PUBLIC_BACKEND=local`. O roteiro do `/designer` (§4) não
diz isso, e vale uma linha nele.

## Como decidir

- **aprovar tudo** → "aprovado"
- **recusar** → "descarta"
