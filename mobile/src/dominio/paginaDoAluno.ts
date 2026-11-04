/**
 * O recorte do que o aluno vê pelo link (`/a/<token>`), num lugar só.
 *
 * A proposta precisa de todos os alunos e da grade do professor para calcular
 * as janelas, e nada disso pode chegar ao navegador do aluno: a Edge Function
 * chama esta função no servidor e devolve só o resultado (PLANO-BACKEND, Parte 6).
 *
 * Por isso todo campo é escolhido um a um, nunca com `...`. O que é gravado às
 * vezes traz mais do que o tipo diz: as alternativas de uma proposta são
 * candidatas inteiras do motor, com `pontos` e `bloco`.
 *
 * Módulo puro, sem React Native nem `estado/`: vai num bundle para o Deno.
 */

import { candidatos, MELHORES, melhores, type Candidata } from './agenda';
import { hoje } from './datas';
import { primeiroNome } from './formato';
import { comoOAlunoVaiLer } from './mensagens';
import { saldo, temPacote } from './politica';
import type {
  Aluno,
  BlocoSemanal,
  Disponibilidade,
  Lancamento,
  Perfil,
  Politicas,
  Proposta,
} from './tipos';

/** A principal mais estas: as 3 janelas de `MELHORES`. */
const ALTERNATIVAS = MELHORES - 1;

/** Sem `motivo`: é texto gravado, e a semente já tem um que cita outro aluno. */
export interface JanelaDaPagina {
  dia: string;
  hora: string;
  /** os motivos do motor, vazio se ele não sugere mais esta janela */
  razoes: string[];
}

export interface PropostaDaPagina {
  principal: JanelaDaPagina;
  alternativas: JanelaDaPagina[];
}

export interface PaginaDoAluno {
  /** só o primeiro nome */
  nome: string;
  disciplina: string;
  dia: string;
  hora: string;
  saldo: number;
  total: number;
  temPacote: boolean;
  validade: string;
  agendada: { dia: string; hora: string } | null;
  /** a regra combinada, a mesma frase que o professor declarou */
  regra: string;
  extrato: Lancamento[];
  professor: { nome: string; disciplina: string | null };
  /** a proposta aberta, ou `null` */
  proposta: PropostaDaPagina | null;
  /** o que o próprio aluno informou, nunca a grade do professor */
  disponibilidade: BlocoSemanal[];
}

function propostaDaPagina(
  proposta: Proposta,
  aluno: Aluno,
  alunos: Aluno[],
  disponibilidade: Disponibilidade,
  referencia: string,
): PropostaDaPagina {
  const todas = candidatos(aluno, alunos, disponibilidade, referencia);
  const janelaDaPagina = ({ dia, hora }: { dia: string; hora: string }): JanelaDaPagina => ({
    dia,
    hora,
    razoes: todas.find((c) => c.dia === dia && c.hora === hora)?.razoes ?? [],
  });

  const { janela } = proposta;
  const sugeridas = (): Candidata[] =>
    melhores(todas.filter((c) => c.dia !== janela.dia || c.hora !== janela.hora));

  return {
    principal: janelaDaPagina(janela),
    // Lista vazia é o que o professor enviou, e fica vazia. Só proposta gravada
    // sem o campo cai nas sugestões, como em AlunoProposta.
    alternativas: (proposta.alternativas ?? sugeridas()).slice(0, ALTERNATIVAS).map(janelaDaPagina),
  };
}

export function paginaDoAluno(
  aluno: Aluno,
  extrato: Lancamento[],
  perfil: Perfil,
  politicas: Politicas,
  alunos: Aluno[],
  disponibilidade: Disponibilidade,
  referencia: string = hoje(),
): PaginaDoAluno {
  return {
    nome: primeiroNome(aluno.name),
    disciplina: aluno.disciplina,
    dia: aluno.dia,
    hora: aluno.hora,
    saldo: saldo(aluno),
    total: aluno.total,
    temPacote: temPacote(aluno),
    validade: aluno.validade,
    agendada: aluno.agendada ? { dia: aluno.agendada.dia, hora: aluno.agendada.hora } : null,
    regra: comoOAlunoVaiLer(politicas, false),
    extrato: extrato.map(({ d, t, s, delta, saldo: saldoApos, dinheiro }) => ({
      d,
      t,
      s,
      delta,
      saldo: saldoApos,
      ...(dinheiro ? { dinheiro } : {}),
    })),
    professor: {
      nome: primeiroNome(perfil.nome),
      disciplina: perfil.disciplinas[0] ?? null,
    },
    // `enviada` é o que o banco chama de aberta (índice `uma_proposta_aberta`).
    // A recusada continua gravada no aluno, mas não há mais o que responder.
    proposta:
      aluno.proposta?.status === 'enviada'
        ? propostaDaPagina(aluno.proposta, aluno, alunos, disponibilidade, referencia)
        : null,
    disponibilidade: aluno.disponibilidade ?? [],
  };
}
