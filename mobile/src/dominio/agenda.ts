/**
 * Motor de sugestão de reposição — módulo puro.
 *
 * É o diferencial declarado no Envio 01: em vez de três strings fixas, as
 * janelas saem de um cálculo contra a agenda real. O algoritmo percorre o
 * horizonte até a validade do pacote, descarta o que colide e pontua o resto.
 *
 * Desde o SCRUM-101 o tempo é contado em minutos, de 15 em 15
 * (`PASSO_MINUTOS`), e não mais em quatro faixas: a disponibilidade do
 * professor e a do aluno são horários livres (`Intervalo`), e cada aula ocupa
 * do começo ao fim, com a duração do aluno (1h por padrão). O formato antigo
 * `{ dia, faixa }` continua entrando, convertido por `intervalosDe`.
 *
 * O horário fixo do aluno sai de `aulaFixaDe` (`aulaFixa.ts`): a estrutura
 * quando o aluno tem, senão o texto livre de antes, lido lá. Este módulo não
 * interpreta texto de horário, fora o `agendada.hora` da reposição marcada,
 * que passa por `lerHorario` (SCRUM-31).
 */

import { aulaFixaDe, duracaoDaAula, iniciosDaAula, trechosDaAulaFixa } from './aulaFixa';
import {
  cabe,
  diaDaSemanaDe,
  DIAS,
  emFolga,
  FAIXAS,
  FIM_DO_DIA,
  formatarHora,
  INICIO_DO_DIA,
  intervalosDe,
  lerHorario,
  minutosPorSemana,
  PASSO_MINUTOS,
  sobrepoe,
} from './disponibilidade';
import { diasEntre, formatarDdMm, lerDdMm, somarDias } from './datas';
import { plural } from './formato';
import type {
  Aluno,
  BlocoSemanal,
  DiaDaSemana,
  Disponibilidade,
  FaixaHoraria,
  FiltroDeAgenda,
  Intervalo,
  Janela,
} from './tipos';

/** Quantas janelas a tela de sugestões mostra. */
export const MELHORES = 3;

/** Horizonte máximo quando o pacote não tem validade. */
const HORIZONTE_PADRAO = 30;

/**
 * Quantos começos o mesmo dia rende, no máximo: um por trecho livre contínuo,
 * para a lista não virar um relógio de 15 em 15 minutos.
 */
const MAXIMO_POR_DIA = 3;

// --- leitura do horário fixo do aluno -------------------------------------

/** Os dias da aula fixa: "terça e quinta" → ['ter', 'qui'], ou a estrutura. */
export function diasDoAluno(a: Aluno): DiaDaSemana[] {
  return aulaFixaDe(a).dias;
}

/** A hora cheia da aula fixa: "17h" → 17, ou a estrutura. */
export function horaDoAluno(a: Aluno): number | null {
  return aulaFixaDe(a).hora;
}

/** Em qual faixa do formato antigo cai uma hora do dia. Só leitura do que já existe. */
export function faixaDaHora(hora: number): FaixaHoraria | null {
  const f = FAIXAS.find((x) => hora >= x.inicio && hora < x.fim);
  return f ? f.chave : null;
}

/** O bloco do formato antigo em que a aula fixa cai. Só leitura do que já existe. */
export function blocosDaAulaFixa(a: Aluno): BlocoSemanal[] {
  const { dias, hora } = aulaFixaDe(a);
  const faixa = hora === null ? null : faixaDaHora(hora);
  if (!faixa) return [];
  return dias.map((dia) => ({ dia, faixa }));
}

/**
 * A reposição já marcada de um aluno, como data e trecho do dia, com a duração
 * da aula dele. `agendada.dia` é o rótulo "Terça, 10/11", e a data é o fim
 * dele. `null` quando não há reposição, ou quando o rótulo ou a hora não se
 * deixam ler.
 */
export function reposicaoMarcada(a: Aluno): { data: string; inicio: number; fim: number } | null {
  if (!a.agendada) return null;
  const data = /(\d{2}\/\d{2})\s*$/.exec(a.agendada.dia)?.[1];
  const inicio = lerHorario(a.agendada.hora);
  if (!data || inicio === null) return null;
  return { data, inicio, fim: inicio + duracaoDaAula(aulaFixaDe(a)) };
}

// --- candidatas -----------------------------------------------------------

export interface Candidata extends Janela {
  data: string;
  diaDaSemana: DiaDaSemana;
  /** o começo e o fim da aula, em minutos */
  inicio: number;
  fim: number;
  emDias: number;
  pontos: number;
  /** as razões que a tela lista, na ordem em que aparecem */
  razoes: string[];
  melhor: boolean;
}

function rotuloDoDia(data: string): string {
  const dia = diaDaSemanaDe(data);
  const nome = DIAS.find((d) => d.chave === dia)?.longo ?? '';
  return `${nome}, ${data}`;
}

