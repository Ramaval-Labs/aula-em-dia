/**
 * Repositório do Supabase (Parte 4 do backend).
 *
 * `carregar()` faz as seis consultas em paralelo e o conversor de fronteira
 * monta o mesmo `Persistido` que a store já espera; o resultado fica no
 * AsyncStorage como cache, para o app abrir sem rede. `registrar()` grava as
 * ações que não mexem em saldo, uma tabela e só as colunas que a ação mudou.
 *
 * As que mexem em saldo (aula, falta, reposição, pagamento, pacote, proposta)
 * gravam aluno e lançamento juntos, e por isso são da Parte 5, por RPC. Até
 * lá elas rejeitam com `AindaNaoGravaNoBanco`, e a store trata como qualquer
 * outra falha: avisa e recarrega do banco.
 *
 * Online com cache, não offline-first (decisão D4): não há fila de gravações.
 * O cliente é o preguiçoso de `supabase.ts`; importar este arquivo não abre
 * conexão, e o modo local nunca chama nada daqui.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

import type { Aluno } from '../dominio/tipos';
import { soPersistido } from './adaptador';
import { CHAVE_CACHE } from './armazenamento';
import type { TablesUpdate } from './banco';
import {
  alunoParaBanco,
  colunasDoAluno,
  disponibilidadeParaBanco,
  montarPersistido,
  pacotePadraoParaBanco,
  perfilParaBanco,
  politicasParaBanco,
  preferenciasParaBanco,
} from './conversor';
import type { Gravado, Mudanca, Persistido, Repositorio } from './repositorio';
import { clienteSupabase } from './supabase';

/** O supabase-js não lança: o erro vem na resposta. Aqui ele vira exceção, com o que se tentava. */
export class ErroDoBanco extends Error {
  readonly causa: unknown;
  constructor(oQue: string, causa: { message?: string } | null) {
    super(`[banco] ${oQue}: ${causa?.message ?? 'falhou'}`);
    this.name = 'ErroDoBanco';
    this.causa = causa;
  }
}

/** Ação que mexe em saldo, recebida antes de a Parte 5 existir. */
export class AindaNaoGravaNoBanco extends Error {
  constructor(acao: Mudanca['tipo'] | string) {
    super(`[banco] "${acao}" mexe em saldo e só grava no banco pela RPC da Parte 5.`);
    this.name = 'AindaNaoGravaNoBanco';
  }
}

type Resposta<T> = { data: T | null; error: { message?: string } | null };

export function exigir<T>(resposta: Resposta<T>, oQue: string): T {
  if (resposta.error) throw new ErroDoBanco(oQue, resposta.error);
  return resposta.data as T;
}

/**
 * Com RLS, um `update` que não alcança linha nenhuma (id de outro professor,
 * id que não existe) volta sem erro. O `select` depois do `update` é o que
 * deixa ver isso, e aqui a gravação vazia vira falha em vez de sumir.
 */
function exigirLinha(resposta: Resposta<unknown[]>, oQue: string): void {
  const linhas = exigir(resposta, oQue);
  if (!linhas || linhas.length === 0) {
    throw new ErroDoBanco(oQue, { message: 'nenhuma linha foi gravada' });
  }
}

/** O id do professor logado, lido da sessão guardada no aparelho (sem rede). */
async function professorLogado(): Promise<string | null> {
  const { data } = await clienteSupabase().auth.getSession();
  return data.session?.user.id ?? null;
}

export async function exigirProfessor(): Promise<string> {
  const id = await professorLogado();
  if (!id) throw new ErroDoBanco('identificar o professor', { message: 'sem sessão' });
  return id;
}

// --- Leitura ----------------------------------------------------------------------

/** O `max_rows` da API (supabase/config.toml). Uma página a menos que isso é a última. */
const PAGINA = 1000;

/** Todas as linhas, página por página: a API corta em `max_rows` sem avisar. */
async function todas<T>(
  pagina: (de: number, ate: number) => PromiseLike<Resposta<T[]>>,
  oQue: string,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const parte = exigir(await pagina(de, de + PAGINA - 1), oQue) ?? [];
    linhas.push(...parte);
    if (parte.length < PAGINA) return linhas;
  }
}

