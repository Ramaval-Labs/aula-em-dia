/**
 * Semente do app. `seed.json` é cópia fiel de ../../data/seed.json do handoff
 * (o Metro não resolve arquivos fora da raiz do projeto). Ao mudar o handoff,
 * copie de novo — não edite este JSON à mão.
 *
 * Perfil e disponibilidade não existem no `seed.json` e por isso nascem aqui,
 * como constantes derivadas do que o JSON já traz.
 *
 * A semente guarda deslocamento, não data (SCRUM-13). `"hoje-12"` e `"hoje+32"`
 * viram dd/mm aqui, na carga, e os tipos do domínio seguem recebendo dd/mm.
 * Dentro de um texto a notação vai entre chaves: `{hoje-58}` vira a data e
 * `{dia:hoje+1}` vira "Sexta, 29/08", com o nome do dia derivado da data.
 * A gramática mora em `lerNotacao`, e é lida por dois lados: `resolverData`
 * troca cada deslocamento por dd/mm, para o app, e `sementeSql.ts` troca por
 * uma expressão SQL, para o `seed.sql`. Data absoluta em dd/mm passa intacta,
 * para o que é fixo de calendário.
 */

import { hoje, somarDias } from '../dominio/datas';
import { DIAS, diaDaSemanaDe } from '../dominio/disponibilidade';
import type {
  Aluno,
  BlocoSemanal,
  Disponibilidade,
  Extratos,
  Janela,
  Perfil,
  Politicas,
} from '../dominio/tipos';
import { iniciaisDe } from '../dominio/validacao';
import bruto from './seed.json';

interface Semente {
  chaveStorage: string;
  chaveTema: string;
  hoje: string;
  valorAula: number;
  politicas: Politicas;
  professor: { nome: string; iniciais: string };
  janelasReposicao: Janela[];
  janelaValidadeEstendida: Janela;
  alunos: Aluno[];
  extratos: Extratos;
}

const semente = bruto as unknown as Semente;

/** `hoje`, `hoje-12`, `hoje+32`. */
const DESLOCAMENTO = /^hoje(?:([+-])(\d+))?$/;
/** A mesma notação dentro de um texto: `{hoje-58}` ou `{dia:hoje+1}`. */
const DESLOCAMENTO_NO_TEXTO = /\{(dia:)?(hoje(?:[+-]\d+)?)\}/g;

/** Um deslocamento em dias a partir de hoje; `comDia` pede "Sexta, 29/08". */
export interface Deslocamento {
  dias: number;
  comDia: boolean;
}

/** Um valor da semente, partido em texto literal e deslocamentos. */
export type ParteDaNotacao = string | Deslocamento;

/** "hoje-12" → -12; null quando não é a notação. */
function diasDoDeslocamento(valor: string): number | null {
  const m = DESLOCAMENTO.exec(valor);
  if (!m) return null;
  return m[2] ? Number(m[2]) * (m[1] === '-' ? -1 : 1) : 0;
}

/**
 * A gramática da notação, num lugar só. Um valor que é só o deslocamento vira
 * uma parte; dentro de um texto, cada trecho entre chaves vira uma parte e o
 * resto fica como literal. O que não tem a notação (dd/mm, `""`,
 * `"sem prazo"`, texto comum) volta como um literal único.
 */
export function lerNotacao(valor: string): ParteDaNotacao[] {
  const inteiro = diasDoDeslocamento(valor);
  if (inteiro !== null) return [{ dias: inteiro, comDia: false }];

  const partes: ParteDaNotacao[] = [];
  let lido = 0;
  for (const m of valor.matchAll(DESLOCAMENTO_NO_TEXTO)) {
    const dias = diasDoDeslocamento(m[2]);
    if (dias === null) continue;
    if (m.index > lido) partes.push(valor.slice(lido, m.index));
    partes.push({ dias, comDia: Boolean(m[1]) });
    lido = m.index + m[0].length;
  }
  if (lido < valor.length || partes.length === 0) partes.push(valor.slice(lido));
  return partes;
}

/** "29/08" → "Sexta, 29/08". Escrito à mão, o dia mente assim que a data anda. */
function comDiaDaSemana(ddmm: string): string {
  const dia = diaDaSemanaDe(ddmm);
  const nome = DIAS.find((d) => d.chave === dia)?.longo;
  return nome ? `${nome}, ${ddmm}` : ddmm;
}

/**
 * A notação resolvida para o app: cada deslocamento vira dd/mm contado a
 * partir de `base`, e o que não tem a notação volta como entrou.
 */
