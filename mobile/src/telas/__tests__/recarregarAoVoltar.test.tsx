/**
 * O app do professor relê o banco ao voltar ao primeiro plano (SCRUM-70): é
 * assim que a resposta do aluno pelo link aparece sem reabrir o app.
 */

import { renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { useRecarregarAoVoltar } from '../../../App';

// O App.tsx importa o expo-font, que puxa o expo-asset (nativo, fora do jest).
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

/** Todo ouvinte registrado no teste: outros módulos também escutam o AppState. */
let ouvintes: ((estado: AppStateStatus) => void)[] = [];
const mudar = (estado: AppStateStatus) => ouvintes.forEach((o) => o(estado));
const remover = jest.fn();

beforeEach(() => {
  ouvintes = [];
  remover.mockClear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_tipo, ouvinte) => {
    ouvintes.push(ouvinte as (estado: AppStateStatus) => void);
    return { remove: remover } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
});

afterEach(() => jest.restoreAllMocks());

it('no remoto, voltar do segundo plano relê o banco, uma vez por volta', async () => {
  const recarregar = jest.fn();
  const { unmount } = await renderHook(() => useRecarregarAoVoltar(recarregar, true));

  mudar('background');
  expect(recarregar).not.toHaveBeenCalled();
  mudar('active');
  expect(recarregar).toHaveBeenCalledTimes(1);
  // Já ativo: não é volta.
  mudar('active');
  expect(recarregar).toHaveBeenCalledTimes(1);

  await unmount();
  expect(remover).toHaveBeenCalled();
});

it('no local, voltar ao primeiro plano não relê nada: os dados são do aparelho', async () => {
  const recarregar = jest.fn();
  await renderHook(() => useRecarregarAoVoltar(recarregar, false));
  mudar('background');
  mudar('active');
  expect(recarregar).not.toHaveBeenCalled();
});
