/**
 * Motor de sugestão de reposição — módulo puro.
 *
 * É o diferencial declarado no Envio 01: em vez de três strings fixas, as
 * janelas saem de um cálculo contra a agenda real. O algoritmo percorre o
 * horizonte até a validade do pacote, descarta o que colide e pontua o resto.
 *
 * O modelo de horário do aluno é texto livre no handoff ("quarta", "terça e
 * quinta", "17h"), então a leitura é por palavra-chave. É o suficiente para
 * o protótipo e fica isolado aqui.
 */

import { diaDaSemanaDe, DIAS, duracaoDaFaixa, emFolga, FAIXAS, temBloco } from './disponibilidade';
import { diasEntre, formatarDdMm, lerDdMm, somarDias } from './datas';
import type {
  Aluno,
  BlocoSemanal,
  DiaDaSemana,
  Disponibilidade,
  FaixaHoraria,
  FiltroDeAgenda,
  Janela,
} from './tipos';

/** Quantas janelas a tela de sugestões mostra. */
export const MELHORES = 3;

/** Horizonte máximo quando o pacote não tem validade. */
const HORIZONTE_PADRAO = 30;

// --- leitura do horário fixo do aluno -------------------------------------

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

/** "terça e quinta" → ['ter', 'qui'] */
export function diasDoAluno(a: Aluno): DiaDaSemana[] {
  const texto = (a.dia ?? '').toLowerCase();
  const achados = Object.keys(APELIDOS)
    .filter((k) => texto.includes(k))
    .map((k) => APELIDOS[k]);
  return Array.from(new Set(achados));
}

/** "17h" → 17 */
export function horaDoAluno(a: Aluno): number | null {
  const m = /(\d{1,2})\s*h/.exec(a.hora ?? '');
  return m ? Number(m[1]) : null;
}

/** Em qual faixa cai uma hora do dia. */
export function faixaDaHora(hora: number): FaixaHoraria | null {
  const f = FAIXAS.find((x) => hora >= x.inicio && hora < x.fim);
  return f ? f.chave : null;
}

/** O bloco semanal em que a aula fixa do aluno acontece. */
export function blocosDaAulaFixa(a: Aluno): BlocoSemanal[] {
  const hora = horaDoAluno(a);
  const faixa = hora === null ? null : faixaDaHora(hora);
  if (!faixa) return [];
  return diasDoAluno(a).map((dia) => ({ dia, faixa }));
}

// --- candidatas -----------------------------------------------------------

export interface Candidata extends Janela {
  data: string;
  bloco: BlocoSemanal;
  emDias: number;
  pontos: number;
  /** as razões que a tela lista, na ordem em que aparecem */
  razoes: string[];
  melhor: boolean;
}

function horaSugerida(faixa: FaixaHoraria, preferida: number | null): string {
  const f = FAIXAS.find((x) => x.chave === faixa);
  if (!f) return '';
  const dentro = preferida !== null && preferida >= f.inicio && preferida < f.fim;
  return `${dentro ? preferida : f.inicio}h`;
}

function rotuloDoDia(data: string): string {
  const dia = diaDaSemanaDe(data);
  const nome = DIAS.find((d) => d.chave === dia)?.longo ?? '';
  return `${nome}, ${data}`;
}

/**
 * Gera as janelas possíveis para repor a aula de um aluno.
 *
 * Descarta: folga do professor, bloco fora da disponibilidade, colisão com
 * aula fixa de outro aluno e colisão com reposição já marcada.
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

  const ocupados: BlocoSemanal[] = todos
    .filter((o) => o.id !== aluno.id && !o.arquivado)
    .flatMap(blocosDaAulaFixa);

  const preferida = horaDoAluno(aluno);
  const blocosDoAluno = blocosDaAulaFixa(aluno);
  const dispDoAluno = aluno.disponibilidade ?? [];

  const saida: Candidata[] = [];

  for (let d = 1; d <= horizonte; d += 1) {
    const data = formatarDdMm(new Date(inicio.getTime() + d * 86400000));
    const dia = diaDaSemanaDe(data);
    if (!dia) continue;
    if (dia === 'sab' && !disponibilidade.sugereSabado) continue;
    if (emFolga(data, disponibilidade.folgas)) continue;

    for (const faixa of FAIXAS) {
      const bloco: BlocoSemanal = { dia, faixa: faixa.chave };

      // fora da agenda declarada do professor
      if (!temBloco(disponibilidade.blocos, bloco) && !disponibilidade.aceitaForaDosBlocos) {
        continue;
      }
      const foraDoHabitual = !temBloco(disponibilidade.blocos, bloco);

      // choque com aula fixa de outro aluno
      if (temBloco(ocupados, bloco)) continue;

      // o aluno declarou disponibilidade e este bloco não está nela
      if (dispDoAluno.length > 0 && !temBloco(dispDoAluno, bloco)) continue;

      const mesmoHorarioDeSempre = temBloco(blocosDoAluno, bloco);
      const razoes: string[] = [];
      let pontos = 100 - d; // quanto antes, melhor

      if (mesmoHorarioDeSempre) {
        pontos += 40;
        razoes.push('É o mesmo horário da aula fixa dele.');
      }
      if (dispDoAluno.length > 0 && temBloco(dispDoAluno, bloco)) {
        pontos += 25;
        razoes.push('Ele marcou esse bloco como disponível.');
      }
      if (foraDoHabitual) {
        pontos -= 30;
        razoes.push('Está fora dos seus blocos habituais.');
      }
      const faltam = diasEntre(data, ate);
      if (faltam !== null && faltam >= 0) {
        razoes.push(`Acontece ${faltam} dias antes do pacote vencer, em ${ate}.`);
      }

      saida.push({
        data,
        bloco,
        dia: rotuloDoDia(data),
        hora: horaSugerida(faixa.chave, preferida),
        motivo: razoes[0] ?? 'Livre na sua agenda.',
        razoes,
        emDias: d,
        pontos,
        melhor: false,
      });
    }
  }

  return saida.sort((a, b) => b.pontos - a.pontos);
}

/** As N melhores, já marcadas. */
export function melhores(lista: Candidata[], quantas = MELHORES): Candidata[] {
  return lista.slice(0, quantas).map((c, i) => ({ ...c, melhor: i === 0 }));
}

export function filtrar(lista: Candidata[], filtro: FiltroDeAgenda): Candidata[] {
  if (filtro === 'fimDeSemana') {
    return lista.filter((c) => c.bloco.dia === 'sab' || c.bloco.dia === 'dom');
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
      janelas: janelas.sort((a, b) => a.emDias - b.emDias),
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

  if (aluno.validade && dias >= 0) {
    razoes.push(`O pacote vence em ${ate}, daqui a ${dias} dias.`);
  }
  if (disponibilidade.blocos.length === 0) {
    razoes.push('Você ainda não marcou nenhum bloco na sua disponibilidade.');
  } else {
    razoes.push(
      `Seus ${disponibilidade.blocos.length} blocos livres batem com aula fixa de outro aluno.`,
    );
  }
  if ((aluno.disponibilidade ?? []).length > 0) {
    razoes.push('A disponibilidade que ele informou não cruza com a sua.');
  } else {
    razoes.push('Ele ainda não informou quando pode repor.');
  }
  return razoes;
}

/** Horas livres por semana — usado no resumo de disponibilidade. */
export const horasLivres = (blocos: BlocoSemanal[]): number =>
  blocos.reduce((t, b) => t + duracaoDaFaixa(b.faixa), 0);
