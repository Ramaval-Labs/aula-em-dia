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

import type { BlocoSemanal, DiaDaSemana, FaixaHoraria, Folga, Intervalo } from './tipos';
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

/** Mensagens de "Marcar folga" em E3, prontas para a prop `erro` do campo. */
export const ERRO_FOLGA = {
  inicioInvalido: 'Data de início inválida, use dd/mm',
  fimInvalido: 'Data de fim inválida, use dd/mm',
  fimAntesDoInicio: 'A folga termina antes de começar',
} as const;

/** "Já existe folga em 14/09 a 21/09 (viagem)" — diz com qual folga bateu. */
export function erroSobreposicao(f: Folga): string {
  const motivo = f.motivo.trim();
  return `Já existe folga em ${periodoDaFolga(f)}${motivo ? ` (${motivo})` : ''}`;
}

/**
 * As duas pontas da folga como Date. `ate` é lido a partir de `de`, então
 * "28/12 a 05/01" atravessa a virada do ano em vez de terminar antes de começar.
 */
function intervaloDaFolga(f: Folga, referencia: number | Date): [Date, Date] | null {
  const de = lerDdMm(f.de, referencia);
  const ate = de && lerDdMm(f.ate, de);
  return de && ate ? [de, ate] : null;
}

/**
 * A folga nova pode entrar? Devolve a mensagem de erro ou `null`.
 *
 * Folga no passado não é erro — é decisão de produto que ainda não foi tomada.
 * `referencia` só decide o ano de `nova.de` (como em `lerDdMm`); as outras
 * datas são lidas a partir dela, então a resposta não muda com o dia em que roda.
 */
export function folgaValida(
  nova: Folga,
  existentes: Folga[],
  referencia: number | Date = hojeComoData(),
): string | null {
  const de = lerDdMm(nova.de, referencia);
  if (!de) return ERRO_FOLGA.inicioInvalido;
  const ate = lerDdMm(nova.ate, de);
  if (!ate) return ERRO_FOLGA.fimInvalido;
  if (ate.getTime() < de.getTime()) return ERRO_FOLGA.fimAntesDoInicio;

  for (const f of existentes) {
    const outra = intervaloDaFolga(f, de);
    if (!outra) continue;
    const [outraDe, outraAte] = outra;
    if (de.getTime() <= outraAte.getTime() && outraDe.getTime() <= ate.getTime()) {
      return erroSobreposicao(f);
    }
  }
  return null;
}

/** Insere a folga e devolve um array novo, em ordem de data. Não muta a entrada. */
export function adicionarFolga(
  folgas: Folga[],
  nova: Folga,
  referencia: number | Date = hojeComoData(),
): Folga[] {
  const ancora = lerDdMm(nova.de, referencia) ?? referencia;
  const inicio = (f: Folga) =>
    intervaloDaFolga(f, ancora)?.[0].getTime() ?? Number.POSITIVE_INFINITY;
  return [...folgas, { ...nova }].sort((a, b) => inicio(a) - inicio(b));
}

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

// --- Horários livres (SCRUM-101) --------------------------------------------
//
// A disponibilidade deixou as quatro faixas e passou a horários livres, em
// minutos desde a meia-noite, de 15 em 15: "posso a partir das 14h30" é um
// começo de 870. O formato antigo `{ dia, faixa }` continua sendo lido por
// `intervalosDe`, que o converte no intervalo da faixa; quem grava, grava o
// formato novo. As funções de bloco acima ficam para essa leitura.

/** A menor unidade de horário do app: disponibilidade, aula fixa e sugestão. */
export const PASSO_MINUTOS = 15;

/** Quanto dura a aula de quem não disse: uma hora. */
export const DURACAO_PADRAO = 60;

/** O trecho do dia que a grade mostra e o motor percorre: das 6h às 23h. */
export const INICIO_DO_DIA = 6 * 60;
export const FIM_DO_DIA = 23 * 60;

const MINUTOS_NO_DIA = 24 * 60;
const ORDEM_DOS_DIAS: DiaDaSemana[] = DIAS.map((d) => d.chave);

const ehDia = (d: string): d is DiaDaSemana => ORDEM_DOS_DIAS.includes(d as DiaDaSemana);
const noPasso = (m: number) => Number.isInteger(m) && m % PASSO_MINUTOS === 0;

/** Dois trechos [a1, a2) e [b1, b2) se sobrepõem? Encostar não é sobrepor. */
export const sobrepoe = (a1: number, a2: number, b1: number, b2: number): boolean =>
  a1 < b2 && b1 < a2;

/** 870 → "14h30"; 840 → "14h". */
export function formatarHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** 90 → "1h30"; 45 → "45 min"; 120 → "2h". */
export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** "14h30–18h" */
export const formatarIntervalo = (i: { inicio: number; fim: number }): string =>
  `${formatarHora(i.inicio)}–${formatarHora(i.fim)}`;

/** "Segunda · 14h30–18h" — a linha da lista sob a grade. */
export const rotuloDoIntervalo = (i: Intervalo): string =>
  `${nomeDoDia(i.dia)} · ${formatarIntervalo(i)}`;

/**
 * Um horário do relógio em minutos: "14:30", "14h30", "14h", "14" e "às 14h".
 * `null` quando não há horário ou ele não existe ("25h", "14:75").
 */
