/**
 * Aula em Dia — regras de negócio como módulo puro.
 * Porte de spec/politica.ts: sem UI, sem storage, sem rede.
 * Cobertura em src/dominio/__tests__/politica.test.ts (spec/casos-de-teste.md).
 */

import { diasEntre, hoje as hojeDoApp } from './datas';
import { dinheiro } from './formato';
import type {
  Aluno,
  Desfecho,
  MeioDePagamento,
  EfeitoRegistro,
  Faixa,
  Filtro,
  Janela,
  Lancamento,
  Pagamento,
  Politicas,
} from './tipos';

export const VALOR_AULA = 80;
export const SALDO_BAIXO = 2;

export const POLITICAS_PADRAO: Politicas = {
  avisoHoras: 24,
  avisadaDevolve: true,
  limiteReposicoes: 3,
  validadeDias: 60,
};

/**
 * O teto do seletor "Reposições por pacote" (SCRUM-101: era 5). Zero continua
 * sendo "sem limite"; 30 cobre qualquer pacote real, e o banco só exige >= 0.
 */
export const LIMITE_MAXIMO_DE_REPOSICOES = 30;

export const saldo = (a: Aluno): number => Math.max(0, a.total - a.usadas);

/**
 * O valor do pacote: as aulas **compradas** vezes o preço. A renovação que
 * soma o saldo anterior aumenta o `total`, mas as aulas herdadas já foram
 * pagas no pacote de antes (SCRUM-101: eram cobradas de novo).
 */
export const valorPacote = (a: Aluno): number =>
  (a.aulasCompradas ?? a.total) * (a.valorPorAula ?? VALOR_AULA);

/**
 * O aluno com `aulasCompradas` refeito pelo extrato: o lançamento de pacote
 * mais recente ("Pacote de 8 aulas") diz quantas foram compradas. Só fica o
 * campo quando o total tem mais aulas que isso (houve saldo somado).
 */
export function comAulasCompradas(a: Aluno, extrato: Lancamento[]): Aluno {
  const ultimo = extrato.find((e) => /^Pacote de \d+ aulas$/.test(e.t));
  const compradas = ultimo ? Number(/\d+/.exec(ultimo.t)?.[0]) : NaN;
  const { aulasCompradas: _antes, ...sem } = a;
  if (Number.isFinite(compradas) && compradas > 0 && compradas < a.total) {
    return a.aulasCompradas === compradas ? a : { ...sem, aulasCompradas: compradas };
  }
  return a.aulasCompradas === undefined ? a : sem;
}

export const temPacote = (a: Aluno): boolean => !a.semPacote && a.total > 0;

export const saldoBaixo = (a: Aluno): boolean => temPacote(a) && saldo(a) <= SALDO_BAIXO;

export const podeRepor = (a: Aluno, p: Politicas): boolean =>
  p.limiteReposicoes === 0 || a.reposicoes < p.limiteReposicoes;

export const podeRegistrar = (a: Aluno): boolean => temPacote(a) && !a.pausado;

/** Tem pacote e não sobrou aula nele: registrar aula debitaria o que ele não tem. */
export const semSaldo = (a: Aluno): boolean => temPacote(a) && saldo(a) === 0;

/** O título do lançamento do cancelamento do professor. */
export const ROTULO_CANCELAMENTO = 'Aula cancelada por você';

/**
 * Núcleo da regra: o que cada desfecho faz, dada a política e a antecedência
 * do aviso. Com o aluno, o limite de reposições entra na conta (SCRUM-101):
 * esgotado, a falta avisada no prazo debita, como a Política e a frase que o
 * aluno lê prometem. Sem o aluno, a resposta é a de quem ainda tem reposição.
 */
