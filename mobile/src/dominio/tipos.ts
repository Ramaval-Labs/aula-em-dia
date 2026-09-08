/** Tipos do domínio — espelham data/seed.json e spec/politica.ts. */

export type Desfecho = 'realizada' | 'avisada' | 'sem_aviso' | 'cancelada_professor';

export interface Politicas {
  /** antecedência mínima do aviso, em horas */
  avisoHoras: number;
  /** se true, falta avisada dentro do prazo não debita a aula */
  avisadaDevolve: boolean;
  /** 0 = sem limite */
  limiteReposicoes: number;
  /** validade padrão do pacote, em dias; 0 = sem prazo */
  validadeDias: number;
}

export type StatusPagamento = 'pago' | 'aberto' | 'atraso' | 'sem';

export interface Pagamento {
  status: StatusPagamento;
  /** pago em dd/mm */
  em?: string;
  /** 'Pix' */
  meio?: string;
  /** aberto: vence em dd/mm */
  vence?: string;
  /** atraso: venceu em dd/mm */
  venceu?: string;
  /** atraso: dias corridos */
  dias?: number;
}

export interface Pendencia {
  /** dd/mm da falta que gerou o direito de reposição */
  origem: string;
  dias: number;
}

export interface Janela {
  dia: string;
  hora: string;
  motivo: string;
}

export interface Aluno {
  id: string;
  name: string;
  disciplina: string;
  dia: string;
  hora: string;
  hoje: boolean;
  /** aulas do pacote */
  total: number;
  usadas: number;
  validade: string;
  validadeEstendida?: boolean;
  reposicoes: number;
  pendencia?: Pendencia | null;
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
  /** dd/mm */
  d: string;
  /** título */
  t: string;
  /** subtítulo */
  s: string;
  /** efeito no saldo */
  delta: number;
  /** saldo após o lançamento */
  saldo: number;
  dinheiro?: boolean;
}

export type Extratos = Record<string, Lancamento[]>;

export interface EfeitoRegistro {
  /** -1 debita, 0 não debita */
  delta: number;
  /** explicação mostrada na tela de registro */
  nota: string;
  /** gera pendência de reposição */
  reposicao: boolean;
  /** título do lançamento no extrato */
  rotulo: string;
  /** subtítulo do lançamento */
  detalhe: string;
}

export type Filtro = 'Urgência' | 'A–Z' | 'Hoje';

export type TipoDeFaixa = 'pausado' | 'atraso' | 'pendente' | 'marcada';

export interface Faixa {
  tipo: TipoDeFaixa;
  texto: string;
  sufixo: string;
}
