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