async function lerDoBanco(professorId: string): Promise<Persistido> {
  const c = clienteSupabase();
  // O filtro por professor repete o que a RLS já garante: é o que deixa o
  // Postgres usar o índice em vez de avaliar a política linha a linha.
  const [professor, politicas, disponibilidade, alunos, lancamentos, propostas] =
    await Promise.all([
      c.from('professores').select('*').eq('id', professorId).single(),
      c.from('politicas').select('*').eq('professor_id', professorId).single(),
      c.from('disponibilidades').select('*').eq('professor_id', professorId).single(),
      todas(
        (de, ate) =>
          c
            .from('alunos')
            .select('*')
            .eq('professor_id', professorId)
            .order('criado_em')
            .order('id')
            .range(de, ate),
        'ler os alunos',
      ),
      todas(
        (de, ate) =>
          c
            .from('lancamentos')
            .select('*')
            .eq('professor_id', professorId)
            .order('criado_em', { ascending: false })
            .order('id')
            .range(de, ate),
        'ler o extrato',
      ),
      c.from('propostas').select('*').eq('professor_id', professorId).eq('status', 'enviada'),
    ]);

  return montarPersistido({
    professor: exigir(professor, 'ler o perfil'),
    politicas: exigir(politicas, 'ler a política'),
    disponibilidade: exigir(disponibilidade, 'ler a disponibilidade'),
    alunos,
    lancamentos,
    propostas: exigir(propostas, 'ler as propostas') ?? [],
  });
}

// --- Cache ------------------------------------------------------------------------

interface Cache {
  professorId: string;
  gravado: Persistido;
}

async function guardarCache(professorId: string, gravado: Persistido): Promise<void> {
  const cache: Cache = { professorId, gravado: soPersistido(gravado) };
  await AsyncStorage.setItem(CHAVE_CACHE, JSON.stringify(cache));
}

/** O cache, só se for deste professor: quem entra com outra conta não vê o anterior. */
async function lerCacheDe(professorId: string): Promise<Gravado | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_CACHE);
    if (!bruto) return null;
    const cache = JSON.parse(bruto) as Partial<Cache> | null;
    if (cache?.professorId !== professorId || !cache.gravado) return null;
    return cache.gravado;
  } catch {
    // Cache ilegível é cache ausente: a rede ainda pode responder.
    return null;
  }
}

/** O cache é conveniência: falhar ao gravá-lo não pode virar falha da ação. */
function guardarCacheSemFalhar(professorId: string, gravado: Persistido): Promise<void> {
  return guardarCache(professorId, gravado).catch(() => {});
}

// --- Gravação ---------------------------------------------------------------------

/** O que cada ação de um aluno muda nele. `atualizarAluno` diz os seus campos. */
const CAMPOS_DA_ACAO = {
  alternarPausa: ['pausado'],
  enviarLembrete: ['lembretes', 'ultimoLembrete'],
  arquivarAluno: ['arquivado'],
  salvarDisponibilidadeDoAluno: ['disponibilidade'],
} as const satisfies Partial<Record<Mudanca['tipo'], readonly (keyof Aluno)[]>>;

/**
 * Campos que só mudam junto com um lançamento no extrato. Editar um deles pela
 * ficha deixaria saldo sem histórico: é a Parte 5.
 */
const CAMPOS_DE_SALDO: readonly (keyof Aluno)[] = ['total', 'usadas'];

async function atualizarProfessor(valores: TablesUpdate<'professores'>, oQue: string) {
  const id = await exigirProfessor();
  exigirLinha(
    await clienteSupabase().from('professores').update(valores).eq('id', id).select('id'),
    oQue,
  );
}

async function atualizarAluno(aluno: Aluno, campos: readonly (keyof Aluno)[], oQue: string) {
  const valores = colunasDoAluno(aluno, campos);
  // Nenhuma coluna do banco mudou (um campo derivado, por exemplo): nada a gravar.
  if (Object.keys(valores).length === 0) return;
  exigirLinha(
    await clienteSupabase().from('alunos').update(valores).eq('id', aluno.id).select('id'),
    oQue,
  );
}

