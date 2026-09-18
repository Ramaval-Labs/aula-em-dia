/**
 * Máquina de navegação de spec/navegacao.md.
 *
 * Pilha própria em vez de react-navigation porque o contrato aqui é curto e
 * específico: trocar de aba zera a pilha, concluir um fluxo substitui a pilha,
 * e o sheet é um terceiro eixo que não empilha painel sobre painel. Manter
 * isso explícito deixa a regra testável e evita configurar um navegador
 * inteiro para 28 telas.
 *
 * O tipo de cada tela (raiz, empilhada, sheet) é o contrato de
 * docs/design/redesign-ios-glass/MAPA-DE-TELAS.md e mora aqui porque a
 * navegação depende dele: sheet troca de conteúdo em vez de empilhar, e a tab
 * bar aparece em toda tela que não é sheet.
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

/**
 * Tipo de cada tela (MAPA-DE-TELAS.md, "Tipos de tela"):
 * - `raiz`: raiz de aba, título grande no conteúdo, padding `54 16 126`;
 * - `empilhada`: botão voltar fixo, padding `100 16 126`;
 * - `sheet`: painel modal por cima da última tela não-sheet.
 *
 * A tab bar aparece em toda tela que não é sheet — por isso não existe mais
 * uma lista de telas com barra.
 */
export type TipoDeTela = 'raiz' | 'empilhada' | 'sheet';

export const TIPO_DA_TELA: Record<Tela, TipoDeTela> = {
  home: 'raiz',
  aluno: 'empilhada',
  alunoForm: 'sheet',
  registrar: 'sheet',
  resultado: 'sheet',
  reposicao: 'sheet',
  dispAluno: 'sheet',
  outroHorario: 'sheet',
  semHorario: 'sheet',
  confirmarReposicao: 'sheet',
  aguardandoAceite: 'empilhada',
  pacote: 'sheet',
  verComoAluno: 'empilhada',
  alunoSaldo: 'empilhada',
  alunoProposta: 'empilhada',
  alunoDisponibilidade: 'empilhada',

  financeiro: 'raiz',
  inadimplencia: 'empilhada',
  pagamento: 'sheet',
  lembrete: 'sheet',

  ajustes: 'raiz',
  politica: 'empilhada',
  perfil: 'empilhada',
  minhaDisponibilidade: 'empilhada',
  pacotesPadrao: 'empilhada',
  avisos: 'empilhada',
  chavePix: 'empilhada',
  conta: 'empilhada',
};

export const ehSheet = (tela: Tela): boolean => TIPO_DA_TELA[tela] === 'sheet';
export const ehRaiz = (tela: Tela): boolean => TIPO_DA_TELA[tela] === 'raiz';
export const ehEmpilhada = (tela: Tela): boolean => TIPO_DA_TELA[tela] === 'empilhada';

type Quadro = { tela: Tela; alunoId: string | null };

/**
 * Pilha sem quadros de sheet. Fechar ou atravessar um painel não pode deixar
 * um sheet enterrado para o voltar reabrir mais tarde.
 */
const semSheets = (pilha: Quadro[]): Quadro[] => pilha.filter((q) => !ehSheet(q.tela));

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
  /** Fecha o sheet aberto: volta para a última tela não-sheet. */
  fecharSheet: () => void;

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
    const s = get();
    // Sheet → sheet troca o conteúdo do painel aberto, sem empilhar outro
    // painel (MAPA-DE-TELAS.md, "Semântica de sheet").
    if (ehSheet(s.tela) && ehSheet(tela)) {
      set({ tela, ...extra });
      return;
    }
    // Sheet → tela comum fecha o sheet e empilha o destino sobre a última
    // não-sheet: o painel some, e voltar não o traz de volta.
    if (ehSheet(s.tela)) {
      set({ tela, pilha: semSheets(s.pilha), ...extra });
      return;
    }
    set({
      pilha: [...s.pilha, { tela: s.tela, alunoId: s.alunoId }],
      tela,
      ...extra,
    });
  },

  voltar() {
    const { pilha, tela } = get();
    // Com sheet aberto, voltar (inclusive o botão do Android) fecha o painel.
    if (ehSheet(tela)) {
      get().fecharSheet();
      return true;
    }
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

  fecharSheet() {
    const s = get();
    if (!ehSheet(s.tela)) return;
    const pilha = semSheets(s.pilha);
    const anterior = pilha[pilha.length - 1];
    if (anterior) {
      set({ tela: anterior.tela, alunoId: anterior.alunoId, pilha: pilha.slice(0, -1) });
      return;
    }
    // Sem pilha (sheet restaurado ou aberto direto): a ficha do aluno em
    // contexto é o lugar mais próximo; sem aluno, a lista.
    if (s.alunoId) set({ tela: 'aluno', pilha: [] });
    else set({ tela: 'home', pilha: [], alunoId: null });
  },

  definirAluno: (alunoId) => set({ alunoId }),
  definirFiltro: (filtro) => set({ filtro }),
}));

/* ── Derivados para a UI ──────────────────────────────────────────────── */

type EstadoDeFundo = Pick<Navegacao, 'tela' | 'pilha' | 'alunoId'>;

/** Há um painel de sheet no ar? A tab bar some quando sim. */
export const sheetAberto = (estado: Pick<Navegacao, 'tela'>): boolean => ehSheet(estado.tela);

/**
 * A tela não-sheet que fica desenhada atrás do painel — o sheet sobe por cima
 * de um contexto, nunca de uma tela em branco. Fora do sheet, é a tela atual.
 *
 * Seletor de store: devolve string, então não recria objeto a cada render.
 */
export function telaDeFundo(estado: EstadoDeFundo): Tela {
  if (!ehSheet(estado.tela)) return estado.tela;
  for (let i = estado.pilha.length - 1; i >= 0; i -= 1) {
    if (!ehSheet(estado.pilha[i].tela)) return estado.pilha[i].tela;
  }
  return estado.alunoId ? 'aluno' : 'home';
}
