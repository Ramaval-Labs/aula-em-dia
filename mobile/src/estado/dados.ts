/**
 * Estado persistido do app: alunos, extratos e políticas.
 * Toda regra vem de src/dominio/politica.ts — aqui só há orquestração
 * e gravação em disco, para a regra continuar testável sem UI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { CHAVE_ESTADO } from '../dados/armazenamento';
import { estadoInicial } from '../dados/semente';
import { hoje, somarDias } from '../dominio/datas';
import { dinheiro, primeiroNome } from '../dominio/formato';
import {
  estenderValidade as regraEstenderValidade,
  marcarReposicao as regraMarcarReposicao,
  registrarAula as regraRegistrarAula,
  registrarPagamento as regraRegistrarPagamento,
  saldo,
  valorPacote,
} from '../dominio/politica';
import type {
  Aluno,
  Desfecho,
  EfeitoRegistro,
  Extratos,
  Lancamento,
  Politicas,
} from '../dominio/tipos';

/** Pacote padrão vendido pelo app (README: 8 aulas a R$ 80). */
const AULAS_DO_PACOTE = 8;
/** Dias somados pela ação "estender validade" na tela de reposição. */
const DIAS_DE_EXTENSAO = 15;

type Persistido = {
  alunos: Aluno[];
  extratos: Extratos;
  politicas: Politicas;
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
};

function gravar(estado: Persistido) {
  const bruto = JSON.stringify({
    alunos: estado.alunos,
    extratos: estado.extratos,
    politicas: estado.politicas,
  });
  AsyncStorage.setItem(CHAVE_ESTADO, bruto).catch(() => {
    // Persistência é conveniência: falhar aqui não pode derrubar a tela.
  });
}

/** Nova validade a partir da política ativa — 0 dias significa sem prazo. */
function validadeDoPacote(p: Politicas): string {
  return p.validadeDias === 0 ? 'sem prazo' : somarDias(hoje(), p.validadeDias);
}

export const useDados = create<Dados>((set, get) => {
  /** Aplica uma transformação num aluno e persiste. Não muta o estado antigo. */
  const mutar = (id: string, fn: (a: Aluno) => Aluno) => {
    set((s) => {
      const proximo = { ...s, alunos: s.alunos.map((a) => (a.id === id ? fn({ ...a }) : a)) };
      gravar(proximo);
      return { alunos: proximo.alunos };
    });
  };

  /** Insere o lançamento no topo do extrato do aluno. */
  const lancar = (id: string, ev: Lancamento) => {
    set((s) => {
      const extratos: Extratos = { ...s.extratos, [id]: [ev, ...(s.extratos[id] ?? [])] };
      gravar({ ...s, extratos });
      return { extratos };
    });
  };

  return {
    ...estadoInicial(),
    carregado: false,

    async carregar() {
      try {
        const bruto = await AsyncStorage.getItem(CHAVE_ESTADO);
        if (bruto) {
          const d = JSON.parse(bruto) as Partial<Persistido>;
          if (d && Array.isArray(d.alunos) && d.extratos && d.politicas) {
            set({ alunos: d.alunos, extratos: d.extratos, politicas: d.politicas });
          }
        }
      } catch {
        // Estado corrompido ou ausente: segue com a semente.
      }
      set({ carregado: true });
    },

    zerar() {
      AsyncStorage.removeItem(CHAVE_ESTADO).catch(() => {});
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
      return efeito;
    },

    marcarReposicao(id, janela) {
      const atual = get().alunoPor(id);
      if (!atual) return;
      const { aluno, lancamento } = regraMarcarReposicao(atual, janela, hoje());
      mutar(id, () => aluno);
      lancar(id, lancamento);
    },

    receberPagamento(id) {
      const atual = get().alunoPor(id);
      if (!atual) return;
      const { aluno, lancamento } = regraRegistrarPagamento(atual, hoje());
      mutar(id, () => aluno);
      lancar(id, lancamento);
    },

    estenderValidade(id) {
      const atual = get().alunoPor(id);
      if (!atual || atual.validadeEstendida) return null;
      const nova = somarDias(atual.validade, DIAS_DE_EXTENSAO);
      const { aluno, lancamento } = regraEstenderValidade(atual, nova, hoje());
      mutar(id, () => aluno);
      lancar(id, lancamento);
      return nova;
    },

    alternarPausa(id) {
      const atual = get().alunoPor(id);
      if (!atual) return false;
      const pausado = !atual.pausado;
      mutar(id, (a) => ({ ...a, pausado }));
      return pausado;
    },

    enviarLembrete(id) {
      mutar(id, (a) => ({
        ...a,
        lembretes: (a.lembretes ?? 0) + 1,
        ultimoLembrete: hoje(),
      }));
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
        gravar({ ...s, alunos });
        return { alunos };
      });
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
      lancar(id, {
        d: hoje(),
        t: `Pacote de ${AULAS_DO_PACOTE} aulas`,
        s: `Validade ${validade} · aguardando pagamento`,
        delta: AULAS_DO_PACOTE,
        saldo: AULAS_DO_PACOTE,
      });
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
      lancar(id, {
        d: hoje(),
        t: `Pacote de ${AULAS_DO_PACOTE} aulas`,
        s: `Renovação · validade ${validade}`,
        delta: AULAS_DO_PACOTE,
        saldo: novoSaldo,
      });
      return { saldo: novoSaldo, validade };
    },

    salvarPoliticas(p) {
      set((s) => {
        const proximo = { ...s, politicas: p };
        gravar(proximo);
        return { politicas: p };
      });
    },
  };
});

/** Textos de toast que dependem do domínio, num lugar só. */
export const avisos = {
  reposicao: (a: Aluno, janela: { dia: string; hora: string }) =>
    `Reposição de ${primeiroNome(a.name)} em ${janela.dia}, ${janela.hora}. Mensagem enviada.`,
  pagamento: (a: Aluno) =>
    `Pagamento de ${primeiroNome(a.name)} registrado: ${dinheiro(valorPacote(a))}.`,
  lembrete: (a: Aluno) =>
    `Lembrete enviado para ${primeiroNome(a.name)} com a chave Pix.`,
  lembreteEmLote: (n: number) =>
    `Lembrete enviado para ${n} ${n > 1 ? 'alunos' : 'aluno'} com a chave Pix.`,
  pausa: (a: Aluno, pausado: boolean) =>
    `Aulas de ${primeiroNome(a.name)} ${pausado ? 'pausadas' : 'retomadas'}.`,
  validade: (nova: string) =>
    `Validade agora vai até ${nova}. Um horário novo entrou na lista.`,
  politicaSalva: 'Política salva. O registro de aula já usa a regra nova.',
  estadoZerado: 'Dados de demonstração restaurados.',
};
