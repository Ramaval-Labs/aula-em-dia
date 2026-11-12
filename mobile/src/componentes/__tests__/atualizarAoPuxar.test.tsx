/**
 * Puxar para atualizar (SCRUM-88).
 *
 * Quem relê o banco é a store (estado/__tests__/dados.test.ts). Aqui se cobra
 * o gesto: no local a tela não oferece o puxar; no remoto, soltar chama
 * `carregar` uma vez, e o indicador some quando ela termina.
 */

import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { RefreshControl, ScrollView, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDados } from '../../estado/dados';
import { TemaProvider } from '../../tema/TemaProvider';
import { TelaVidro, useAtualizarAoPuxar } from '../Chassi';

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const comTema = (filho: React.ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>{filho}</TemaProvider>
    </SafeAreaProvider>,
  );

function Rolagem({ remoto }: { remoto: boolean }) {
  const atualizar = useAtualizarAoPuxar(0, remoto);
  return (
    <ScrollView refreshControl={atualizar}>
      <Text>conteúdo</Text>
    </ScrollView>
  );
}

const ORIGINAL = useDados.getState().carregar;
/** A rolagem nativa acima do texto: é ela que recebe o `refreshControl`. */
const controle = (texto = 'conteúdo') => {
  let no = screen.getByText(texto) as { type?: unknown; parent: unknown; props: Record<string, unknown> } | null;
  while (no && no.type !== 'RCTScrollView') no = no.parent as typeof no;
  if (!no) throw new Error('rolagem não encontrada');
  return no.props.refreshControl as
    | React.ReactElement<React.ComponentProps<typeof RefreshControl>>
    | undefined;
};

afterEach(() => {
  useDados.setState({ carregar: ORIGINAL });
});

it('no local, a TelaVidro não oferece o puxar para atualizar', async () => {
  await comTema(
    <TelaVidro tipo="raiz" titulo="Alunos">
      <Text>lista</Text>
    </TelaVidro>,
  );
  expect(controle('lista')).toBeUndefined();
});

it('no local, o gancho não devolve controle', async () => {
  await comTema(<Rolagem remoto={false} />);
  expect(controle()).toBeUndefined();
});

it('no remoto, puxar chama carregar uma vez e o indicador some ao terminar', async () => {
  let terminar: () => void = () => {};
  const carregar = jest.fn(() => new Promise<void>((r) => (terminar = r)));
  useDados.setState({ carregar });
  await comTema(<Rolagem remoto />);

  expect(controle()?.props.refreshing).toBe(false);
  await act(async () => controle()?.props.onRefresh?.());
  expect(carregar).toHaveBeenCalledTimes(1);
  expect(controle()?.props.refreshing).toBe(true);

  await act(async () => terminar());
  expect(controle()?.props.refreshing).toBe(false);
});

it('o indicador some mesmo quando a carga não traz nada novo', async () => {
  // `carregar` não rejeita: a falha vira aviso na store e a promessa resolve.
  const carregar = jest.fn(async () => {});
  useDados.setState({ carregar });
  await comTema(<Rolagem remoto />);

  await act(async () => controle()?.props.onRefresh?.());
  expect(controle()?.props.refreshing).toBe(false);
});

it('desmontar no meio da carga não tenta mexer no estado', async () => {
  let terminar: () => void = () => {};
  useDados.setState({ carregar: jest.fn(() => new Promise<void>((r) => (terminar = r))) });
  const erro = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { unmount } = await comTema(<Rolagem remoto />);

  await act(async () => controle()?.props.onRefresh?.());
  await unmount();
  await act(async () => terminar());
  const chamadas = erro.mock.calls.map((c) => String(c[0]).slice(0, 160));
  erro.mockRestore();
  expect(chamadas).toEqual([]);
});
