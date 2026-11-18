/**
 * Qual tema o app abre (SCRUM-97). O tema salvo manda; sem ele, vale o do
 * sistema na primeira carga. O efeito que lê isso roda uma vez só: o tema do
 * sistema entra por uma ref, e não pela lista de dependências, então trocá-lo
 * depois da carga não troca o tema do app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { CHAVE_TEMA } from '../../dados/armazenamento';
import { TemaProvider, useTema } from '../TemaProvider';

let mockSistema: 'light' | 'dark' = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockSistema,
}));

function Mostra() {
  const { tema, carregado } = useTema();
  return <Text>{carregado ? `tema ${tema}` : 'carregando'}</Text>;
}

const montar = () =>
  render(
    <TemaProvider>
      <Mostra />
    </TemaProvider>,
  );

beforeEach(async () => {
  mockSistema = 'light';
  await AsyncStorage.clear();
});

it('o tema salvo manda sobre o do sistema', async () => {
  await AsyncStorage.setItem(CHAVE_TEMA, 'escuro');
  await montar();
  await waitFor(() => expect(screen.getByText('tema escuro')).toBeTruthy());
});

it('sem tema salvo, abre no tema do sistema', async () => {
  mockSistema = 'dark';
  await montar();
  await waitFor(() => expect(screen.getByText('tema escuro')).toBeTruthy());
});

it('trocar o tema do sistema depois da carga não troca o tema do app', async () => {
  const tela = await montar();
  await waitFor(() => expect(screen.getByText('tema claro')).toBeTruthy());

  mockSistema = 'dark';
  await tela.rerender(
    <TemaProvider>
      <Mostra />
    </TemaProvider>,
  );
  expect(screen.getByText('tema claro')).toBeTruthy();
});
