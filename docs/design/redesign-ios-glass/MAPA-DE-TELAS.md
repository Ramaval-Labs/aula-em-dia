# Mapa de telas — redesign iOS Glass

Contrato compartilhado pelos agentes do redesign (`PLANO.md`, nesta pasta). Cada tela tem **um**
tipo, **uma** referência e **um** dono na Onda 3. Se esta tabela estiver errada para uma tela, o
agente relata no relatório final e **não** muda a navegação por conta própria.

Referências:
- **H§n** = seção *n* de `handoff-ios-glass/README.md` (as 9 telas desenhadas). Medidas, copy e
  estados vêm de lá, à risca.
- **Derivada (Fluxo X)** = o handoff novo não desenha. O conteúdo e o comportamento vêm da tela
  atual e de `docs/design/historico/tinta-chapada/Fluxo X*.dc.html`; o visual é montado **só** com
  o catálogo de componentes novo, seguindo o padrão da tela desenhada mais parecida (indicada em
  "Modelo").

## Tipos de tela

| Tipo | Chrome | Padding do conteúdo | Tab bar |
|---|---|---|---|
| **raiz** | título grande no conteúdo; barra de navegação aparece com a rolagem | `54 16 126` | visível, aba ativa |
| **empilhada** | botão voltar fixo (chevron + rótulo em tint); barra de navegação com a rolagem | `100 16 126` | visível, aba da raiz ativa |
| **sheet** | painel 88% (74% no `resultado`), puxador, cabeçalho 52px com "Cancelar" + título, corpo rolável, rodapé fixo com a ação primária | corpo `6 16 16`, rodapé `10 16 30` | escondida |
| **entrada** | fundo de refração, sem tab bar; voltar em tint quando há passo anterior | `54 16` + rodapé com o primário | não existe |

Rótulo do voltar = título curto da última tela **não-sheet** da pilha: "Alunos", "Financeiro",
"Ajustes", ou o **primeiro nome do aluno** quando a anterior é a Ficha.

## Semântica de sheet (implementada na Onda 2A em `estado/navegacao.ts`)

- `ir(sheet)` a partir de tela não-sheet → abre o sheet sobre ela.
- `ir(sheet)` a partir de um sheet → **troca o conteúdo** do sheet aberto (não empilha outro painel).
- `ir(naoSheet)` a partir de um sheet → fecha o sheet e empilha o destino sobre a última não-sheet.
- `concluir(destino)` a partir de um sheet → fecha o sheet e substitui a pilha, como hoje.
- "Cancelar", toque fora do painel e voltar do Android → `fecharSheet()`: remove as entradas de
  sheet da pilha e volta para a última não-sheet.

## As 35 telas

### Aba Alunos — dono T1 (exceto registro e reposição, T2)

