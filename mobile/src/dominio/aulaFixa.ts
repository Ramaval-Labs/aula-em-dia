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

import { DIAS, DURACAO_PADRAO, formatarHora, lerHorario } from './disponibilidade';
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
    return {
      dias: naOrdem(a.aulaFixa.dias),
      hora: a.aulaFixa.hora,
      ...(minuto ? { minuto } : {}),
      ...(duracao ? { duracao } : {}),
    };
  }
  return lerAulaFixa(a.dia, a.hora);
}

/** O começo da aula em minutos desde a meia-noite (18h30 → 1110); `null` sem hora. */
export const inicioDaAula = (af: AulaFixa): number | null =>
  af.hora === null ? null : af.hora * 60 + (af.minuto ?? 0);

/** Quanto a aula dura, em minutos: a do aluno ou a padrão (1h). */
export const duracaoDaAula = (af: AulaFixa): number => af.duracao ?? DURACAO_PADRAO;

/**
 * Os trechos da semana que a aula fixa ocupa: um por dia, do começo ao fim
 * (terça 18h30, 90 min → `{ dia: 'ter', inicio: 1110, fim: 1200 }`).
 */
export function trechosDaAulaFixa(a: Pick<Aluno, 'dia' | 'hora' | 'aulaFixa'>): Intervalo[] {
  const af = aulaFixaDe(a);
  const inicio = inicioDaAula(af);
  if (inicio === null) return [];
  const fim = inicio + duracaoDaAula(af);
  return af.dias.map((dia) => ({ dia, inicio, fim }));
}

/** "segunda", "terça e quinta", "segunda, quarta e sexta". */
function juntar(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/**
 * A estrutura → o texto que o app grava em `dia` e `hora`, no formato que a
 * semente e as telas já usam: `{ dia: 'terça e quinta', hora: '18h' }`, e
 * `{ dia: 'sem horário fixo', hora: '' }` sem dia nenhum.
 */
export function rotuloDaAulaFixa(af: AulaFixa): { dia: string; hora: string } {
  const nomes = naOrdem(af.dias).map(
    (d) => DIAS.find((x) => x.chave === d)?.longo.toLowerCase() ?? '',
  );
  return {
    dia: nomes.length > 0 ? juntar(nomes) : SEM_HORARIO_FIXO,
    hora: af.hora === null ? '' : formatarHora(af.hora * 60 + (af.minuto ?? 0)),
  };
}

/** Se a aula fixa cai nesse dia da semana. */
export const temAulaNoDia = (af: AulaFixa, dia: DiaDaSemana): boolean => af.dias.includes(dia);
