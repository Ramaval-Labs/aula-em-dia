# Business Model Canvas — Aula em Dia

Grupo 08 · turma GPE17M80081 · versão final (25/11/2026)

O canvas da proposta ([Envio 01](propostas/Envio01-AulaEmDia.pdf), p. 5) foi atualizado pelo que foi
construído. O que mudou está resumido no fim. Onde algo ainda é plano, e não produto, o texto diz.

| Bloco | Conteúdo |
|---|---|
| **Segmentos de clientes** | **Foco:** o professor particular autônomo de aula individual (idiomas, reforço escolar, instrumento musical) que vende pacotes de aulas. **Expansão 1:** escolas de música e microescolas de idiomas, de 2 a 10 professores. Ali a reposição também precisa de sala e de professor substituto. **Expansão 2:** escolinhas esportivas e estúdios, com turmas coletivas. **Usuário não pagante:** o aluno ou responsável, que consulta o próprio saldo e divulga o produto. |
| **Proposta de valor** | **A reposição deixa de ser negociação:** o app devolve as melhores janelas, de 15 em 15 minutos, conferidas contra a disponibilidade dos dois lados, as aulas fixas de todos os alunos (com horário e duração por dia), as reposições já marcadas, as folgas e a validade do pacote, cada uma com o motivo em texto. **A política de faltas é do professor e é aplicada sozinha:** prazo mínimo de aviso (de 1 a 720 horas), se a falta avisada devolve a aula, quantas reposições por pacote (até 30, ou sem limite) e a validade; o app executa a regra antes de confirmar e registra o motivo de cada débito. **Acaba a discussão sobre quantas aulas restam:** extrato auditável, visível também para o aluno pelo link, **sem instalar nada**. **Nenhuma reposição ou cobrança esquecida:** pendências, atrasos, pacotes perto de vencer e aulas sem registro aparecem primeiro. **Feito para o celular:** registrar a aula leva dois toques. |
| **Canais** | A **página do aluno** (link público) e as **mensagens prontas no WhatsApp** (proposta de reposição e cobrança) levam a marca a cada aluno de cada professor, sem custo de aquisição. Grupos de WhatsApp, Facebook e Telegram de professores particulares e de música. Indicação entre professores. Instagram e TikTok com conteúdo de gestão. **Hoje** o app roda pelo Expo Go e pelo navegador (https://aula-em-dia-three.vercel.app); as lojas de aplicativos ficam para a publicação. |
| **Relacionamento com clientes** | Self-service, com o **onboarding guiado em 4 passos** (perfil, disponibilidade, política e primeiro aluno com pacote), que já está construído. Lembretes que trazem o professor de volta: as aulas de hoje sem registro, na tela inicial (já no app), e o resumo das 7h e o aviso antes da aula, por push. O push já está pronto no servidor, mas só passa a ser entregue quando o app publicado gravar o endereço do aparelho. Suporte direto por WhatsApp na fase inicial, feito pela equipe. Conteúdo educativo sobre precificação e política de cancelamento. Uso diário, o que favorece a retenção. |
| **Fontes de receita** | **Assinatura mensal do professor:** plano gratuito até **5 alunos ativos** (regra do app) e plano pago a **R$ 29,90/mês** sem limite. Hoje a tela de Conta mostra os dois planos e conta as vagas, mas a assinatura em si ainda não é cobrada: relatórios e link personalizado do plano pago são **planejados**. **Plano por escola**, por professor ativo (fase de escolas). **Futuro:** taxa sobre pagamento processado, quando Pix e cartão forem integrados. **O aluno nunca paga.** |
| **Recursos principais** | **Dois motores próprios, o ativo central:** o de consumo de pacote (a política de faltas) e o de agendamento de reposição com restrições, ambos funções puras cobertas por testes automatizados. O aplicativo em React Native com Expo e a mesma base compilada para a web. **Backend gerenciado no Supabase:** banco Postgres com regras de acesso por professor (RLS), escrita transacional do saldo e Edge Functions para a página do aluno, os avisos e a exclusão de conta. Design system próprio (iOS Glass, claro e escuro). Equipe de 3 desenvolvedores. |
| **Atividades-chave** | Desenvolvimento e manutenção do app, da versão web e da API. Evolução do motor de reposição, que é a defesa competitiva. Os lembretes automáticos: o resumo do dia e o aviso antes da aula, prontos no servidor. Entrevistas de validação com professores. Aquisição, onboarding e suporte. Conteúdo sobre gestão de aulas particulares. |
| **Parcerias-chave** | **Supabase** (escolhido): autenticação, banco e funções. **Vercel:** hospeda a versão web e a página do aluno. **Resend:** o e-mail de recuperação de senha. **Expo:** o Expo Go hoje; as notificações push (Expo Push) e o build das lojas na publicação. Escolas de música e de idiomas, como canal e, na fase 2, como clientes. Google Play e App Store, quando o app for publicado. Um provedor de pagamentos (Pix e cartão), na fase de cobrança integrada. Criadores de conteúdo e comunidades de professores. |
| **Estrutura de custos** | **Hoje:** os planos gratuitos do Supabase, da Vercel e do Resend; o tempo da equipe é o maior custo real. **Ao crescer:** banco e funções com custo variável por volume, contas de desenvolvedor (Google Play, taxa única; Apple, anual), marketing e aquisição, suporte e, no futuro, as taxas do provedor de pagamentos. |

## O que mudou desde o Envio 01

- **Backend:** "Supabase ou Firebase" e "API própria" viraram **Supabase**, com regras de acesso por
  professor no próprio banco. Vercel e Resend entraram como parceiros.
- **O aluno usa o produto pelo navegador:** a página do aluno saiu do papel e é o principal canal de
  divulgação.
- **Os motores ficaram mais finos que na proposta:**
  - a agenda passou das faixas fixas (manhã, tarde, noite) para **horários livres de 15 em 15
    minutos**;
  - a aula fixa tem **horário e duração por dia**;
  - a política aceita **qualquer prazo** de aviso e até 30 reposições por pacote.
- **Novos motivos para voltar ao app todo dia:** as aulas sem registro na tela inicial e o atraso de
  pagamento detectado sozinho. O resumo do dia e o aviso antes da aula estão prontos no servidor e
  esperam o app publicado.
- **Distribuição:** o app ainda não está nas lojas. Roda pelo Expo Go e pela versão web.
