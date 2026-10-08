/**
 * Estado persistido do app: alunos, extratos e políticas.
 * Toda regra vem de src/dominio/politica.ts — aqui só há orquestração,
 * para a regra continuar testável sem UI.
 *
 * A gravação fica atrás de `dados/repositorio.ts`: cada ação calcula, faz
 * `set()`, devolve o resultado na hora e só então avisa o repositório, sem
 * esperar por ele. As telas dependem de a resposta vir no mesmo instante.
 */

import { create } from 'zustand';

import {
  repositorio,
  type Mudanca,
  type Persistido,
  type PreferenciasDeAviso,
} from '../dados/repositorio';
import { estadoInicial } from '../dados/semente';
import { hoje, somarDias } from '../dominio/datas';
import {
  estenderValidade as regraEstenderValidade,
  marcarReposicao as regraMarcarReposicao,
  registrarAula as regraRegistrarAula,
  registrarPagamento as regraRegistrarPagamento,
  saldo,
} from '../dominio/politica';
import { calcularPacote, type PacoteCalculado } from '../dominio/pacote';
import type {
  Aluno,
  BlocoSemanal,
  ConfigPacote,
  Desfecho,
  Disponibilidade,
  EfeitoRegistro,
  Extratos,
  Janela,
  Lancamento,
  MeioDePagamento,
  Perfil,
  Politicas,
  StatusDaProposta,
} from '../dominio/tipos';

/** Pacote padrão vendido pelo app (README: 8 aulas a R$ 80). */
const AULAS_DO_PACOTE = 8;
/** Dias somados pela ação "estender validade" na tela de reposição. */
const DIAS_DE_EXTENSAO = 15;

// O tipo mora com o contrato de persistência; o re-export mantém válido quem
// o importa daqui.
export type { PreferenciasDeAviso } from '../dados/repositorio';

export const AVISOS_PADRAO: PreferenciasDeAviso = {
  aulaDoDia: true,
  saldoBaixo: true,
  reposicaoPendente: true,
  pagamentoVencendo: false,
};

type Dados = Persistido & {
  carregado: boolean;

  carregar: () => Promise<void>;
  zerar: () => void;

  alunoPor: (id: string | null) => Aluno | undefined;

  registrarAula: (
    id: string,
    desfecho: Desfecho,
    avisoH: number,
  ) => EfeitoRegistro | null;
  marcarReposicao: (id: string, janela: { dia: string; hora: string }) => void;
  receberPagamento: (id: string) => void;
  estenderValidade: (id: string) => string | null;
  alternarPausa: (id: string) => boolean;
  enviarLembrete: (id: string) => void;
  cobrarTodosEmAtraso: () => number;
  criarPacote: (id: string) => string;
  renovarPacote: (id: string) => { saldo: number; validade: string };
  salvarPoliticas: (p: Politicas) => void;
  salvarPerfil: (p: Perfil) => void;
  salvarDisponibilidade: (d: Disponibilidade) => void;
  salvarPacotePadrao: (cfg: ConfigPacote) => void;
  salvarPreferenciasDeAviso: (p: PreferenciasDeAviso) => void;

  criarAluno: (dados: NovoAluno) => string;
  atualizarAluno: (id: string, patch: Partial<Aluno>) => void;
  arquivarAluno: (id: string) => void;
  criarPacoteCom: (id: string, cfg: ConfigPacote) => PacoteCalculado;
  registrarPagamentoCom: (id: string, meio: MeioDePagamento) => void;
  salvarDisponibilidadeDoAluno: (id: string, blocos: BlocoSemanal[]) => void;
  enviarProposta: (id: string, janela: { dia: string; hora: string }, alternativas: Janela[]) => void;
  /**
   * `janela` é a que o aluno tocou — a principal ou uma alternativa. Sem ela,
   * vale a janela principal da proposta.
   */
  responderProposta: (
    id: string,
    status: StatusDaProposta,
    janela?: { dia: string; hora: string },
  ) => void;
};

/** O que a tela de cadastro entrega. */
export interface NovoAluno {
  nome: string;
  disciplina: string;
  dia: string;
  hora: string;
  telefone?: string;
}

/** Toda ação que muda o que vai para o disco: o resto é campo, carga ou leitura. */
type AcaoQueGrava = Exclude<
  keyof Dados,
  keyof Persistido | 'carregado' | 'carregar' | 'zerar' | 'alunoPor'
