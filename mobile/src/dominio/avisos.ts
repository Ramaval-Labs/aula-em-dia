/**
 * Os lembretes do professor — módulo puro (SCRUM-91).
 *
 * A tela de Avisos promete cinco lembretes, e é aqui que eles são calculados,
 * com as mesmas regras que o app já mostra (o âmbar do saldo, a aula fixa, a
 * pendência). O backend (SCRUM-23) chama estas funções pelo bundle do domínio
 * e só decide quando e para quem mandar; não refaz a conta.
 *
 * Dois momentos:
 *   - o resumo da manhã (`avisosDoDia` + `resumoDoDia`), uma frase por dia;
 *   - o aviso antes da aula (`aulasDaProximaHora` + `avisoDaAula`), um por aula.
 *
 * O dia (`dd/mm`) e a hora entram como parâmetro: o fuso é de quem chama.
 */

import { aulaFixaDe, temAulaNoDia } from './aulaFixa';
import { diasEntre } from './datas';
import { diaDaSemanaDe } from './disponibilidade';
import { plural, primeiroNome } from './formato';
import { saldoBaixo } from './politica';
import type { Aluno, PreferenciasDeAviso } from './tipos';

/** "Se ficar 3 dias sem horário escolhido" (tela de Avisos). */
export const DIAS_SEM_HORARIO = 3;
/** "Três dias antes do vencimento" (tela de Avisos). */
export const DIAS_ANTES_DO_VENCIMENTO = 3;
/** "Uma hora antes de cada aula" (tela de Avisos, SCRUM-92). */
export const HORAS_ANTES_DA_AULA = 1;

/** O aluno de um aviso: o suficiente para a frase e para não repetir. */
export interface AlunoAvisado {
  id: string;
  nome: string;
}

export interface AvisosDoDia {
  aulasDeHoje: AlunoAvisado[];
  saldoBaixo: AlunoAvisado[];
  reposicaoPendente: AlunoAvisado[];
  pagamentoVencendo: AlunoAvisado[];
}

export interface AvisoDeAula extends AlunoAvisado {
  /** a hora cheia do começo da aula */
  hora: number;
}

const avisado = (a: Aluno): AlunoAvisado => ({ id: a.id, nome: a.name });

/** Aluno arquivado saiu da lista: não gera aviso nenhum. */
const naLista = (a: Aluno): boolean => !a.arquivado;

/** Aluno pausado não tem aula: não entra nos avisos de aula. */
const temAulas = (a: Aluno): boolean => naLista(a) && !a.pausado;

/** Tem aula fixa no dia da semana de `hoje`. */
function temAulaHoje(a: Aluno, hoje: string): boolean {
  const dia = diaDaSemanaDe(hoje);
  return dia !== null && temAulaNoDia(aulaFixaDe(a), dia);
}

/**
 * A falta virou direito de reposição e, há 3 dias ou mais, o professor não
 * escolheu horário. Proposta enviada ao aluno conta como escolhido: o horário
 * existe e espera o aceite. Proposta recusada volta a contar como pendente.
 */
function reposicaoSemHorario(a: Aluno, hoje: string): boolean {
  if (!a.pendencia || a.agendada) return false;
  if (a.proposta?.status === 'enviada') return false;
  const dias = diasEntre(a.pendencia.origem, hoje);
  return dias !== null && dias >= DIAS_SEM_HORARIO;
}

/** Pagamento em aberto que vence daqui a exatamente 3 dias: avisa uma vez só. */
function vencendo(a: Aluno, hoje: string): boolean {
  if (a.pagamento.status !== 'aberto' || !a.pagamento.vence) return false;
  return diasEntre(hoje, a.pagamento.vence) === DIAS_ANTES_DO_VENCIMENTO;
}

/** O que o resumo da manhã de `hoje` tem para dizer, por categoria. */
export function avisosDoDia(
  alunos: Aluno[],
  preferencias: PreferenciasDeAviso,
  hoje: string,
): AvisosDoDia {
  const lista = alunos.filter(naLista);
  const se = (ligado: boolean, cond: (a: Aluno) => boolean) =>
    ligado ? lista.filter(cond).map(avisado) : [];

  return {
    aulasDeHoje: se(preferencias.aulaDoDia, (a) => temAulas(a) && temAulaHoje(a, hoje)),
    saldoBaixo: se(preferencias.saldoBaixo, saldoBaixo),
    reposicaoPendente: se(preferencias.reposicaoPendente, (a) => reposicaoSemHorario(a, hoje)),
    pagamentoVencendo: se(preferencias.pagamentoVencendo, (a) => vencendo(a, hoje)),
  };
}

/** "a", "a e b", "a, b e c". */
function juntar(partes: string[]): string {
  if (partes.length <= 1) return partes.join('');
  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/**
 * A frase do push da manhã: "Hoje: 2 aulas, 1 saldo baixo e 1 reposição sem
 * horário.". Sem nada para avisar, `null`, e não há push.
 */
export function resumoDoDia(avisos: AvisosDoDia): string | null {
  const partes = [
    [avisos.aulasDeHoje.length, 'aula', 'aulas'],
    [avisos.saldoBaixo.length, 'saldo baixo', 'saldos baixos'],
    [avisos.reposicaoPendente.length, 'reposição sem horário', 'reposições sem horário'],
    [avisos.pagamentoVencendo.length, 'pagamento vencendo', 'pagamentos vencendo'],
  ] as const;
  const ditas = partes.filter(([n]) => n > 0).map(([n, um, varios]) => plural(n, um, varios));
  return ditas.length > 0 ? `Hoje: ${juntar(ditas)}.` : null;
}

/**
 * As aulas de hoje que começam daqui a uma hora: com `horaAgora = 17`, as das
 * 18h. `antesDaAula` ausente vale ligado, como o padrão da tela: a preferência
 * gravada antes do aviso existir não tem a chave.
 */
export function aulasDaProximaHora(
  alunos: Aluno[],
  preferencias: PreferenciasDeAviso,
  hoje: string,
  horaAgora: number,
): AvisoDeAula[] {
  if (preferencias.antesDaAula === false) return [];
  const hora = horaAgora + HORAS_ANTES_DA_AULA;
  return alunos
    .filter((a) => temAulas(a) && temAulaHoje(a, hoje) && aulaFixaDe(a).hora === hora)
    .map((a) => ({ ...avisado(a), hora }));
}

/** A frase do push antes da aula: "Aula com Bia às 18h.". */
export const avisoDaAula = (aviso: Pick<AvisoDeAula, 'nome' | 'hora'>): string =>
  `Aula com ${primeiroNome(aviso.nome)} às ${aviso.hora}h.`;
