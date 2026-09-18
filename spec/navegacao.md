# Máquina de navegação

## Tipos de tela

Cada uma das 28 telas do app tem **um** tipo, declarado em `TIPO_DA_TELA`
(`mobile/src/estado/navegacao.ts`) e contratado em
`docs/design/redesign-ios-glass/MAPA-DE-TELAS.md`:

| Tipo | Chrome | Tab bar |
|---|---|---|
| `raiz` | título grande no conteúdo; barra de navegação aparece com a rolagem | visível, aba ativa |
| `empilhada` | botão voltar fixo (chevron + rótulo em tint) | visível, aba da raiz ativa |
| `sheet` | painel modal (88%, ou 74% no `resultado`) sobre a última tela não-sheet | escondida |

- **Raízes:** `home`, `financeiro`, `ajustes`.
- **Sheets:** `alunoForm`, `pacote`, `registrar`, `resultado`, `reposicao`, `dispAluno`,
  `outroHorario`, `semHorario`, `confirmarReposicao`, `pagamento`, `lembrete`.
- **Empilhadas:** todas as outras.

A tab bar aparece em **toda tela não-sheet** — não existe mais lista de telas com barra.

## Telas e a qual aba pertencem
| tela | aba | tipo | ação de rodapé |
|---|---|---|---|
| `home` | Alunos | raiz | — |
| `aluno` | Alunos | empilhada | Registrar aula |
| `registrar` | Alunos | sheet | Confirmar |
| `resultado` | Alunos | sheet (74%) | Escolher horário / Voltar ao aluno |
| `reposicao` | Alunos | sheet | Confirmar horário |
| `financeiro` | Financeiro | raiz | — |
| `inadimplencia` | Financeiro | empilhada | Registrar pagamento |
| `ajustes` | Ajustes | raiz | — |
| `politica` | Ajustes | empilhada | Salvar alterações / Descartar |

## Transições
```
home            toca cartão          ->  aluno
aluno           Registrar aula       ->  registrar      (abre sheet)
registrar       Confirmar            ->  resultado      (troca o conteúdo do sheet)
resultado       Escolher horário     ->  reposicao      (troca o conteúdo do sheet)
resultado       Voltar               ->  aluno          (fecha o sheet)
aluno           Escolher horário     ->  reposicao      (pendência existente)
reposicao       Confirmar            ->  aluno          (pilha zerada + toast)
reposicao       Rever política       ->  politica       (fecha o sheet e empilha)
financeiro      toca aluno em atraso ->  inadimplencia
inadimplencia   Registrar pagamento  ->  pagamento      (sheet; conclui na própria cobrança)
ajustes         Política de faltas   ->  politica
politica        Salvar / Descartar   ->  ajustes
```

## Contrato da pilha
- `ir(tela, extra?)` — empilha `{ tela, alunoId }` atual e navega.
- `voltar()` — desempilha; pilha vazia cai na raiz da aba atual.
- `trocarTab(aba)` — navega e **zera** `pilha`, `alunoId` e os rascunhos.
- `concluir(tela, alunoId?)` — substitui a pilha e limpa os rascunhos, para o usuário não
  voltar para dentro de um fluxo já concluído.
- `definirAluno` / `definirFiltro` — trocam contexto sem mexer na pilha.

## Semântica de sheet
O sheet é um terceiro eixo: painel sobre um contexto, nunca painel sobre painel.

- `ir(sheet)` a partir de tela **não-sheet** → abre o painel sobre ela (a origem é empilhada).
- `ir(sheet)` a partir de um **sheet** → **troca o conteúdo** do painel aberto; a pilha não cresce.
- `ir(naoSheet)` a partir de um **sheet** → fecha o painel e empilha o destino sobre a última
  tela não-sheet.
- `concluir(destino)` a partir de um sheet → fecha o painel e substitui a pilha.
- `fecharSheet()` — "Cancelar", toque fora do painel e voltar do Android. Remove as entradas de
  sheet da pilha e volta para a última tela não-sheet; sem pilha, vai para a ficha do aluno se
  houver `alunoId`, senão para `home`.
- `voltar()` com sheet aberto = `fecharSheet()`, e devolve `true` (o Android não fecha o app).
- A pilha **nunca** guarda quadro de sheet: nenhum painel fica enterrado para o voltar reabrir.

## Derivados para a UI
- `sheetAberto(estado)` — a tab bar some quando `true`.
- `telaDeFundo(estado)` — a tela não-sheet desenhada atrás do painel (fora do sheet, a própria
  tela atual).

Na implementação nativa, usar a pilha de navegação da plataforma com o mesmo comportamento:
trocar de aba volta à raiz; concluir um fluxo substitui a pilha em vez de empilhar; sheet é
apresentação modal, não um item da pilha.
