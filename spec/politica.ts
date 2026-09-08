/**
 * Aula em Dia — regras de negócio como módulo puro.
 * Referência a portar: sem dependência de UI, framework ou storage.
 * Cobertura esperada em spec/casos-de-teste.md.
 */

export const VALOR_AULA = 80;
export const SALDO_BAIXO = 2;

export type Desfecho = 'realizada' | 'avisada' | 'sem_aviso' | 'cancelada_professor';

export interface Politicas {
  /** antecedência mínima do aviso, em horas */
  avisoHoras: number;
  /** se true, falta avisada dentro do prazo não debita a aula */
  avisadaDevolve: boolean;
  /** 0 = sem limite */
  limiteReposicoes: number;
  /** validade padrão do pacote, em dias */
  validadeDias: number;
}

export const POLITICAS_PADRAO: Politicas = {
  avisoHoras: 24,
  avisadaDevolve: true,
  limiteReposicoes: 3,
  validadeDias: 60,
};

export type StatusPagamento = 'pago' | 'aberto' | 'atraso' | 'sem';

export interface Pagamento {
  status: StatusPagamento;
  em?: string;      // pago em dd/mm
  meio?: string;    // 'Pix'
  vence?: string;   // aberto: vence em dd/mm
  venceu?: string;  // atraso: venceu em dd/mm
  dias?: number;    // atraso: dias corridos
}

export interface Aluno {
  id: string;
  name: string;
  disciplina: string;
  dia: string;
  hora: string;
  hoje: boolean;
  total: number;   // aulas do pacote
  usadas: number;
  validade: string;
  validadeEstendida?: boolean;
  reposicoes: number;
  pendencia?: { origem: string; dias: number } | null;
  agendada?: { dia: string; hora: string } | null;
  pausado?: boolean;
  semPacote?: boolean;
  encerrado?: string;
  lembretes?: number;
  ultimoLembrete?: string;
  atrasosHistoricos?: number;
  pagamento: Pagamento;
}

export interface Lancamento {
  d: string;        // dd/mm
  t: string;        // título
  s: string;        // subtítulo
  delta: number;    // efeito no saldo
  saldo: number;    // saldo após o lançamento
  dinheiro?: boolean;
}

export interface EfeitoRegistro {
  delta: number;        // -1 debita, 0 não debita
  nota: string;         // explicação mostrada na tela de registro
  reposicao: boolean;   // gera pendência de reposição
  rotulo: string;       // título do lançamento no extrato
  detalhe: string;      // subtítulo do lançamento
}

export const saldo = (a: Aluno): number => Math.max(0, a.total - a.usadas);
export const valorPacote = (a: Aluno): number => a.total * VALOR_AULA;
export const temPacote = (a: Aluno): boolean => !a.semPacote && a.total > 0;
export const saldoBaixo = (a: Aluno): boolean => temPacote(a) && saldo(a) <= SALDO_BAIXO;

export const podeRepor = (a: Aluno, p: Politicas): boolean =>
  p.limiteReposicoes === 0 || a.reposicoes < p.limiteReposicoes;

export const podeRegistrar = (a: Aluno): boolean => temPacote(a) && !a.pausado;

export const dinheiro = (n: number): string =>
  'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Núcleo da regra: o que cada desfecho faz, dada a política e a antecedência do aviso. */
export function efeito(desfecho: Desfecho, avisoH: number, p: Politicas): EfeitoRegistro {
  if (desfecho === 'realizada') {
    return { delta: -1, nota: 'Aula usada normalmente', reposicao: false,
             rotulo: 'Aula realizada', detalhe: 'Aula do pacote' };
  }
  if (desfecho === 'avisada') {
    if (!p.avisadaDevolve) {
      return { delta: -1, nota: 'Sua política não devolve a aula em falta avisada', reposicao: false,
               rotulo: 'Falta avisada', detalhe: `Aviso com ${avisoH}h · política não devolve` };
    }
    const emPrazo = avisoH >= p.avisoHoras;
    return emPrazo
      ? { delta: 0, nota: `Aviso com ${avisoH}h, dentro do mínimo de ${p.avisoHoras}h`, reposicao: true,
          rotulo: 'Falta avisada', detalhe: `Aviso com ${avisoH}h · reposição gerada` }
      : { delta: -1, nota: `Aviso com ${avisoH}h, abaixo do mínimo de ${p.avisoHoras}h`, reposicao: false,
          rotulo: 'Falta avisada', detalhe: `Aviso com ${avisoH}h · fora do prazo` };
  }
  if (desfecho === 'sem_aviso') {
    return { delta: -1, nota: 'Falta sem aviso debita a aula', reposicao: false,
             rotulo: 'Falta sem aviso', detalhe: 'Política: debita a aula' };
  }
  return { delta: 0, nota: 'Você cancelou, então a reposição é obrigatória', reposicao: true,
           rotulo: 'Aula cancelada por você', detalhe: 'Cancelamento seu · reposição obrigatória' };
}

