/**
 * A store e o repositório (SCRUM-17).
 *
 * A regra de cada ação é do `dominio/` e tem suíte própria. Aqui se cobra o
 * contrato da persistência: toda ação avisa o repositório uma vez, com a
 * mudança que leva o seu nome; a resposta para a tela não espera o disco; e
 * o que foi gravado volta inteiro na próxima carga.
 *
 * Nenhuma data é escrita aqui: `hoje()` é a data do aparelho, e a suíte
 * compara o estado consigo mesmo.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAVE_ESTADO } from '../../dados/armazenamento';
import { repositorio, type Mudanca } from '../../dados/repositorio';
import { estadoInicial } from '../../dados/semente';
import type { ConfigPacote } from '../../dominio/tipos';
import { useDados } from '../dados';

const d = () => useDados.getState();
const registrar = jest.spyOn(repositorio, 'registrar');

/** Deixa as promessas do AsyncStorage (que é um mock em memória) terminarem. */
const assentar = () => new Promise<void>((pronto) => setImmediate(pronto));
const emDisco = async () => {
  const bruto = await AsyncStorage.getItem(CHAVE_ESTADO);
  return bruto ? JSON.parse(bruto) : null;
};
/** Os campos que vão para o disco, sem as ações nem o `carregado`. */
const persistido = () => {
  const s = d();
  return JSON.parse(
    JSON.stringify({
      alunos: s.alunos,
      extratos: s.extratos,
      politicas: s.politicas,
      perfil: s.perfil,
      disponibilidade: s.disponibilidade,
      pacotePadrao: s.pacotePadrao,
      preferenciasDeAviso: s.preferenciasDeAviso,
    }),
  );
};
const voltarASemente = () =>
  useDados.setState({
    ...estadoInicial(),
    pacotePadrao: undefined,
    preferenciasDeAviso: undefined,
    carregado: false,
  });

const JANELA = { dia: 'Sexta', hora: '17h' };
const PACOTE: ConfigPacote = { aulas: 4, valorPorAula: 90, validadeDias: 30, somarSaldo: false };
const NOVO_ALUNO = { nome: 'Aluno Novo', disciplina: 'Piano', dia: 'sexta', hora: '15h' };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  voltarASemente();
});

afterAll(() => {
  registrar.mockRestore();
  voltarASemente();
});

/**
 * Uma chamada de cada ação que grava, sobre os alunos da semente. O `Record`
 * obriga a tabela a ter todos os casos de `Mudanca`: caso novo sem linha aqui
 * não compila.
 */
const ACOES: Record<Mudanca['tipo'], () => unknown> = {
  registrarAula: () => d().registrarAula('val', 'realizada', 0),
  marcarReposicao: () => d().marcarReposicao('raf', JANELA),
  receberPagamento: () => d().receberPagamento('val'),
  registrarPagamentoCom: () => d().registrarPagamentoCom('val', 'Pix'),
  estenderValidade: () => d().estenderValidade('raf'),
  criarPacote: () => d().criarPacote('bea'),
  renovarPacote: () => d().renovarPacote('mar'),
  criarPacoteCom: () => d().criarPacoteCom('bea', PACOTE),
  enviarProposta: () => d().enviarProposta('mar', JANELA, []),
  responderProposta: () => d().responderProposta('raf', 'aceita'),
  alternarPausa: () => d().alternarPausa('mar'),
  enviarLembrete: () => d().enviarLembrete('val'),
  criarAluno: () => d().criarAluno(NOVO_ALUNO),
  atualizarAluno: () => d().atualizarAluno('mar', { hora: '19h' }),
  arquivarAluno: () => d().arquivarAluno('bea'),
  salvarDisponibilidadeDoAluno: () =>
    d().salvarDisponibilidadeDoAluno('mar', [{ dia: 'sex', faixa: 'tarde' }]),
  cobrarTodosEmAtraso: () => d().cobrarTodosEmAtraso(),
  salvarPoliticas: () => d().salvarPoliticas({ ...d().politicas, avisoHoras: 12 }),
  salvarPerfil: () => d().salvarPerfil({ ...d().perfil, nome: 'Outro Nome' }),
  salvarDisponibilidade: () => d().salvarDisponibilidade({ ...d().disponibilidade, folgas: [] }),
  salvarPacotePadrao: () => d().salvarPacotePadrao(PACOTE),
  salvarPreferenciasDeAviso: () =>
    d().salvarPreferenciasDeAviso({
      aulaDoDia: false,
      saldoBaixo: true,
      reposicaoPendente: false,
      pagamentoVencendo: true,
    }),
};

describe('toda ação avisa o repositório, uma vez, com o próprio nome', () => {
  it.each(Object.entries(ACOES))('%s', async (nome, executar) => {
    executar();

    expect(registrar).toHaveBeenCalledTimes(1);
    const [mudanca, estado] = registrar.mock.calls[0];
    expect(mudanca.tipo).toBe(nome);
    // O estado que acompanha a mudança é o de depois da ação.
    expect(estado).toBe(d());

    // E o disco fica igual à memória, com uma escrita só.
    await assentar();
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(await emDisco()).toEqual(persistido());
  });
});