export function efeito(
  desfecho: Desfecho,
  avisoH: number,
  p: Politicas,
  a?: Aluno,
): EfeitoRegistro {
  if (desfecho === 'realizada') {
    return {
      delta: -1,
      nota: 'Aula usada normalmente',
      reposicao: false,
      rotulo: 'Aula realizada',
      detalhe: 'Aula do pacote',
    };
  }

  if (desfecho === 'avisada') {
    if (!p.avisadaDevolve) {
      return {
        delta: -1,
        nota: 'Sua política não devolve a aula em falta avisada',
        reposicao: false,
        rotulo: 'Falta avisada',
        detalhe: `Aviso com ${avisoH}h · política não devolve`,
      };
    }
    const emPrazo = avisoH >= p.avisoHoras;
    if (emPrazo && a && !podeRepor(a, p)) {
      return {
        delta: -1,
        nota:
          p.limiteReposicoes === 1
            ? 'Aviso no prazo, mas a reposição do pacote já foi usada'
            : `Aviso no prazo, mas as ${p.limiteReposicoes} reposições do pacote já foram usadas`,
        reposicao: false,
        rotulo: 'Falta avisada',
        detalhe: `Aviso com ${avisoH}h · limite de reposições atingido`,
      };
    }
    return emPrazo
      ? {
          delta: 0,
          nota: `Aviso com ${avisoH}h, dentro do mínimo de ${p.avisoHoras}h`,
          reposicao: true,
          rotulo: 'Falta avisada',
          detalhe: `Aviso com ${avisoH}h · reposição gerada`,
        }
      : {
          delta: -1,
          nota: `Aviso com ${avisoH}h, abaixo do mínimo de ${p.avisoHoras}h`,
          reposicao: false,
          rotulo: 'Falta avisada',
          detalhe: `Aviso com ${avisoH}h · fora do prazo`,
        };
  }

  if (desfecho === 'sem_aviso') {
    return {
      delta: -1,
      nota: 'Falta sem aviso debita a aula',
      reposicao: false,
      rotulo: 'Falta sem aviso',
      detalhe: 'Política: debita a aula',
    };
  }

  return {
    delta: 0,
    nota: 'Você cancelou, então a reposição é obrigatória',
    reposicao: true,
    doProfessor: true,
    rotulo: ROTULO_CANCELAMENTO,
    detalhe: 'Cancelamento seu · reposição obrigatória',
  };
}

/**
 * A reposição que **este** registro cria: a regra quer reposição e o aluno
 * ainda tem direito a ela no pacote — ou a reposição é do professor, que não
 * depende do limite (SCRUM-101). É a mesma condição que `registrarAula`
 * aplica; existe à parte porque a tela de Resultado precisa saber se a
 * pendência que ela vê nasceu agora ou já existia antes.
 */
export function geraReposicao(a: Aluno, ef: EfeitoRegistro, p: Politicas): boolean {
  return ef.reposicao && (!!ef.doProfessor || podeRepor(a, p));
}

/**
 * Se a reposição pendente nasceu de um cancelamento do professor: o
 * lançamento do dia da pendência é o do cancelamento. Essa reposição não
 * conta no limite do aluno (SCRUM-101).
 */
export function pendenciaDoProfessor(a: Aluno, extrato: Lancamento[]): boolean {
  const origem = a.pendencia?.origem;
  return !!origem && extrato.some((e) => e.d === origem && e.t === ROTULO_CANCELAMENTO);
}

/** Aplica o registro: retorna aluno novo e lançamento. Não muta a entrada. */
export function registrarAula(
  a: Aluno,
  desfecho: Desfecho,
  avisoH: number,
  p: Politicas,
  hoje: string,
): { aluno: Aluno; lancamento: Lancamento; efeito: EfeitoRegistro } {
  const ef = efeito(desfecho, avisoH, p, a);
  const novoSaldo = Math.max(0, saldo(a) + ef.delta);
  const aluno: Aluno = { ...a };
  if (ef.delta < 0) aluno.usadas = a.usadas + 1;
  if (geraReposicao(aluno, ef, p)) aluno.pendencia = { origem: hoje, dias: 0 };
  // O registro do dia da reposição marcada é o dela: qualquer desfecho a
  // resolve, e a aula dada vira "Reposição realizada" no extrato (SCRUM-101).
  const daReposicao = reposicaoHoje(a, hoje);
  if (daReposicao) aluno.agendada = null;
  const titulo = daReposicao && desfecho === 'realizada' ? 'Reposição realizada' : ef.rotulo;
  const base = daReposicao && desfecho === 'realizada' ? 'Reposição marcada para hoje' : ef.detalhe;
  // Debitar com o saldo zerado não tem de onde tirar: o extrato registra, para
  // a aula dada sem crédito não sumir (SCRUM-101).
  const detalhe = ef.delta < 0 && semSaldo(a) ? `${base} · sem saldo no pacote` : base;
  return {
    aluno,
    lancamento: { d: hoje, t: titulo, s: detalhe, delta: ef.delta, saldo: novoSaldo },
    efeito: ef,
  };
}