| Chave | Arquivo | Tipo | Referência | Modelo / notas | Dono |
|---|---|---|---|---|---|
| `home` | `telas/Home.tsx` | raiz | **H§1** | Mantém "Novo aluno" (hoje em `Home.tsx:43`) como secundário ou item de cabeçalho — um primário por tela ("Registrar aula") | T1 |
| `aluno` | `telas/AlunoDetalhe.tsx` | empilhada ("Alunos") | **H§2** | Ações que o handoff não tem (disponibilidade do aluno, aguardando aceite, ver como aluno, editar, pacote) entram como lista agrupada "MAIS" depois do extrato; o primário continua sendo um só | T1 |
| `alunoForm` | `telas/AlunoForm.tsx` | sheet 88% | Derivada (Fluxo E/A) | Modelo: sheet de H§3 + campos novos. Título "Novo aluno"/"Editar aluno", rodapé "Salvar". Arquivar: botão texto no fim do corpo, com `useDoisToques` | T1 |
| `pacote` | `telas/Pacote.tsx` | sheet 88% | Derivada (Fluxo D) | Modelo: H§3 (cartões de escolha) + cartão de saldo de H§2 | T1 |
| `verComoAluno` | `telas/aluno/VisaoDoAluno.tsx` | empilhada (primeiro nome) | Derivada (Fluxo F) | Faixa "Prévia do que o aluno vê" no topo; lista agrupada das três visões | T1 |
| `alunoSaldo` | `telas/aluno/VisaoDoAluno.tsx` | empilhada ("Prévia") | Derivada (Fluxo F) | Modelo: cartão de saldo + extrato de H§2 | T1 |
| `alunoProposta` | `telas/aluno/VisaoDoAluno.tsx` | empilhada ("Prévia") | Derivada (Fluxo F) | Modelo: cartões de escolha de janela de H§5 | T1 |
| `alunoDisponibilidade` | `telas/aluno/VisaoDoAluno.tsx` | empilhada ("Prévia") | Derivada (Fluxo F) | `GradeSemanal` nova dentro de cartão de vidro | T1 |
| `registrar` | `telas/Registrar.tsx` | sheet 88% | **H§3** | Os segmentos de antecedência do handoff (48h/26h/10h) são ilustrativos; o domínio (`politica.ts`) decide. Se o domínio usa outro controle, mantém o controle e registra | T2 |
| `resultado` | `telas/Resultado.tsx` | sheet 74% | **H§4** | Mostra o saldo gravado (divergência conhecida do protótipo) | T2 |
| `reposicao` | `telas/Reposicao.tsx` | sheet 88% ("Escolher horário") | **H§5** | Janelas vêm do motor `dominio/agenda.ts`, não das fixas do protótipo. "Nenhum serve · escolher outro" → `outroHorario` (troca o conteúdo); "Rever política" → `politica` (fecha o sheet); "Ver saídas" → `semHorario` | T2 |
| `dispAluno` | `telas/reposicao/DispAluno.tsx` | sheet 88% | Derivada (Fluxo C, C2) | "Passo 1 de 3" vira sub-linha (padrão da sub-linha de H§5). `GradeSemanal` nova | T2 |
| `outroHorario` | `telas/reposicao/OutroHorario.tsx` | sheet 88% | Derivada (Fluxo C, C4) | Modelo: H§5, com segmentado de semana | T2 |
| `semHorario` | `telas/reposicao/SemHorario.tsx` | sheet 88% | Derivada (Fluxo C, C5) | Modelo: bloco âmbar de limite de H§5 + lista agrupada de saídas | T2 |
| `confirmarReposicao` | `telas/reposicao/ConfirmarReposicao.tsx` | sheet 88% | Derivada (Fluxo C, C6) | Rodapé "Confirmar e avisar o aluno" (copy de H§5); `PreviaDeMensagem` nova no corpo | T2 |
| `aguardandoAceite` | `telas/reposicao/AguardandoAceite.tsx` | empilhada (primeiro nome) | Derivada (Fluxo C, C7) | Modelo: blocos de status de H§2 + lista de ações de H§7 | T2 |

### Aba Financeiro — dono T3

| Chave | Arquivo | Tipo | Referência | Modelo / notas |
|---|---|---|---|---|
| `financeiro` | `telas/Financeiro.tsx` | raiz | **H§6** | — |
| `inadimplencia` | `telas/Inadimplencia.tsx` | empilhada ("Financeiro", ou primeiro nome quando vem da Ficha) | **H§7** | — |
| `pagamento` | `telas/Pagamento.tsx` | sheet 88% ("Registrar pagamento") | Derivada (Fluxo D, D2) | Modelo: cartão de débito de H§7. Handoff: "Cobrança → Registrar pagamento → volta (com toast)" — aberto a partir de `inadimplencia`, conclui voltando para ela em vez de `financeiro` |
| `lembrete` | `telas/Lembrete.tsx` | sheet 88% ("Lembrete de cobrança") | Derivada (Fluxo D, D5) | Três tons em segmentado; `PreviaDeMensagem` nova |

### Aba Ajustes — dono T4