>;
type Iguais<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Exige<T extends true> = T;
// Só existe para o typecheck: ele quebra aqui se uma ação nascer sem caso em
// `Mudanca`, ou se sobrar caso sem ação.
type TodaAcaoTemMudanca = Exige<Iguais<AcaoQueGrava, Mudanca['tipo']>>;

/**
 * Falha ao gravar, ler ou apagar: a decisão mora aqui, num lugar só.
 *
 * No modo local a tela segue como está. A memória é o que a pessoa vê, e
 * recarregar de um disco que acabou de falhar jogaria fora o que ela fez.
 * O erro deixou de ser engolido — chega até aqui e aparece no console em
 * desenvolvimento — mas ainda não vira aviso na tela: o texto do toast é de
 * `estado/avisos.ts`. Com o repositório remoto (Parte 4), é neste ponto que
 * entram a recarga e o toast previstos no plano.
 */
function aoFalharNaPersistencia(erro: unknown) {
  if (__DEV__) {
    console.warn('[dados] a persistência falhou; o app segue com o estado em memória.', erro);
  }
}

/** Nova validade a partir da política ativa — 0 dias significa sem prazo. */
function validadeDoPacote(p: Politicas): string {
  return p.validadeDias === 0 ? 'sem prazo' : somarDias(hoje(), p.validadeDias);
}

