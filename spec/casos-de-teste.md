# Casos de teste — regras de negócio

Portar como testes unitários do módulo `politica.ts`. Política padrão salvo indicação:
`{ avisoHoras: 24, avisadaDevolve: true, limiteReposicoes: 3, validadeDias: 60 }`.

## `efeito(desfecho, avisoH, politicas)`

| # | desfecho | avisoH | política | delta | reposição |
|---|---|---|---|---|---|
| 1 | realizada | — | padrão | −1 | não |
| 2 | avisada | 26 | padrão | **0** | **sim** |
| 3 | avisada | 24 | padrão (limite exato) | **0** | **sim** |
| 4 | avisada | 23 | padrão | −1 | não |
| 5 | avisada | 48 | `avisadaDevolve: false` | −1 | não |
| 6 | avisada | 26 | `avisoHoras: 48` | −1 | não |
| 7 | sem_aviso | — | padrão | −1 | não |
| 8 | cancelada_professor | — | padrão | 0 | sim |
| 9 | cancelada_professor | — | `avisadaDevolve: false` | 0 | sim (não depende da política) |

Textos: o caso 2 gera nota "Aviso com 26h, dentro do mínimo de 24h" e detalhe
"Aviso com 26h · reposição gerada". O caso 4 gera "…abaixo do mínimo de 24h" e
"Aviso com 23h · fora do prazo". Conferir string a string — elas aparecem na UI.

## `saldo` e limites
| # | entrada | esperado |
|---|---|---|
| 10 | total 6, usadas 2 | 4 |
| 11 | total 6, usadas 6 | 0 |
| 12 | total 6, usadas 9 (inconsistente) | **0**, nunca negativo |
| 13 | `semPacote: true`, total 0 | `temPacote` false, contador exibe "—" |
| 14 | total 8, usadas 6 | saldo 2 → `saldoBaixo` true (amarelo) |
| 15 | total 8, usadas 5 | saldo 3 → `saldoBaixo` false |

## `podeRepor(aluno, politicas)`
| # | reposições | limite | esperado |
|---|---|---|---|
| 16 | 0 | 3 | true |
| 17 | 3 | 3 | **false** |
| 18 | 9 | 0 (sem limite) | **true** |

## `registrarAula`
| # | cenário | esperado |
|---|---|---|
| 19 | Valentin (6/2), avisada, 26h, padrão | usadas segue 2, saldo 4, `pendencia = { origem: hoje, dias: 0 }` |
| 20 | Valentin (6/2), realizada | usadas 3, saldo 3, sem pendência |
| 21 | aluno com `reposicoes: 3` e limite 3, avisada 26h | delta 0, **sem** pendência (limite estourado) |
| 22 | qualquer registro | a entrada **não é mutada**; retorna cópia |
| 23 | qualquer registro | lançamento entra **no topo** do extrato |

## `marcarReposicao`
| # | esperado |
|---|---|
| 24 | `reposicoes` +1, `pendencia` null, `agendada` preenchida |
| 25 | lançamento "Reposição marcada" com "{dia}, {hora}", delta 0 |
| 26 | toast: "Reposição de {primeiro nome} em {dia}, {hora}. Mensagem enviada." |

## Janelas de reposição
| # | cenário | esperado |
|---|---|---|
| 27 | aluno sem validade estendida | **3** janelas |
| 28 | `validadeEstendida: true` | **4** janelas (a extra é "Quinta, 11/09 · 18h") |
| 42 | aluno com aula fixa terça 18h | nenhuma janela em terça na faixa de 18h (17–20); o resto da terça continua (SCRUM-84) |
| 43 | o mesmo aluno, quinta 18h livre | a janela soma o bônus de mesmo horário, com a razão "No mesmo horário da aula dele." |
| 44 | aluno com `aulaFixa: { dias: ['ter'], hora: 18 }` e texto `dia: 'quarta'` | vale a estrutura: sai terça 18h, quarta 17h continua (SCRUM-31) |
| 45 | os alunos da semente, com `aulaFixa` lida do texto | **as mesmas** janelas que o texto dá |
| 46 | `rotuloDaAulaFixa(lerAulaFixa(dia, hora))` para cada aluno da semente | o mesmo `dia` e `hora` da semente ("terça e quinta", "18h"; "sem horário fixo", "") |

## Pagamento e validade
| # | cenário | esperado |
|---|---|---|
| 29 | `registrarPagamento` em Valentin (6 aulas) | status pago/Pix/hoje, `pausado: false`, lançamento "R$ 480,00 · Pix" com `dinheiro: true` |
| 30 | `dinheiro(480)` | `"R$ 480,00"` (pt-BR, 2 casas) |
| 31 | `estenderValidade` | `validade` nova, `validadeEstendida: true`, detalhe do aluno mostra " · estendida" |

## Ordenação e faixa
| # | cenário | esperado |
|---|---|---|
| 32 | semente, filtro Urgência | Valentin (atraso) → Rafael (pendência) → Mateus → Bernardo (sem pacote) |
| 33 | semente, filtro A–Z | Bernardo, Mateus, Rafael, Valentin |
| 34 | semente, filtro Hoje | Valentin, Mateus |
| 35 | aluno pausado **e** em atraso | faixa **"Aulas pausadas"** (precedência 1) |
| 36 | aluno em atraso **e** com pendência | faixa **"Pagamento em atraso"** |
| 37 | aluno com pendência de hoje | sufixo "hoje", não "há 0 dias" |

## Política (tela E2)
| # | cenário | esperado |
|---|---|---|
| 38 | rascunho igual à política salva | botão Salvar **desabilitado** |
| 39 | mudar `avisoHoras` para 48 e salvar | registro de falta avisada com 26h passa a debitar |
| 40 | Descartar | rascunho volta ao valor salvo, sem efeito colateral |
| 41 | `limiteReposicoes: 0` | detalhe do aluno mostra "{n} reposições" (sem "de X") |

## Avisos (`avisos.ts`, SCRUM-91)

Cada caso é uma frase da tela de Avisos. Arquivado não gera aviso nenhum; pausado não entra nos
avisos de aula.

| # | cenário | esperado |
|---|---|---|
| 47 | aula do dia: aula fixa no dia da semana de hoje; outra em outro dia | só a de hoje entra |
| 48 | saldo baixo: saldo 2 e saldo 3; aluno sem pacote | só o de saldo 2 (o âmbar da lista) |
| 49 | reposição pendente há 2, 3 e 9 dias, sem `agendada` | entram 3 e 9 ("3 dias sem horário") |
| 50 | reposição pendente com proposta `enviada` e com proposta `recusada` | só a recusada: a enviada já tem horário escolhido |
| 51 | pagamento em aberto vencendo daqui a 2, 3 e 4 dias; pago daqui a 3 | só o aberto de 3 dias, para avisar uma vez |
| 52 | as quatro preferências do resumo desligadas | as quatro categorias vazias |
| 53 | `resumoDoDia` com 2 aulas, 1 saldo baixo e 1 reposição | "Hoje: 2 aulas, 1 saldo baixo e 1 reposição sem horário."; sem nada, `null` |
| 54 | antes da aula, `horaAgora = 17`: aulas de hoje às 18h e às 19h | só a das 18h; "Aula com Bia às 18h." |
| 55 | antes da aula com `antesDaAula: false` e com a chave ausente | desligado não avisa; ausente vale ligado |
