/**
 * A tela de Avisos com o lembrete antes da aula (SCRUM-92).
 *
 * O que se cobra: o quinto item aparece com a frase que a regra do SCRUM-91
 * cumpre, liga e desliga como os outros, e uma preferência gravada antes dele
 * (sem a chave `antesDaAula`) abre com o padrão, ligado.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { estadoInicial } from '../../dados/semente';
import { AVISOS_PADRAO, useDados } from '../../estado/dados';
import { useFormularios } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { Avisos } from '../ajustes/Avisos';

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Avisos />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const chave = (nome: string) => screen.getByRole('switch', { name: nome });
const ligado = (nome: string) => chave(nome).props.accessibilityState?.checked;

beforeEach(() => {
  jest.useFakeTimers();
  // `estadoInicial()` não traz a preferência, e o `setState` só mescla: sem o
  // `undefined` explícito, a preferência salva por um teste vazaria no outro.
  useDados.setState({ ...estadoInicial(), preferenciasDeAviso: undefined });
  useFormularios.getState().limparTudo();
  useNavegacao.setState({ tela: 'avisos', pilha: [], alunoId: null });
  useToast.setState({ avisar: jest.fn() });
});

afterEach(() => {
  jest.useRealTimers();
});

it('mostra os cinco avisos, com "Antes da aula" logo depois de "Aula do dia"', async () => {
  await montar();
  const nomes = screen.getAllByRole('switch').map((s) => s.props.accessibilityLabel);
  expect(nomes).toEqual([
    'Aula do dia',
    'Antes da aula',
    'Saldo baixo',
    'Reposição pendente',
    'Pagamento vencendo',
  ]);
  expect(screen.getByText('Uma hora antes de cada aula')).toBeTruthy();
});

it('sem preferência salva, "Antes da aula" abre ligado, como o padrão', async () => {
  useDados.setState({ preferenciasDeAviso: undefined });
  await montar();
  expect(AVISOS_PADRAO.antesDaAula).toBe(true);
  expect(ligado('Antes da aula')).toBe(true);
});

it('preferência gravada antes do aviso existir abre com ele ligado', async () => {
  useDados.setState({
    preferenciasDeAviso: {
      aulaDoDia: false,
      saldoBaixo: true,
      reposicaoPendente: false,
      pagamentoVencendo: true,
    },
  });
  await montar();
  expect(ligado('Antes da aula')).toBe(true);
  // o que estava salvo continua como estava
  expect(ligado('Aula do dia')).toBe(false);
  expect(ligado('Pagamento vencendo')).toBe(true);
});

it('desligar e salvar grava o objeto inteiro, com antesDaAula', async () => {
  await montar();
  await fireEvent.press(chave('Antes da aula'));
  expect(ligado('Antes da aula')).toBe(false);
  await fireEvent.press(screen.getByText('Salvar'));

  expect(useDados.getState().preferenciasDeAviso).toEqual({
    ...AVISOS_PADRAO,
    antesDaAula: false,
  });
});