export const useDados = create<Dados>((set, get) => {
  /** Aplica uma transformação num aluno. Não muta o estado antigo. */
  const mutar = (id: string, fn: (a: Aluno) => Aluno) => {
    set((s) => ({ alunos: s.alunos.map((a) => (a.id === id ? fn({ ...a }) : a)) }));
  };

  /** Insere o lançamento no topo do extrato do aluno. */
  const lancar = (id: string, ev: Lancamento) => {
    set((s) => {
      const extratos: Extratos = { ...s.extratos, [id]: [ev, ...(s.extratos[id] ?? [])] };
      return { extratos };
    });
  };

  /**
   * Avisa o repositório do que mudou, uma vez por ação e depois de todos os
   * `set()`. Não espera: a ação já devolveu o resultado para a tela.
   */
  const persistir = (mudanca: Mudanca) => {
    repositorio.registrar(mudanca, get()).catch(aoFalharNaPersistencia);
  };

  /** O mesmo, para as mudanças que levam o aluno como ele ficou. */
  const persistirAluno = (id: string, montar: (aluno: Aluno) => Mudanca) => {
    const aluno = get().alunoPor(id);
    if (aluno) persistir(montar(aluno));
  };

  return {
    ...estadoInicial(),
    carregado: false,

    async carregar() {
      try {
        const gravado = await repositorio.carregar();
        // Espalhar sobre a semente, e não substituir campo a campo: o
        // estado persistido cresce a cada fase, e um payload gravado por
        // uma versão anterior deixaria os campos novos indefinidos.
        if (gravado) set({ ...estadoInicial(), ...gravado });
      } catch (erro) {
        // Estado corrompido ou ilegível: segue com a semente.
        aoFalharNaPersistencia(erro);
      }
      set({ carregado: true });
    },

    zerar() {
      repositorio.apagar().catch(aoFalharNaPersistencia);
      set({ ...estadoInicial() });
    },

    alunoPor(id) {
      if (!id) return undefined;
      return get().alunos.find((a) => a.id === id);
    },

    registrarAula(id, desfecho, avisoH) {
      const atual = get().alunoPor(id);
      if (!atual) return null;

      const { aluno, lancamento, efeito } = regraRegistrarAula(
        atual,
        desfecho,
        avisoH,
        get().politicas,
        hoje(),
      );
      mutar(id, () => aluno);
      lancar(id, lancamento);
      persistir({ tipo: 'registrarAula', aluno, lancamento, desfecho });
      return efeito;
    },

    marcarReposicao(id, janela) {
      const atual = get().alunoPor(id);
      if (!atual) return;
      const { aluno, lancamento } = regraMarcarReposicao(atual, janela, hoje());
      mutar(id, () => aluno);
      lancar(id, lancamento);
      persistir({ tipo: 'marcarReposicao', aluno, lancamento });
    },

    receberPagamento(id) {
      const atual = get().alunoPor(id);
      if (!atual) return;
      const { aluno, lancamento } = regraRegistrarPagamento(atual, hoje());
      mutar(id, () => aluno);
      lancar(id, lancamento);
      persistir({ tipo: 'receberPagamento', aluno, lancamento });
    },

    estenderValidade(id) {
      const atual = get().alunoPor(id);
      if (!atual || atual.validadeEstendida) return null;
      const nova = somarDias(atual.validade, DIAS_DE_EXTENSAO);
      const { aluno, lancamento } = regraEstenderValidade(atual, nova, hoje());
      mutar(id, () => aluno);
      lancar(id, lancamento);
      persistir({ tipo: 'estenderValidade', aluno, lancamento });
      return nova;
    },

    alternarPausa(id) {
      const atual = get().alunoPor(id);
      if (!atual) return false;
      const pausado = !atual.pausado;
      mutar(id, (a) => ({ ...a, pausado }));
      persistirAluno(id, (aluno) => ({ tipo: 'alternarPausa', aluno }));
      return pausado;
    },

    enviarLembrete(id) {
      mutar(id, (a) => ({
        ...a,
        lembretes: (a.lembretes ?? 0) + 1,
        ultimoLembrete: hoje(),
      }));
      persistirAluno(id, (aluno) => ({ tipo: 'enviarLembrete', aluno }));
    },

    cobrarTodosEmAtraso() {
      const emAtraso = get().alunos.filter((a) => a.pagamento.status === 'atraso');
      set((s) => {
        const ids = new Set(emAtraso.map((a) => a.id));
        const alunos = s.alunos.map((a) =>
          ids.has(a.id)
            ? { ...a, lembretes: (a.lembretes ?? 0) + 1, ultimoLembrete: hoje() }
            : a,
        );
        return { alunos };
      });
      if (emAtraso.length > 0) {
        const ids = new Set(emAtraso.map((a) => a.id));
        persistir({
          tipo: 'cobrarTodosEmAtraso',
          alunos: get().alunos.filter((a) => ids.has(a.id)),
        });
      }
      return emAtraso.length;
    },

    criarPacote(id) {
      const politicas = get().politicas;
      const validade = validadeDoPacote(politicas);
      mutar(id, (a) => ({
        ...a,
        semPacote: false,
        encerrado: undefined,
        total: AULAS_DO_PACOTE,
        usadas: 0,
        validade,
        validadeEstendida: false,
        pagamento: { status: 'aberto', vence: somarDias(hoje(), 7) },
      }));
      const lancamento: Lancamento = {
        d: hoje(),
        t: `Pacote de ${AULAS_DO_PACOTE} aulas`,
        s: `Validade ${validade} · aguardando pagamento`,
        delta: AULAS_DO_PACOTE,
        saldo: AULAS_DO_PACOTE,
      };
      lancar(id, lancamento);
      persistirAluno(id, (aluno) => ({ tipo: 'criarPacote', aluno, lancamento }));
      return validade;
    },

    renovarPacote(id) {
      const atual = get().alunoPor(id);
      const politicas = get().politicas;
      const validade = validadeDoPacote(politicas);
      const novoSaldo = (atual ? saldo(atual) : 0) + AULAS_DO_PACOTE;
      mutar(id, (a) => ({
        ...a,
        total: a.total + AULAS_DO_PACOTE,
        validade,
        validadeEstendida: false,
        pagamento: { status: 'aberto', vence: somarDias(hoje(), 7) },
      }));
      const lancamento: Lancamento = {
        d: hoje(),
        t: `Pacote de ${AULAS_DO_PACOTE} aulas`,
        s: `Renovação · validade ${validade}`,
        delta: AULAS_DO_PACOTE,
        saldo: novoSaldo,
      };
      lancar(id, lancamento);
      persistirAluno(id, (aluno) => ({ tipo: 'renovarPacote', aluno, lancamento }));
      return { saldo: novoSaldo, validade };
    },

    salvarPoliticas(p) {
      set({ politicas: p });
      persistir({ tipo: 'salvarPoliticas', politicas: p });
    },

    salvarPerfil(perfil) {
      set({ perfil });
      persistir({ tipo: 'salvarPerfil', perfil });
    },

    salvarDisponibilidade(disponibilidade) {
      set({ disponibilidade });
      persistir({ tipo: 'salvarDisponibilidade', disponibilidade });
    },

    salvarPacotePadrao(pacotePadrao) {
      set({ pacotePadrao });
      persistir({ tipo: 'salvarPacotePadrao', pacotePadrao });
    },

    salvarPreferenciasDeAviso(preferenciasDeAviso) {
      set({ preferenciasDeAviso });
      persistir({ tipo: 'salvarPreferenciasDeAviso', preferenciasDeAviso });
    },

    criarAluno(dados) {
      const id = `al${Date.now().toString(36)}`;
      const novo: Aluno = {
        id,
        name: dados.nome.trim(),
        disciplina: dados.disciplina,
        dia: dados.dia,
        hora: dados.hora,
        telefone: dados.telefone,
        hoje: false,
        total: 0,
        usadas: 0,
        validade: '',
        reposicoes: 0,
        semPacote: true,
        criadoEm: hoje(),
        pagamento: { status: 'sem' },
      };
      set((s) => ({ alunos: [...s.alunos, novo], extratos: { ...s.extratos, [id]: [] } }));
      persistir({ tipo: 'criarAluno', aluno: novo });
      return id;
    },

    atualizarAluno(id, patch) {
      mutar(id, (a) => ({ ...a, ...patch }));
      persistirAluno(id, (aluno) => ({ tipo: 'atualizarAluno', aluno }));
    },

    arquivarAluno(id) {
      mutar(id, (a) => ({ ...a, arquivado: true }));
      persistirAluno(id, (aluno) => ({ tipo: 'arquivarAluno', aluno }));
    },

    criarPacoteCom(id, cfg) {
      const atual = get().alunoPor(id);
      const anterior = atual ? saldo(atual) : 0;
      const calculado = calcularPacote(cfg, anterior, hoje());

      mutar(id, (a) => ({
        ...a,
        semPacote: false,
        encerrado: undefined,
        total: calculado.total,
        usadas: 0,
        valorPorAula: cfg.valorPorAula,
        validade: calculado.validade,
        validadeEstendida: false,
        pagamento: { status: 'aberto', vence: calculado.vence },
      }));

      const lancamento: Lancamento = {
        d: hoje(),
        t: `Pacote de ${cfg.aulas} aulas`,
        s: cfg.somarSaldo && anterior > 0
          ? `Renovação · somou ${anterior} do pacote anterior · validade ${calculado.validade}`
          : `Validade ${calculado.validade} · aguardando pagamento`,
        delta: cfg.aulas,
        saldo: calculado.saldoFinal,
      };
      lancar(id, lancamento);
      persistirAluno(id, (aluno) => ({ tipo: 'criarPacoteCom', aluno, lancamento }));

      return calculado;
    },

    registrarPagamentoCom(id, meio) {
      const atual = get().alunoPor(id);
      if (!atual) return;
      const { aluno, lancamento } = regraRegistrarPagamento(atual, hoje(), meio);
      mutar(id, () => aluno);
      lancar(id, lancamento);
      persistir({ tipo: 'registrarPagamentoCom', aluno, lancamento });
    },

    salvarDisponibilidadeDoAluno(id, blocos) {
      mutar(id, (a) => ({ ...a, disponibilidade: blocos }));
      persistirAluno(id, (aluno) => ({ tipo: 'salvarDisponibilidadeDoAluno', aluno }));
    },

    enviarProposta(id, janela, alternativas) {
      mutar(id, (a) => ({
        ...a,
        proposta: { janela, enviadaEm: hoje(), status: 'enviada', alternativas },
      }));
      const lancamento: Lancamento = {
        d: hoje(),
        t: 'Proposta de reposição enviada',
        s: `${janela.dia}, ${janela.hora} · aguardando resposta`,
        delta: 0,
        saldo: saldo(get().alunoPor(id) ?? ({ total: 0, usadas: 0 } as Aluno)),
      };
      lancar(id, lancamento);
      persistirAluno(id, (aluno) => ({ tipo: 'enviarProposta', aluno, lancamento }));
    },

    responderProposta(id, status, escolhida) {
      const atual = get().alunoPor(id);
      if (!atual?.proposta) return;
      const janela = escolhida ?? atual.proposta.janela;

      if (status === 'recusada') {
        mutar(id, (a) => ({
          ...a,
          proposta: a.proposta ? { ...a.proposta, status } : null,
        }));
        persistirAluno(id, (aluno) => ({
          tipo: 'responderProposta',
          aluno,
          lancamento: null,
          status,
        }));
        return;
      }

      // Aceita ou confirmada pelo professor: vira reposição marcada de fato.
      const { aluno, lancamento } = regraMarcarReposicao(atual, janela, hoje());
      mutar(id, () => ({ ...aluno, proposta: null }));
      lancar(id, lancamento);
      persistirAluno(id, (marcado) => ({
        tipo: 'responderProposta',
        aluno: marcado,
        lancamento,
        status,
      }));
    },
  };
});

// Os textos de toast moram em ./avisos.ts. O re-export mantém os imports
// existentes (`import { avisos, useDados } from '../estado/dados'`) válidos.
export { avisos } from './avisos';