| Chave | Arquivo | Tipo | Referência | Modelo / notas |
|---|---|---|---|---|
| `ajustes` | `telas/Ajustes.tsx` | raiz | **H§8** | Segmentado Claro/Escuro embutido na linha "Aparência". **Não** portar o bloco "Zerar dados de demonstração" nem a versão "protótipo acadêmico" — o rodapé mostra só a versão |
| `politica` | `telas/Politica.tsx` | empilhada ("Ajustes") | **H§9** | Salvar e Descartar no fim do conteúdo (não é sheet) |
| `perfil` | `telas/ajustes/SubTelas.tsx` | empilhada ("Ajustes") | Derivada (Fluxo E) | Modelo: cartão de perfil de H§8 + campos em cartão de vidro; primário no fim |
| `minhaDisponibilidade` | `telas/ajustes/SubTelas.tsx` | empilhada ("Ajustes") | Derivada (Fluxo E) | `GradeSemanal` nova + lista de folgas |
| `pacotesPadrao` | `telas/ajustes/SubTelas.tsx` | empilhada ("Ajustes") | Derivada (Fluxo E) | Modelo: cartões de H§9 (stepper, segmentado) |
| `avisos` | `telas/ajustes/SubTelas.tsx` | empilhada ("Ajustes") | Derivada (Fluxo E) | Modelo: cartões com switch de H§9 |
| `chavePix` | `telas/ajustes/SubTelas.tsx` | empilhada ("Ajustes") | Derivada (Fluxo E) | Campo em cartão de vidro + `PreviaDeMensagem` |
| `conta` | `telas/ajustes/SubTelas.tsx` | empilhada ("Ajustes") | Derivada (Fluxo E) | Lista agrupada; "Sair" como botão texto destrutivo com `useDoisToques` |

### Entrada — dono T5 (máquina `estado/sessao.ts`, fora do `registro.ts`)

| Tela | Arquivo | Tipo | Referência | Modelo / notas |
|---|---|---|---|---|
| Splash | `telas/entrada/Splash.tsx` | entrada | Derivada (Fluxo A1) | Fundo de refração + wordmark **só tipográfico** ("Aula em Dia", Satoshi 800, tint). As quatro barras com amarelo saem |
| Boas-vindas | `telas/entrada/BoasVindas.tsx` | entrada | Derivada (Fluxo A2) | Título grande de H§1; três passos em lista agrupada; primário "Criar conta", secundário "Entrar" |
| Acesso | `telas/entrada/Acesso.tsx` | entrada | Derivada (Fluxo A3) | Campos em cartão de vidro; segmentado Entrar/Criar conta |
| Onboarding 1–4 | `telas/entrada/{Perfil,Disponibilidade,PoliticaInicial,PrimeiroAluno}.tsx` + `PassoDoOnboarding.tsx` | entrada | Derivada (Fluxo A4–A7) | Chassi único em `PassoDoOnboarding`: voltar, "Passo N de 4" como sub-linha, medidor de 4 barras (padrão do medidor de pacote de H§2), primário no rodapé. `PoliticaInicial` reusa os cartões de H§9 |

## Divergências handoff × domínio já conhecidas

Quem encontrar mais uma acrescenta aqui no relatório; o domínio vence sempre.

| Ponto | Handoff iOS Glass | App | Vale |
|---|---|---|---|
| Janelas de reposição | 3 fixas + 1 com validade estendida | motor `agenda.ts` com motivo calculado | app |
| Saldo no Resultado | protótipo aplica o delta duas vezes | saldo gravado | app |
| "13 blocos · 26h por semana" | 2h por bloco | duração real (40h) | app |
| Ordenação da Home | Urgência / A–Z / Hoje | conferir com o filtro atual (`navegacao.filtro`) | domínio/estado atual; registrar se diferir |
| Chave de persistência | `aulaemdia.ios.v1` | `aulaemdia.app.v4` (+ tema em `CHAVE_TEMA`) | app |
