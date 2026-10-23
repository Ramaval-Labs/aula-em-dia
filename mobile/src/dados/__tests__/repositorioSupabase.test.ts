/**
 * Repositório do Supabase (SCRUM-20), contra o Supabase simulado em memória.
 *
 * Cobra o contrato das Partes 4 e 5: as seis leituras com cache, a gravação de
 * cada ação direta na tabela e nas colunas certas, as que mexem em saldo pela
 * RPC com a trava de versão, e a falha que não pode sumir — sem rede, um
 * `update` que a RLS deixou sem linha, ou outro aparelho que gravou antes. O
 * SQL de verdade é provado pelo pgTAP e pela ponta a ponta contra o banco
 * local (docs/backend/PLANO-BACKEND.md, Partes 4 e 5).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { estadoInicial } from '../semente';
import { CHAVE_CACHE } from '../armazenamento';
import { criarSupabaseFalso, SEM_REDE, type Consulta, type SupabaseFalso } from '../__simulados__/supabaseFalso';
import { tabelasDoPersistido } from '../__simulados__/linhas';
import type { Mudanca, Persistido } from '../repositorio';
import {
  ConflitoDeVersao,
  ehConflitoDeVersao,
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
  // Esquece as versões que o teste anterior leu.
  await repo.apagar();
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

  it('o que veio do banco vai para o cache, com o id do professor e as versões', async () => {
    comSemente();
    const gravado = await repo.carregar();
    expect(await emCache()).toEqual({
      professorId: 'prof-a',
      gravado,
      versoes: { val: 0, raf: 0, mar: 0, bea: 0 },
    });
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

describe('registrar — o que mexe em saldo vai pela RPC (Parte 5)', () => {
  const e = semente();
  const val = e.alunos.find((a) => a.id === 'val')!;
  const raf = e.alunos.find((a) => a.id === 'raf')!;
  const lancamento = e.extratos.val[0];

  /** Lê o banco primeiro: é o que enche o mapa de versões. */
  const carregado = async (extra: Parameters<typeof criarSupabaseFalso>[0] = {}) => {
    comSemente(extra);
    await repo.carregar();
    falso.consultas.length = 0;
  };
  const chamadas = () => falso.consultas.filter((c) => c.operacao === 'rpc');
  const args = (i = 0) => chamadas()[i].valores as Record<string, any>;

  it.each<[Mudanca, string | null, Record<string, unknown> | null]>([
    [{ tipo: 'registrarAula', aluno: val, lancamento, desfecho: 'realizada' }, 'aula', null],
    [{ tipo: 'registrarAula', aluno: val, lancamento, desfecho: 'avisada' }, 'falta_avisada', null],
    [{ tipo: 'registrarAula', aluno: val, lancamento, desfecho: 'sem_aviso' }, 'falta_sem_aviso', null],
    [
      { tipo: 'registrarAula', aluno: val, lancamento, desfecho: 'cancelada_professor' },
      'cancelada_professor',
      null,
    ],
    [{ tipo: 'marcarReposicao', aluno: val, lancamento }, 'reposicao', { status: 'recusada' }],
    [{ tipo: 'receberPagamento', aluno: val, lancamento }, 'pagamento', null],
    [{ tipo: 'registrarPagamentoCom', aluno: val, lancamento }, 'pagamento', null],
    [{ tipo: 'estenderValidade', aluno: val, lancamento }, 'validade', null],
    [{ tipo: 'criarPacote', aluno: val, lancamento }, 'pacote', null],
    [{ tipo: 'renovarPacote', aluno: val, lancamento }, 'pacote', null],
    [{ tipo: 'criarPacoteCom', aluno: val, lancamento }, 'pacote', null],
    [
      { tipo: 'responderProposta', aluno: val, lancamento, status: 'aceita' },
      'reposicao',
      { status: 'aceita' },
    ],
    [
      { tipo: 'responderProposta', aluno: val, lancamento: null, status: 'recusada' },
      null,
      { status: 'recusada' },
    ],
  ])('%#: $tipo vai numa chamada só, com o tipo do lançamento e a proposta', async (mudanca, tipo, proposta) => {
    await carregado();
    await repo.registrar(mudanca, e);

    expect(falso.gravacoes()).toHaveLength(1);
    const a = args();
    expect(chamadas()[0].tabela).toBe('aplicar_movimento');
    expect(a.p_versao).toBe(0);
    expect(a.p_aluno).toMatchObject({ id: 'val', usadas: val.usadas });
    expect(a.p_lancamento?.tipo ?? null).toBe(tipo);
    expect(a.p_proposta ?? null).toEqual(proposta);
  });

  it('enviarProposta leva a proposta nova, e a aberta de antes fecha', async () => {
    await carregado();
    const nova = {
      janela: { dia: 'Sexta, 30/10', hora: '17h' },
      enviadaEm: e.extratos.raf[0].d,
      status: 'enviada' as const,
      alternativas: [],
    };
    await repo.registrar(
      { tipo: 'enviarProposta', aluno: { ...raf, proposta: nova }, lancamento: e.extratos.raf[0] },
      e,
    );

    expect(args().p_proposta).toMatchObject({ status: 'enviada', janela: nova.janela });
    const abertas = falso.tabelas.propostas.filter((p) => p.status === 'enviada');
    expect(abertas.map((p) => (p.janela as { dia: string }).dia)).toEqual(['Sexta, 30/10']);
  });

  it('o lançamento vai com o professor e o aluno da linha, e o tipo da ação', async () => {
    await carregado();
    const antes = falso.tabelas.lancamentos.length;
    await repo.registrar({ tipo: 'registrarAula', aluno: { ...val, usadas: 3 }, lancamento, desfecho: 'realizada' }, e);

    expect(falso.tabelas.lancamentos).toHaveLength(antes + 1);
    expect(falso.tabelas.lancamentos.at(-1)).toMatchObject({
      aluno_id: 'val',
      professor_id: 'prof-a',
      tipo: 'aula',
      titulo: lancamento.t,
    });
    expect(falso.tabelas.alunos.find((a) => a.id === 'val')).toMatchObject({ usadas: 3, versao: 1 });
  });

  it('a versão que a RPC devolve é a da próxima chamada', async () => {
    await carregado();
    await repo.registrar({ tipo: 'receberPagamento', aluno: val, lancamento }, e);
    await repo.registrar({ tipo: 'estenderValidade', aluno: val, lancamento }, e);

    expect([args(0).p_versao, args(1).p_versao]).toEqual([0, 1]);
  });

  it('duas seguidas do mesmo aluno saem uma depois da outra, sem conflito consigo mesmas', async () => {
    await carregado();
    await Promise.all([
      repo.registrar({ tipo: 'registrarAula', aluno: val, lancamento, desfecho: 'realizada' }, e),
      repo.registrar({ tipo: 'marcarReposicao', aluno: val, lancamento }, e),
    ]);

    expect([args(0).p_versao, args(1).p_versao]).toEqual([0, 1]);
  });

  it('outro aparelho gravou antes: ConflitoDeVersao, e nada muda', async () => {
    await carregado();
    falso.gravarPorFora('val', { usadas: 5 });
    const antes = falso.tabelas.lancamentos.length;

    const erro = await repo
      .registrar({ tipo: 'registrarAula', aluno: val, lancamento, desfecho: 'realizada' }, e)
      .catch((x: unknown) => x);

    expect(erro).toBeInstanceOf(ConflitoDeVersao);
    expect(ehConflitoDeVersao(erro)).toBe(true);
    expect(falso.tabelas.alunos.find((a) => a.id === 'val')?.usadas).toBe(5);
    expect(falso.tabelas.lancamentos).toHaveLength(antes);
  });

  it('depois do conflito, a recarga traz a versão nova e a gravação passa', async () => {
    await carregado();
    falso.gravarPorFora('val', { usadas: 5 });
    await expect(repo.registrar({ tipo: 'receberPagamento', aluno: val, lancamento }, e)).rejects.toThrow();

    await repo.carregar();
    await expect(repo.registrar({ tipo: 'receberPagamento', aluno: val, lancamento }, e)).resolves.toBeUndefined();
  });

  it('aluno sem versão conhecida é conflito, sem ir ao banco: só a recarga prova o que se leu', async () => {
    comSemente();
    const erro = await repo
      .registrar({ tipo: 'receberPagamento', aluno: val, lancamento }, e)
      .catch((x: unknown) => x);

    expect(erro).toBeInstanceOf(ConflitoDeVersao);
    expect(chamadas()).toEqual([]);
  });

  it('o aluno criado neste aparelho já tem versão: o primeiro movimento passa', async () => {
    comSemente();
    const novo = { ...val, id: repo.novoIdDeAluno(), name: 'Ana' };
    await repo.registrar({ tipo: 'criarAluno', aluno: novo }, e);
    await repo.registrar({ tipo: 'criarPacote', aluno: { ...novo, total: 8 }, lancamento }, e);

    expect(args().p_versao).toBe(0);
  });

  it('rede caída na RPC é falha comum, não conflito', async () => {
    await carregado({ falhar: (c) => (c.operacao === 'rpc' ? SEM_REDE : null) });
    const erro = await repo
      .registrar({ tipo: 'receberPagamento', aluno: val, lancamento }, e)
      .catch((x: unknown) => x);

    expect(erro).toBeInstanceOf(ErroDoBanco);
    expect(ehConflitoDeVersao(erro)).toBe(false);
  });

  it('o lançamento recusado pelo banco desfaz o aluno (o rollback da transação)', async () => {
    await carregado();
    await expect(
      repo.registrar(
        {
          tipo: 'registrarAula',
          aluno: { ...val, usadas: 9 },
          lancamento: { ...lancamento, saldo: -1 },
          desfecho: 'realizada',
        },
        e,
      ),
    ).rejects.toThrow('check');
    expect(falso.tabelas.alunos.find((a) => a.id === 'val')).toMatchObject({ usadas: val.usadas, versao: 0 });
  });

  it('atualizarAluno com saldo vai pela RPC, e o resto do patch direto', async () => {
    await carregado();
    await repo.registrar(
      { tipo: 'atualizarAluno', aluno: { ...val, usadas: 0, name: 'Val K.' }, campos: ['usadas', 'name'] },
      e,
    );

    expect(falso.gravacoes().map((c) => c.operacao)).toEqual(['rpc', 'update']);
    expect(falso.gravacoes()[1].valores).toEqual({ nome: 'Val K.' });
    expect(falso.tabelas.alunos.find((a) => a.id === 'val')).toMatchObject({ usadas: 0, nome: 'Val K.' });
  });

  it('as versões vão no cache: aberto sem rede, o app ainda sabe o que leu', async () => {
    await carregado();
    await repo.registrar({ tipo: 'receberPagamento', aluno: val, lancamento }, e);
    expect((await emCache()).versoes.val).toBe(1);
  });

  it('apagar esquece as versões junto com o cache', async () => {
    await carregado();
    await repo.apagar();
    await expect(repo.registrar({ tipo: 'receberPagamento', aluno: val, lancamento }, e)).rejects.toBeInstanceOf(
      ConflitoDeVersao,
    );
  });
});
