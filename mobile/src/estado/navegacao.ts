/**
 * Máquina de navegação de spec/navegacao.md.
 *
 * Pilha própria em vez de react-navigation porque o contrato aqui é curto e
 * específico: trocar de aba zera a pilha, concluir um fluxo substitui a pilha,
 * e a navbar só aparece nas três raízes. Manter isso explícito deixa a regra
 * testável e evita configurar um navegador inteiro para nove telas.
 */

import { create } from 'zustand';

import type { Filtro } from '../dominio/tipos';
import { useFormularios } from './formularios';

export type Tela =
  // aba Alunos
  | 'home'
  | 'aluno'
  | 'alunoForm'
  | 'registrar'
  | 'resultado'
  | 'reposicao'
  | 'dispAluno'
  | 'outroHorario'
  | 'semHorario'
  | 'confirmarReposicao'
  | 'aguardandoAceite'
  | 'pacote'
  | 'verComoAluno'
  | 'alunoSaldo'
  | 'alunoProposta'
  | 'alunoDisponibilidade'
  // aba Financeiro
  | 'financeiro'
  | 'inadimplencia'
  | 'pagamento'
  | 'lembrete'
  // aba Ajustes
  | 'ajustes'
  | 'politica'
  | 'perfil'
  | 'minhaDisponibilidade'
  | 'pacotesPadrao'
  | 'avisos'
  | 'chavePix'
  | 'conta';

export type Aba = 'home' | 'financeiro' | 'ajustes';

/** A qual aba cada tela pertence — a navbar destaca a aba da tela atual. */
export const ABA_DA_TELA: Record<Tela, Aba> = {
  home: 'home',
  aluno: 'home',
  alunoForm: 'home',
  registrar: 'home',
  resultado: 'home',
  reposicao: 'home',
  dispAluno: 'home',
  outroHorario: 'home',
  semHorario: 'home',
  confirmarReposicao: 'home',
  aguardandoAceite: 'home',
  pacote: 'home',
  verComoAluno: 'home',
  alunoSaldo: 'home',
  alunoProposta: 'home',
  alunoDisponibilidade: 'home',

  financeiro: 'financeiro',
  inadimplencia: 'financeiro',
  pagamento: 'financeiro',
  lembrete: 'financeiro',

  ajustes: 'ajustes',
  politica: 'ajustes',
  perfil: 'ajustes',
  minhaDisponibilidade: 'ajustes',
  pacotesPadrao: 'ajustes',
  avisos: 'ajustes',
  chavePix: 'ajustes',
  conta: 'ajustes',
};

/** A navbar só aparece nas raízes; nas telas de tarefa o rodapé é da ação. */
export const TELAS_COM_NAVBAR: Tela[] = ['home', 'financeiro', 'ajustes'];

type Quadro = { tela: Tela; alunoId: string | null };

type Navegacao = {
  tela: Tela;
  pilha: Quadro[];
  alunoId: string | null;
  filtro: Filtro;

  ir: (tela: Tela, extra?: Partial<Quadro>) => void;
  voltar: () => boolean;
  trocarTab: (aba: Aba) => void;
  /** Conclui um fluxo: navega zerando a pilha, para não voltar para dentro dele. */
  concluir: (tela: Tela, alunoId?: string | null) => void;

  /** Troca o aluno da tela atual sem empilhar (escolha dentro de Registrar). */
  definirAluno: (id: string | null) => void;
  definirFiltro: (f: Filtro) => void;
};

export const useNavegacao = create<Navegacao>((set, get) => ({
  tela: 'home',
  pilha: [],
  alunoId: null,
  filtro: 'Urgência',

  ir(tela, extra) {
    set((s) => ({
      pilha: [...s.pilha, { tela: s.tela, alunoId: s.alunoId }],
      tela,
      ...extra,
    }));
  },

  voltar() {
    const { pilha, tela } = get();
    if (!pilha.length) {
      // Raiz de uma aba: nada a desempilhar, o sistema trata o gesto.
      // Cai na raiz da aba atual, não em 'home' — voltar de uma tela da aba
      // Ajustes para a lista de alunos seria salto, não retorno.
      set({ tela: ABA_DA_TELA[tela] });
      return false;
    }
    const anterior = pilha[pilha.length - 1];
    set({
      tela: anterior.tela,
      alunoId: anterior.alunoId,
      pilha: pilha.slice(0, -1),
    });
    return true;
  },

  trocarTab(aba) {
    // Trocar de aba abandona qualquer formulário em andamento.
    useFormularios.getState().limparTudo();
    set({ tela: aba, pilha: [], alunoId: null });
  },

  concluir(tela, alunoId) {
    // Fluxo concluído: o rascunho que o alimentava não serve mais.
    useFormularios.getState().limparTudo();
    set((s) => ({
      tela,
      alunoId: alunoId === undefined ? s.alunoId : alunoId,
      pilha: [],
    }));
  },

  definirAluno: (alunoId) => set({ alunoId }),
  definirFiltro: (filtro) => set({ filtro }),
}));
