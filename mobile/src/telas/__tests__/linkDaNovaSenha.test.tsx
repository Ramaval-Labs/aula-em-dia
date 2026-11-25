/**
 * O link de nova senha pela raiz do app (SCRUM-98).
 *
 * O `recuperacao.test.tsx` cobre a leitura do link e a tela isolada. Aqui se
 * cobra o `App.tsx`: aberto em `/redefinir-senha?token_hash=…`, ele vai direto
 * para a tela de nova senha, não restaura a sessão guardada (a conta do link
 * pode não ser a deste aparelho) e tira o token da barra de endereço.
 *
 * O `App.tsx` lê o link uma vez, quando o módulo carrega
 * (`TOKEN_DA_NOVA_SENHA`). Por isso cada caso zera o registro de módulos,
 * prepara o endereço e a plataforma, e só então carrega o app — e o React, a
 * biblioteca de teste e a sessão saem do mesmo registro, para não haver dois
 * Reacts nem duas sessões. A biblioteca vem do `/pure`, que não registra
 * ganchos ao carregar: cada caso desmonta o que montou.
 */

import type * as Biblioteca from '@testing-library/react-native/pure';
import type * as ReactNative from 'react-native';

import type * as Sessao from '../../estado/sessao';

// O App.tsx importa o expo-font, que puxa o expo-asset (nativo, fora do jest).
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
// A `Raiz` monta o SafeAreaProvider sem medidas: o mock oficial as fornece.
jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const LINK = { pathname: '/redefinir-senha', search: '?token_hash=x&type=recovery' };

type Janela = { location?: unknown; history?: unknown };
const janela = globalThis.window as unknown as Janela;
const ORIGINAL = { location: janela.location, history: janela.history };

let desmontar: (() => Promise<void> | void) | null = null;

afterEach(async () => {
  await desmontar?.();
  desmontar = null;
  janela.location = ORIGINAL.location;
  janela.history = ORIGINAL.history;
});

/**
 * Carrega o app do zero como se o navegador estivesse em `LINK`, na
 * plataforma pedida. A plataforma volta à do jest antes de desenhar: só a
 * leitura do link, na carga do módulo, precisa vê-la.
 */
async function abrirPeloLink(plataforma: 'web' | 'ios') {
  jest.resetModules();
  const replaceState = jest.fn();
  janela.location = LINK;
  janela.history = { replaceState };

  const { Platform } = require('react-native') as typeof ReactNative;
  const doJest = Platform.OS;
  const { render, cleanup } = require('@testing-library/react-native/pure') as typeof Biblioteca;
  const { useSessao } = require('../../estado/sessao') as typeof Sessao;
  const carregar = jest.fn(async () => {});
  useSessao.setState({ carregar });

  Object.defineProperty(Platform, 'OS', { value: plataforma, configurable: true });
  let Raiz: React.ComponentType;
  try {
    Raiz = require('../../../App').default;
  } finally {
    Object.defineProperty(Platform, 'OS', { value: doJest, configurable: true });
  }

  const React = require('react') as typeof import('react');
  const tela = await render(React.createElement(Raiz));
  desmontar = cleanup;
  return { tela, useSessao, carregar, replaceState };
}

describe('o App aberto pelo link do e-mail', () => {
  it('na web: abre a tela de nova senha, sem restaurar a sessão, e limpa a barra', async () => {
    const { tela, useSessao, carregar, replaceState } = await abrirPeloLink('web');

    // O título aparece duas vezes: no cabeçalho e na barra que surge com a rolagem.
    expect((await tela.findAllByText('Criar uma senha nova')).length).toBeGreaterThan(0);
    expect(useSessao.getState()).toMatchObject({ fase: 'entrada', tela: 'novaSenha' });
    expect(carregar).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/');
  });

  it('no nativo não há link: a sessão carrega como sempre', async () => {
    const { tela, useSessao, carregar, replaceState } = await abrirPeloLink('ios');

    expect(carregar).toHaveBeenCalledTimes(1);
    expect(useSessao.getState().tela).not.toBe('novaSenha');
    expect(tela.queryAllByText('Criar uma senha nova')).toHaveLength(0);
    expect(replaceState).not.toHaveBeenCalled();
  });
});
