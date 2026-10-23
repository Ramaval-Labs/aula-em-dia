/**
 * O caminho de ida para o banco, sem banco: o que o conversor manda, com os
 * padrões que o Postgres poria nas colunas que o app não envia (ids,
 * `criado_em`, `token_publico`, `versao`). Serve à ida e volta do conversor e
 * para preencher as tabelas do Supabase simulado.
 *
 * Os padrões seguem a 0001: `criado_em` é `now()` no aluno e nas três tabelas
 * do professor, e o lançamento leva o `criado_em` que o conversor montou.
 */

import { formatarDdMm } from '../../dominio/datas';
import {
  alunoParaBanco,
  disponibilidadeParaBanco,
  extratoParaBanco,
  perfilParaBanco,
  politicasParaBanco,
  propostaParaBanco,
  type LinhaDaDisponibilidade,
  type LinhaDaPolitica,
  type LinhaDaProposta,
  type LinhaDoAluno,
  type LinhaDoLancamento,
  type LinhaDoProfessor,
  type Linhas,
} from '../conversor';
import type { Persistido } from '../repositorio';

export const EMAIL_DO_LOGIN = 'professor@exemplo.test';

/** Uma data fixa para o `now()` do banco simulado; o dia é o de hoje. */
function agora(i: number): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 9, 0, 0, i).toISOString();
}

/** dd/mm do `criado_em` que o banco simulado põe no aluno. */
export const criadoEmDoBanco = (): string => formatarDdMm(new Date(agora(0)));

export function linhasDoPersistido(
  p: Persistido,
  professorId: string,
  referencia?: Date,
): Linhas {
  const professor = {
    id: professorId,
    email: EMAIL_DO_LOGIN,
    criado_em: agora(0),
    pacote_padrao: (p.pacotePadrao ?? null) as LinhaDoProfessor['pacote_padrao'],
    preferencias_aviso: (p.preferenciasDeAviso ?? null) as LinhaDoProfessor['preferencias_aviso'],
    onboarding_concluido: true,
    ...perfilParaBanco(p.perfil),
  } as LinhaDoProfessor;

  const alunos = p.alunos.map(
    (a, i) =>
      ({
        ...alunoParaBanco(a, referencia),
        professor_id: professorId,
        criado_em: agora(i),
        token_publico: `token-${a.id}`,
        versao: 0,
      }) as LinhaDoAluno,
  );

  let n = 0;
  const lancamentos = p.alunos.flatMap((a) =>
    extratoParaBanco(p.extratos[a.id] ?? [], a.id, professorId, referencia).map(
      (l) => ({ ...l, id: `lanc-${++n}` }) as LinhaDoLancamento,
    ),
  );

  const propostas = p.alunos.flatMap((a) =>
    a.proposta
      ? [
          {
            ...propostaParaBanco(a.proposta, a.id, professorId, referencia),
            id: `prop-${a.id}`,
            respondida_em: null,
          } as LinhaDaProposta,
        ]
      : [],
  );

  return {
    professor,
    politicas: { professor_id: professorId, ...politicasParaBanco(p.politicas) } as LinhaDaPolitica,
    disponibilidade: {
      professor_id: professorId,
      ...disponibilidadeParaBanco(p.disponibilidade),
    } as LinhaDaDisponibilidade,
    alunos,
    lancamentos,
    propostas,
  };
}

/** As mesmas linhas no formato das tabelas do Supabase simulado. */
export function tabelasDoPersistido(p: Persistido, professorId: string) {
  const l = linhasDoPersistido(p, professorId);
  return {
    professores: [l.professor],
    politicas: [l.politicas],
    disponibilidades: [l.disponibilidade],
    alunos: l.alunos,
    lancamentos: l.lancamentos,
    propostas: l.propostas,
  } as unknown as Record<string, Record<string, unknown>[]>;
}
