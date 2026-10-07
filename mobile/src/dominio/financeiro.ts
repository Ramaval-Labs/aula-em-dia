/**
 * Resumo do mês do Financeiro — módulo puro (SCRUM-28).
 *
 * O cartão "Aulas dadas em <mês>" somava o extrato inteiro, sem filtro: o
 * rótulo dizia o mês e o número contava desde sempre. Aqui a conta é a mesma
 * de antes, só que restrita ao mês (e ano) da referência.
 *
 * A referência entra por parâmetro, nunca por `hoje()`: quem chama passa o
 * hoje do app, e o teste passa a data que quiser.
 *
 * Decisão sobre `reposicoes`: sai do extrato, contando `Reposição realizada`
 * no mês. Antes era a soma de `Aluno.reposicoes`, que é o contador do pacote
 * atual usado contra o limite da política, não um número do mês: no mesmo
 * cartão, dois números tinham a janela do mês e um tinha a do pacote. Agora
 * os três têm a mesma janela.
 *
 * Atenção, tela: a regra de contagem não mudou, e por ela uma reposição
 * realizada conta em `aulasDadas` E em `reposicoes`. `reposicoes` é um
 * subconjunto de `aulasDadas`, não uma parcela à parte. Uma barra que some os
 * dois segmentos conta a reposição duas vezes; use
 * `aulasDadas - reposicoes` para o segmento das aulas regulares.
 */

import { lerDdMm } from './datas';
import type { Extratos } from './tipos';

export interface ResumoDoMes {
  /** `Aula realizada` + `Reposição realizada` no mês */
  aulasDadas: number;
  /** lançamentos de falta que debitaram (`delta < 0`) no mês */
  faltasDebitadas: number;
  /** `Reposição realizada` no mês — já contadas em `aulasDadas` */
  reposicoes: number;
}

/** O lançamento de dd/mm cai no mesmo mês e ano da referência? */
function noMesDe(ddmm: string, referencia: Date): boolean {
  // O ano é inferido perto da referência: dezembro lido em janeiro é o anterior.
  const d = lerDdMm(ddmm, referencia);
  return (
    d !== null &&
    d.getMonth() === referencia.getMonth() &&
    d.getFullYear() === referencia.getFullYear()
  );
}

/** Aulas dadas, faltas debitadas e reposições do mês de `referencia`. */
export function resumoDoMes(extratos: Extratos, referencia: Date): ResumoDoMes {
  const resumo: ResumoDoMes = { aulasDadas: 0, faltasDebitadas: 0, reposicoes: 0 };
  Object.values(extratos).forEach((lista) =>
    lista.forEach((e) => {
      if (!noMesDe(e.d, referencia)) return;
      if (e.t === 'Aula realizada' || e.t === 'Reposição realizada') resumo.aulasDadas += 1;
      if (e.t === 'Reposição realizada') resumo.reposicoes += 1;
      if (e.t.startsWith('Falta') && e.delta < 0) resumo.faltasDebitadas += 1;
    }),
  );
  return resumo;
}
