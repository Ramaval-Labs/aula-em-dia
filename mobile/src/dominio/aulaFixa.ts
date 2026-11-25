/**
 * A aula fixa do aluno — módulo puro (SCRUM-31).
 *
 * O horário nasceu como texto livre ("terça e quinta", "18h", "sem horário
 * fixo"), e o motor de reposição o lia por palavra-chave. Agora a estrutura
 * `{ dias, hora }` é a fonte, e o texto é gerado dela na hora de salvar, para
 * a lista e a página do aluno mostrarem o mesmo de antes.
 *
 * O aluno salvo antes da estrutura não tem `aulaFixa`: o texto dele é lido
 * aqui, uma porta só. Nenhum outro lugar do app interpreta "terça e quinta".
 */

import { DIAS, DURACAO_PADRAO, PASSO_MINUTOS, formatarHora, lerHorario } from './disponibilidade';
import type { Aluno, AulaFixa, DiaDaSemana, Intervalo } from './tipos';

/** O texto que o app grava quando o aluno não tem dia de aula. */
export const SEM_HORARIO_FIXO = 'sem horário fixo';

/** Palavra do texto → dia. Com e sem acento, porque o texto foi digitado. */
const APELIDOS: Record<string, DiaDaSemana> = {
  segunda: 'seg',
  terca: 'ter',
  terça: 'ter',
  quarta: 'qua',
  quinta: 'qui',
  sexta: 'sex',
  sabado: 'sab',
  sábado: 'sab',
  domingo: 'dom',
};

/** A ordem da semana, para os dias saírem sempre de segunda a domingo. */
const ORDEM: DiaDaSemana[] = DIAS.map((d) => d.chave);

const naOrdem = (dias: DiaDaSemana[]): DiaDaSemana[] =>
  ORDEM.filter((d) => dias.includes(d));

/** "terça e quinta" → ['ter', 'qui']. Sem dia reconhecível → []. */
export function lerDias(texto: string | undefined): DiaDaSemana[] {
  const t = (texto ?? '').toLowerCase();
  return naOrdem(Object.keys(APELIDOS).filter((k) => t.includes(k)).map((k) => APELIDOS[k]));
}

/**
 * A hora cheia do começo da aula: "18h" → 18, "18h30" → 18, "18:30" → 18,
 * "18" → 18. `null` quando não há hora ou ela não existe no relógio ("25h").
 * Minutos ficam de fora: o motor trabalha com faixa e hora cheia.
 */
export function lerHora(texto: string | undefined): number | null {
  // sem âncora no começo, como a leitura de antes: "às 18h" também é 18
  const m = /(\d{1,2})\s*(?:h|:|$)/i.exec(texto ?? '');
  if (!m) return null;
  const hora = Number(m[1]);
  return hora <= 23 ? hora : null;
}

/**
 * O texto livre de antes → a estrutura. "18h30" guarda os minutos (SCRUM-101);
 * a hora cheia continua em `hora`, que é o que o banco e os avisos leem.
 */
export function lerAulaFixa(dia: string | undefined, hora: string | undefined): AulaFixa {
  const inicio = lerHorario(hora);
  const minuto = inicio === null ? 0 : inicio % 60;
  return {
    dias: lerDias(dia),
    hora: inicio === null ? null : Math.floor(inicio / 60),
    ...(minuto ? { minuto } : {}),
  };
}

/**
 * A aula fixa de um aluno: a estrutura quando ele tem, senão o texto lido.
 * É a única porta de leitura do horário fixo no domínio.
 */
export function aulaFixaDe(a: Pick<Aluno, 'dia' | 'hora' | 'aulaFixa'>): AulaFixa {
  if (a.aulaFixa) {
    const { minuto, duracao } = a.aulaFixa;
    const dias = naOrdem(a.aulaFixa.dias);
    const base = { dias, hora: a.aulaFixa.hora, ...(minuto ? { minuto } : {}) };
    const porDia = porDiaLimpo(base, a.aulaFixa.porDia);
    return {
      ...base,
      ...(duracao ? { duracao } : {}),
      ...(porDia ? { porDia } : {}),
    };
  }
  return lerAulaFixa(a.dia, a.hora);
}

/** O começo da aula em minutos desde a meia-noite (18h30 → 1110); `null` sem hora. */
export const inicioDaAula = (af: AulaFixa): number | null =>
  af.hora === null ? null : af.hora * 60 + (af.minuto ?? 0);

/** Um começo que o relógio aceita: inteiro, de 15 em 15, dentro do dia. */
const comecoValido = (m: unknown): m is number =>
  typeof m === 'number' && Number.isInteger(m) && m >= 0 && m < 24 * 60 && m % PASSO_MINUTOS === 0;

/**
 * Só o que `porDia` tem de útil: dias que a aula tem, com começo válido e
 * diferente do horário geral. Vazio → `undefined`, para nada sobrar no banco.
 */