export function lerHorario(texto: string | undefined): number | null {
  // sem âncora no começo, como `lerHora`: "às 18h" também é 18h
  const m = /(\d{1,2})\s*(?:[h:]\s*(\d{2})?|$)/i.exec(texto ?? '');
  if (!m) return null;
  const hora = Number(m[1]);
  const minuto = m[2] === undefined ? 0 : Number(m[2]);
  if (hora > 23 || minuto > 59) return null;
  return hora * 60 + minuto;
}

/** O horário cai no passo de 15 minutos? (14h30 sim; 14h20 não) */
export const horarioNoPasso = (minutos: number): boolean => noPasso(minutos);

/**
 * Junta os intervalos que se encostam ou se sobrepõem no mesmo dia e devolve
 * em ordem de dia e de hora. Não muta a entrada.
 */
export function juntarIntervalos(lista: Intervalo[]): Intervalo[] {
  const ordenada = [...lista].sort(
    (a, b) =>
      ORDEM_DOS_DIAS.indexOf(a.dia) - ORDEM_DOS_DIAS.indexOf(b.dia) || a.inicio - b.inicio,
  );
  const saida: Intervalo[] = [];
  for (const i of ordenada) {
    const ultimo = saida[saida.length - 1];
    if (ultimo && ultimo.dia === i.dia && i.inicio <= ultimo.fim) {
      ultimo.fim = Math.max(ultimo.fim, i.fim);
    } else {
      saida.push({ ...i });
    }
  }
  return saida;
}

/**
 * A disponibilidade lida dos dois formatos: o novo `{ dia, inicio, fim }` e o
 * antigo `{ dia, faixa }`, que vira o intervalo da faixa (manhã → 8h–12h).
 * O que não for nem um nem outro é descartado. Sai junta e em ordem.
 */
export function intervalosDe(lista: unknown): Intervalo[] {
  if (!Array.isArray(lista)) return [];
  const saida: Intervalo[] = [];
  for (const x of lista) {
    if (!x || typeof x !== 'object') continue;
    const { dia, faixa, inicio, fim } = x as Record<string, unknown>;
    if (typeof dia !== 'string' || !ehDia(dia)) continue;
    if (typeof faixa === 'string') {
      const f = porChave(FAIXAS, faixa);
      if (f) saida.push({ dia, inicio: f.inicio * 60, fim: f.fim * 60 });
      continue;
    }
    if (
      typeof inicio === 'number' &&
      typeof fim === 'number' &&
      noPasso(inicio) &&
      noPasso(fim) &&
      inicio >= 0 &&
      fim <= MINUTOS_NO_DIA &&
      inicio < fim
    ) {
      saida.push({ dia, inicio, fim });
    }
  }
  return juntarIntervalos(saida);
}

/**
 * Liga ou desliga o trecho entre `de` e `ate` (em qualquer ordem) de um dia —
 * o que a grade faz quando se arrasta. Não muta a entrada.
 */
export function pintar(
  lista: Intervalo[],
  dia: DiaDaSemana,
  de: number,
  ate: number,
  ligar: boolean,
): Intervalo[] {
  const a = Math.min(de, ate);
  const b = Math.max(de, ate);
  if (a === b) return lista.map((i) => ({ ...i }));
  if (ligar) return juntarIntervalos([...lista, { dia, inicio: a, fim: b }]);
  const saida: Intervalo[] = [];
  for (const i of lista) {
    if (i.dia !== dia || !sobrepoe(i.inicio, i.fim, a, b)) {
      saida.push({ ...i });
      continue;
    }
    if (i.inicio < a) saida.push({ dia, inicio: i.inicio, fim: a });
    if (i.fim > b) saida.push({ dia, inicio: b, fim: i.fim });
  }
  return saida;
}

/** Tira um intervalo inteiro (o × da lista sob a grade). Não muta a entrada. */
export const removerIntervalo = (lista: Intervalo[], alvo: Intervalo): Intervalo[] =>
  lista.filter((i) => !(i.dia === alvo.dia && i.inicio === alvo.inicio && i.fim === alvo.fim));

/** O trecho [de, ate) cabe inteiro num intervalo daquele dia? */
export const cabe = (lista: Intervalo[], dia: DiaDaSemana, de: number, ate: number): boolean =>
  lista.some((i) => i.dia === dia && i.inicio <= de && ate <= i.fim);

/** O minuto daquele dia está livre? (a célula da grade) */
export const livreEm = (lista: Intervalo[], dia: DiaDaSemana, minuto: number): boolean =>
  lista.some((i) => i.dia === dia && i.inicio <= minuto && minuto < i.fim);

export const minutosPorSemana = (lista: Intervalo[]): number =>
  lista.reduce((t, i) => t + (i.fim - i.inicio), 0);

/** "3 horários · 12h30 por semana" — o rodapé da grade do professor. */
export function resumoDosHorarios(lista: Intervalo[]): string {
  const n = lista.length;
  if (n === 0) return 'Nenhum horário marcado';
  return `${n} ${n === 1 ? 'horário' : 'horários'} · ${formatarDuracao(
    minutosPorSemana(lista),
  )} por semana`;
}

/** "2 horários marcados" — o rodapé da grade do aluno. */
export function resumoDosMarcados(lista: Intervalo[]): string {
  const n = lista.length;
  return `${n} ${n === 1 ? 'horário marcado' : 'horários marcados'}`;
}
