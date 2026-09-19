/**
 * Frases sobre o aluno que mais de uma tela escreve igual. Moram em
 * `telas/comum/` porque são texto de interface montado a partir do domínio —
 * o domínio (`dominio/`) decide o estado; a frase é da tela.
 */

import { faixaStatus } from '../../dominio/politica';
import type { Aluno, TipoDeFaixa } from '../../dominio/tipos';

/**
 * "{disciplina} · hoje, {hora}" ou "{disciplina} · {dia}, {hora}" — a linha
 * de apoio da lista de alunos (H§1), da ficha (H§2), da escolha de aluno no
 * Registrar (H§3), da Cobrança (H§7) e da prévia do onboarding.
 */
export function linhaDeHorario(a: Aluno): string {
  if (!a.hora) return `${a.disciplina} · ${a.dia}`;
  return `${a.disciplina} · ${a.hoje ? 'hoje' : a.dia}, ${a.hora}`;
}

/**
 * Faixa de status da linha de aluno: o estado e a prioridade vêm do domínio
 * (`faixaStatus`); o texto é o do handoff §1, montado aqui.
 */
export function faixaDaLinha(a: Aluno): { tipo: TipoDeFaixa; texto: string } | undefined {
  const f = faixaStatus(a);
  if (!f) return undefined;
  const rotulo =
    f.tipo === 'pausado'
      ? `Pausado ${f.sufixo}`
      : f.tipo === 'atraso'
        ? `Atraso de ${f.sufixo}`
        : f.tipo === 'pendente'
          ? `${f.texto} ${f.sufixo}`
          : `Reposição ${f.sufixo}`;
  return { tipo: f.tipo, texto: rotulo };
}
