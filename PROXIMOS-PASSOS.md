# Próximos passos

Backlog priorizado do que vem depois do app navegável.

> **Atualizado.** As 35 telas do handoff estão implementadas, e o motor de reposição
> (item 1 da versão anterior deste arquivo) **existe** em `mobile/src/dominio/agenda.ts`.
> O que sobrou aqui é o que ainda não foi feito.

---

## ~~1. Motor de agendamento de reposição~~ — feito

**Feito** em `mobile/src/dominio/agenda.ts`: percorre o horizonte até a validade do pacote,
descarta folga do professor, colisão com aula fixa de outro aluno e bloco fora da
disponibilidade declarada dos dois lados, e pontua por proximidade, coincidência com o
horário habitual e encaixe. As razões que aparecem na tela saem do cálculo.

**O que falta aprimorar:** o horário fixo do aluno ainda é texto livre (`"terça e quinta"`,
`"18h"`), lido por palavra-chave. Um modelo estruturado de horário tornaria a detecção de
colisão exata em vez de aproximada. E não há teste automatizado do motor — só o teste de
montagem das telas que o consomem.

## ~~2. Disponibilidade do professor e do aluno~~ — feito

**Feito**: modelo de blocos semanais em `dominio/disponibilidade.ts`, grade reutilizada em
quatro telas (onboarding, disponibilidade do aluno, Ajustes e visão do aluno), folgas e
feriados, e persistência junto do resto do estado.

**Divergência registrada:** o handoff mostra *"13 blocos · 26h por semana"*, o que equivale a
contar 2h por bloco. As faixas desenhadas são de 4h, 3h, 3h e 2h — os mesmos 13 blocos somam
**40h**. O app calcula pela duração real, porque é esse número que o motor de agenda usa.

## 3. Datas reais no lugar de `28/08`

O app tem tudo pronto para virar essa chave: `mobile/src/dominio/datas.ts` centraliza o "hoje" e
já faz contas de dias de verdade. Basta `USAR_DATA_REAL = true`.

