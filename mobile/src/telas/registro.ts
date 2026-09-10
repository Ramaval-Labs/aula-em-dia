/**
 * Registro de telas do app.
 *
 * Fica fora do `App.tsx` porque são 28 entradas e o componente raiz não
 * deveria carregar 28 imports.
 *
 * O contrato é estrito: toda chave de `Tela` precisa de uma entrada aqui.
 * `App.tsx` indexa este objeto, então uma tela ausente vira tela branca
 * silenciosa — é o que o teste de consistência impede.
 */

import type { ComponentType } from 'react';

import type { Tela } from '../estado/navegacao';
import { Ajustes } from './Ajustes';
import { AlunoDetalhe } from './AlunoDetalhe';
import { AlunoForm } from './AlunoForm';
import { Financeiro } from './Financeiro';
import { Home } from './Home';
import { Inadimplencia } from './Inadimplencia';
import { Lembrete } from './Lembrete';
import { Pacote } from './Pacote';
import { Pagamento } from './Pagamento';
import { Politica } from './Politica';
import { Registrar } from './Registrar';
import { Reposicao } from './Reposicao';
import { Resultado } from './Resultado';
import {
  Avisos,
  ChavePix,
  Conta,
  MinhaDisponibilidade,
  PacotesPadrao,
  PerfilProfessor,
} from './ajustes/SubTelas';
import {
  AlunoDisponibilidade,
  AlunoProposta,
  AlunoSaldo,
  VerComoAluno,
} from './aluno/VisaoDoAluno';
import { AguardandoAceite } from './reposicao/AguardandoAceite';
import { ConfirmarReposicao } from './reposicao/ConfirmarReposicao';
import { DispAluno } from './reposicao/DispAluno';
import { OutroHorario } from './reposicao/OutroHorario';
import { SemHorario } from './reposicao/SemHorario';

export const REGISTRO: Record<Tela, ComponentType> = {
  // aba Alunos
  home: Home,
  aluno: AlunoDetalhe,
  alunoForm: AlunoForm,
  registrar: Registrar,
  resultado: Resultado,
  reposicao: Reposicao,
  dispAluno: DispAluno,
  outroHorario: OutroHorario,
  semHorario: SemHorario,
  confirmarReposicao: ConfirmarReposicao,
  aguardandoAceite: AguardandoAceite,
  pacote: Pacote,
  verComoAluno: VerComoAluno,
  alunoSaldo: AlunoSaldo,
  alunoProposta: AlunoProposta,
  alunoDisponibilidade: AlunoDisponibilidade,

  // aba Financeiro
  financeiro: Financeiro,
  inadimplencia: Inadimplencia,
  pagamento: Pagamento,
  lembrete: Lembrete,

  // aba Ajustes
  ajustes: Ajustes,
  politica: Politica,
  perfil: PerfilProfessor,
  minhaDisponibilidade: MinhaDisponibilidade,
  pacotesPadrao: PacotesPadrao,
  avisos: Avisos,
  chavePix: ChavePix,
  conta: Conta,
};

/** Nunca devolve indefinido: uma tela fora do registro cai na raiz. */
export function telaDe(tela: Tela): ComponentType {
  return REGISTRO[tela] ?? Home;
}