describe('o que a mudança leva', () => {
  it('movimento leva o aluno e o lançamento como ficaram, e o desfecho da aula', () => {
    d().registrarAula('val', 'avisada', 30);

    expect(registrar.mock.calls[0][0]).toEqual({
      tipo: 'registrarAula',
      aluno: d().alunoPor('val'),
      lancamento: d().extratos.val[0],
      desfecho: 'avisada',
    });
  });

  it('pacote montado na store leva o aluno já com o pacote novo', () => {
    d().criarPacoteCom('bea', PACOTE);

    const mudanca = registrar.mock.calls[0][0];
    expect(mudanca).toEqual({
      tipo: 'criarPacoteCom',
      aluno: d().alunoPor('bea'),
      lancamento: d().extratos.bea[0],
    });
    expect(d().alunoPor('bea')).toMatchObject({ semPacote: false, total: 4, valorPorAula: 90 });
  });

  it('proposta recusada não leva lançamento; aceita leva o da reposição marcada', () => {
    const antes = d().extratos.raf.length;
    d().responderProposta('raf', 'recusada');
    expect(registrar.mock.calls[0][0]).toEqual({
      tipo: 'responderProposta',
      aluno: d().alunoPor('raf'),
      lancamento: null,
      status: 'recusada',
    });
    expect(d().extratos.raf).toHaveLength(antes);

    d().responderProposta('raf', 'aceita');
    expect(registrar.mock.calls[1][0]).toEqual({
      tipo: 'responderProposta',
      aluno: d().alunoPor('raf'),
      lancamento: d().extratos.raf[0],
      status: 'aceita',
    });
    expect(d().alunoPor('raf')?.proposta).toBeNull();
    expect(d().extratos.raf).toHaveLength(antes + 1);
  });

  it('cobrança em lote leva só quem estava em atraso', () => {
    expect(d().cobrarTodosEmAtraso()).toBe(1);

    expect(registrar.mock.calls[0][0]).toEqual({
      tipo: 'cobrarTodosEmAtraso',
      alunos: [d().alunoPor('val')],
    });
  });
});

describe('o que não é mudança não chega ao repositório', () => {
  it('ação sobre um aluno que não existe', () => {
    expect(d().registrarAula('nada', 'realizada', 0)).toBeNull();
    d().marcarReposicao('nada', JANELA);
    d().receberPagamento('nada');
    expect(d().estenderValidade('nada')).toBeNull();
    expect(d().alternarPausa('nada')).toBe(false);
    d().enviarLembrete('nada');
    d().atualizarAluno('nada', { hora: '19h' });
    d().arquivarAluno('nada');
    d().responderProposta('nada', 'aceita');

    expect(registrar).not.toHaveBeenCalled();
  });

  it('estender a validade pela segunda vez, e responder sem proposta aberta', () => {
    d().estenderValidade('raf');
    registrar.mockClear();

    expect(d().estenderValidade('raf')).toBeNull();
    d().responderProposta('mar', 'aceita');

    expect(registrar).not.toHaveBeenCalled();
  });

  it('cobrar em lote sem ninguém em atraso', () => {
    d().receberPagamento('val');
    registrar.mockClear();

    expect(d().cobrarTodosEmAtraso()).toBe(0);
    expect(registrar).not.toHaveBeenCalled();
  });
});

describe('a tela não espera o disco', () => {
  it('a ação devolve o resultado e muda a memória antes de o repositório responder', () => {
    registrar.mockReturnValueOnce(new Promise(() => {}));
    const antes = d().alunoPor('val')?.usadas ?? 0;

    const efeito = d().registrarAula('val', 'realizada', 0);

    expect(efeito).toMatchObject({ delta: -1, reposicao: false });
    expect(d().alunoPor('val')?.usadas).toBe(antes + 1);
  });

  it('falha ao gravar não derruba a ação nem desfaz a memória, e aparece', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    registrar.mockRejectedValueOnce(new Error('disco cheio'));

    expect(() => d().alternarPausa('mar')).not.toThrow();
    await assentar();

    expect(d().alunoPor('mar')?.pausado).toBe(true);
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });
});

describe('carregar e zerar', () => {
  it('sem nada em disco, fica com a semente e marca carregado', async () => {
    const semente = persistido();

    await d().carregar();

    expect(persistido()).toEqual(semente);
    expect(d().carregado).toBe(true);
  });

  it('fechar e reabrir preserva tudo o que foi feito', async () => {
    d().registrarAula('val', 'realizada', 0);
    const novo = d().criarAluno(NOVO_ALUNO);
    d().criarPacoteCom(novo, PACOTE);
    d().salvarPoliticas({ ...d().politicas, avisoHoras: 12 });
    d().salvarPacotePadrao(PACOTE);
    await assentar();
    const feito = persistido();

    voltarASemente();
    await d().carregar();

    expect(persistido()).toEqual(feito);
    expect(d().alunoPor(novo)?.name).toBe('Aluno Novo');
  });

  it('payload de versão anterior é completado com a semente', async () => {
    const { alunos, extratos, politicas } = persistido();
    await AsyncStorage.setItem(
      CHAVE_ESTADO,
      JSON.stringify({ alunos: alunos.slice(0, 1), extratos, politicas }),
    );

    await d().carregar();

    expect(d().alunos).toHaveLength(1);
    expect(d().perfil).toEqual(estadoInicial().perfil);
    expect(d().disponibilidade).toEqual(estadoInicial().disponibilidade);
  });

  it('disco corrompido segue com a semente, e o erro aparece', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const semente = persistido();
    await AsyncStorage.setItem(CHAVE_ESTADO, '{corrompido');

    await d().carregar();

    expect(persistido()).toEqual(semente);
    expect(d().carregado).toBe(true);
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });

  it('zerar apaga o disco e volta à semente', async () => {
    const semente = persistido();
    d().registrarAula('val', 'realizada', 0);
    await assentar();
    expect(await emDisco()).not.toBeNull();

    d().zerar();
    await assentar();

    expect(await emDisco()).toBeNull();
    expect(persistido()).toEqual(semente);
  });
});
