/**
 * Data de referência do app, num lugar só.
 *
 * Desde o SCRUM-16 o app usa a data do aparelho (`USAR_DATA_REAL = true`).
 * A semente guarda deslocamentos (`hoje-12`, `hoje+32`) e é resolvida na
 * carga contra este hoje, e `lerDdMm` infere o ano a partir dele — todo o
 * resto do app já lê daqui.
 */

export const USAR_DATA_REAL = true;

/**
 * `HOJE_DEMO` e `ANO_DEMO` ficam, de propósito, com a flag ligada. São a
 * âncora de demonstração, e servem a duas coisas:
 *
 * - é o 28/08 de onde cada deslocamento de `data/seed.json` foi derivado (o
 *   campo `"hoje"` da semente é o espelho dele), e que a copy do handoff cita;
 * - virar a flag para `false` congela o app nesse dia, para quando for preciso
 *   texto de tela idêntico entre dias diferentes (capturas comparadas fora da
 *   mesma rodada do /designer, que tira o antes e o depois no mesmo dia).
 *
 * Os testes NÃO usam esta âncora: cada suíte recebe a data por parâmetro ou
 * fixa o ano (`lerDdMm('28/08', 2025)`), para passar em qualquer dia e com a
 * flag em qualquer posição. Se a âncora deixar de servir às duas coisas
 * acima, apague as duas constantes juntas.
 */

/** dd/mm fixo do protótipo (data/seed.json → "hoje"). */
export const HOJE_DEMO = '28/08';

/**
 * Ano de `HOJE_DEMO`, e só dele. Não é o ano de toda data: `lerDdMm` infere o
 * ano a partir de hoje (ver abaixo). Um dd/mm de demonstração precisa de um
 * ano para ser Date.
 */
export const ANO_DEMO = 2025;

/**
 * Meio ano de folga para cada lado de hoje. Um dd/mm cai no ano de hoje; se
 * ficar a MAIS de 183 dias, desloca um ano na direção que o aproxima.
 * Exatamente 183 fica no mesmo ano.
 */
export const JANELA_DO_ANO = 183;

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

const UM_DIA = 24 * 60 * 60 * 1000;

/** Dias de `a` até `b`, arredondado para não sofrer com horário de verão. */
function diasDeAte(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / UM_DIA);
}

/**
 * dd/mm → Date.
 *
 * `referencia` decide o ano:
 * - um número é o ano, usado sem inferência (o gerador do seed.sql passa assim);
 * - uma Date é o "hoje" de onde o ano é inferido (padrão: o hoje do app).
 *
 * A inferência assume o ano da referência e desloca ±1 ano quando a data cai a
 * mais de `JANELA_DO_ANO` dias dela. Sem isso `diasEntre('28/12', '05/01')`
 * dava −357 em vez de +8.
 *
 * A validação é estrita: `31/04` é `null`, e não 1º de maio, que é o que
 * `new Date(ano, 3, 31)` devolveria em silêncio. O mesmo vale para `29/02`
 * quando o ano escolhido não é bissexto: a data não existe, então é `null` —
 * empurrá-la para 1º de março mudaria vencimento e extrato sem ninguém ver.
 * O ano é escolhido antes de validar, então `29/02` perto de um ano bissexto
 * cai nele.
 */
export function lerDdMm(
  ddmm: string,
  referencia: number | Date = hojeComoData(),
): Date | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(ddmm.trim());
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  let ano: number;
  if (typeof referencia === 'number') {
    ano = referencia;
  } else {
    ano = referencia.getFullYear();
    // Data aproximada (29/02 num ano comum vira 01/03): só decide o ano.
    const distancia = diasDeAte(referencia, new Date(ano, mes - 1, dia));
    if (distancia > JANELA_DO_ANO) ano -= 1;
    else if (distancia < -JANELA_DO_ANO) ano += 1;
  }

  const data = new Date(ano, mes - 1, dia);
  if (data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  return data;
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
  // Ano explícito: inferir aqui seria chamar a si mesmo pelo padrão de lerDdMm.
  return lerDdMm(HOJE_DEMO, ANO_DEMO) as Date;
}

/**
 * Dias corridos de `de` até `ate` (negativo se `de` for no futuro).
 *
 * `ate` tem o ano inferido a partir de hoje, e `de` a partir de `ate`: assim o
 * par fica coerente mesmo quando os dois estão longe de hoje e perto um do
 * outro, e o resultado nunca passa de meio ano para nenhum lado.
 */
export function diasEntre(de: string, ate: string = hoje()): number | null {
  const b = lerDdMm(ate);
  if (!b) return null;
  const a = lerDdMm(de, b);
  if (!a) return null;
  return diasDeAte(a, b);
}

/** dd/mm somando dias — usado para validade estendida e pacotes novos. */
export function somarDias(ddmm: string, dias: number): string {
  const base = lerDdMm(ddmm);
  if (!base) return ddmm;
  return formatarDdMm(new Date(base.getTime() + dias * UM_DIA));
}

/** Eyebrow do cabeçalho da home: "Quinta, 28 de agosto". */
export function dataPorExtenso(
  ddmm: string = hoje(),
  referencia: number | Date = hojeComoData(),
): string {
  const d = lerDdMm(ddmm, referencia);
  if (!d) return ddmm;
  return `${DIAS_PT[d.getDay()]}, ${d.getDate()} de ${MESES_PT[d.getMonth()]}`;
}

/**
 * "Agosto de 2025" — eyebrow do Financeiro. É a única função que mostra o ano,
 * então é onde um ano errado apareceria na tela.
 */
export function mesPorExtenso(
  ddmm: string = hoje(),
  referencia: number | Date = hojeComoData(),
): string {
  const d = lerDdMm(ddmm, referencia);
  if (!d) return ddmm;
  const nome = MESES_PT[d.getMonth()];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${d.getFullYear()}`;
}
