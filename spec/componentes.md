# Inventário de componentes

O catálogo iOS Glass de `mobile/src/componentes/`. Toda tela é montada só com ele — nada de
vidro, cor ou medida remontada na tela. Cor vem de `useCores()` e medida de `RAIO`/`TAMANHO`
(`mobile/src/tema/tokens.ts`). A tela `__catalogo__/Catalogo.tsx` mostra cada peça em todos os
estados (`npm run capturar -- --catalogo`). `?` = opcional; H§n = seção do
`handoff-ios-glass/README.md`.

## Material — `Vidro.tsx`
| componente | props | notas |
|---|---|---|
| `FundoRefracao` | `style?` | cor `tela` + 4 gradientes radiais (`FUNDO_REFRACAO`), opacidade `material.opacidadeFundo`. Sob todo o app: o `Portao` desenha na entrada, o `App` dentro do alvo de desfoque |
| `SuperficieVidro` | `nivel: 'cartao'\|'vidro'\|'vidro2'\|'sheet'`, `raio`, `soTopo?`, `anel?`, `sombra?`, `sombraExterna?`, `modo?`, `style?` | BlurView (web: `backdrop-filter`) + miolo + `gin` + borda 0,5px. Cai sozinha no fallback sem blur (Android < 12, vidro dentro do alvo). `anel` só na tab bar |
| `ProvedorDeDesfoque`, `AlvoDeDesfoque` | `children`, `style?` | Android: o `BlurView` das barras e do sheet desfoca o que está no alvo |
| `MODO_VIDRO`, `blurLigado(modo?)` | — | chave geral `auto`/`blur`/`fallback` |

## Chassi — `Chassi.tsx`, `Sheet.tsx`, `TabBar.tsx`, `Toast.tsx`
| componente | props | notas |
|---|---|---|
| `TelaVidro` | `tipo: 'raiz'\|'empilhada'`, `titulo`, `voltarPara?`, `aoVoltar?`, `rodape?`, `comTeclado?` | padding `54 16 126` (raiz) ou `100 16 126` (empilhada); rodapé no fim do conteúdo, 18px acima; `comTeclado` sobe o conteúdo com o teclado |
| `TituloDeConteudo` | `titulo`, `acima?`, `abaixo?`, `porte?: 'grande'\|'empilhada'`, `direita?`, `estilo?` | título no conteúdo (34 ou 29/800), recuo 6; `direita` = "N hoje" de H§1 |
| `BarraNavegacao` | `titulo`, `opacidade` | 94px de vidro, aparece com a rolagem |
| `useBarraComRolagem()` | — | `{ opacidade, aoRolar }`: `min(1, max(0, (y − 16)/34))` em degraus de 0.1, 180ms |
| `usePadTopo(tipo)` | — | 54/100 + o que o recorte do aparelho tiver a mais |
| `BotaoVoltar` | `rotulo`, `aoVoltar?`, `style?` | chevron 19 + título curto em tint, fixo |
| `Sheet` | `titulo`, `altura?: 'tarefa'\|'resultado'`, `semCancelar?`, `aoFechar?`, `rodape?`, `comTeclado?`, `children` | 88% (74% no resultado), véu `veuSheet`, puxador, cabeçalho 52 com "Cancelar", corpo `6 16 16`, rodapé fixo `10 16 30`. Modal para o leitor de tela; voltar do Android fecha |
| `SubLinhaSheet` | `passo?`, `texto?` | linha de contexto `4 6 0` (H§5); `passo` = "Passo N de 3" |
| `TabBar` | `abaAtiva`, `aoTrocar` | 66px, raio 26, anel de refração; item ativo com `PILULA_ABA`; some com sheet aberto |
| `Toast` | — | lê `estado/toast.ts`; 106px da base, `sombraToast`, live region |