/**
 * Marca a reposição: consome uma reposição, limpa a pendência, agenda e fecha
 * a proposta que estivesse aberta — marcada a aula, não há mais o que propor.
 * A reposição de um cancelamento do professor não consome o limite do aluno
 * (`contaNoLimite: false`, decidido por `pendenciaDoProfessor`).
 */
export function marcarReposicao(
  a: Aluno,
  janela: { dia: string; hora: string },
  hoje: string,
  contaNoLimite = true,
): { aluno: Aluno; lancamento: Lancamento } {
  const aluno: Aluno = {
    ...a,
    reposicoes: a.reposicoes + (contaNoLimite ? 1 : 0),
    pendencia: null,
    agendada: { dia: janela.dia, hora: janela.hora },
    proposta: null,
  };
  return {
    aluno,
    lancamento: {
      d: hoje,
      t: 'Reposição marcada',
      s: `${janela.dia}, ${janela.hora}`,
      delta: 0,
      saldo: saldo(a),
    },
  };
}

export function registrarPagamento(
  a: Aluno,
  hoje: string,
  /** Parâmetro com padrão, e não campo novo: o pagamento continua `{status, em, meio}`. */
  meio: MeioDePagamento = 'Pix',
): { aluno: Aluno; lancamento: Lancamento } {
  const aluno: Aluno = {
    ...a,
    pagamento: { status: 'pago', em: hoje, meio },
    pausado: false,
  };
  return {
    aluno,
    lancamento: {
      d: hoje,
      t: 'Pagamento recebido',
      s: `${dinheiro(valorPacote(a))} · ${meio}`,
      delta: 0,
      saldo: saldo(a),
      dinheiro: true,
    },
  };
}

export function estenderValidade(
  a: Aluno,
  novaValidade: string,
  hoje: string,
): { aluno: Aluno; lancamento: Lancamento } {
  const aluno: Aluno = { ...a, validade: novaValidade, validadeEstendida: true };
  return {
    aluno,
    lancamento: {
      d: hoje,
      t: 'Validade estendida',
      s: `De ${a.validade} para ${novaValidade} · 15 dias`,
      delta: 0,
      saldo: saldo(a),
    },
  };
}

/** Peso de urgência: menor vem primeiro. */
export function pesoUrgencia(a: Aluno): 0 | 1 | 2 | 3 {
  if (a.pagamento?.status === 'atraso') return 0;
  if (a.pendencia) return 1;
  if (a.semPacote) return 3;
  return 2;
}

export function ordenar(alunos: Aluno[], filtro: Filtro): Aluno[] {
  const c = [...alunos];
  if (filtro === 'A–Z') return c.sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
  if (filtro === 'Hoje') return c.filter((a) => a.hoje);
  return c.sort((x, y) => pesoUrgencia(x) - pesoUrgencia(y) || saldo(x) - saldo(y));
}

/** Faltando isso ou menos para a validade, com aula sobrando, o pacote avisa. */
export const DIAS_PARA_AVISAR_VALIDADE = 7;

/** A data (dd/mm) da reposição marcada: o fim do rótulo "Terça, 10/11". */
export function dataDaReposicao(a: Aluno): string | null {
  if (!a.agendada) return null;
  return /(\d{2}\/\d{2})\s*$/.exec(a.agendada.dia)?.[1] ?? null;
}

/** A reposição marcada é hoje: o registro de hoje é o dela (SCRUM-101). */
export const reposicaoHoje = (a: Aluno, hoje: string): boolean => dataDaReposicao(a) === hoje;

/** Dias que faltam para a validade do pacote; `null` sem pacote ou sem prazo. */
export function diasParaVencer(a: Aluno, hoje: string): number | null {
  if (!temPacote(a) || !/^\d{2}\/\d{2}$/.test(a.validade ?? '')) return null;
  return diasEntre(hoje, a.validade);
}

