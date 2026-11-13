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

import { DIAS } from './disponibilidade';
import type { Aluno, AulaFixa, DiaDaSemana } from './tipos';

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

/** O texto livre de antes → a estrutura. */
export function lerAulaFixa(dia: string | undefined, hora: string | undefined): AulaFixa {
  return { dias: lerDias(dia), hora: lerHora(hora) };
}

/**
 * A aula fixa de um aluno: a estrutura quando ele tem, senão o texto lido.
 * É a única porta de leitura do horário fixo no domínio.
 */
export function aulaFixaDe(a: Pick<Aluno, 'dia' | 'hora' | 'aulaFixa'>): AulaFixa {
  if (a.aulaFixa) return { dias: naOrdem(a.aulaFixa.dias), hora: a.aulaFixa.hora };
  return lerAulaFixa(a.dia, a.hora);
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
    hora: af.hora === null ? '' : `${af.hora}h`,
  };
}

/** Se a aula fixa cai nesse dia da semana. */
export const temAulaNoDia = (af: AulaFixa, dia: DiaDaSemana): boolean => af.dias.includes(dia);
