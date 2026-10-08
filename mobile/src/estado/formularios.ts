/**
 * Rascunhos de formulário, um por chave.
 *
 * Existe porque o chassi **desmonta a tela ao navegar** (`App.tsx` faz
 * `TELAS[tela]`): não há navegador com parâmetros de rota nem componente pai
 * comum, então um `useState` local perderia o preenchimento no primeiro
 * "Continuar" de um assistente de vários passos.
 *
 * O critério para decidir onde mora cada estado:
 *   - morre com a tela e ninguém mais lê (foco, "mostrar senha", acordeão
 *     aberto) → `useState` local;
 *   - atravessa telas, precisa sobreviver ao `voltar()`, ou é comparado com o
 *     valor persistido para habilitar "Salvar" → aqui.
 *
 * E não fica em `dados.ts` porque lá cada `set` grava no AsyncStorage — seria
 * uma escrita em disco por tecla digitada.
 */

import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

import type {
  Aluno,
  BlocoSemanal,
  ConfigPacote,
  Desfecho,
  Disponibilidade,
  FaixaDeAlunos,
  FiltroDeAgenda,
  MeioDePagamento,
  Politicas,
  TomDeMensagem,
} from '../dominio/tipos';
import type { Tela } from './navegacao';

export interface RascunhoAcesso {
  email: string;
  senha: string;
  mostrarSenha: boolean;
  erro: string | null;
}

export interface RascunhoPerfil {
  nome: string;
  email: string;
  disciplinas: string[];
  faixaDeAlunos: FaixaDeAlunos;
}

export interface RascunhoAluno {
  /** preenchido só na edição */
  id?: string;
  nome: string;
  disciplina: string;
  dia: string;
  hora: string;
  telefone: string;
  /**
   * Para onde salvar volta, quando a edição foi aberta de dentro de outra
   * tarefa (o atalho "Cadastrar telefone" da prévia de mensagem). Sem ele,
   * salvar conclui na ficha do aluno.
   */
  retorno?: Tela;
}

export interface RascunhoPagamento {
  meio: MeioDePagamento;
  /** em reais, como número */
  valor: number;
  /** dd/mm */
  data: string;
}

export interface RascunhoMensagem {
  tom: TomDeMensagem;
  texto: string;
  /** o professor mexeu no texto, então não regerar por cima */
  editado: boolean;
}

/**
 * Identidade de uma janela candidata: a data (dd/mm) e a hora bastam para
 * reencontrá-la em qualquer lista do motor. Não guardar o índice — C3, C4 e
 * C6 montam listas diferentes (as melhores, a filtrada, a completa), e o
 * mesmo índice apontaria para outro horário em cada uma.
 */
export interface IdDaJanela {
  data: string;
  hora: string;
}

export interface RascunhoReposicao {
  janela: IdDaJanela | null;
  filtro: FiltroDeAgenda;
}

/** A candidata `c` é a janela guardada no rascunho? */
export function mesmaJanela(
  id: IdDaJanela | null,
  c: { data: string; hora: string },
): boolean {
  return id !== null && id.data === c.data && id.hora === c.hora;
}

export interface RascunhoRegistro {
  desfecho: Desfecho | null;
  avisoH: number;
  /**
   * O que o registro fez de fato, guardado na hora de confirmar para a tela
   * de Resultado não reler o aluno: `null` antes de confirmar.
   */
  reposicaoCriada: boolean | null;
}

/** Uma entrada por formulário do app. */
export interface MapaDeRascunhos {
  acesso: RascunhoAcesso;
  perfil: RascunhoPerfil;
  politica: Politicas;
  aluno: RascunhoAluno;
  pacote: ConfigPacote;
  pagamento: RascunhoPagamento;
  mensagem: RascunhoMensagem;
  disponibilidadeProfessor: Disponibilidade;
  disponibilidadeAluno: BlocoSemanal[];
  registro: RascunhoRegistro;
  reposicao: RascunhoReposicao;
}

export type ChaveDeRascunho = keyof MapaDeRascunhos;

/** Antecedência do aviso pré-selecionada na tela de registro. */
export const AVISO_PADRAO = 26;

