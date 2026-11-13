# /designer — padding do chassi e dos controles — 13/11/2026

Branch `designer/2026-11-13-padding-do-chassi` · ponto de partida `171d727` (a `main` estava limpa) ·
pedido: SCRUM-40, rodada 2 e final, `extract` sobre o chassi, o sheet, os controles e os recuos.

Rodada feita à mão, com as travas do `/designer`. O PO pediu para rodar e mesclar sem aprovação.

## Resumo

- **Como estava:** depois da rodada 1, sobravam 37 paddings soltos em `src/telas` e
  `src/componentes`, mais os tamanhos e posições do chassi (puxador, colunas do cabeçalho do sheet,
  margem do botão voltar).
- **O que mudou:** 27 tokens novos em `PAD` e 4 em `TAMANHO`. O que sobra solto leva comentário
  dizendo por quê. Nenhum valor mudou.
- **Decisão do card:** os vãos entre elementos continuam literais, como o `DESIGN.md` decide (a
  opção 1 da rodada 1, escolhida pelo time em 13/11).

## Comandos rodados

| # | comando | por quê | commit | resultado |
|---|---|---|---|---|
| 1 | `extract` | padding do chassi e do sheet | `f7380ed` | 10 tokens em `PAD`, 4 em `TAMANHO` |
| 2 | `extract` | padding dos controles e dos recuos | `96c3e68` | 17 tokens em `PAD`, comentários no que fica solto |

## Tokens novos

`PAD` (`padding` no JSON), iguais nos dois temas. A tabela completa está em `DESIGN.md`, Layout.

| grupo | tokens |
|---|---|
| chassi | `tituloNav` (0 · 60), `botaoVoltar` (0 · 10), `cabecalhoTela` (8 · 6 · 2), `tabBar` (5), `rodapeEntrada` (12 em cima) |
| sheet | `puxadorSheet` (9 · 0 · 2), `cabecalhoSheet` (0 · 18), `corpoSheet` (6 · 16 · 16), `subLinhaSheet` (4 · 6 · 0), `rodapeSheet` (10 · 16 · 30) |
| controles | `botaoPrimario` (8 · 18), `botaoInline` (0 · 18), `trilhoSegmentado` (3), `trilhoSegmentadoLinha` (2.5), `trilhoStepper` (3), `ficha` (0 · 14), `selo` (0 · 7), `campo` (0 · 14) |
| dentro do cartão | `separador` (13 em cima), `rodapeDoCartao` (12 em cima), `previaMensagem` (14), `cartaoDaGrade` (14 · 8), `caixaDePacote` (11 · 13), `linhaDePasso` (14 · 15) |
| recuos | `recuo` (0 · 6), `identificacao` (0 · 4), `resultado` (10 · 4 · 0) |

`TAMANHO`: `margemVoltar` (12), `puxadorLargura` (38), `puxadorAltura` (5) e `colunaCabecalhoSheet` (72).

## Decisões tomadas sem perguntar

- **O rodapé do sheet sobre o teclado usa `rodapeSheet.paddingTop` embaixo.** O código já fazia
  10 em cima e 10 embaixo com o teclado aberto; o token mantém isso sem criar um quinto valor.
- **`PAD_CARTAO_DA_GRADE` continua exportado**, agora apontando para `PAD.cartaoDaGrade`: cinco
  telas o importam, e a conta de largura da grade cita o nome.
- **A linha de aluno e o segmentado ficam com a tabela por porte**, comentada. Cada medida já tem
  nome ali (`lista`, `sheet`, `cobranca`; `filtro`, `cartao`, `linha`), e o segmentado lê os
  trilhos de `PAD`.
- **Ficam soltos, com comentário:** a nota centralizada da ficha (8), o link da tela de Acesso e
  a dica do campo (2), o splash (24), a contagem da Home (4) e os dois zeros que só zeram um lado.
- **Um achado de ferramenta virou uma linha no roteiro do `/designer`** (§4): subir o Expo Web com
  `EXPO_PUBLIC_BACKEND=local`, senão toda captura sai na tela de entrada.

## Descartado (stash) e por quê

Nada.

## Verificação

- testes: 1057 passaram (38 suítes, EXIT=0) · typecheck: ok
- **capturas, lote 1 (chassi):** 9 telas. Oito com o HTML idêntico. A Registrar só trocou a ordem
  de dois atributos de uma `div`; as 218 classes e todos os estilos inline são os mesmos.
- **capturas, lote 2 (controles):** 18 telas (home, ficha `raf` e `bea`, registrar, reposição,
  disponibilidade do aluno, sem horário, pagamento, cobrança, lembrete, pacote, ficha do aluno,
  minha disponibilidade, ajustes, financeiro, acesso, boas-vindas, onboarding 4). Dezessete com o
  HTML idêntico; a de sem horário com as mesmas classes e estilos.
- o bundle servido foi conferido dos dois lados, com e sem os tokens novos.
- fora das capturas: o Resultado e o corpo aberto da falta avisada, que o atalho do script não
  alcança. A mudança neles é a mesma troca de número por token.
- detector: não rodado, porque a rodada não muda o HTML.
- paddings soltos em `src/telas` e `src/componentes`: 37 → 10, todos com comentário.
- capturas: `docs/design/revisoes/capturas/2026-11-13-padding-do-chassi/` (fora do git).

## Como decidir

O PO autorizou mesclar sem aprovação. Para desfazer, `git revert` do merge.
