/**
 * Repositório do Supabase (SCRUM-20), contra o Supabase simulado em memória.
 *
 * Cobra o contrato da Parte 4: as seis leituras com cache, a gravação de cada
 * ação direta na tabela e nas colunas certas, a recusa das ações que mexem em
 * saldo (Parte 5) e a falha que não pode sumir — sem rede, ou um `update`
 * que a RLS deixou sem linha. O SQL de verdade é provado pelo pgTAP e pela
 * ponta a ponta contra o banco local (docs/backend/PLANO-BACKEND.md, Parte 4).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { estadoInicial } from '../semente';
import { CHAVE_CACHE } from '../armazenamento';
import { criarSupabaseFalso, SEM_REDE, type Consulta, type SupabaseFalso } from '../__simulados__/supabaseFalso';
import { tabelasDoPersistido } from '../__simulados__/linhas';
import type { Mudanca, Persistido } from '../repositorio';
import {
  AindaNaoGravaNoBanco,
  ErroDoBanco,
  marcarOnboardingConcluido,
  onboardingConcluido,
  repositorioSupabase as repo,
} from '../repositorioSupabase';
import { clienteSupabase } from '../supabase';

jest.mock('../supabase', () => ({
  usaSupabase: jest.fn(() => true),
  clienteSupabase: jest.fn(),
}));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}` };
});

const cliente = clienteSupabase as jest.MockedFunction<typeof clienteSupabase>;

let falso: SupabaseFalso;

function usar(opcoes: Parameters<typeof criarSupabaseFalso>[0]) {
  falso = criarSupabaseFalso(opcoes);
  cliente.mockReturnValue(falso.cliente as unknown as ReturnType<typeof clienteSupabase>);
  return falso;
}

const semente = (): Persistido => estadoInicial();
const comSemente = (extra: Parameters<typeof criarSupabaseFalso>[0] = {}) =>
  usar({ tabelas: tabelasDoPersistido(semente(), 'prof-a'), ...extra });

const emCache = async () => {
  const bruto = await AsyncStorage.getItem(CHAVE_CACHE);
  return bruto ? JSON.parse(bruto) : null;
};
const filtro = (c: Consulta, coluna: string) => c.filtros.find((f) => f.coluna === coluna)?.valor;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('carregar — seis leituras em paralelo e o cache', () => {
  it('monta o Persistido que a store espera, do professor logado', async () => {
    comSemente();
    const gravado = await repo.carregar();

    expect(gravado?.alunos.map((a) => a.name)).toEqual(semente().alunos.map((a) => a.name));
    expect(gravado?.extratos.val).toEqual(semente().extratos.val);
    expect(gravado?.politicas).toEqual(semente().politicas);

    const lidas = falso.consultas.map((c) => c.tabela).sort();
    expect(lidas).toEqual(
      ['alunos', 'disponibilidades', 'lancamentos', 'politicas', 'professores', 'propostas'].sort(),
    );
    // Toda leitura filtra pelo professor, além da RLS.
    for (const c of falso.consultas) {
      expect(filtro(c, c.tabela === 'professores' ? 'id' : 'professor_id')).toBe('prof-a');
    }
  });

  it('o que veio do banco vai para o cache, com o id do professor', async () => {
    comSemente();
    const gravado = await repo.carregar();
    expect(await emCache()).toEqual({ professorId: 'prof-a', gravado });
  });

  it('sem sessão não há o que carregar, e nada vai à rede', async () => {
    comSemente({ usuario: null });
    expect(await repo.carregar()).toBeNull();
    expect(falso.consultas).toEqual([]);
  });

  it('sem rede, abre pelo cache deste professor', async () => {
    comSemente();
    const gravado = await repo.carregar();
    usar({ falhar: () => SEM_REDE });

    expect(await repo.carregar()).toEqual(gravado);
  });

  it('sem rede e sem cache, rejeita: quem decide é a store', async () => {
    usar({ falhar: () => SEM_REDE });
    await expect(repo.carregar()).rejects.toBeInstanceOf(ErroDoBanco);
  });

  it('o cache de outra conta não serve: rejeita em vez de mostrar os alunos dela', async () => {
    comSemente();
    await repo.carregar();
    usar({ usuario: 'prof-b', falhar: () => SEM_REDE });

    await expect(repo.carregar()).rejects.toBeInstanceOf(ErroDoBanco);
    expect(await repo.lerCache?.()).toBeNull();
  });

  it('lerCache devolve o cache sem ir à rede', async () => {
    comSemente();
    const gravado = await repo.carregar();
    falso.consultas.length = 0;

    expect(await repo.lerCache?.()).toEqual(gravado);
    expect(falso.consultas).toEqual([]);
  });

  it('o extrato vem inteiro, página por página: a API corta em 1000 linhas', async () => {
    const tabelas = tabelasDoPersistido(semente(), 'prof-a');
    const um = tabelas.lancamentos[0];
    tabelas.lancamentos = Array.from({ length: 1001 }, (_, i) => ({
      ...um,
      id: `l${i}`,
      criado_em: new Date(2026, 0, 1, 0, 0, i).toISOString(),
    }));
    usar({ tabelas });

    const gravado = await repo.carregar();
    expect(gravado?.extratos[um.aluno_id as string]).toHaveLength(1001);
    const paginas = falso.consultas.filter((c) => c.tabela === 'lancamentos');
    expect(paginas.map((c) => c.faixa)).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it('espera a gravação no ar: o aluno criado no fim do onboarding já vem na leitura', async () => {
    comSemente();
    const novo = { ...semente().alunos[0], id: 'novo', name: 'Ana Nova' };
    const gravando = repo.registrar({ tipo: 'criarAluno', aluno: novo }, semente());
    const gravado = await repo.carregar();
    await gravando;

    expect(falso.consultas[0].operacao).toBe('insert');
    expect(gravado?.alunos.map((a) => a.name)).toContain('Ana Nova');
  });
});

describe('registrar — o que não mexe em saldo vai para o banco', () => {
  const e = semente();
  const val = e.alunos.find((a) => a.id === 'val')!;

  const gravou = () => {
    const g = falso.gravacoes();
    expect(g).toHaveLength(1);
    return g[0];
  };

  it('salvarPoliticas: update na política do professor', async () => {
    comSemente();
    const politicas = { ...e.politicas, avisoHoras: 12 };
    await repo.registrar({ tipo: 'salvarPoliticas', politicas }, e);

    const c = gravou();
    expect(c).toMatchObject({ tabela: 'politicas', operacao: 'update' });
    expect(filtro(c, 'professor_id')).toBe('prof-a');
    expect(c.valores).toEqual({
      aviso_horas: 12,
      avisada_devolve: true,
      limite_reposicoes: 3,
      validade_dias: 60,
    });
  });

  it('salvarPerfil: update no professor, sem o e-mail', async () => {
    comSemente();
    await repo.registrar({ tipo: 'salvarPerfil', perfil: { ...e.perfil, nome: 'Caio T.' } }, e);

    const c = gravou();
    expect(c).toMatchObject({ tabela: 'professores', operacao: 'update' });
    expect(filtro(c, 'id')).toBe('prof-a');
    expect(c.valores).toMatchObject({ nome: 'Caio T.' });
    expect(c.valores).not.toHaveProperty('email');
  });

  it('pacote padrão e avisos: as colunas jsonb do professor', async () => {
    comSemente();
    const pacotePadrao = { aulas: 4, valorPorAula: 90, validadeDias: 30, somarSaldo: false };
    await repo.registrar({ tipo: 'salvarPacotePadrao', pacotePadrao }, e);
    const preferenciasDeAviso = {
      aulaDoDia: true,
      saldoBaixo: false,
      reposicaoPendente: true,
      pagamentoVencendo: true,
    };
    await repo.registrar({ tipo: 'salvarPreferenciasDeAviso', preferenciasDeAviso }, e);

    expect(falso.gravacoes().map((c) => c.valores)).toEqual([
      { pacote_padrao: pacotePadrao },
      { preferencias_aviso: preferenciasDeAviso },
    ]);
  });

  it('salvarDisponibilidade: update na disponibilidade do professor', async () => {
    comSemente();
    await repo.registrar({ tipo: 'salvarDisponibilidade', disponibilidade: e.disponibilidade }, e);

    const c = gravou();
    expect(c).toMatchObject({ tabela: 'disponibilidades', operacao: 'update' });
    expect(c.valores).toMatchObject({ aceita_fora_dos_blocos: true, sugere_sabado: false });
  });

  it('criarAluno: insert com o id do app, e o professor fica com o padrão do banco', async () => {
    comSemente();
    const aluno = { ...val, id: repo.novoIdDeAluno(), name: 'Ana' };
    await repo.registrar({ tipo: 'criarAluno', aluno }, e);

    const c = gravou();
    expect(c).toMatchObject({ tabela: 'alunos', operacao: 'insert' });
    expect(c.valores).toMatchObject({ id: aluno.id, nome: 'Ana' });
    expect(c.valores).not.toHaveProperty('professor_id');
  });

  it.each<[string, Mudanca, Record<string, unknown>]>([
    ['alternarPausa', { tipo: 'alternarPausa', aluno: { ...val, pausado: true } }, { pausado: true }],
    [
      'enviarLembrete',
      { tipo: 'enviarLembrete', aluno: { ...val, lembretes: 2, ultimoLembrete: '20/10' } },
      { lembretes: 2, ultimo_lembrete: expect.stringMatching(/-10-20$/) },
    ],
    ['arquivarAluno', { tipo: 'arquivarAluno', aluno: { ...val, arquivado: true } }, { arquivado: true }],
    [
      'salvarDisponibilidadeDoAluno',
      {
        tipo: 'salvarDisponibilidadeDoAluno',
        aluno: { ...val, disponibilidade: [{ dia: 'seg', faixa: 'tarde' }] },
      },
      { disponibilidade: [{ dia: 'seg', faixa: 'tarde' }] },
    ],
    [
      'atualizarAluno com nome e telefone',
      { tipo: 'atualizarAluno', aluno: { ...val, name: 'Val K.', telefone: '51988887777' }, campos: ['name', 'telefone'] },
      { nome: 'Val K.', telefone: '51988887777' },
    ],
    [
      'atualizarAluno desfazendo a pendência',
      { tipo: 'atualizarAluno', aluno: { ...val, pendencia: null }, campos: ['pendencia'] },
      { pendencia_origem: null },
    ],
  ])('%s grava só as colunas da ação', async (_nome, mudanca, colunas) => {
    comSemente();
    await repo.registrar(mudanca, e);

    const c = gravou();
    expect(c).toMatchObject({ tabela: 'alunos', operacao: 'update' });
    expect(filtro(c, 'id')).toBe(val.id);
    expect(c.valores).toEqual(colunas);
  });

  it('cobrarTodosEmAtraso: um update por aluno, cada um com a sua contagem', async () => {
    comSemente();
    const raf = e.alunos.find((a) => a.id === 'raf')!;
    await repo.registrar(
      {
        tipo: 'cobrarTodosEmAtraso',
        alunos: [
          { ...val, lembretes: 2, ultimoLembrete: '20/10' },
          { ...raf, lembretes: 1, ultimoLembrete: '20/10' },
        ],
      },
      e,
    );

    const g = falso.gravacoes();
    expect(g.map((c) => [filtro(c, 'id'), (c.valores as { lembretes: number }).lembretes])).toEqual([
      ['val', 2],
      ['raf', 1],
    ]);
  });

  it('gravou: o cache passa a ser o estado da tela', async () => {
    comSemente();
    const depois = { ...e, politicas: { ...e.politicas, avisoHoras: 6 } };
    await repo.registrar({ tipo: 'salvarPoliticas', politicas: depois.politicas }, depois);

    expect((await emCache()).gravado.politicas.avisoHoras).toBe(6);
  });
});

describe('registrar — o que não pode passar em silêncio', () => {
  const e = semente();
  const val = e.alunos.find((a) => a.id === 'val')!;
  const lancamento = e.extratos.val[0];

  it.each<Mudanca>([
    { tipo: 'registrarAula', aluno: val, lancamento, desfecho: 'realizada' },
    { tipo: 'marcarReposicao', aluno: val, lancamento },
    { tipo: 'receberPagamento', aluno: val, lancamento },
    { tipo: 'registrarPagamentoCom', aluno: val, lancamento },
    { tipo: 'estenderValidade', aluno: val, lancamento },
    { tipo: 'criarPacote', aluno: val, lancamento },
    { tipo: 'renovarPacote', aluno: val, lancamento },
    { tipo: 'criarPacoteCom', aluno: val, lancamento },
    { tipo: 'enviarProposta', aluno: val, lancamento },
    { tipo: 'responderProposta', aluno: val, lancamento: null, status: 'recusada' },
  ])('$tipo mexe em saldo: rejeita até a Parte 5, sem gravar nada', async (mudanca) => {
    comSemente();
    await expect(repo.registrar(mudanca, e)).rejects.toBeInstanceOf(AindaNaoGravaNoBanco);
    expect(falso.gravacoes()).toEqual([]);
  });

  it('atualizarAluno que mexe no saldo também é da Parte 5', async () => {
    comSemente();
    await expect(
      repo.registrar({ tipo: 'atualizarAluno', aluno: { ...val, usadas: 0 }, campos: ['usadas'] }, e),
    ).rejects.toBeInstanceOf(AindaNaoGravaNoBanco);
    expect(falso.gravacoes()).toEqual([]);
  });

  it('um update que não alcança linha nenhuma (a RLS, ou um id que não existe) rejeita', async () => {
    comSemente();
    await expect(
      repo.registrar({ tipo: 'alternarPausa', aluno: { ...val, id: 'de-outro-professor' } }, e),
    ).rejects.toThrow('nenhuma linha');
  });

  it('sem rede, rejeita com o que se tentava', async () => {
    comSemente({ falhar: (c) => (c.operacao === 'update' ? SEM_REDE : null) });
    await expect(
      repo.registrar({ tipo: 'salvarPoliticas', politicas: e.politicas }, e),
    ).rejects.toThrow('[banco] salvar a política: TypeError: Network request failed');
  });

  it('falhou: o cache não muda', async () => {
    comSemente();
    await repo.carregar();
    const antes = await emCache();
    usar({ falhar: () => SEM_REDE });
    const depois = { ...e, politicas: { ...e.politicas, avisoHoras: 1 } };

    await expect(
      repo.registrar({ tipo: 'salvarPoliticas', politicas: depois.politicas }, depois),
    ).rejects.toThrow();
    expect(await emCache()).toEqual(antes);
  });
});

describe('o resto do contrato', () => {
  it('é remoto, e apagar só esquece o cache', async () => {
    comSemente();
    await repo.carregar();
    await repo.apagar();

    expect(repo.remoto).toBe(true);
    expect(await emCache()).toBeNull();
    expect(falso.gravacoes()).toEqual([]);
  });

  it('o id do aluno novo é um uuid, que é o que a coluna aceita', () => {
    expect(repo.novoIdDeAluno()).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('onboarding concluído (0004)', () => {
  const comOnboarding = (concluido: boolean) => {
    const tabelas = tabelasDoPersistido(semente(), 'prof-a');
    tabelas.professores[0].onboarding_concluido = concluido;
    return usar({ tabelas });
  };

  it('lê a coluna do professor logado', async () => {
    comOnboarding(false);
    expect(await onboardingConcluido()).toBe(false);
    comOnboarding(true);
    expect(await onboardingConcluido()).toBe(true);
  });

  it('sem sessão ou sem rede, não dá para saber: null', async () => {
    usar({ usuario: null });
    expect(await onboardingConcluido()).toBeNull();
    usar({ falhar: () => SEM_REDE });
    expect(await onboardingConcluido()).toBeNull();
  });

  it('concluir grava true na linha do professor', async () => {
    comOnboarding(false);
    await marcarOnboardingConcluido();
    expect(falso.tabelas.professores[0].onboarding_concluido).toBe(true);
  });
});