/** Estado zerado do registro de aula — a tela sempre começa em branco. */
export const REGISTRO_INICIAL: RascunhoRegistro = {
  desfecho: null,
  avisoH: AVISO_PADRAO,
  reposicaoCriada: null,
};

/** Estado zerado da escolha de horário de reposição. */
export const REPOSICAO_INICIAL: RascunhoReposicao = {
  janela: null,
  filtro: 'livres',
};

/**
 * O rascunho de edição de um aluno existente. Quem abre a edição grava este
 * rascunho antes de navegar: um rascunho que sobrou de uma edição cancelada
 * seria de outro aluno, ou levaria o `retorno` de outra tarefa.
 */
export const rascunhoDeAluno = (aluno: Aluno, retorno?: Tela): RascunhoAluno => ({
  id: aluno.id,
  nome: aluno.name,
  disciplina: aluno.disciplina,
  dia: aluno.dia,
  hora: aluno.hora,
  telefone: aluno.telefone ?? '',
  retorno,
});

type Guardados = { [K in ChaveDeRascunho]?: MapaDeRascunhos[K] };

type Formularios = {
  rascunhos: Guardados;
  abrir: <K extends ChaveDeRascunho>(chave: K, inicial: MapaDeRascunhos[K]) => void;
  atualizar: <K extends ChaveDeRascunho>(
    chave: K,
    patch: Partial<MapaDeRascunhos[K]>,
  ) => void;
  substituir: <K extends ChaveDeRascunho>(chave: K, valor: MapaDeRascunhos[K]) => void;
  fechar: (chave: ChaveDeRascunho) => void;
  limparTudo: () => void;
};

export const useFormularios = create<Formularios>((set) => ({
  rascunhos: {},

  abrir(chave, inicial) {
    set((s) => ({ rascunhos: { ...s.rascunhos, [chave]: inicial } }));
  },

  atualizar(chave, patch) {
    set((s) => {
      const atual = s.rascunhos[chave];
      if (atual === undefined) return s;
      const proximo = Array.isArray(atual)
        ? patch
        : { ...(atual as object), ...(patch as object) };
      return { rascunhos: { ...s.rascunhos, [chave]: proximo } };
    });
  },

  substituir(chave, valor) {
    set((s) => ({ rascunhos: { ...s.rascunhos, [chave]: valor } }));
  },

  fechar(chave) {
    set((s) => {
      const proximo = { ...s.rascunhos };
      delete proximo[chave];
      return { rascunhos: proximo };
    });
  },

  limparTudo() {
    set({ rascunhos: {} });
  },
}));

/**
 * Lê e escreve um rascunho.
 *
 * O primeiro render devolve `inicial` (ainda não há nada no store) e o efeito
 * grava logo em seguida, então a tela nunca vê `undefined`. `inicial` é lido
 * uma vez só: mudá-lo depois não reabre o rascunho — é isso que faz o valor
 * sobreviver ao `voltar()` de um assistente.
 */
export function useRascunho<K extends ChaveDeRascunho>(
  chave: K,
  inicial: MapaDeRascunhos[K],
): [
  MapaDeRascunhos[K],
  (patch: Partial<MapaDeRascunhos[K]>) => void,
  (valor: MapaDeRascunhos[K]) => void,
  () => void,
] {
  const guardado = useFormularios((s) => s.rascunhos[chave]) as
    | MapaDeRascunhos[K]
    | undefined;
  const inicialRef = useRef(inicial);

  useEffect(() => {
    if (useFormularios.getState().rascunhos[chave] === undefined) {
      useFormularios.getState().abrir(chave, inicialRef.current);
    }
  }, [chave]);

  const atualizar = useCallback(
    (patch: Partial<MapaDeRascunhos[K]>) =>
      useFormularios.getState().atualizar(chave, patch),
    [chave],
  );

  const substituir = useCallback(
    (valor: MapaDeRascunhos[K]) => useFormularios.getState().substituir(chave, valor),
    [chave],
  );

  const fechar = useCallback(() => useFormularios.getState().fechar(chave), [chave]);

  return [guardado ?? inicialRef.current, atualizar, substituir, fechar];
}