export function resolverData(valor: string, base: string = hoje()): string {
  return lerNotacao(valor)
    .map((parte) => {
      if (typeof parte === 'string') return parte;
      const data = somarDias(base, parte.dias);
      return parte.comDia ? comDiaDaSemana(data) : data;
    })
    .join('');
}

/** Aplica `resolverData` a todo texto de uma estrutura, devolvendo uma cópia. */
function resolverDatas<T>(valor: T, base: string = hoje()): T {
  if (typeof valor === 'string') return resolverData(valor, base) as unknown as T;
  if (Array.isArray(valor)) return valor.map((v) => resolverDatas(v, base)) as unknown as T;
  if (valor !== null && typeof valor === 'object') {
    const saida: Record<string, unknown> = {};
    for (const [chave, v] of Object.entries(valor)) saida[chave] = resolverDatas(v, base);
    return saida as T;
  }
  return valor;
}

export const PROFESSOR = semente.professor;
export const JANELAS: Janela[] = resolverDatas(semente.janelasReposicao);
export const JANELA_VALIDADE_ESTENDIDA: Janela = resolverDatas(semente.janelaValidadeEstendida);

/** Tira acento sem depender de escape de regex. */
const semAcento = (v: string): string =>
  v
    .normalize('NFD')
    .split('')
    .filter((c) => {
      const n = c.charCodeAt(0);
      return n < 0x0300 || n > 0x036f;
    })
    .join('');

/** E-mail de demonstração, derivado do nome — não há um no handoff. */
const emailDemo = (nome: string): string =>
  `${semAcento(nome.toLowerCase()).split(' ').filter(Boolean).join('.')}@gmail.com`;

/** Disciplinas do professor: as que os alunos-semente estudam, sem repetir. */
const disciplinasDaSemente = (): string[] =>
  Array.from(new Set(semente.alunos.map((a) => a.disciplina).filter(Boolean)));

export const PERFIL_PADRAO: Perfil = {
  nome: PROFESSOR.nome,
  iniciais: PROFESSOR.iniciais || iniciaisDe(PROFESSOR.nome),
  email: emailDemo(PROFESSOR.nome),
  disciplinas: disciplinasDaSemente(),
  faixaDeAlunos: '1–5',
  plano: 'gratuito',
};

/** A grade desenhada em A5: 13 blocos. */
const BLOCOS_PADRAO: BlocoSemanal[] = [
  { dia: 'ter', faixa: 'manha' },
  { dia: 'qui', faixa: 'manha' },
  { dia: 'seg', faixa: 'tarde' },
  { dia: 'ter', faixa: 'tarde' },
  { dia: 'qua', faixa: 'tarde' },
  { dia: 'qui', faixa: 'tarde' },
  { dia: 'sex', faixa: 'tarde' },
  { dia: 'seg', faixa: 'fimTarde' },
  { dia: 'ter', faixa: 'fimTarde' },
  { dia: 'qua', faixa: 'fimTarde' },
  { dia: 'qui', faixa: 'fimTarde' },
  { dia: 'sex', faixa: 'fimTarde' },
  { dia: 'qua', faixa: 'noite' },
];

/** Na notação da semente: a viagem anda com o hoje. */
export const DISPONIBILIDADE_DA_SEMENTE: Disponibilidade = {
  blocos: BLOCOS_PADRAO,
  aceitaForaDosBlocos: true,
  sugereSabado: false,
  folgas: [
    // 7 de setembro é fixo de calendário, por isso fica absoluto.
    { de: '07/09', ate: '07/09', motivo: 'feriado' },
    { de: 'hoje+17', ate: 'hoje+24', motivo: 'viagem' },
  ],
};

export const DISPONIBILIDADE_PADRAO: Disponibilidade = resolverDatas(DISPONIBILIDADE_DA_SEMENTE);

export interface EstadoPersistivel {
  alunos: Aluno[];
  extratos: Extratos;
  politicas: Politicas;
  perfil: Perfil;
  disponibilidade: Disponibilidade;
}

/**
 * A semente como está escrita, ainda na notação `hoje±N`. É o que o gerador de
 * `seed.sql` lê; o app usa `estadoInicial()`, que já devolve as datas.
 */
export const SEMENTE_NA_NOTACAO: EstadoPersistivel = {
  alunos: semente.alunos,
  extratos: semente.extratos,
  politicas: semente.politicas,
  perfil: PERFIL_PADRAO,
  disponibilidade: DISPONIBILIDADE_DA_SEMENTE,
};

/**
 * Cópia profunda, para o "zerar estado" nunca devolver o mesmo objeto mutado.
 * As datas são resolvidas a cada chamada, contra o hoje daquele momento.
 */
export function estadoInicial(): EstadoPersistivel {
  return resolverDatas(SEMENTE_NA_NOTACAO);
}
