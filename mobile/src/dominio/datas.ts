/**
 * Data de referência do app, num lugar só.
 *
 * O pacote de handoff congela o "hoje" em 28/08 porque toda a semente
 * (validades, dias de atraso, janelas de reposição) foi escrita em volta
 * dessa data. Trocar para a data real do aparelho é ligar `USAR_DATA_REAL`
 * — todo o resto do app já lê daqui.
 */

export const USAR_DATA_REAL = false;

/** dd/mm fixo do protótipo (data/seed.json → "hoje"). */
export const HOJE_DEMO = '28/08';

/** Ano assumido para a semente, já que o handoff só traz dd/mm. */
export const ANO_DEMO = 2025;

const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const DIAS_PT = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
];

function doisDigitos(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatarDdMm(d: Date): string {
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;
}

/** dd/mm → Date, assumindo o ano de referência. */
export function lerDdMm(ddmm: string, ano: number = ANO_DEMO): Date | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(ddmm.trim());
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return new Date(ano, mes - 1, dia);
}

/** O "hoje" do app em dd/mm. */
export function hoje(): string {
  return USAR_DATA_REAL ? formatarDdMm(new Date()) : HOJE_DEMO;
}

/** O "hoje" do app como Date, para contas de dias. */
export function hojeComoData(): Date {
  if (USAR_DATA_REAL) {
    const agora = new Date();
    return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  }
  return lerDdMm(HOJE_DEMO) as Date;
}

const UM_DIA = 24 * 60 * 60 * 1000;

/** Dias corridos de `de` até `ate` (negativo se `de` for no futuro). */
export function diasEntre(de: string, ate: string = hoje()): number | null {
  const a = lerDdMm(de);
  const b = lerDdMm(ate);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / UM_DIA);
}

/** dd/mm somando dias — usado para validade estendida e pacotes novos. */
export function somarDias(ddmm: string, dias: number): string {
  const base = lerDdMm(ddmm);
  if (!base) return ddmm;
  return formatarDdMm(new Date(base.getTime() + dias * UM_DIA));
}

/** Eyebrow do cabeçalho da home: "Quinta, 28 de agosto". */
export function dataPorExtenso(ddmm: string = hoje()): string {
  const d = lerDdMm(ddmm);
  if (!d) return ddmm;
  return `${DIAS_PT[d.getDay()]}, ${d.getDate()} de ${MESES_PT[d.getMonth()]}`;
}

/** "Agosto de 2025" — eyebrow do Financeiro. */
export function mesPorExtenso(ddmm: string = hoje()): string {
  const d = lerDdMm(ddmm);
  if (!d) return ddmm;
  const nome = MESES_PT[d.getMonth()];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${d.getFullYear()}`;
}
