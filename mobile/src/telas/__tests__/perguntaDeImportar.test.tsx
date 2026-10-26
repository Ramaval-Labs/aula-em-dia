/**
 * A pergunta "Levar seus alunos para a conta?" na tela de Alunos (`SCRUM-61`;
 * o "Agora não" que vale de vez, `SCRUM-68`).
 * O que importa é da camada de dados e está simulado aqui: o teste cobra só o
 * que a tela faz com cada resposta.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  dispensarImportacao,
  importarDadosLocais,
  temDadosLocaisParaImportar,
} from '../../dados/importacao';
import { avisos } from '../../estado/avisos';
import { useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { reiniciarPerguntaDeImportar } from '../comum/perguntaDeImportar';
import { Home } from '../Home';

jest.mock('../../dados/importacao', () => ({
  temDadosLocaisParaImportar: jest.fn(),
  importarDadosLocais: jest.fn(),
  dispensarImportacao: jest.fn(() => Promise.resolve()),
}));

const temDados = jest.mocked(temDadosLocaisParaImportar);
const importar = jest.mocked(importarDadosLocais);
const dispensar = jest.mocked(dispensarImportacao);

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Home />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const PERGUNTA = 'Levar seus alunos para a conta?';
const carregar = jest.fn(() => Promise.resolve());
const avisar = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  reiniciarPerguntaDeImportar();
  useNavegacao.setState({ tela: 'home', pilha: [], alunoId: null });
  useDados.setState({ carregar });
  useToast.setState({ avisar });
});

it('não pergunta quando o aparelho não tem o que levar', async () => {
  temDados.mockResolvedValue(false);
  await montar();
  await waitFor(() => expect(temDados).toHaveBeenCalled());
  expect(screen.queryByText(PERGUNTA)).toBeNull();
});

it('"Agora não" esconde, e a pergunta não volta ao sair e voltar', async () => {
  temDados.mockResolvedValue(true);
  const t = await montar();
  expect(await screen.findByText(PERGUNTA)).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: /Agora não/ }));
  expect(screen.queryByText(PERGUNTA)).toBeNull();
  expect(importar).not.toHaveBeenCalled();
  // E grava a dispensa: a pergunta também não volta na próxima abertura (SCRUM-68).
  expect(dispensar).toHaveBeenCalledTimes(1);

  await t.unmount();
  temDados.mockClear();
  await montar();
  expect(temDados).not.toHaveBeenCalled();
  expect(screen.queryByText(PERGUNTA)).toBeNull();
});

it('levar: se falha, avisa e a pergunta fica; se dá certo, avisa, recarrega e some', async () => {
  temDados.mockResolvedValue(true);
  await montar();
  await screen.findByText(PERGUNTA);

  importar.mockRejectedValueOnce(new Error('sem rede'));
  await fireEvent.press(screen.getByRole('button', { name: 'Levar alunos' }));
  await waitFor(() => expect(avisar).toHaveBeenCalledWith(avisos.importacaoFalhou));
  expect(screen.getByText(PERGUNTA)).toBeTruthy();
  expect(carregar).not.toHaveBeenCalled();

  importar.mockResolvedValueOnce(3);
  await fireEvent.press(screen.getByRole('button', { name: 'Levar alunos' }));
  await waitFor(() => expect(carregar).toHaveBeenCalledTimes(1));
  expect(avisar).toHaveBeenLastCalledWith('3 alunos levados para a conta.');
  expect(screen.queryByText(PERGUNTA)).toBeNull();
  // Levar não é dispensar: quem marca a importação é a própria importarDadosLocais.
  expect(dispensar).not.toHaveBeenCalled();
});
