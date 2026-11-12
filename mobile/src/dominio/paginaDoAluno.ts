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
import { diasEntre, hoje } from './datas';
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

/**
 * A janela já passou: a data do rótulo ("Terça, 20/10") é anterior a
 * `referencia`. A de hoje ainda vale. Um rótulo sem data não vence, porque
 * não há o que comparar (SCRUM-79, P2-1 da revisão da Parte 6).
 */
export function janelaVencida(janela: { dia: string }, referencia: string = hoje()): boolean {
  const data = /(\d{2}\/\d{2})\s*$/.exec(janela.dia)?.[1];
  if (!data) return false;
  const dias = diasEntre(data, referencia);
  return dias !== null && dias > 0;
}

function propostaDaPagina(
  proposta: Proposta,
  aluno: Aluno,
  alunos: Aluno[],
  disponibilidade: Disponibilidade,
  referencia: string,
): PropostaDaPagina | null {
  const todas = candidatos(aluno, alunos, disponibilidade, referencia);
  const janelaDaPagina = ({ dia, hora }: { dia: string; hora: string }): JanelaDaPagina => ({
    dia,
    hora,
    razoes: todas.find((c) => c.dia === dia && c.hora === hora)?.razoes ?? [],
  });

  const { janela } = proposta;
  // A proposta vencida some para o aluno (PO, 04/11): sem o estado "expirada",
  // a página mostra que não há proposta em aberto, e o professor segue vendo a
  // pendência na ficha. No banco ela continua como estava.
  if (janelaVencida(janela, referencia)) return null;
  const sugeridas = (): Candidata[] =>
    melhores(todas.filter((c) => c.dia !== janela.dia || c.hora !== janela.hora));

  // A janela que outro aluno já ocupou com a reposição dele sai da página: um
  // horário aceita uma reposição só (SCRUM-83). Se a principal saiu, a
  // primeira alternativa livre toma o lugar dela.
  const ocupada = (j: { dia: string; hora: string }) =>
    alunos.some(
      (o) => o.id !== aluno.id && !o.arquivado && o.agendada?.dia === j.dia && o.agendada?.hora === j.hora,
    );
  // Lista vazia é o que o professor enviou, e fica vazia. Só proposta gravada
  // sem o campo cai nas sugestões, como em AlunoProposta.
  const alternativas = (proposta.alternativas ?? sugeridas())
    .filter((j) => !janelaVencida(j, referencia))
    .slice(0, ALTERNATIVAS);
  const livres = [janela, ...alternativas].filter((j) => !ocupada(j));
  if (livres.length === 0) return null;
  const [principal, ...resto] = livres;

  return {
    principal: janelaDaPagina(principal),
    alternativas: resto.slice(0, ALTERNATIVAS).map(janelaDaPagina),
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
