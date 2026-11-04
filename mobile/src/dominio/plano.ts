/**
 * O limite de alunos do plano gratuito — módulo puro.
 *
 * Só a conta. Recusar o aluno seguinte no cadastro é decisão de PO e outro card,
 * e o trigger no banco espera por ela (PLANO-BACKEND, Parte 5).
 */

import type { Aluno, Plano } from './tipos';

export const LIMITE_GRATUITO = 5;

/** Quem ocupa vaga: todo aluno que não foi arquivado, mesmo pausado ou sem pacote. */
export const alunosAtivos = (alunos: Aluno[]): Aluno[] => alunos.filter((a) => !a.arquivado);

/** O plano pago não tem limite. */
export const atingiuOLimite = (alunos: Aluno[], plano: Plano): boolean =>
  plano === 'gratuito' && alunosAtivos(alunos).length >= LIMITE_GRATUITO;
