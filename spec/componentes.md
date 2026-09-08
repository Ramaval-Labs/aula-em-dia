# Inventário de componentes

Nomes sugeridos; adapte à convenção do repositório. `?` = opcional.

## Chassi
| componente | props | notas |
|---|---|---|
| `AppShell` | — | coluna de altura total: cabeçalho / conteúdo com scroll / rodapé |
| `CabecalhoEscuro` | `titulo`, `eyebrow?`, `aoVoltar?`, `heroi?: {numero, rotulo}`, `corDaCurva?` | fundo `--topo`, `padding-bottom` 64px, curva SVG no rodapé |
| `CurvaTopo` | `fill` | `viewBox="0 0 390 80"`, absoluto, `bottom:-1px` |
| `CurvaNavbar` | — | faixa de **58px** no fluxo (não overlay), `fill: var(--topo)` |
| `Navbar` | `abaAtiva`, `aoTrocar` | 3 abas; inativa 52px só ícone; ativa expande com rótulo |
| `PilulaVidro` | `ativa` | gradiente + borda + sombras internas + brilho; **sem `backdrop-filter`** |
| `StatusBarSimulada` | `hora` | só no protótipo; na implementação usar a status bar do sistema |
| `Toast` | `mensagem` | 3600ms, barra amarela 4px à esquerda, fundo `--elevado` |
| `BotaoPrimario` | `rotulo`, `onPress`, `desabilitado?` | 52px, raio 8px, `600 15.5px`, fundo `--botao` |
| `BotaoTexto` | `rotulo`, `onPress` | 44px, cor `--suave`, hover `--texto` |
| `MascaraDeScroll` | — | `linear-gradient(to top, var(--tela) 72%, transparent)` sobre a lista |

## Alunos
| componente | props | notas |
|---|---|---|
| `ChipsFiltro` | `valor: 'Urgência'\|'A–Z'\|'Hoje'`, `aoTrocar` | ativo: fundo `--texto` |
| `CartaoAluno` | `aluno`, `onPress` | nome, 2 linhas de meta, contador, pontos, faixa |
| `ContadorSaldo` | `numero`, `unidade`, `baixo?`, `vazio?` | amarelo quando saldo ≤ 2; "—/sem pacote" quando vazio |
| `PontosPacote` | `total`, `usadas`, `baixo?` | um ponto por aula; usadas em `--linha` |
| `FaixaStatus` | `faixa` | uma só, por precedência (ver `politica.ts`) |
| `CartaoContexto` | `tipo: 'atraso'\|'pendente'\|'marcada'\|'pausado'`, `texto`, `acoes?` | cartões acima do extrato |
| `LinhaExtrato` | `lancamento` | data, título, subtítulo, delta colorido, saldo |
| `EstadoVazio` | `titulo`, `nota` | extrato sem lançamentos, filtro Hoje sem resultado |

## Registrar / reposição
| componente | props | notas |
|---|---|---|
| `CartaoDesfecho` | `titulo`, `sub`, `selecionado`, `onPress`, `filhos?` | 4 opções; o selecionado abre a prévia |
| `SliderAntecedencia` | `horas`, `aoMudar` | dentro do cartão "Falta avisada"; default 26 |
| `PreviaEfeito` | `efeito` | mostra delta e nota calculados ao vivo |
| `CartaoJanela` | `dia`, `hora`, `motivo`, `selecionada`, `onPress` | o motivo é parte do design, não decoração |

## Financeiro / Ajustes
| componente | props | notas |
|---|---|---|
| `TotaisFinanceiro` | `aReceber`, `recebido`, `emAtraso` | moeda pt-BR, tabular |
| `LinhaFinanceiro` | `aluno`, `onPress?` | valor do pacote + situação |
| `AcoesCobranca` | `aoReceber`, `aoLembrar`, `aoPausar`, `aoEstender` | tela `inadimplencia` |
| `SeletorTema` | `valor: 'claro'\|'escuro'`, `aoTrocar` | persiste em `aulaemdia.app.v3.tema` |
| `CampoPolitica` | `rotulo`, `valor`, `aoMudar`, `tipo: 'horas'\|'boolean'\|'contagem'\|'dias'` | edita rascunho |
| `DiffPolitica` | `de`, `para` | resumo textual do que muda ao salvar |
