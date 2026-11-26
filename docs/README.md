# Aula em Dia — Grupo 08

Soluções Computacionais · Universidade Católica de Brasília · 2026/2

## Integrantes

| Nome completo | Matrícula | Turma |
|---|---|---|
| Mauro Schulz | UC22201123 | GPE17M80081 |
| Rafael Dornelas | UC23101280 | GPE17M80081 |
| Valentin Klein Antunes | UC23100774 | GPE17M80081 |

**Vídeo de apresentação (YouTube, não listado):** _a preencher com o link_

---

## O projeto

Professores particulares de idiomas, reforço escolar e instrumento musical vendem pacotes de aulas
pagos adiantado. Quando o aluno falta, começam duas dores:
- **Saber se a falta consome uma aula do pacote.** A regra existe só na cabeça do professor.
- **Encontrar um horário de reposição.** Ele precisa servir aos dois, não colidir com os outros
  alunos e cair antes de o pacote vencer.

Hoje isso custa a discussão mensal sobre quantas aulas restam e dez mensagens de WhatsApp por
falta. Muitas vezes termina em reposição esquecida: aula paga e não dada.

O **Aula em Dia** resolve o que vem depois da falta:
- **A política de faltas é aplicada sozinha.** O professor a define uma vez, e o app registra o
  motivo de cada débito num extrato que o aluno também vê.
- **A reposição vira horários prontos.** Eles são calculados contra a agenda real e vêm com o
  motivo de cada sugestão.

Os concorrentes resolvem o saldo; nós resolvemos o que vem depois.

O documento completo está em **[PROJETO.md](PROJETO.md)** ([PDF](PROJETO.pdf)): dores, solução,
regras de negócio, arquitetura, qualidade e próximos passos.

## As aplicações

| Pasta | O que é |
|---|---|
| [`app/`](../app/README.md) | O aplicativo do professor, em React Native + Expo, que roda no Expo Go (iOS e Android). |
| [`web/`](../web/README.md) | A mesma aplicação compilada para o navegador, publicada em **https://aula-em-dia-three.vercel.app**. É também onde mora a **página do aluno** (`/a/<token>`). |
| [`api/`](../api/README.md) | O backend no Supabase: banco Postgres com regras de acesso (RLS), as funções do banco e as Edge Functions. As duas aplicações usam a mesma API. |

**Não há aplicação desktop.** O professor usa o app no celular, quase sempre no fim da aula. Quem
prefere o computador usa a versão web, que é o mesmo código.

**Perfis de acesso:**
- **Professor:** entra com e-mail e senha e só enxerga os próprios alunos.
- **Aluno (ou responsável):** não tem conta. Abre o link que o professor manda e, por ele, vê o
  saldo, o extrato e as propostas de reposição, e informa quando pode repor.

## Como executar

Cada aplicação tem um README próprio, que começa pelos pré-requisitos, pelas dependências, pelas
variáveis de ambiente e pelos comandos:
- [`app/README.md`](../app/README.md): o app no celular (Expo Go) ou no navegador. Roda sem backend,
  no modo local, com dados de demonstração.
- [`web/README.md`](../web/README.md): servir a versão web já compilada, ou compilar de novo.
- [`api/README.md`](../api/README.md): subir o banco e as funções localmente (Docker) e rodar os
  testes.

## Prints

| Alunos | Reposição | Página do aluno |
|---|---|---|
| ![Lista de alunos](prints/01-alunos.png) | ![Sugestões de reposição](prints/02-reposicao.png) | ![Página do aluno](prints/03-pagina-do-aluno.png) |
| Quem precisa de atenção aparece primeiro: atraso, reposição pendente, saldo baixo. | As melhores sugestões de horário, cada uma com o motivo, calculadas contra a agenda real. | O que o aluno vê pelo link, sem instalar nada: saldo, extrato e a regra combinada. |

## Documentos

| Documento | O que tem |
|---|---|
| [PROJETO.md](PROJETO.md) · [PDF](PROJETO.pdf) | O projeto completo: problema, solução, regras, arquitetura, qualidade e limitações |
| [BMC.md](BMC.md) | O Business Model Canvas, atualizado pelo que foi construído |
| [DADOS.md](DADOS.md) · [PDF](DADOS.pdf) | O modelo de dados: diagrama ER, dicionário, regras de acesso e funções |
| [propostas/](propostas/) | As entregas anteriores: a proposta (Envio 01) e a entrega de 25/09 |
| [backend/](backend/) | O plano do backend em 8 partes (`PLANO-BACKEND.md`, com os diagramas em Mermaid) |
| [design/](design/) | O plano do redesign *iOS Glass*, o mapa das 37 telas e os relatórios das revisões de design |
| [jira/](jira/) | O quadro Scrum: papéis, sprints e o backlog inicial |
| [projeto/](projeto/) | Os arquivos editáveis de especificação: o handoff de design (protótipos), `spec/` (regras, navegação, acessibilidade, casos de teste), `tokens/`, `PRODUCT.md`, `DESIGN.md` e os dados de demonstração |
