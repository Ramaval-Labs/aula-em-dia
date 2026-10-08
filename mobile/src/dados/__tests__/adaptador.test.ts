/**
 * Repositório local (SCRUM-17).
 *
 * Cobra o que não pode mudar para quem já usa o app: a chave, os campos
 * gravados e a tolerância a disco vazio ou estranho. O formato é o mesmo que
 * `estado/dados.ts` gravava antes de a persistência ir para trás da interface.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { repositorioLocal } from '../adaptador';
import { CHAVE_ESTADO } from '../armazenamento';
import { escolherRepositorio, type Mudanca, type Persistido } from '../repositorio';
import { estadoInicial } from '../semente';

const estado = (): Persistido => estadoInicial();
const mudanca = (e: Persistido): Mudanca => ({ tipo: 'salvarPoliticas', politicas: e.politicas });
const emDisco = async () => JSON.parse((await AsyncStorage.getItem(CHAVE_ESTADO)) as string);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('repositório local — o que vai para o disco', () => {
  it('a chave é a mesma de antes: subir a versão apagaria os dados de quem já usa', () => {
    expect(CHAVE_ESTADO).toBe('aulaemdia.app.v4');
  });

  it('grava o estado inteiro na chave, seja qual for a mudança', async () => {
    const e = estado();
    await repositorioLocal.registrar(mudanca(e), e);

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(await emDisco()).toEqual(e);
  });

  it('só os campos persistidos vão para o disco, mesmo recebendo a store inteira', async () => {
    const store = { ...estado(), carregado: true, alunoPor: () => undefined } as Persistido;
    await repositorioLocal.registrar(mudanca(store), store);

    expect(Object.keys(await emDisco())).toEqual([
      'alunos',
      'extratos',
      'politicas',
      'perfil',
      'disponibilidade',
    ]);
  });

  it('os campos opcionais entram quando existem', async () => {
    const e: Persistido = {
      ...estado(),
      pacotePadrao: { aulas: 4, valorPorAula: 90, validadeDias: 30, somarSaldo: true },
      preferenciasDeAviso: {
        aulaDoDia: false,
        saldoBaixo: true,
        reposicaoPendente: false,
        pagamentoVencendo: true,
      },
    };
    await repositorioLocal.registrar(mudanca(e), e);

    expect(await emDisco()).toEqual(e);
  });

  it('rejeita quando o disco falha, em vez de engolir o erro', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disco cheio'));
    const e = estado();

    await expect(repositorioLocal.registrar(mudanca(e), e)).rejects.toThrow('disco cheio');
  });
});

describe('repositório local — o que volta do disco', () => {
  it('devolve o que foi gravado', async () => {
    const e = estado();
    await repositorioLocal.registrar(mudanca(e), e);

    expect(await repositorioLocal.carregar()).toEqual(e);
  });

  it('sem nada gravado, devolve null', async () => {
    expect(await repositorioLocal.carregar()).toBeNull();
  });

  it('um payload que não é um estado nosso é tratado como ausente', async () => {
    await AsyncStorage.setItem(CHAVE_ESTADO, JSON.stringify({ alunos: 1, extratos: {} }));
    expect(await repositorioLocal.carregar()).toBeNull();

    await AsyncStorage.setItem(CHAVE_ESTADO, 'null');
    expect(await repositorioLocal.carregar()).toBeNull();
  });

  it('um payload de versão anterior volta como está, sem os campos novos', async () => {
    const { alunos, extratos, politicas } = estado();
    await AsyncStorage.setItem(CHAVE_ESTADO, JSON.stringify({ alunos, extratos, politicas }));

    expect(await repositorioLocal.carregar()).toEqual({ alunos, extratos, politicas });
  });

  it('rejeita quando o que está gravado não é JSON', async () => {
    await AsyncStorage.setItem(CHAVE_ESTADO, '{corrompido');

    await expect(repositorioLocal.carregar()).rejects.toThrow(SyntaxError);
  });

  it('apagar remove a chave', async () => {
    const e = estado();
    await repositorioLocal.registrar(mudanca(e), e);
    await repositorioLocal.apagar();

    expect(await AsyncStorage.getItem(CHAVE_ESTADO)).toBeNull();
  });
});

describe('escolha do repositório por EXPO_PUBLIC_BACKEND', () => {
  it('sem valor, ou com `local`, é o repositório local', () => {
    expect(escolherRepositorio(undefined)).toBe(repositorioLocal);
    expect(escolherRepositorio('local')).toBe(repositorioLocal);
  });

  it('um valor sem implementação cai no local e avisa em desenvolvimento', () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(escolherRepositorio('supabase')).toBe(repositorioLocal);
    expect(aviso).toHaveBeenCalledTimes(1);

    aviso.mockRestore();
  });
});