async function gravar(mudanca: Mudanca): Promise<void> {
  switch (mudanca.tipo) {
    case 'salvarPerfil':
      return atualizarProfessor(perfilParaBanco(mudanca.perfil), 'salvar o perfil');
    case 'salvarPacotePadrao':
      return atualizarProfessor(pacotePadraoParaBanco(mudanca.pacotePadrao), 'salvar o pacote padrão');
    case 'salvarPreferenciasDeAviso':
      return atualizarProfessor(preferenciasParaBanco(mudanca.preferenciasDeAviso), 'salvar os avisos');

    case 'salvarPoliticas': {
      const id = await exigirProfessor();
      return exigirLinha(
        await clienteSupabase()
          .from('politicas')
          .update(politicasParaBanco(mudanca.politicas))
          .eq('professor_id', id)
          .select('professor_id'),
        'salvar a política',
      );
    }
    case 'salvarDisponibilidade': {
      const id = await exigirProfessor();
      return exigirLinha(
        await clienteSupabase()
          .from('disponibilidades')
          .update(disponibilidadeParaBanco(mudanca.disponibilidade))
          .eq('professor_id', id)
          .select('professor_id'),
        'salvar a disponibilidade',
      );
    }

    // O id vem do app (`novoIdDeAluno`), e `professor_id` fica com o padrão
    // do banco, `auth.uid()`: o app não tem como gravar aluno para outro.
    case 'criarAluno':
      return exigirLinha(
        await clienteSupabase().from('alunos').insert(alunoParaBanco(mudanca.aluno)).select('id'),
        'criar o aluno',
      );

    case 'atualizarAluno':
      if (mudanca.campos.some((c) => CAMPOS_DE_SALDO.includes(c))) {
        throw new AindaNaoGravaNoBanco('atualizarAluno com saldo');
      }
      return atualizarAluno(mudanca.aluno, mudanca.campos, 'atualizar o aluno');
    case 'alternarPausa':
    case 'enviarLembrete':
    case 'arquivarAluno':
    case 'salvarDisponibilidadeDoAluno':
      return atualizarAluno(mudanca.aluno, CAMPOS_DA_ACAO[mudanca.tipo], mudanca.tipo);
    case 'cobrarTodosEmAtraso':
      // Um update por aluno: cada um tem a sua contagem de lembretes.
      await Promise.all(
        mudanca.alunos.map((a) =>
          atualizarAluno(a, CAMPOS_DA_ACAO.enviarLembrete, 'cobrar os atrasados'),
        ),
      );
      return;

    case 'registrarAula':
    case 'marcarReposicao':
    case 'receberPagamento':
    case 'registrarPagamentoCom':
    case 'estenderValidade':
    case 'criarPacote':
    case 'renovarPacote':
    case 'criarPacoteCom':
    case 'enviarProposta':
    case 'responderProposta':
      throw new AindaNaoGravaNoBanco(mudanca.tipo);

    default: {
      // Caso novo em `Mudanca` sem decisão aqui não compila.
      const semCaso: never = mudanca;
      throw new AindaNaoGravaNoBanco((semCaso as Mudanca).tipo);
    }
  }
}

/**
 * Gravações ainda no ar. `carregar()` espera por elas: no fim do onboarding a
 * tela do app abre e lê o banco logo depois do último "Continuar", e a leitura
 * não pode chegar antes do aluno que acabou de ser criado.
 */
const emVoo = new Set<Promise<void>>();

export const repositorioSupabase: Repositorio = {
  remoto: true,

  async carregar() {
    await Promise.allSettled([...emVoo]);
    const id = await professorLogado();
    if (!id) return null;
    try {
      const gravado = await lerDoBanco(id);
      await guardarCacheSemFalhar(id, gravado);
      return gravado;
    } catch (erro) {
      // Sem rede, o app abre pelo cache. Sem cache, quem decide é a store.
      const cache = await lerCacheDe(id);
      if (cache) return cache;
      throw erro;
    }
  },

  async lerCache() {
    const id = await professorLogado();
    return id ? lerCacheDe(id) : null;
  },

  async registrar(mudanca, estado) {
    const gravacao = gravar(mudanca);
    emVoo.add(gravacao);
    try {
      await gravacao;
    } finally {
      emVoo.delete(gravacao);
    }
    // Gravou: o cache passa a ser o estado como a tela mostra.
    const id = await professorLogado();
    if (id) await guardarCacheSemFalhar(id, estado);
  },

  async apagar() {
    await AsyncStorage.removeItem(CHAVE_CACHE);
  },

  novoIdDeAluno() {
    return randomUUID();
  },
};

// --- Onboarding -------------------------------------------------------------------

/**
 * Se o professor logado já passou pelo onboarding (Parte 4, decisão sobre o
 * "O que fica em aberto" da Parte 3). `null` quando não dá para saber, sem
 * sessão ou sem rede: a sessão segue para o app, que abre pelo cache.
 */
export async function onboardingConcluido(): Promise<boolean | null> {
  try {
    const id = await professorLogado();
    if (!id) return null;
    const { data, error } = await clienteSupabase()
      .from('professores')
      .select('onboarding_concluido')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data.onboarding_concluido;
  } catch {
    return null;
  }
}

export async function marcarOnboardingConcluido(): Promise<void> {
  await atualizarProfessor({ onboarding_concluido: true }, 'concluir o onboarding');
}
