/**
 * Semente do app. `seed.json` é cópia fiel de ../../data/seed.json do handoff
 * (o Metro não resolve arquivos fora da raiz do projeto). Ao mudar o handoff,
 * copie de novo — não edite este JSON à mão.
 */

import type { Aluno, Extratos, Janela, Politicas } from '../dominio/tipos';
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

/** Cópia profunda, para o "zerar estado" nunca devolver o mesmo objeto mutado. */
export function estadoInicial(): {
  alunos: Aluno[];
  extratos: Extratos;
  politicas: Politicas;
} {
  return JSON.parse(
    JSON.stringify({
      alunos: semente.alunos,
      extratos: semente.extratos,
      politicas: semente.politicas,
    }),
  );
}
