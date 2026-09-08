# Próximos passos

Backlog priorizado do que vem depois do app navegável. As seis fases de
[IMPLEMENTACAO.md](IMPLEMENTACAO.md) estão concluídas; o que está aqui é trabalho novo.

A ordem não é arbitrária: o item 1 é o que o Envio 01 aponta como **o diferencial do produto** e
hoje é a maior lacuna entre o que o projeto promete e o que ele entrega.

---

## 1. Motor de agendamento de reposição — o diferencial

**Hoje:** as janelas são três strings fixas em `data/seed.json`, escritas à mão.
**Deveria:** sair de um algoritmo, como descreve o Envio 01.

O escopo do MVP define o algoritmo assim: percorrer o horizonte até o vencimento do pacote,
descartar toda janela que colida com aula fixa de outro aluno, com reposição já marcada ou que
caia fora da disponibilidade declarada pelas duas partes, pontuar o que sobra por proximidade da
data, coincidência com o horário regular do aluno e encaixe ao lado de aula existente, e devolver
as três melhores com os motivos em texto.

Como fazer sem quebrar o que já funciona:

- Escrever em `mobile/src/dominio/reposicao.ts`, **puro**, no mesmo padrão de `politica.ts`:
  entra estado, sai resultado, sem tela, sem storage, sem rede.
- Assinatura sugerida:
  `sugerirJanelas(aluno, todosOsAlunos, disponibilidade, politicas, hoje): Janela[]`
- Testar antes de ligar na UI. Os motivos são texto que aparece na tela — teste string a string,
  como já é feito em `politica.test.ts`.
- A tela `Reposicao.tsx` já consome uma lista de `Janela`. Trocar a fonte é uma linha.

**Bloqueio real:** o algoritmo precisa de dois dados que o modelo ainda não tem —
disponibilidade do professor e disponibilidade do aluno. Ver item 2.

## 2. Disponibilidade do professor e do aluno

Sem isso o item 1 não sai do papel. A tela de Ajustes já tem a entrada
*"Minha disponibilidade — 13 blocos · 26h por semana"*, mas ela é decorativa.

- Modelar blocos semanais (dia da semana + intervalo de horas).
- Tela de edição em Ajustes.
- Guardar junto do resto do estado, na mesma chave versionada.

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

Falta modelar o telefone do aluno e a chave Pix do professor (a tela de Ajustes já tem a entrada
*"Chave Pix e dados de cobrança"*, também decorativa).

## 6. Cadastro de alunos

O app carrega quatro alunos de semente e não tem tela de cadastro. Para uso real: criar, editar e
arquivar aluno, com disciplina, horário fixo e telefone.

## 7. Publicação

- **Licença da Satoshi** para app publicado — conferir os termos da Fontshare. É pendência aberta
  desde o handoff.
- Ícone e splash de verdade (hoje são os padrões do template do Expo).
- Development build ou EAS Build. Vale lembrar que *development build não exige login no Expo Go*,
  o que resolve o atrito que aparece hoje ao rodar em celular emprestado.

---

## Dívidas técnicas conhecidas

- **Sem teste de interface.** Só o domínio é testado. As telas foram verificadas à mão, no
  navegador. Vale adicionar `@testing-library/react-native` nos fluxos críticos — registrar aula e
  confirmar reposição.
- **`mobile/src/dados/seed.json` é cópia** de `data/seed.json`, porque o Metro não resolve arquivos
  fora da raiz do projeto. Mudou um, copie no outro.
- **Sem linter configurado.** Só `tsc --noEmit`. Um `eslint-config-expo` fecharia a lacuna.
- **Sem CI.** Um workflow rodando `npm test` e `npm run typecheck` a cada push evita regressão nas
  regras de negócio.
