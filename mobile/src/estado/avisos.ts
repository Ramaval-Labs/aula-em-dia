/**
 * Textos de toast que dependem do domínio, num lugar só.
 *
 * Ficam fora de `dados.ts` porque a lista cresce a cada fluxo novo e o store
 * já é o arquivo mais movimentado do estado. Toda tela nova acrescenta aqui,
 * em vez de escrever literal no meio do JSX.
 */

import { dinheiro, plural, primeiroNome } from '../dominio/formato';
import { valorPacote } from '../dominio/politica';
import type { Aluno } from '../dominio/tipos';

/** Textos de toast que dependem do domínio, num lugar só. */
export const avisos = {
  /** Marcada sem mensagem: "Agendar sem avisar" e a confirmação feita pelo professor. */
  reposicaoMarcada: (a: Aluno, janela: { dia: string; hora: string }) =>
    `Reposição de ${primeiroNome(a.name)} marcada para ${janela.dia}, ${janela.hora}.`,
  pagamento: (a: Aluno) =>
    `Pagamento de ${primeiroNome(a.name)} registrado: ${dinheiro(valorPacote(a))}.`,
  // O app não envia mensagem nenhuma: quem manda é o professor, pelo WhatsApp.
  // Os avisos dizem o que o app fez de fato — marcou o lembrete.
  lembrete: (a: Aluno) => `Lembrete de ${primeiroNome(a.name)} marcado como enviado.`,
  // O app não manda mensagem: o lembrete fica marcado e o envio acontece na
  // Cobrança de cada aluno, com a mensagem pronta para copiar.
  lembreteEmLote: (n: number) =>
    `Lembrete marcado para ${plural(n, 'aluno', 'alunos')}. O envio é pela Cobrança${
      n > 1 ? ' de cada um' : ''
    }.`,
  pausa: (a: Aluno, pausado: boolean) =>
    `Aulas de ${primeiroNome(a.name)} ${pausado ? 'pausadas' : 'retomadas'}.`,
  // Diz o que mudou de fato: a validade. Quais horários isso abre é a lista
  // de sugestões que mostra, logo em seguida.
  validade: (nova: string) => `Validade estendida: agora vai até ${nova}.`,
  alunoCriado: (nome: string) => `${primeiroNome(nome)} entrou na sua lista.`,
  pacoteCriado: (aulas: number, validade: string) =>
    `Pacote de ${aulas} aulas criado, validade ${validade}.`,
  pacoteRenovado: (saldo: number, validade: string) =>
    `Pacote renovado. Saldo agora é ${saldo}, validade ${validade}.`,
  pagamentoCom: (a: Aluno, meio: string) =>
    `Pagamento de ${primeiroNome(a.name)} registrado: ${dinheiro(valorPacote(a))} · ${meio}.`,
  // Confirma o que foi feito; o que fazer com ela está na nota da prévia.
  mensagemCopiada: 'Mensagem copiada.',
  propostaEnviada: (a: Aluno, dia: string, hora: string) =>
    `Proposta enviada para ${primeiroNome(a.name)}: ${dia}, ${hora}.`,
  propostaAceita: (a: Aluno) => `${primeiroNome(a.name)} aceitou o horário.`,
  propostaRecusada: (a: Aluno) => `${primeiroNome(a.name)} recusou o horário.`,
  propostaCancelada: (a: Aluno) =>
    `Proposta cancelada. A reposição de ${primeiroNome(a.name)} voltou a ficar pendente.`,
  disponibilidadeSalva: 'Disponibilidade salva.',
  perfilSalvo: 'Perfil atualizado.',
  politicaSalva: 'Política salva. O registro de aula já usa a regra nova.',
  estadoZerado: 'Dados de demonstração restaurados.',
};