**O que trava:** `data/seed.json` foi escrito em volta de 28/08 — validades, dias de atraso e as
janelas fixas. Ligar a data real sem revisar a semente produz números sem sentido ("venceu há 400
dias"). Decidir: ou a semente passa a usar datas relativas ao dia de hoje, ou o app deixa de vir
com dados de demonstração.

Há também uma inconsistência herdada do handoff: Rafael tem `pendencia.origem: "12/08"` com
`dias: 3`, mas de 12/08 a 28/08 são 16 dias. Definir qual dos dois valores é o correto.

## 4. Backend e sincronização

Hoje é tudo local (AsyncStorage). Trocar de aparelho perde tudo, e não existe o link público do
aluno previsto no MVP.

O Business Model Canvas já aponta a direção: **Supabase ou Firebase** para autenticação e banco.
Ordem sugerida: autenticação do professor → sincronizar alunos, extratos e políticas → só então o
link público de consulta do aluno.

## 5. Envio real da mensagem ao aluno

Hoje o app registra a ação e mostra um toast — não envia nada. O MVP prevê **lembrete disparado
por link direto do WhatsApp**, que é o caminho mais barato: montar a mensagem e abrir
`https://wa.me/<telefone>?text=<mensagem>` com o `Linking` do React Native.

O telefone do aluno e a chave Pix do professor **já estão modelados e editáveis**, e as telas de
mensagem (reposição e cobrança) já montam o texto pronto — só copiam para a área de
transferência em vez de abrir o WhatsApp. Trocar `Clipboard` por `Linking.openURL` é a mudança.

## ~~6. Cadastro de alunos~~ — feito

**Feito**: criar pelo "+ Novo aluno" no cabeçalho da home, editar e arquivar na ficha, com
disciplina, horário fixo e telefone. O onboarding também cria o primeiro aluno.

## 7. Publicação

- **Licença da Satoshi** para app publicado — conferir os termos da Fontshare. É pendência aberta
  desde o handoff.
- Ícone e splash de verdade (hoje são os padrões do template do Expo).
- Development build ou EAS Build. Vale lembrar que *development build não exige login no Expo Go*,
  o que resolve o atrito que aparece hoje ao rodar em celular emprestado.

---

## Redesign iOS Glass — o que ficou depois da integração

A troca de design system terminou na Onda 4: um único sistema visual, o legado apagado e
teste que impede o amarelo e as curvas de voltarem. O que segue é revisão (Onda 5) e decisão
de design.

**P2 — decisão de design**
- **Âmbar como texto no tema claro** (`#C07C00`) fica em 2.4–3.2:1 sobre cartão e sobre
  `ambarSuave` (`spec/acessibilidade.md`). Afeta "Reposição pendente", saldo baixo e "A
  receber". Proposta: um âmbar de texto mais escuro só no claro, mantendo o de fundo.
- **Glifo branco (`sobreCor`) sobre verde/âmbar no escuro** fica abaixo de 3:1 (check da
  medalha do Resultado, ícone de bloco). O handoff pede branco; `sobreTint` resolveria.
- **Título do cartão de ajuste**: o protótipo usa 14.5/700 em H§9; algumas fatias tinham usado
  15. Ficou 14.5 em todos (`CartaoDeAjuste`). Confirmar.
- **Divergências de comportamento** registradas em `mobile/README.md` → "Onde a implementação
  diverge do protótipo" (itens 4 a 11): "Fechar" no Resultado, "Trocar o horário" sempre para
  as sugestões, alternativa da proposta que seleciona em vez de aceitar, bloco "Zerar dados"
  removido, Pagamento que volta para a Cobrança, efeito da falta avisada só depois de escolhida.

**P2 — telas derivadas a validar com design** (o handoff novo não desenha; o visual foi
montado com o catálogo, seguindo a tela desenhada mais parecida — `MAPA-DE-TELAS.md`):
- Entrada: Splash, Boas-vindas, Acesso, os 4 passos do onboarding (chassi `TelaDeEntrada`).
- Alunos: Novo/Editar aluno, Pacote, as quatro telas da visão do aluno.
- Reposição: disponibilidade do aluno, outro horário, sem horário, confirmar, aguardando aceite.
- Financeiro: Registrar pagamento, Lembrete de cobrança.
- Ajustes: Meu perfil, Minha disponibilidade, Pacotes padrão, Avisos, Chave Pix, Conta.

**P3 — acabamento**
- Calibrar o blur no aparelho (iOS e Android 12+): `MATERIAL.intensidade*` partiu da conversão
  do CSS; o checkpoint da Onda 1 validou só o essencial.
- Teclado no sheet: o painel tem altura fixa (88%), então no Android (adjustResize) o topo pode
  ser cortado com o teclado aberto em Novo aluno e Pacote. Conferir no aparelho.
- Medidas soltas que ainda não são token (paddings internos de cartão, `alturaDaCelula={52}` na
  disponibilidade do aluno, margens entre blocos): vale uma passada do `/designer` com
  `extract`.
- `DESIGN.md` regravado a partir do que foi entregue (Onda 4, sessão principal).

---

## Dívidas técnicas conhecidas

- **Teste de interface só de fumaça.** Existe um teste que monta as 28 telas do app em quatro
  estados, as 7 da entrada e o app com um sheet aberto, e afirma que nenhuma lança — foi ele que pegou um loop infinito de render causado por
  seletor de store instável. Falta teste de fluxo de verdade: registrar aula e confirmar
  reposição, com asserção de conteúdo.
- **Os módulos de domínio novos não têm teste próprio.** `agenda.ts`, `mensagens.ts` e
  `pacote.ts` são puros e testáveis, mas hoje só são exercitados de lado, pelo teste de
  montagem.
- **O visual foi conferido por capturas web**, não no aparelho: as 35 telas nos dois temas
  estão em `docs/design/revisoes/capturas/redesign-integrado/` (fora do git). Falta a passada
  no Expo Go.
- **`mobile/src/dados/seed.json` é cópia** de `data/seed.json`, porque o Metro não resolve arquivos
  fora da raiz do projeto. Mudou um, copie no outro.
- **Sem linter configurado.** Só `tsc --noEmit`. Um `eslint-config-expo` fecharia a lacuna.
- **Sem CI.** Um workflow rodando `npm test` e `npm run typecheck` a cada push evita regressão nas
  regras de negócio.