## Controles — `Controles.tsx`
| componente | props | notas |
|---|---|---|
| `BotaoPrimario` | `rotulo`, `aoTocar`, `desabilitado?`, `icone?`, `rotuloAcessivel?`, `estilo?` | 54px, raio 18, tint + `tintSombra`. **Um por tela** |
| `BotaoSecundario` | idem | 52px, raio 18, vidro2 |
| `BotaoCompacto` | idem | 50px, raio 17 |
| `BotaoInline` | `rotulo`, `aoTocar`, `variante?: 'tint'\|'vidro'`, `desabilitado?`, `rotuloAcessivel?`, `estilo?` | 40px dentro de bloco, alvo estendido a 44 |
| `BotaoTexto` | `rotulo`, `aoTocar`, `tom?: 'neutro'\|'destrutivo'`, `desabilitado?`, `rotuloAcessivel?`, `estilo?` | 46px, sem caixa |
| `NotaDoBotao` | `texto` | o que falta para o primário acender, live region, logo acima dele |
| `Segmentado<T>` | `opcoes`, `valor`, `aoTrocar`, `porte?: 'filtro'\|'cartao'\|'linha'`, `rotuloDoGrupo?`, `desabilitado?`, `estilo?` | grupo de rádios; `filtro` e `cartao` ocupam a largura, `linha` encolhe |
| `FichaDeEscolha` | `rotulo`, `marcada`, `aoTocar` | escolha múltipla (checkbox), 36px, raio 13 |
| `Switch` | `ligado`, `aoAlternar`, `rotulo`, `desabilitado?`, `estilo?` | 52 × 32, botão `botaoSwitch` |
| `Stepper` | `valor`, `minimo`, `maximo`, `aoTrocar`, `rotulo`, `formatar?`, `rotuloDoValor?`, `estilo?` | `rotuloDoValor` diz o que "—" significa ("sem limite") |
| `CartaoEscolha` | `titulo`, `selecionado`, `aoTocar`, `subtitulo?`, `valor?`, `corDoValor?`, `aoLado?`, `selo?`, `desabilitado?`, `rotuloAcessivel?`, `children?`, `estilo?` | o radio de H§3/H§5; `children` abre abaixo de um fio |
| `Selo` | `texto` | "MELHOR" |
| `useDoisToques(acao)` (`useDoisToques.ts`) | — | `{ armado, tocar }`: o 1º toque arma, o 2º executa; desarma em `MOVIMENTO.toastDuracaoMs` |

## Blocos — `Blocos.tsx`
| componente | props | notas |
|---|---|---|
| `CartaoVidro` | `children`, `semPadding?`, `raio?`, `estilo?` | raio 22, padding `17 18`; `raio` 20 no cartão de contexto de H§7 |
| `CartaoDeAjuste` | `titulo`, `subtitulo?`, `direita?`, `children?`, `estilo?` | cartão de controle de H§9: título 14.5/700, controle à direita ou embaixo, padding `16 17` |
| `BlocoStatus` | `titulo`, `tom?: TomDeStatus`, `texto?`, `icone?`, `acao?: {rotulo, aoTocar, variante?}`, `aoTocar?`, `chevron?`, `estilo?` | fundo suave do tom, título na cor cheia |
| `CartaoDeDebito` | `rotulo`, `valor`, `tom?: 'vermelho'\|'verde'\|'neutro'`, `notas?`, `direita?`, `linhas?`, `children?`, `estilo?` | H§7: valor 32/800; `neutro` é vidro com valor em `tinta` |
| `FaixaStatus` | `tipo: TipoDeFaixa`, `texto`, `estilo?` | pílula de 21px, uma por linha (`PRIORIDADE_DA_FAIXA`) |
| `Avatar` | `nome?`, `texto?`, `estado?: EstadoDoAvatar`, `tamanho?: 62\|48\|44\|40\|38`, `estilo?` | decorativo |
| `MedidorPacote` | `total`, `usadas`, `baixo?`, `variante?: 'saldo'\|'progresso'`, `estilo?` | barras de 7px; `progresso` pinta as primeiras (passos do onboarding, vagas do plano). Decorativo |
| `BarraProporcional` | `segmentos: {peso, tom, rotulo}[]`, `estilo?` | aulas × reposições × faltas (H§6), rótulo acessível |
| `CartaoResumo` | `rotulo`, `valor`, `tom?`, `zerado?`, `estilo?` | os três do topo do Financeiro |
| `EstadoVazio` | `titulo`, `nota?`, `estilo?` | dentro de lista ou cartão |
| `coresDoTom(cores, tom)` | — | par `{ suave, cheia }` de cada tom |

