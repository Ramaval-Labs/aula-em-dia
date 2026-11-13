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

/**
 * Preferências da tela "Avisos e lembretes" (SCRUM-91 trouxe o tipo de
 * `dados/repositorio.ts` para cá, porque a regra dos lembretes o lê).
 */
export interface PreferenciasDeAviso {
  aulaDoDia: boolean;
  saldoBaixo: boolean;
  reposicaoPendente: boolean;
  pagamentoVencendo: boolean;
  /**
   * O aviso uma hora antes de cada aula (SCRUM-23, PO de 13/11). Opcional
   * porque as preferências gravadas antes dele, no aparelho e na coluna
   * `preferencias_aviso`, não têm a chave: ausente vale o padrão, ligado.
   */
  antesDaAula?: boolean;
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

  // Campos da expansão. Todos opcionais de propósito: `alunoBase` nos testes
  // de política é uma fixture literal, e um campo obrigatório aqui quebraria
  // trinta e poucos testes de compilação.
  /** só dígitos, com DDD: "51999994182" */
  telefone?: string;
  email?: string;
  /** sobrepõe VALOR_AULA quando o pacote deste aluno tem outro preço */
  valorPorAula?: number;
  disponibilidade?: BlocoSemanal[];
  /**
   * A aula fixa estruturada (SCRUM-31). Ausente no aluno salvo antes dela: aí
   * o horário é lido de `dia` e `hora` por `aulaFixaDe`, em `aulaFixa.ts`.
   */
  aulaFixa?: AulaFixa | null;
  arquivado?: boolean;
  /** dd/mm */
  criadoEm?: string;
  proposta?: Proposta | null;
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

// --- Expansão: agenda, perfil, pacote e mensagens -------------------------

export type DiaDaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

/** As quatro faixas que o handoff usa nas grades (A5, C2, E3, F3). */
export type FaixaHoraria = 'manha' | 'tarde' | 'fimTarde' | 'noite';

export interface BlocoSemanal {
  dia: DiaDaSemana;
  faixa: FaixaHoraria;
}

/**
 * A aula fixa do aluno, estruturada (SCRUM-31). É o que o motor de reposição
 * lê. `Aluno.dia` e `Aluno.hora` continuam como o texto que as telas mostram,
 * gerado desta estrutura na hora de salvar.
 */
export interface AulaFixa {
  /** os dias da semana em que a aula acontece; vazio = sem horário fixo */
  dias: DiaDaSemana[];
  /** a hora cheia do começo da aula (18 para "18h" e para "18h30"); `null` = sem hora */
  hora: number | null;
}

export interface Folga {
  /** dd/mm */
  de: string;
  /** dd/mm — igual a `de` quando é um dia só */
  ate: string;
  motivo: string;
}

export interface Disponibilidade {
  blocos: BlocoSemanal[];
  aceitaForaDosBlocos: boolean;
  sugereSabado: boolean;
  folgas: Folga[];
}

export type FaixaDeAlunos = '1–5' | '6–15' | '16+';

export type Plano = 'gratuito' | 'pago';

export interface Perfil {
  nome: string;
  iniciais: string;
  email: string;
  disciplinas: string[];
  faixaDeAlunos: FaixaDeAlunos;
  chavePix?: string;
  plano: Plano;
}

export type MeioDePagamento = 'Pix' | 'Dinheiro' | 'Transferência';

export type TomDeMensagem = 'cordial' | 'direto' | 'formal';

/** O que a tela de novo pacote / renovação monta antes de gravar. */
export interface ConfigPacote {
  aulas: number;
  valorPorAula: number;
  validadeDias: number;
  /** somar o saldo que sobrou do pacote anterior */
  somarSaldo: boolean;
}

export type StatusDaProposta =
  | 'enviada'
  | 'aceita'
  | 'recusada'
  | 'confirmadaPeloProfessor';

export interface Proposta {
  janela: { dia: string; hora: string };
  /** dd/mm */
  enviadaEm: string;
  status: StatusDaProposta;
  alternativas: Janela[];
}

/** Filtros da tela de escolher outro horário (C4). */
export type FiltroDeAgenda = 'livres' | 'todos' | 'fimDeSemana';

/** Estados de carga do financeiro (D6). Sem rede, é alavanca de protótipo. */
export type EstadoDeCarga = 'ok' | 'carregando' | 'erro';
