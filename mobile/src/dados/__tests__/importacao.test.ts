/**
 * Importar os dados locais para a conta (SCRUM-20).
 *
 * O "pronto quando" do SCRUM-20 é que quem já usava não perde dado. Isso quer
 * dizer três coisas, e cada uma tem teste: o que é do professor chega inteiro
 * ao banco, com os ids trocados uma vez só; nada fica pela metade quando a
 * rede cai no meio; e nada é apagado do aparelho.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { hoje, somarDias } from '../../dominio/datas';
import type { Aluno } from '../../dominio/tipos';
import { criarSupabaseFalso, SEM_REDE, type SupabaseFalso } from '../__simulados__/supabaseFalso';
import { CHAVE_ESTADO, CHAVE_IMPORTACAO } from '../armazenamento';
import {
  dispensarImportacao,
  IMPORTACAO_DISPENSADA,
  importarDadosLocais,
  temDadosLocaisParaImportar,
} from '../importacao';
import type { Persistido } from '../repositorio';
import { estadoInicial } from '../semente';
import { clienteSupabase, usaSupabase } from '../supabase';

jest.mock('../supabase', () => ({
  usaSupabase: jest.fn(() => true),
  clienteSupabase: jest.fn(),
}));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}` };
});

const modoSupabase = usaSupabase as jest.MockedFunction<typeof usaSupabase>;
const cliente = clienteSupabase as jest.MockedFunction<typeof clienteSupabase>;

let falso: SupabaseFalso;
function usar(opcoes: Parameters<typeof criarSupabaseFalso>[0] = {}) {
  falso = criarSupabaseFalso(opcoes);
  cliente.mockReturnValue(falso.cliente as unknown as ReturnType<typeof clienteSupabase>);
}

/** Um aluno que o professor cadastrou no modo local, com extrato e proposta. */
const ANA: Aluno = {
  id: 'alm1x2y3',
  name: 'Ana Souza',
  disciplina: 'Piano',
  dia: 'segunda',
  hora: '15h',
  hoje: false,
  total: 8,
  usadas: 1,
  validade: somarDias(hoje(), 50),
  reposicoes: 0,
  telefone: '51988887777',
  valorPorAula: 95,
  criadoEm: somarDias(hoje(), -10),
  pagamento: { status: 'pago', em: somarDias(hoje(), -9), meio: 'Pix' },
  proposta: {
    janela: { dia: 'Sexta, 30/10', hora: '17h' },
    enviadaEm: somarDias(hoje(), -1),
    status: 'enviada',
    alternativas: [],
  },
};
const BRUNO: Aluno = { ...ANA, id: 'alm9z8w7', name: 'Bruno Lima', proposta: null };

function noAparelho(alunos: Aluno[]): Persistido {
  const e = estadoInicial();
  return {
    ...e,
    alunos: [...e.alunos, ...alunos],
    extratos: {
      ...e.extratos,
      [ANA.id]: [
        { d: somarDias(hoje(), -2), t: 'Aula realizada', s: 'Segunda, 15h', delta: -1, saldo: 7 },
        { d: somarDias(hoje(), -9), t: 'Pacote de 8 aulas', s: 'Pix', delta: 8, saldo: 8 },
      ],
      [BRUNO.id]: [],
    },
  };
}

const guardar = (p: Persistido) => AsyncStorage.setItem(CHAVE_ESTADO, JSON.stringify(p));
const inseridos = (tabela: string) => falso.tabelas[tabela] ?? [];

beforeEach(async () => {
  jest.clearAllMocks();
  modoSupabase.mockReturnValue(true);
  await AsyncStorage.clear();
  usar();
});

describe('temDadosLocaisParaImportar — se a pergunta aparece', () => {
  it('com um aluno do professor no aparelho, sim', async () => {
    await guardar(noAparelho([ANA]));
    expect(await temDadosLocaisParaImportar()).toBe(true);
  });

  it('só com a semente, não: os alunos de demonstração não são dele', async () => {
    await guardar(estadoInicial());
    expect(await temDadosLocaisParaImportar()).toBe(false);
  });

  it('com nada gravado, ou com o disco ilegível, não', async () => {
    expect(await temDadosLocaisParaImportar()).toBe(false);
    await AsyncStorage.setItem(CHAVE_ESTADO, '{corrompido');
    expect(await temDadosLocaisParaImportar()).toBe(false);
  });

  it('no modo local, nunca: não há conta para onde levar', async () => {
    modoSupabase.mockReturnValue(false);
    await guardar(noAparelho([ANA]));
    expect(await temDadosLocaisParaImportar()).toBe(false);
  });

  it('depois de importar uma vez, não pergunta de novo, nem para outra conta', async () => {
    await guardar(noAparelho([ANA]));
    await importarDadosLocais();
    falso.logar('prof-b');
    expect(await temDadosLocaisParaImportar()).toBe(false);
  });
});

