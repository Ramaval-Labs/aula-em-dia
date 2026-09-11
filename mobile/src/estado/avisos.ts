/**
 * Textos de toast que dependem do domínio, num lugar só.
 *
 * Ficam fora de `dados.ts` porque a lista cresce a cada fluxo novo e o store
 * já é o arquivo mais movimentado do estado. Toda tela nova acrescenta aqui,
 * em vez de escrever literal no meio do JSX.
 */

import { dinheiro, primeiroNome } from '../dominio/formato';
import { valorPacote } from '../dominio/politica';
import type { Aluno } from '../dominio/tipos';

/** Textos de toast que dependem do domínio, num lugar só. */
export const avisos = {
  reposicao: (a: Aluno, janela: { dia: string; hora: string }) =>
    `Reposição de ${primeiroNome(a.name)} em ${janela.dia}, ${janela.hora}. Mensagem enviada.`,
  pagamento: (a: Aluno) =>
    `Pagamento de ${primeiroNome(a.name)} registrado: ${dinheiro(valorPacote(a))}.`,
  // O app não envia mensagem nenhuma: quem manda é o professor, pelo WhatsApp.
  // Os avisos dizem o que o app fez de fato — marcou o lembrete.
  lembrete: (a: Aluno) => `Lembrete de ${primeiroNome(a.name)} marcado como enviado.`,
  lembreteEmLote: (n: number) =>
    `Cobrança marcada para ${n} ${n > 1 ? 'alunos' : 'aluno'}. As mensagens saem pelo seu WhatsApp.`,
  pausa: (a: Aluno, pausado: boolean) =>
    `Aulas de ${primeiroNome(a.name)} ${pausado ? 'pausadas' : 'retomadas'}.`,
  validade: (nova: string) =>
    `Validade agora vai até ${nova}. Um horário novo entrou na lista.`,
  alunoCriado: (nome: string) => `${primeiroNome(nome)} entrou na sua lista.`,
  pacoteCriado: (aulas: number, validade: string) =>
    `Pacote de ${aulas} aulas criado, validade ${validade}.`,
  pacoteRenovado: (saldo: number, validade: string) =>
    `Pacote renovado. Saldo agora é ${saldo}, validade ${validade}.`,
  pagamentoCom: (a: Aluno, meio: string) =>
    `Pagamento de ${primeiroNome(a.name)} registrado: ${dinheiro(valorPacote(a))} · ${meio}.`,
  mensagemCopiada: 'Mensagem copiada. É só colar no WhatsApp.',
  propostaEnviada: (a: Aluno, dia: string, hora: string) =>
    `Proposta enviada para ${primeiroNome(a.name)}: ${dia}, ${hora}.`,
  propostaAceita: (a: Aluno) => `${primeiroNome(a.name)} aceitou o horário.`,
  propostaRecusada: (a: Aluno) =>
    `${primeiroNome(a.name)} recusou. Peça a disponibilidade dele.`,
  propostaCancelada: (a: Aluno) =>
    `Proposta cancelada. A reposição de ${primeiroNome(a.name)} voltou a ficar pendente.`,
  disponibilidadeSalva: 'Disponibilidade salva.',
  perfilSalvo: 'Perfil atualizado.',
  politicaSalva: 'Política salva. O registro de aula já usa a regra nova.',
  estadoZerado: 'Dados de demonstração restaurados.',
};