/** Uma faixa só, nesta precedência. `hoje` entra para a reposição e a validade. */
export function faixaStatus(a: Aluno, hoje: string = hojeDoApp()): Faixa | null {
  if (a.pausado) {
    return { tipo: 'pausado', texto: 'Aulas pausadas', sufixo: 'até regularizar' };
  }
  if (a.pagamento?.status === 'atraso') {
    return {
      tipo: 'atraso',
      texto: 'Pagamento em atraso',
      sufixo: `${a.pagamento.dias} dias`,
    };
  }
  if (a.pendencia) {
    return {
      tipo: 'pendente',
      texto: 'Reposição pendente',
      sufixo: a.pendencia.dias > 0 ? `há ${a.pendencia.dias} dias` : 'hoje',
    };
  }
  // A reposição marcada cujo dia passou sem registro: ela não aconteceu, ou
  // aconteceu e ninguém registrou. Nos dois casos, é pendência (SCRUM-101).
  const marcadaEm = dataDaReposicao(a);
  const passou = marcadaEm ? diasEntre(marcadaEm, hoje) : null;
  if (a.agendada && marcadaEm && passou !== null && passou > 0) {
    return { tipo: 'pendente', texto: `Reposição de ${marcadaEm}`, sufixo: 'sem registro' };
  }
  // Pacote com aula sobrando perto de vencer, ou já vencido (SCRUM-101).
  const faltam = diasParaVencer(a, hoje);
  if (faltam !== null && saldo(a) > 0) {
    if (faltam < 0) return { tipo: 'vencido', texto: 'Pacote venceu', sufixo: `em ${a.validade}` };
    if (faltam <= DIAS_PARA_AVISAR_VALIDADE) {
      return {
        tipo: 'vencendo',
        texto: 'Pacote vence',
        sufixo: faltam === 0 ? 'hoje' : faltam === 1 ? 'amanhã' : `em ${faltam} dias`,
      };
    }
  }
  if (a.agendada) {
    return {
      tipo: 'marcada',
      texto: 'Reposição marcada',
      sufixo: `${a.agendada.dia.replace(/^\S+,\s*/, '')} · ${a.agendada.hora}`,
    };
  }
  return null;
}

/**
 * O pagamento como ele está hoje (SCRUM-101). O pacote nasce "aberto" com
 * vencimento, e nada o passava para "atraso" quando a data chegava: para o
 * professor de verdade, ninguém nunca atrasava. Aberto com o vencimento já
 * passado é atraso, com os dias contados desde o vencimento. O resto fica
 * como está.
 */
export function pagamentoNaData(pg: Pagamento, hoje: string): Pagamento {
  if (pg.status !== 'aberto' || !pg.vence) return pg;
  const dias = diasEntre(pg.vence, hoje);
  if (dias === null || dias <= 0) return pg;
  const { vence, ...resto } = pg;
  return { ...resto, status: 'atraso', venceu: vence, dias };
}

/** O aluno com o pagamento lido na data: o mesmo objeto quando nada muda. */
export function comPagamentoNaData(a: Aluno, hoje: string): Aluno {
  if (!a.pagamento) return a;
  const pagamento = pagamentoNaData(a.pagamento, hoje);
  return pagamento === a.pagamento ? a : { ...a, pagamento };
}

/** Totais do financeiro. Alunos sem pacote não entram em nenhum total. */
export function totaisFinanceiro(alunos: Aluno[]) {
  const soma = (f: (a: Aluno) => boolean) =>
    alunos.filter((a) => temPacote(a) && f(a)).reduce((t, a) => t + valorPacote(a), 0);
  return {
    aReceber: soma((a) => a.pagamento.status === 'aberto'),
    recebido: soma((a) => a.pagamento.status === 'pago'),
    emAtraso: soma((a) => a.pagamento.status === 'atraso'),
  };
}

/**
 * Janelas oferecidas ao aluno. A quarta só existe quando a validade
 * do pacote foi estendida — é o que justifica a extensão na tela.
 */
export function janelasDisponiveis(
  a: Aluno | null | undefined,
  base: Janela[],
  extra: Janela,
): Janela[] {
  return a?.validadeEstendida ? [...base, extra] : base;
}
