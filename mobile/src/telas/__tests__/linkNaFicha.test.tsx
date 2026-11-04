/**
 * "Copiar link do aluno" e "Gerar novo link" na ficha (SCRUM-70).
 *
 * O link vem da store, que repassa ao repositório (estado/__tests__/dados.test.ts
 * e dados/__tests__/repositorioSupabase.test.ts). Aqui se cobra a ficha: no
 * modo local as duas linhas não existem; no remoto, copiar põe o link na área
 * de transferência, e gerar um novo pede dois toques.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { avisos } from '../../estado/avisos';
import { useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { AlunoDetalhe } from '../AlunoDetalhe';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const LINK = 'http://192.168.0.10:8081/a/token-val';
const NOVO = 'http://192.168.0.10:8081/a/token-val-novo';

const montar = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <AlunoDetalhe />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const ORIGINAL = {
  linkDoAluno: useDados.getState().linkDoAluno,
  gerarNovoLink: useDados.getState().gerarNovoLink,
};
const avisar = jest.fn();
const linha = (nome: string | RegExp) => screen.getByRole('button', { name: nome });

/** O modo supabase, pela store: há link, e gerar um novo devolve outro. */
function comLink() {
  let atual = LINK;
  const gerar = jest.fn(async (_id: string) => (atual = NOVO));
  useDados.setState({ linkDoAluno: () => atual, gerarNovoLink: gerar });
  return gerar;
}

beforeEach(() => {
  // O dois toques desarma sozinho por um setTimeout: sem o relógio falso, ele
  // dispararia depois de o ambiente da suíte cair.
  jest.useFakeTimers();
  jest.clearAllMocks();
  useNavegacao.setState({ tela: 'aluno', pilha: [], alunoId: 'val' });
  useToast.setState({ avisar });
});

afterEach(() => {
  jest.useRealTimers();
  useDados.setState(ORIGINAL);
});

it('no modo local, a ficha não mostra as duas linhas do link', async () => {
  await montar();
  expect(screen.getByText('Ver como o aluno vê')).toBeTruthy();
  expect(screen.queryByText('Copiar link do aluno')).toBeNull();
  expect(screen.queryByText('Gerar novo link')).toBeNull();
});

it('copiar põe o link na área de transferência e avisa', async () => {
  comLink();
  await montar();

  await fireEvent.press(linha(/Copiar link do aluno/));
  await waitFor(() => expect(avisar).toHaveBeenCalledWith(avisos.linkCopiado));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(LINK);
});

it('gerar um novo pede dois toques, avisa, e o próximo copiar já leva o novo', async () => {
  const gerar = comLink();
  await montar();

  await fireEvent.press(linha(/Gerar novo link/));
  expect(gerar).not.toHaveBeenCalled();
  expect(screen.getByText('Tocar de novo para gerar')).toBeTruthy();

  await fireEvent.press(linha(/Tocar de novo para gerar/));
  await waitFor(() => expect(avisar).toHaveBeenCalledWith(avisos.linkNovoGerado));
  expect(gerar).toHaveBeenCalledWith('val');

  await fireEvent.press(linha(/Copiar link do aluno/));
  await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(NOVO));
});

it('o banco recusou a troca: avisa que não salvou, sem dizer que o link mudou', async () => {
  const gerar = comLink();
  gerar.mockImplementation(() => Promise.reject(new Error('sem rede')));
  await montar();

  await fireEvent.press(linha(/Gerar novo link/));
  await fireEvent.press(linha(/Tocar de novo para gerar/));
  await waitFor(() => expect(avisar).toHaveBeenCalledWith(avisos.falhaAoSalvar));
  expect(avisar).not.toHaveBeenCalledWith(avisos.linkNovoGerado);
});
