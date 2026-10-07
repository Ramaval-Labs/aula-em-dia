/**
 * Disponibilidade semanal — módulo puro.
 *
 * Alimenta quatro telas do handoff (A5, C2, E3 e F3) e é a entrada do motor
 * de sugestão de reposição. Sem UI, sem storage.
 *
 * Nota sobre as horas: o handoff mostra "13 blocos · 26h por semana", o que
 * equivale a contar 2h por bloco. As faixas desenhadas, porém, são de 4h, 3h,
 * 3h e 2h — os mesmos 13 blocos somam 40h. Aqui a conta é feita pela duração
 * real da faixa, porque é esse número que o motor de agenda precisa; o "26h"
 * do mock não deriva de nenhuma regra consistente.
 */

import type { BlocoSemanal, DiaDaSemana, FaixaHoraria, Folga } from './tipos';
import { diasEntre, hoje as hojeDoApp, hojeComoData, lerDdMm } from './datas';

export const DIAS: { chave: DiaDaSemana; curto: string; longo: string }[] = [
  { chave: 'seg', curto: 'SEG', longo: 'Segunda' },
  { chave: 'ter', curto: 'TER', longo: 'Terça' },
  { chave: 'qua', curto: 'QUA', longo: 'Quarta' },
  { chave: 'qui', curto: 'QUI', longo: 'Quinta' },
  { chave: 'sex', curto: 'SEX', longo: 'Sexta' },
  { chave: 'sab', curto: 'SÁB', longo: 'Sábado' },
  { chave: 'dom', curto: 'DOM', longo: 'Domingo' },
];

/** Os seis dias que o handoff mostra na grade do professor — domingo fechado. */
export const DIAS_DA_SEMANA: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

/** A grade que o aluno preenche é de segunda a sexta (C2). */
export const DIAS_UTEIS: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex'];

export const FAIXAS: {
  chave: FaixaHoraria;
  /** rótulo do professor: intervalo explícito */
  horario: string;
  /** rótulo do aluno: linguagem corrente */
  nome: string;
  inicio: number;
  fim: number;
}[] = [
  { chave: 'manha', horario: '8–12', nome: 'manhã', inicio: 8, fim: 12 },
  { chave: 'tarde', horario: '14–17', nome: 'tarde', inicio: 14, fim: 17 },
  { chave: 'fimTarde', horario: '17–20', nome: 'fim da tarde', inicio: 17, fim: 20 },
  { chave: 'noite', horario: '20–22', nome: 'noite', inicio: 20, fim: 22 },
];

export const FAIXAS_HORARIAS: FaixaHoraria[] = FAIXAS.map((f) => f.chave);

const porChave = <T extends { chave: string }>(lista: T[], chave: string) =>
  lista.find((x) => x.chave === chave);

export const nomeDoDia = (d: DiaDaSemana): string => porChave(DIAS, d)?.longo ?? d;
export const diaCurto = (d: DiaDaSemana): string => porChave(DIAS, d)?.curto ?? d;
export const horarioDaFaixa = (f: FaixaHoraria): string =>
  porChave(FAIXAS, f)?.horario ?? f;
export const nomeDaFaixa = (f: FaixaHoraria): string => porChave(FAIXAS, f)?.nome ?? f;

export const duracaoDaFaixa = (f: FaixaHoraria): number => {
  const faixa = porChave(FAIXAS, f);
  return faixa ? faixa.fim - faixa.inicio : 0;
};

export const mesmoBloco = (a: BlocoSemanal, b: BlocoSemanal): boolean =>
  a.dia === b.dia && a.faixa === b.faixa;

export const temBloco = (blocos: BlocoSemanal[], b: BlocoSemanal): boolean =>
  blocos.some((x) => mesmoBloco(x, b));

/** Liga ou desliga um bloco. Não muta a entrada. */
export function alternarBloco(blocos: BlocoSemanal[], b: BlocoSemanal): BlocoSemanal[] {
  return temBloco(blocos, b)
    ? blocos.filter((x) => !mesmoBloco(x, b))
    : [...blocos, { ...b }];
}

export const contarBlocos = (blocos: BlocoSemanal[]): number => blocos.length;

export const horasPorSemana = (blocos: BlocoSemanal[]): number =>
  blocos.reduce((t, b) => t + duracaoDaFaixa(b.faixa), 0);

/** "13 blocos · 40h por semana" — rodapé de A5, E3 e da linha de Ajustes. */
export function resumo(blocos: BlocoSemanal[]): string {
  const n = contarBlocos(blocos);
  if (n === 0) return 'Nenhum bloco marcado';
  const horas = horasPorSemana(blocos);
  return `${n} ${n === 1 ? 'bloco' : 'blocos'} · ${horas}h por semana`;
}

/** "8 blocos marcados" — rodapé da grade do aluno (C2, F3). */
export function resumoMarcados(blocos: BlocoSemanal[]): string {
  const n = contarBlocos(blocos);
  return `${n} ${n === 1 ? 'bloco marcado' : 'blocos marcados'}`;
}

/** O que serve para os dois: base do cálculo de janelas de reposição. */
export function intersecao(
  professor: BlocoSemanal[],
  aluno: BlocoSemanal[],
): BlocoSemanal[] {
  return professor.filter((b) => temBloco(aluno, b));
}

/** A data cai dentro de alguma folga declarada? */
export function emFolga(ddmm: string, folgas: Folga[]): Folga | null {
  const alvo = lerDdMm(ddmm);
  if (!alvo) return null;
  for (const f of folgas) {
    const de = lerDdMm(f.de);
    const ate = lerDdMm(f.ate);
    if (!de || !ate) continue;
    if (alvo.getTime() >= de.getTime() && alvo.getTime() <= ate.getTime()) return f;
  }
  return null;
}

/** "07/09" ou "14/09 a 21/09" — como a folga aparece na lista de E3. */
export function periodoDaFolga(f: Folga): string {
  return f.de === f.ate ? f.de : `${f.de} a ${f.ate}`;
}

/** Dias até a folga começar; negativo se já passou. Usado para ordenar E3. */
export const diasAteFolga = (f: Folga, hoje: string = hojeDoApp()): number | null =>
  diasEntre(hoje, f.de);

/**
 * Qual `DiaDaSemana` corresponde a uma data dd/mm.
 *
 * `referencia` é a mesma de `lerDdMm`: um número fixa o ano, uma Date é o hoje
 * de onde o ano é inferido. Sem ela, o dia da semana muda com o ano corrente.
 */
export function diaDaSemanaDe(
  ddmm: string,
  referencia: number | Date = hojeComoData(),
): DiaDaSemana | null {
  const d = lerDdMm(ddmm, referencia);
  if (!d) return null;
  // getDay(): 0 = domingo
  const ordem: DiaDaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return ordem[d.getDay()];
}