## Listas — `Listas.tsx`
| componente | props | notas |
|---|---|---|
| `ListaAgrupada` | `children`, `estilo?` | cartão recortado; o fio entre filhos é dela |
| `CabecalhoGrupo` | `titulo`, `contagem?`, `tom?: 'neutro'\|'atraso'`, `estilo?` | 12/600 caixa alta |
| `LinhaLista` | `titulo`, `subtitulo?`, `aoTocar?`, `chevron?`, `direita?`, `porte?: 'padrao'\|'grande'\|'app'`, `rotuloAcessivel?` | 62 / 64 / 58px |
| `LinhaAluno` | `nome`, `apoio?`, `iniciais?`, `estadoDoAvatar?`, `faixa?`, `valor?`, `unidade?`, `corDoValor?`, `caixaNoValor?`, `porte?: 'lista'\|'sheet'\|'cobranca'`, `aoTocar?`, `chevron?`, `rotuloAcessivel?` | 76 / 68 / 66px |
| `LinhaExtrato` | `data`, `titulo`, `subtitulo?`, `delta`, `deltaEmPalavras`, `rodape`, `tom: TomDoDelta` | cor nunca é o único sinal |

## Campos e peças de conteúdo
| componente | props | notas |
|---|---|---|
| `CampoDeTexto` (`Campos.tsx`) | `rotulo`, `valor`, `aoMudar`, `placeholder?`, `senha?`, `teclado?`, `erro?`, `ajuda?`, `autoFoco?`, `capitalizar?`, `multilinha?`, `sufixo?`, `aoEnviar?`, `estilo?` | derivado: trilho `preenchimento` 50px, raio 13; erro é live region |
| `AcaoDoCampo` (`Campos.tsx`) | `rotulo`, `aoTocar`, `rotuloAcessivel?` | ação em tint no `sufixo` ("mostrar", "copiar") |
| `GradeSemanal`, `RodapeDaGrade` (`GradeSemanal.tsx`) | `marcados`, `aoAlternar?`, `dias?`, `faixas?`, `rotuloDaFaixa?`, `alturaDaCelula?`, `somenteLeitura?` · `esquerda`, `direita?` | derivada: disponibilidade semanal, só toque |
| `PreviaDeMensagem` (`PreviaDeMensagem.tsx`) | `texto`, `destino?`, `rotuloDoBotao?`, `aoCopiar?`, `rodape?` | derivada: mensagem pronta + copiar |
| `Icone` (`Icone.tsx`) | `nome: NomeDeIcone`, `tamanho`, `cor`, `traco?`, `girar?`, `style?` | chevron, check, checkBloco, mais, alerta, abaAlunos/Financeiro/Ajustes; decorativo |

## Fora do catálogo, compartilhado entre telas — `mobile/src/telas/`
| peça | onde | notas |
|---|---|---|
| `LinhaDoExtrato`, `deltaEmPalavras` | `telas/comum/Extrato.tsx` | `Lancamento` → `LinhaExtrato` (ficha e "Meu saldo") |
| `linhaDeHorario`, `faixaDaLinha` | `telas/comum/aluno.ts` | frases do aluno da Home, Registrar, ficha, Cobrança e prévia do onboarding |
| `TelaDeEntrada` | `telas/entrada/TelaDeEntrada.tsx` | chassi da entrada: sem tab bar, voltar pela sessão, primário em faixa fixa |
| `PassoDoOnboarding` | `telas/entrada/PassoDoOnboarding.tsx` | medidor de passos + "Passo N de 4" + rodapé |
