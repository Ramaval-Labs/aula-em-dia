/**
 * Máquina de navegação de spec/navegacao.md.
 *
 * Pilha própria em vez de react-navigation porque o contrato aqui é curto e
 * específico: trocar de aba zera a pilha, concluir um fluxo substitui a pilha,
 * e a navbar só aparece nas três raízes. Manter isso explícito deixa a regra
 * testável e evita configurar um navegador inteiro para nove telas.
 */

import { create } from 'zustand';

import type { Desfecho, Filtro, Politicas } from '../dominio/tipos';

export type Tela =
  | 'home'
  | 'aluno'
  | 'registrar'
  | 'resultado'
  | 'reposicao'
  | 'financeiro'
  | 'inadimplencia'
  | 'ajustes'
  | 'politica';

export type Aba = 'home' | 'financeiro' | 'ajustes';

/** A qual aba cada tela pertence — a navbar destaca a aba da tela atual. */
export const ABA_DA_TELA: Record<Tela, Aba> = {
  home: 'home',
  aluno: 'home',
  registrar: 'home',
  resultado: 'home',
  reposicao: 'home',
  financeiro: 'financeiro',
  inadimplencia: 'financeiro',
  ajustes: 'ajustes',
  politica: 'ajustes',
};

/** A navbar só aparece nas raízes; nas telas de tarefa o rodapé é da ação. */
export const TELAS_COM_NAVBAR: Tela[] = ['home', 'financeiro', 'ajustes'];

/** Antecedência do aviso pré-selecionada na tela de registro. */
export const AVISO_PADRAO = 26;

type Quadro = { tela: Tela; alunoId: string | null };

type Navegacao = {
  tela: Tela;
  pilha: Quadro[];
  alunoId: string | null;
  filtro: Filtro;

  // efêmero: some ao voltar ou trocar de aba
  desfecho: Desfecho | null;
  avisoH: number;
  janela: number | null;
  rascunho: Politicas | null;

  ir: (tela: Tela, extra?: Partial<Quadro & Efemero>) => void;
  voltar: () => boolean;
  trocarTab: (aba: Aba) => void;
  /** Conclui um fluxo: navega zerando a pilha, para não voltar para dentro dele. */
  concluir: (tela: Tela, alunoId?: string | null) => void;

  /** Troca o aluno da tela atual sem empilhar (escolha dentro de Registrar). */
  definirAluno: (id: string | null) => void;
  definirFiltro: (f: Filtro) => void;
  definirDesfecho: (d: Desfecho | null) => void;
  definirAvisoH: (h: number) => void;
  definirJanela: (i: number | null) => void;
  definirRascunho: (p: Politicas | null) => void;
};

type Efemero = {
  desfecho: Desfecho | null;
  avisoH: number;
  janela: number | null;
  rascunho: Politicas | null;
};

const EFEMERO_LIMPO = {
  desfecho: null,
  janela: null,
  rascunho: null,
} as const;

export const useNavegacao = create<Navegacao>((set, get) => ({
  tela: 'home',
  pilha: [],
  alunoId: null,
  filtro: 'Urgência',

  desfecho: null,
  avisoH: AVISO_PADRAO,
  janela: null,
  rascunho: null,

  ir(tela, extra) {
    set((s) => ({
      pilha: [...s.pilha, { tela: s.tela, alunoId: s.alunoId }],
      tela,
      ...extra,
    }));
  },

  voltar() {
    const { pilha } = get();
    if (!pilha.length) {
      // Raiz da aba Alunos: nada a desempilhar, o sistema trata o gesto.
      set({ tela: 'home', ...EFEMERO_LIMPO });
      return false;
    }
    const anterior = pilha[pilha.length - 1];
    set({
      tela: anterior.tela,
      alunoId: anterior.alunoId,
      pilha: pilha.slice(0, -1),
      ...EFEMERO_LIMPO,
    });
    return true;
  },

  trocarTab(aba) {
    set({ tela: aba, pilha: [], alunoId: null, ...EFEMERO_LIMPO });
  },

  concluir(tela, alunoId) {
    set((s) => ({
      tela,
      alunoId: alunoId === undefined ? s.alunoId : alunoId,
      pilha: [],
      ...EFEMERO_LIMPO,
    }));
  },

  definirAluno: (alunoId) => set({ alunoId }),
  definirFiltro: (filtro) => set({ filtro }),
  definirDesfecho: (desfecho) => set({ desfecho }),
  definirAvisoH: (avisoH) => set({ avisoH }),
  definirJanela: (janela) => set({ janela }),
  definirRascunho: (rascunho) => set({ rascunho }),
}));
