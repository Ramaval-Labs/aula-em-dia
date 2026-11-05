/**
 * "Apagar minha conta" na tela de Conta (SCRUM-76).
 *
 * Quem apaga é a sessão (estado/__tests__/sessao.test.ts e a Edge Function,
 * do SCRUM-75). Aqui se cobra a tela: no modo local a linha não tem ação; no
 * supabase, um toque só arma, o segundo chama `apagarConta`, e a falha mostra
 * a frase sem tirar a pessoa da tela.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { avisos } from '../../estado/avisos';
import { podeApagarConta, useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { Conta } from '../ajustes/Conta';

jest.mock('../../estado/sessao', () => ({
  ...jest.requireActual('../../estado/sessao'),
  podeApagarConta: jest.fn(() => false),
}));

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Conta />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const pode = jest.mocked(podeApagarConta);
const ORIGINAL = useSessao.getState().apagarConta;
const avisar = jest.fn();
const apagar = jest.fn<Promise<void>, []>();
const linha = (nome: string | RegExp) => screen.getByRole('button', { name: nome });

beforeEach(() => {
  // O dois toques desarma sozinho por um setTimeout: sem o relógio falso, ele
  // dispararia depois de o ambiente da suíte cair.
  jest.useFakeTimers();
  jest.clearAllMocks();
  pode.mockReturnValue(true);
  apagar.mockResolvedValue(undefined);
  useSessao.setState({ apagarConta: apagar });
  useToast.setState({ avisar });
});

afterEach(() => {
  jest.useRealTimers();
  useSessao.setState({ apagarConta: ORIGINAL });
});

it('no modo local, a linha segue sem ação e diz que nada é apagado', async () => {
  pode.mockReturnValue(false);
  await montar();
  expect(screen.getByText('Indisponível no protótipo: nesta versão nada é apagado.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Apagar minha conta/ })).toBeNull();
});

it('no supabase, a linha diz o tamanho do estrago antes do primeiro toque', async () => {
  await montar();
  expect(linha(/Apagar minha conta/)).toBeTruthy();
  expect(screen.getByText(avisos.apagarContaSubtitulo)).toBeTruthy();
});

it('um toque só arma: o rótulo pede o segundo, e nada é apagado', async () => {
  await montar();
  await fireEvent.press(linha(/Apagar minha conta/));
  expect(screen.getByText(avisos.apagarContaConfirmar)).toBeTruthy();
  expect(apagar).not.toHaveBeenCalled();
});

it('dois toques chamam apagarConta, uma vez só', async () => {
  await montar();
  await fireEvent.press(linha(/Apagar minha conta/));
  await fireEvent.press(linha(new RegExp(avisos.apagarContaConfirmar)));
  expect(apagar).toHaveBeenCalledTimes(1);
  expect(avisar).not.toHaveBeenCalled();
});

it('enquanto o servidor não responde, a linha não arma de novo', async () => {
  apagar.mockReturnValue(new Promise<void>(() => {}));
  await montar();
  await fireEvent.press(linha(/Apagar minha conta/));
  await fireEvent.press(linha(new RegExp(avisos.apagarContaConfirmar)));
  expect(screen.queryByRole('button', { name: /Apagar minha conta/ })).toBeNull();
  expect(apagar).toHaveBeenCalledTimes(1);
});

it('a falha mostra a frase, e a linha volta para tentar de novo', async () => {
  apagar.mockRejectedValue(new Error('sem rede'));
  await montar();
  await fireEvent.press(linha(/Apagar minha conta/));
  await fireEvent.press(linha(new RegExp(avisos.apagarContaConfirmar)));
  await waitFor(() => expect(avisar).toHaveBeenCalledWith(avisos.apagarContaFalhou));
  expect(linha(/Apagar minha conta/)).toBeTruthy();
});

it('o dois toques desarma sozinho, e o toque seguinte só arma de novo', async () => {
  await montar();
  await fireEvent.press(linha(/Apagar minha conta/));
  await act(() => jest.runOnlyPendingTimers());
  expect(screen.queryByText(avisos.apagarContaConfirmar)).toBeNull();
  await fireEvent.press(linha(/Apagar minha conta/));
  expect(apagar).not.toHaveBeenCalled();
});