function porDiaLimpo(
  af: Pick<AulaFixa, 'dias' | 'hora' | 'minuto'>,
  porDia: AulaFixa['porDia'],
): AulaFixa['porDia'] {
  const geral = inicioDaAula(af as AulaFixa);
  if (!porDia || geral === null) return undefined;
  const limpo: Partial<Record<DiaDaSemana, number>> = {};
  for (const dia of af.dias) {
    const m = porDia[dia];
    if (comecoValido(m) && m !== geral) limpo[dia] = m;
  }
  return Object.keys(limpo).length > 0 ? limpo : undefined;
}

/**
 * O começo da aula num dia da semana: o próprio do dia, senão o geral.
 * `null` sem hora. Não confere se a aula cai no dia — isso é `temAulaNoDia`.
 */
export function inicioNoDia(af: AulaFixa, dia: DiaDaSemana): number | null {
  const geral = inicioDaAula(af);
  if (geral === null) return null;
  return af.porDia?.[dia] ?? geral;
}

/** Se algum dia começa num horário diferente dos outros. */
export const temHorarioPorDia = (af: AulaFixa): boolean =>
  new Set(af.dias.map((d) => inicioNoDia(af, d))).size > 1;

/** Os começos da semana, sem repetir e em ordem: [915, 1050]. */
export function iniciosDaAula(af: AulaFixa): number[] {
  const inicios = af.dias.map((d) => inicioNoDia(af, d)).filter((m): m is number => m !== null);
  return [...new Set(inicios)].sort((a, b) => a - b);
}

/**
 * Monta a aula fixa a partir do começo de cada dia, como o formulário tem
 * (segunda 915, quarta 1050 → `hora: 15, minuto: 15, porDia: { qua: 1050 }`).
 * O primeiro dia da semana dá o horário geral; dia sem começo fica no geral.
 */
export function aulaFixaComHorarios(
  dias: DiaDaSemana[],
  inicios: Partial<Record<DiaDaSemana, number | null>>,
  duracao?: number,
): AulaFixa {
  const ordem = naOrdem(dias);
  const primeiro = ordem.map((d) => inicios[d]).find((m): m is number => typeof m === 'number');
  if (ordem.length === 0 || primeiro === undefined) return { dias: ordem, hora: null };
  const minuto = primeiro % 60;
  const base = { dias: ordem, hora: Math.floor(primeiro / 60), ...(minuto ? { minuto } : {}) };
  const porDia = porDiaLimpo(
    base,
    Object.fromEntries(ordem.map((d) => [d, inicios[d] ?? undefined])) as AulaFixa['porDia'],
  );
  return {
    ...base,
    ...(duracao && duracao !== DURACAO_PADRAO ? { duracao } : {}),
    ...(porDia ? { porDia } : {}),
  };
}

/** Quanto a aula dura, em minutos: a do aluno ou a padrão (1h). */
export const duracaoDaAula = (af: AulaFixa): number => af.duracao ?? DURACAO_PADRAO;

/**
 * Os trechos da semana que a aula fixa ocupa: um por dia, do começo ao fim
 * (terça 18h30, 90 min → `{ dia: 'ter', inicio: 1110, fim: 1200 }`). Com
 * horário por dia, cada dia tem o seu começo.
 */
export function trechosDaAulaFixa(a: Pick<Aluno, 'dia' | 'hora' | 'aulaFixa'>): Intervalo[] {
  const af = aulaFixaDe(a);
  const duracao = duracaoDaAula(af);
  return af.dias.flatMap((dia) => {
    const inicio = inicioNoDia(af, dia);
    return inicio === null ? [] : [{ dia, inicio, fim: inicio + duracao }];
  });
}

/**
 * A hora da aula num dia, como texto ("17h30"); `''` sem hora. É o que a lista
 * mostra quando a aula é hoje e cada dia tem um horário.
 */
export function horaNoDia(a: Pick<Aluno, 'dia' | 'hora' | 'aulaFixa'>, dia: DiaDaSemana): string {
  const inicio = inicioNoDia(aulaFixaDe(a), dia);
  return inicio === null ? '' : formatarHora(inicio);
}

/** "segunda", "terça e quinta", "segunda, quarta e sexta". */
function juntar(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/**
 * A estrutura → o texto que o app grava em `dia` e `hora`, no formato que a
 * semente e as telas já usam: `{ dia: 'terça e quinta', hora: '18h' }`, e
 * `{ dia: 'sem horário fixo', hora: '' }` sem dia nenhum. Com horário por dia,
 * a hora acompanha os dias na mesma ordem: `{ dia: 'segunda e quarta',
 * hora: '15h15 e 17h30' }`.
 */
export function rotuloDaAulaFixa(af: AulaFixa): { dia: string; hora: string } {
  const dias = naOrdem(af.dias);
  const nomes = dias.map((d) => DIAS.find((x) => x.chave === d)?.longo.toLowerCase() ?? '');
  const geral = inicioDaAula(af);
  const hora =
    geral === null
      ? ''
      : temHorarioPorDia(af)
        ? juntar(dias.map((d) => formatarHora(inicioNoDia(af, d) ?? geral)))
        : formatarHora(geral);
  return { dia: nomes.length > 0 ? juntar(nomes) : SEM_HORARIO_FIXO, hora };
}

/** Se a aula fixa cai nesse dia da semana. */
export const temAulaNoDia = (af: AulaFixa, dia: DiaDaSemana): boolean => af.dias.includes(dia);
