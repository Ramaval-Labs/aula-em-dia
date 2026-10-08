/**
 * Fronteira de persistência (Parte 1 do backend).
 *
 * A store (`estado/dados.ts`) só conhece esta interface: calcula com o
 * `dominio/`, faz `set()`, devolve o resultado na hora e depois avisa o
 * repositório do que mudou. Trocar o disco do aparelho pelo Supabase é trocar
 * a implementação escolhida no fim deste arquivo, sem tocar em tela nenhuma.
 *
 * `Mudanca` tem um caso por ação da store que grava, com o mesmo nome da ação
 * (Apêndice A de docs/backend/PLANO-BACKEND.md). O repositório local ignora o
 * caso e grava o estado inteiro; o remoto vai gravar só o que o caso traz.
 */

import type {
  Aluno,
  ConfigPacote,
  Desfecho,
  Disponibilidade,
  Lancamento,
  Perfil,
  Politicas,
  StatusDaProposta,
} from '../dominio/tipos';
import { repositorioLocal } from './adaptador';
import type { EstadoPersistivel } from './semente';

/**
 * Preferências da tela "Avisos e lembretes". Só a escolha fica salva — nada é
 * enviado nesta versão, e a tela diz isso.
 */
export interface PreferenciasDeAviso {
  aulaDoDia: boolean;
  saldoBaixo: boolean;
  reposicaoPendente: boolean;
  pagamentoVencendo: boolean;
}

/** O estado que vai para o disco. */
export interface Persistido extends EstadoPersistivel {
  /** opcionais: entraram depois da v4 e não existem em estado gravado antes */
  pacotePadrao?: ConfigPacote;
  preferenciasDeAviso?: PreferenciasDeAviso;
}

/**
 * O que volta do disco. Um payload gravado por uma versão anterior pode não
 * ter os campos mais novos: a store espalha isto sobre a semente.
 */
export type Gravado = Partial<Persistido> & Pick<Persistido, 'alunos' | 'extratos' | 'politicas'>;

/** Aluno e lançamento juntos: no banco, uma transação só (Parte 5). */
type Movimento<Acao extends string> = { tipo: Acao; aluno: Aluno; lancamento: Lancamento };
/** Só a linha do aluno muda (Parte 4). */
type DoAluno<Acao extends string> = { tipo: Acao; aluno: Aluno };

export type Mudanca =
  // O desfecho vai junto porque é dele que sai o tipo do lançamento no banco.
  | (Movimento<'registrarAula'> & { desfecho: Desfecho })
  | Movimento<'marcarReposicao'>
  | Movimento<'receberPagamento'>
  | Movimento<'registrarPagamentoCom'>
  | Movimento<'estenderValidade'>
  | Movimento<'criarPacote'>
  | Movimento<'renovarPacote'>
  | Movimento<'criarPacoteCom'>
  | Movimento<'enviarProposta'>
  // Recusada não gera lançamento; aceita ou confirmada vira reposição marcada.
  | {
      tipo: 'responderProposta';
      aluno: Aluno;
      lancamento: Lancamento | null;
      status: StatusDaProposta;
    }
  | DoAluno<'alternarPausa'>
  | DoAluno<'enviarLembrete'>
  | DoAluno<'criarAluno'>
  | DoAluno<'atualizarAluno'>
  | DoAluno<'arquivarAluno'>
  | DoAluno<'salvarDisponibilidadeDoAluno'>
  | { tipo: 'cobrarTodosEmAtraso'; alunos: Aluno[] }
  | { tipo: 'salvarPoliticas'; politicas: Politicas }
  | { tipo: 'salvarPerfil'; perfil: Perfil }
  | { tipo: 'salvarDisponibilidade'; disponibilidade: Disponibilidade }
  | { tipo: 'salvarPacotePadrao'; pacotePadrao: ConfigPacote }
  | { tipo: 'salvarPreferenciasDeAviso'; preferenciasDeAviso: PreferenciasDeAviso };

export interface Repositorio {
  /** O que está gravado, ou `null` quando não há nada que se reconheça. */
  carregar(): Promise<Gravado | null>;
  /**
   * Chamado depois de cada ação, com o que mudou e o estado como ficou.
   * Rejeita quando não consegue gravar: quem decide o que fazer é a store.
   */
  registrar(mudanca: Mudanca, estado: Persistido): Promise<void>;
  /** "Zerar dados de demonstração": só faz sentido no modo local. */
  apagar(): Promise<void>;
}

export type Backend = 'local' | 'supabase';

/** `supabase` entra aqui na Parte 4. */
const IMPLEMENTACOES: Partial<Record<Backend, Repositorio>> = {
  local: repositorioLocal,
};

/**
 * `EXPO_PUBLIC_BACKEND` escolhe a implementação, e `local` é o padrão. Um
 * valor sem implementação cai no local: o app continua sendo o de hoje.
 */
export function escolherRepositorio(
  backend: string | undefined = process.env.EXPO_PUBLIC_BACKEND,
): Repositorio {
  const escolhido = IMPLEMENTACOES[backend as Backend];
  if (escolhido) return escolhido;
  if (backend && __DEV__) {
    console.warn(`EXPO_PUBLIC_BACKEND="${backend}" ainda não tem repositório; usando o local.`);
  }
  return repositorioLocal;
}

export const repositorio: Repositorio = escolherRepositorio();
