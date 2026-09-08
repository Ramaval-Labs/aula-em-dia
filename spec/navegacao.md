# Máquina de navegação

## Telas e a qual aba pertencem
| tela | aba | navbar visível | ação de rodapé |
|---|---|---|---|
| `home` | Alunos | **sim** | — |
| `aluno` | Alunos | não | Registrar aula |
| `registrar` | Alunos | não | Confirmar |
| `resultado` | Alunos | não | Escolher horário / Voltar ao aluno |
| `reposicao` | Alunos | não | Confirmar horário |
| `financeiro` | Financeiro | **sim** | — |
| `inadimplencia` | Financeiro | não | Registrar pagamento |
| `ajustes` | Ajustes | **sim** | — |
| `politica` | Ajustes | não | Salvar alterações / Descartar |

## Transições
```
home            toca cartão          ->  aluno
aluno           Registrar aula       ->  registrar
registrar       Confirmar            ->  resultado
resultado       Escolher horário     ->  reposicao
resultado       Voltar               ->  aluno
aluno           Escolher horário     ->  reposicao      (pendência existente)
reposicao       Confirmar            ->  aluno          (pilha zerada + toast)
financeiro      toca aluno em atraso ->  inadimplencia
inadimplencia   Registrar pagamento  ->  inadimplencia  (atualiza no lugar + toast)
ajustes         Política de faltas   ->  politica
politica        Salvar / Descartar   ->  ajustes
```

## Contrato da pilha
- `ir(tela, extra?)` — empilha `{ tela, alunoId }` atual e navega.
- `voltar()` — desempilha; pilha vazia volta para `home`. Sempre limpa
  `desfecho`, `janela` e `rascunho`.
- `trocarTab(tela)` — navega e **zera** `pilha`, `alunoId`, `desfecho`, `janela`, `rascunho`.
- Confirmar reposição é um caso especial: vai para `aluno` com a pilha zerada, para o
  usuário não voltar para dentro de um fluxo já concluído.

Na implementação nativa, usar a pilha de navegação da plataforma com o mesmo comportamento:
trocar de aba volta à raiz; concluir um fluxo substitui a pilha em vez de empilhar.