describe('importarDadosLocais', () => {
  it('leva os alunos do professor, e só eles', async () => {
    await guardar(noAparelho([ANA, BRUNO]));
    expect(await importarDadosLocais()).toBe(2);

    expect(inseridos('alunos').map((a) => a.nome)).toEqual(['Ana Souza', 'Bruno Lima']);
    expect(inseridos('alunos').every((a) => a.professor_id === 'prof-a')).toBe(true);
  });

  it('cada aluno ganha um uuid, trocado no aluno, no extrato e na proposta', async () => {
    await guardar(noAparelho([ANA]));
    await importarDadosLocais();

    const [ana] = inseridos('alunos');
    expect(ana.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(inseridos('lancamentos').map((l) => l.aluno_id)).toEqual([ana.id, ana.id]);
    expect(inseridos('propostas').map((p) => p.aluno_id)).toEqual([ana.id]);
  });

  it('o extrato entra na ordem, com o tipo pelo título', async () => {
    await guardar(noAparelho([ANA]));
    await importarDadosLocais();

    const [nova, antiga] = inseridos('lancamentos');
    expect([nova.tipo, antiga.tipo]).toEqual(['aula', 'pacote']);
    expect(Date.parse(nova.criado_em as string)).toBeGreaterThan(Date.parse(antiga.criado_em as string));
  });

  it('dinheiro e datas vão convertidos', async () => {
    await guardar(noAparelho([ANA]));
    await importarDadosLocais();

    const [ana] = inseridos('alunos');
    expect(ana.valor_por_aula_centavos).toBe(9500);
    expect(ana.validade).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('nada sai do aparelho', async () => {
    const antes = noAparelho([ANA]);
    await guardar(antes);
    await importarDadosLocais();

    expect(JSON.parse((await AsyncStorage.getItem(CHAVE_ESTADO)) as string)).toEqual(antes);
    expect(await AsyncStorage.getItem(CHAVE_IMPORTACAO)).toBe('prof-a');
  });

  it('a rede cai no extrato: os alunos que entraram saem, e a marca não é gravada', async () => {
    let semRede = true;
    usar({ falhar: (c) => (semRede && c.tabela === 'lancamentos' ? SEM_REDE : null) });
    await guardar(noAparelho([ANA]));

    await expect(importarDadosLocais()).rejects.toThrow('importar o extrato');
    expect(inseridos('alunos')).toEqual([]);
    expect(await AsyncStorage.getItem(CHAVE_IMPORTACAO)).toBeNull();
    // Tentar de novo, no mesmo banco e já com rede, não duplica ninguém.
    semRede = false;
    expect(await importarDadosLocais()).toBe(1);
    expect(inseridos('alunos')).toHaveLength(1);
  });

  it('um dado que não converte para tudo antes de ir à rede', async () => {
    await guardar(noAparelho([{ ...ANA, validade: 'amanhã' }]));

    await expect(importarDadosLocais()).rejects.toThrow('dd/mm');
    expect(falso.gravacoes()).toEqual([]);
  });

  it('sem nada a levar, devolve 0 sem gravar', async () => {
    await guardar(estadoInicial());
    expect(await importarDadosLocais()).toBe(0);
    expect(falso.gravacoes()).toEqual([]);
  });

  it('sem sessão, rejeita', async () => {
    usar({ usuario: null });
    await guardar(noAparelho([ANA]));
    await expect(importarDadosLocais()).rejects.toThrow('sem sessão');
  });
});

describe('dispensarImportacao — "Agora não" vale de vez (SCRUM-68)', () => {
  it('depois de dispensar, a pergunta não aparece mais', async () => {
    await guardar(noAparelho([ANA]));
    await dispensarImportacao();

    expect(await temDadosLocaisParaImportar()).toBe(false);
    expect(await AsyncStorage.getItem(CHAVE_IMPORTACAO)).toBe(IMPORTACAO_DISPENSADA);
  });

  it('vale também para outra conta que entre depois no mesmo aparelho', async () => {
    await guardar(noAparelho([ANA]));
    await dispensarImportacao();
    falso.logar('prof-b');

    expect(await temDadosLocaisParaImportar()).toBe(false);
  });

  it('nada sai do aparelho e nada vai ao banco', async () => {
    const antes = noAparelho([ANA]);
    await guardar(antes);
    await dispensarImportacao();

    expect(JSON.parse((await AsyncStorage.getItem(CHAVE_ESTADO)) as string)).toEqual(antes);
    expect(falso.consultas).toEqual([]);
  });

  it('não apaga a marca de uma importação que já aconteceu', async () => {
    await guardar(noAparelho([ANA]));
    await importarDadosLocais();
    await dispensarImportacao();

    expect(await AsyncStorage.getItem(CHAVE_IMPORTACAO)).toBe('prof-a');
  });

  it('importar depois de dispensar continua possível, e a marca passa a ser a da conta', async () => {
    await guardar(noAparelho([ANA]));
    await dispensarImportacao();

    expect(await importarDadosLocais()).toBe(1);
    expect(await AsyncStorage.getItem(CHAVE_IMPORTACAO)).toBe('prof-a');
  });

  it('com o disco falhando, não rejeita: a tela chama sem esperar', async () => {
    await guardar(noAparelho([ANA]));
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disco cheio'));

    await expect(dispensarImportacao()).resolves.toBeUndefined();
    // A marca não entrou: a pergunta volta, que é o pior caso combinado.
    expect(await temDadosLocaisParaImportar()).toBe(true);
  });
});