/**
 * Do mesmo dia, fica um começo por trecho livre contínuo (os começos que andam
 * de 15 em 15 sem buraco, todos dentro ou todos fora dos horários habituais
 * do professor): o de mais pontos, e o mais cedo no empate. E no máximo
 * `MAXIMO_POR_DIA` trechos, os de mais pontos.
 */
function umPorTrecho(doDia: { c: Candidata; dentro: boolean }[]): Candidata[] {
  const escolhidas: Candidata[] = [];
  let trecho: { c: Candidata; dentro: boolean }[] = [];
  const fechar = () => {
    if (trecho.length === 0) return;
    escolhidas.push(trecho.reduce((m, x) => (x.c.pontos > m.c.pontos ? x : m)).c);
    trecho = [];
  };
  for (const x of doDia) {
    const anterior = trecho[trecho.length - 1];
    if (anterior && (x.c.inicio !== anterior.c.inicio + PASSO_MINUTOS || x.dentro !== anterior.dentro)) {
      fechar();
    }
    trecho.push(x);
  }
  fechar();
  return escolhidas
    .sort((a, b) => b.pontos - a.pontos || a.inicio - b.inicio)
    .slice(0, MAXIMO_POR_DIA);
}

/**
 * Gera as janelas possíveis para repor a aula de um aluno.
 *
 * Descarta: folga do professor, horário fora da disponibilidade dele (a não
 * ser que ele aceite), a própria aula fixa do aluno, choque com aula fixa de
 * outro aluno, choque com reposição já marcada e horário fora do que o aluno
 * disse que pode. Choque é sobreposição de trecho: a aula das 14h30 com 1h
 * ocupa 14h30–15h30, bate com uma das 15h e não com uma das 15h30.
 *
 * O bônus de "mesmo horário" vale para o começo da aula fixa em **outro** dia
 * da semana (quinta 18h para quem tem terça 18h). O dia da própria aula fixa
 * não é reposição: é a aula que ele já tem (SCRUM-84, decisão de PO de 04/11).
 */
export function candidatos(
  aluno: Aluno,
  todos: Aluno[],
  disponibilidade: Disponibilidade,
  hoje: string,
): Candidata[] {
  const ate = aluno.validade && lerDdMm(aluno.validade) ? aluno.validade : somarDias(hoje, HORIZONTE_PADRAO);
  const horizonte = Math.min(diasEntre(hoje, ate) ?? HORIZONTE_PADRAO, 60);
  if (horizonte <= 0) return [];

  const inicio = lerDdMm(hoje);
  if (!inicio) return [];

  const doProfessor = intervalosDe(disponibilidade.blocos);
  const outros = todos.filter((o) => o.id !== aluno.id && !o.arquivado);
  const ocupados: Intervalo[] = outros.flatMap(trechosDaAulaFixa);
  // A reposição marcada de outro aluno ocupa aquela data, não a semana toda
  // (SCRUM-83, P2-2 da revisão da Parte 6).
  const marcadas = outros
    .map(reposicaoMarcada)
    .filter((m): m is { data: string; inicio: number; fim: number } => m !== null);

  const af = aulaFixaDe(aluno);
  // com horário por dia, qualquer um dos começos dele é "o horário de sempre"
  const preferidos = iniciosDaAula(af);
  const duracao = duracaoDaAula(af);
  const proprias = trechosDaAulaFixa(aluno);
  const doAluno = intervalosDe(aluno.disponibilidade);

  const saida: Candidata[] = [];

  for (let d = 1; d <= horizonte; d += 1) {
    const data = formatarDdMm(new Date(inicio.getTime() + d * 86400000));
    const dia = diaDaSemanaDe(data);
    if (!dia) continue;
    if (dia === 'sab' && !disponibilidade.sugereSabado) continue;
    if (emFolga(data, disponibilidade.folgas)) continue;

    const ocupadosHoje = ocupados.filter((o) => o.dia === dia);
    const marcadasHoje = marcadas.filter((m) => m.data === data);
    const doDia: { c: Candidata; dentro: boolean }[] = [];

    for (let t = INICIO_DO_DIA; t + duracao <= FIM_DO_DIA; t += PASSO_MINUTOS) {
      const fim = t + duracao;
      const dentroDoHabitual = cabe(doProfessor, dia, t, fim);

      // fora da agenda declarada do professor
      if (!dentroDoHabitual && !disponibilidade.aceitaForaDosBlocos) continue;

      // a aula fixa do próprio aluno nesse dia
      if (proprias.some((p) => p.dia === dia && sobrepoe(p.inicio, p.fim, t, fim))) continue;

      // choque com aula fixa de outro aluno
      if (ocupadosHoje.some((o) => sobrepoe(o.inicio, o.fim, t, fim))) continue;

      // choque com reposição já marcada de outro aluno, nesta data
      if (marcadasHoje.some((m) => sobrepoe(m.inicio, m.fim, t, fim))) continue;

      // o aluno disse quando pode, e este horário não cabe nisso
      const alunoMarcou = doAluno.length > 0 && cabe(doAluno, dia, t, fim);
      if (doAluno.length > 0 && !alunoMarcou) continue;

      // a mesma hora da aula fixa, em outro dia (o dia dela já saiu acima)
      const mesmoHorarioDeSempre = preferidos.includes(t);
      const encaixa = [...ocupadosHoje, ...marcadasHoje].some((o) => o.fim === t || o.inicio === fim);
      const razoes: string[] = [];
      let pontos = 100 - d; // quanto antes, melhor

      if (mesmoHorarioDeSempre) {
        pontos += 40;
        razoes.push('No mesmo horário da aula dele.');
      }
      if (alunoMarcou) {
        pontos += 25;
        razoes.push('Ele marcou esse horário como disponível.');
      }
      if (encaixa) {
        pontos += 10;
        razoes.push('Encaixa logo antes ou depois de outra aula.');
      }
      if (!dentroDoHabitual) {
        pontos -= 30;
        razoes.push('Está fora dos seus horários habituais.');
      }
      const faltam = diasEntre(data, ate);
      if (faltam !== null && faltam >= 0) {
        razoes.push(`Acontece ${plural(faltam, 'dia', 'dias')} antes do pacote vencer, em ${ate}.`);
      }

      doDia.push({
        dentro: dentroDoHabitual,
        c: {
          data,
          diaDaSemana: dia,
          inicio: t,
          fim,
          dia: rotuloDoDia(data),
          hora: formatarHora(t),
          motivo: razoes[0] ?? 'Livre na sua agenda.',
          razoes,
          emDias: d,
          pontos,
          melhor: false,
        },
      });
    }

    saida.push(...umPorTrecho(doDia));
  }

  return saida.sort((a, b) => b.pontos - a.pontos);
}

