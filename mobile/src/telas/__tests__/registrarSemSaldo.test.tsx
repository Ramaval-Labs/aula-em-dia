/**
 * Registrar com o saldo zerado e no limite de reposições (SCRUM-101).
 *
 * O que se cobra: o aviso "Sem aulas no pacote" aparece antes do registro, com
 * o atalho para renovar; e a prévia da falta avisada no limite já mostra o
 * débito, como a política promete.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { estadoInicial } from '../../dados/semente';
import { useDados } from '../../estado/dados';
import { useFormularios } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { Registrar } from '../Registrar';

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Registrar />
      </TemaProvider>
    </SafeAreaProvider>,
  );

/** O Mateus da semente, com o que o teste precisar mudar. */
const mateusCom = (mudanca: { usadas?: number; reposicoes?: number }) =>
  useDados.setState((s) => ({
    alunos: s.alunos.map((a) => (a.id === 'mar' ? { ...a, ...mudanca } : a)),
  }));

beforeEach(() => {
  jest.useFakeTimers();
  useDados.setState({ ...estadoInicial() });
  useFormularios.getState().limparTudo();
  useNavegacao.setState({ tela: 'registrar', pilha: [], alunoId: 'mar' });
  useToast.setState({ avisar: jest.fn() });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('saldo zerado', () => {
  it('avisa antes de registrar e oferece renovar', async () => {
    const total = useDados.getState().alunos.find((a) => a.id === 'mar')!.total;
    mateusCom({ usadas: total });
    await montar();
    expect(screen.getByText('Sem aulas no pacote')).toBeTruthy();
    await fireEvent.press(screen.getByText('Renovar pacote'));
    expect(useNavegacao.getState().tela).toBe('pacote');
  });

  it('com saldo, o aviso não aparece', async () => {
    mateusCom({ usadas: 0 });
    await montar();
    expect(screen.queryByText('Sem aulas no pacote')).toBeNull();
  });
});

describe('limite de reposições', () => {
  it('no limite, a falta avisada no prazo já mostra o débito', async () => {
    const { limiteReposicoes } = useDados.getState().politicas;
    mateusCom({ usadas: 0, reposicoes: limiteReposicoes });
    await montar();
    await fireEvent.press(screen.getByRole('radio', { name: /^Falta avisada\./ }));
    await fireEvent.changeText(screen.getByLabelText('Antecedência do aviso, em horas'), '48');
    expect(
      screen.getByText(
        `Aviso no prazo, mas as ${limiteReposicoes} reposições do pacote já foram usadas`,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/limite de reposições do pacote já foi usado. A aula é debitada./)).toBeTruthy();
  });
});
