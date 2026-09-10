/**
 * Semente do app. `seed.json` é cópia fiel de ../../data/seed.json do handoff
 * (o Metro não resolve arquivos fora da raiz do projeto). Ao mudar o handoff,
 * copie de novo — não edite este JSON à mão.
 *
 * Perfil e disponibilidade não existem no `seed.json` e por isso nascem aqui,
 * como constantes derivadas do que o JSON já traz.
 */

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

export const PROFESSOR = semente.professor;
export const JANELAS: Janela[] = semente.janelasReposicao;
export const JANELA_VALIDADE_ESTENDIDA: Janela = semente.janelaValidadeEstendida;

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

export const DISPONIBILIDADE_PADRAO: Disponibilidade = {
  blocos: BLOCOS_PADRAO,
  aceitaForaDosBlocos: true,
  sugereSabado: false,
  folgas: [
    { de: '07/09', ate: '07/09', motivo: 'feriado' },
    { de: '14/09', ate: '21/09', motivo: 'viagem' },
  ],
};

export interface EstadoPersistivel {
  alunos: Aluno[];
  extratos: Extratos;
  politicas: Politicas;
  perfil: Perfil;
  disponibilidade: Disponibilidade;
}

/** Cópia profunda, para o "zerar estado" nunca devolver o mesmo objeto mutado. */
export function estadoInicial(): EstadoPersistivel {
  return JSON.parse(
    JSON.stringify({
      alunos: semente.alunos,
      extratos: semente.extratos,
      politicas: semente.politicas,
      perfil: PERFIL_PADRAO,
      disponibilidade: DISPONIBILIDADE_PADRAO,
    }),
  );
}