/** As N melhores, já marcadas. */
export function melhores(lista: Candidata[], quantas = MELHORES): Candidata[] {
  return lista.slice(0, quantas).map((c, i) => ({ ...c, melhor: i === 0 }));
}

export function filtrar(lista: Candidata[], filtro: FiltroDeAgenda): Candidata[] {
  if (filtro === 'fimDeSemana') {
    return lista.filter((c) => c.diaDaSemana === 'sab' || c.diaDaSemana === 'dom');
  }
  return lista;
}

/** Agrupa por semana, como o calendário de C4. */
export function porSemana(lista: Candidata[]): { rotulo: string; janelas: Candidata[] }[] {
  const grupos = new Map<number, Candidata[]>();
  for (const c of lista) {
    const semana = Math.floor((c.emDias - 1) / 7);
    grupos.set(semana, [...(grupos.get(semana) ?? []), c]);
  }
  return [...grupos.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([semana, janelas]) => ({
      rotulo:
        semana === 0 ? 'Esta semana' : semana === 1 ? 'Semana que vem' : `Em ${semana} semanas`,
      janelas: janelas.sort((a, b) => a.emDias - b.emDias || a.inicio - b.inicio),
    }));
}

/** As razões de não haver janela — o conteúdo de C5. */
export function motivosDaFalta(
  aluno: Aluno,
  todos: Aluno[],
  disponibilidade: Disponibilidade,
  hoje: string,
): string[] {
  const razoes: string[] = [];
  const ate = aluno.validade || 'sem prazo';
  const dias = diasEntre(hoje, aluno.validade) ?? 0;
  const doProfessor = intervalosDe(disponibilidade.blocos);

  if (aluno.validade && dias >= 0) {
    razoes.push(`O pacote vence em ${ate}, daqui a ${plural(dias, 'dia', 'dias')}.`);
  }
  if (doProfessor.length === 0) {
    razoes.push('Você ainda não marcou nenhum horário na sua disponibilidade.');
  } else {
    razoes.push(
      doProfessor.length === 1
        ? 'Seu horário livre bate com aula fixa de outro aluno.'
        : `Seus ${doProfessor.length} horários livres batem com aula fixa de outro aluno.`,
    );
  }
  if (intervalosDe(aluno.disponibilidade).length > 0) {
    razoes.push('A disponibilidade que ele informou não cruza com a sua.');
  } else {
    razoes.push('Ele ainda não informou quando pode repor.');
  }
  return razoes;
}

/** Horas livres por semana — usado no resumo de disponibilidade. */
export const horasLivres = (lista: unknown): number =>
  minutosPorSemana(intervalosDe(lista)) / 60;