/** Aplica o registro: retorna o aluno novo e o lançamento de extrato. Não muta a entrada. */
export function registrarAula(
  a: Aluno, desfecho: Desfecho, avisoH: number, p: Politicas, hoje: string
): { aluno: Aluno; lancamento: Lancamento; efeito: EfeitoRegistro } {
  const ef = efeito(desfecho, avisoH, p);
  const novoSaldo = Math.max(0, saldo(a) + ef.delta);
  const aluno: Aluno = { ...a };
  if (ef.delta < 0) aluno.usadas = a.usadas + 1;
  if (ef.reposicao && podeRepor(aluno, p)) aluno.pendencia = { origem: hoje, dias: 0 };
  return {
    aluno,
    lancamento: { d: hoje, t: ef.rotulo, s: ef.detalhe, delta: ef.delta, saldo: novoSaldo },
    efeito: ef,
  };
}

/** Marca a reposição: consome uma reposição, limpa a pendência e agenda. */
export function marcarReposicao(
  a: Aluno, janela: { dia: string; hora: string }, hoje: string
): { aluno: Aluno; lancamento: Lancamento } {
  const aluno: Aluno = { ...a, reposicoes: a.reposicoes + 1, pendencia: null, agendada: janela };
  return {
    aluno,
    lancamento: { d: hoje, t: 'Reposição marcada', s: `${janela.dia}, ${janela.hora}`, delta: 0, saldo: saldo(a) },
  };
}

export function registrarPagamento(a: Aluno, hoje: string): { aluno: Aluno; lancamento: Lancamento } {
  const aluno: Aluno = { ...a, pagamento: { status: 'pago', em: hoje, meio: 'Pix' }, pausado: false };
  return {
    aluno,
    lancamento: { d: hoje, t: 'Pagamento recebido', s: `${dinheiro(valorPacote(a))} · Pix`,
                  delta: 0, saldo: saldo(a), dinheiro: true },
  };
}

export function estenderValidade(a: Aluno, novaValidade: string, hoje: string): { aluno: Aluno; lancamento: Lancamento } {
  const aluno: Aluno = { ...a, validade: novaValidade, validadeEstendida: true };
  return {
    aluno,
    lancamento: { d: hoje, t: 'Validade estendida', s: `Nova validade ${novaValidade}`, delta: 0, saldo: saldo(a) },
  };
}

/** Peso de urgência: menor vem primeiro. */
export function pesoUrgencia(a: Aluno): 0 | 1 | 2 | 3 {
  if (a.pagamento?.status === 'atraso') return 0;
  if (a.pendencia) return 1;
  if (a.semPacote) return 3;
  return 2;
}

export type Filtro = 'Urgência' | 'A–Z' | 'Hoje';

export function ordenar(alunos: Aluno[], filtro: Filtro): Aluno[] {
  const c = [...alunos];
  if (filtro === 'A–Z') return c.sort((x, y) => x.name.localeCompare(y.name));
  if (filtro === 'Hoje') return c.filter(a => a.hoje);
  return c.sort((x, y) => pesoUrgencia(x) - pesoUrgencia(y) || saldo(x) - saldo(y));
}

export type Faixa =
  | { tipo: 'pausado'; texto: 'Aulas pausadas'; sufixo: string }
  | { tipo: 'atraso'; texto: 'Pagamento em atraso'; sufixo: string }
  | { tipo: 'pendente'; texto: 'Reposição pendente'; sufixo: string }
  | { tipo: 'marcada'; texto: 'Reposição marcada'; sufixo: string }
  | null;

/** Uma faixa só, nesta precedência. */
export function faixaStatus(a: Aluno): Faixa {
  if (a.pausado) return { tipo: 'pausado', texto: 'Aulas pausadas', sufixo: 'até regularizar' };
  if (a.pagamento?.status === 'atraso') return { tipo: 'atraso', texto: 'Pagamento em atraso', sufixo: `${a.pagamento.dias} dias` };
  if (a.pendencia) return { tipo: 'pendente', texto: 'Reposição pendente', sufixo: a.pendencia.dias > 0 ? `há ${a.pendencia.dias} dias` : 'hoje' };
  if (a.agendada) return { tipo: 'marcada', texto: 'Reposição marcada', sufixo: `${a.agendada.dia.replace(/^\S+,\s*/, '')} · ${a.agendada.hora}` };
  return null;
}

/** Totais do financeiro. */
export function totaisFinanceiro(alunos: Aluno[]) {
  const soma = (f: (a: Aluno) => boolean) =>
    alunos.filter(a => temPacote(a) && f(a)).reduce((t, a) => t + valorPacote(a), 0);
  return {
    aReceber: soma(a => a.pagamento.status === 'aberto'),
    recebido: soma(a => a.pagamento.status === 'pago'),
    emAtraso: soma(a => a.pagamento.status === 'atraso'),
  };
}
