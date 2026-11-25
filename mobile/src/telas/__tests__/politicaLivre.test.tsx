/**
 * A política de faltas com prazo e limite livres (SCRUM-101).
 *
 * O que se cobra: o prazo mínimo de aviso é digitado em horas (1 a 720), um
 * prazo inválido segura o Salvar, e o limite de reposições passa de 5.
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
import { Politica } from '../Politica';

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Politica />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const campoDoPrazo = () => screen.getByLabelText('Em horas antes da aula');
const salvar = () => screen.getByRole('button', { name: 'Salvar alterações' });

beforeEach(() => {
  jest.useFakeTimers();
  useDados.setState({ ...estadoInicial() });
  useFormularios.getState().limparTudo();
  useNavegacao.setState({ tela: 'politica', pilha: [], alunoId: null });
  useToast.setState({ avisar: jest.fn() });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('prazo mínimo de aviso, digitado', () => {
  it('abre com o prazo salvo', async () => {
    await montar();
    expect(campoDoPrazo().props.value).toBe(String(estadoInicial().politicas.avisoHoras));
  });

  it('1h, de quem dá aula online, salva', async () => {
    await montar();
    await fireEvent.changeText(campoDoPrazo(), '1');
    expect(screen.getByText(/Prazo de aviso muda de \d+h para 1h/)).toBeTruthy();
    await fireEvent.press(salvar());
    expect(useDados.getState().politicas.avisoHoras).toBe(1);
  });

  it('zero mostra o erro e segura o Salvar', async () => {
    await montar();
    await fireEvent.changeText(campoDoPrazo(), '0');
    expect(screen.getByText('Use pelo menos 1 hora')).toBeTruthy();
    expect(salvar().props.accessibilityState?.disabled).toBe(true);
  });

  it('campo vazio também segura', async () => {
    await montar();
    await fireEvent.changeText(campoDoPrazo(), '');
    expect(screen.getByText('Informe o prazo em horas')).toBeTruthy();
    expect(salvar().props.accessibilityState?.disabled).toBe(true);
  });
});

describe('reposições por pacote', () => {
  it('o seletor passa de 5', async () => {
    useDados.setState((s) => ({ politicas: { ...s.politicas, limiteReposicoes: 5 } }));
    await montar();
    // o trilho é um controle ajustável só; o + responde à ação de aumentar
    const seletor = screen.getByRole('adjustable', { name: 'reposições por pacote' });
    await fireEvent(seletor, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    await fireEvent.press(salvar());
    expect(useDados.getState().politicas.limiteReposicoes).toBe(6);
  });
});
