/**
 * O sheet desce ao fechar e fecha arrastando (SCRUM-42).
 *
 * O que se cobra: quem fecha (a navegação, ou o `aoFechar`) só é chamado no
 * fim da descida; dois toques seguidos fecham uma vez; com "reduzir
 * movimento" fecha na hora; e a regra de soltar o arrasto. O gesto em si é
 * conferido no aparelho: o Jest não simula o histórico de toques do
 * PanResponder.
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TemaProvider } from '../../tema/TemaProvider';
import { MOVIMENTO } from '../../tema/tokens';
import { deveFecharAoSoltar, Sheet } from '../Sheet';

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = (aoFechar: () => void) =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Sheet titulo="Registrar aula" aoFechar={aoFechar} rodape={<Text>Confirmar</Text>}>
          <Text>corpo</Text>
        </Sheet>
      </TemaProvider>
    </SafeAreaProvider>,
  );

/** Deixa a subida terminar, para o painel estar aberto de verdade. */
const esperarSubir = () =>
  act(async () => {
    jest.advanceTimersByTime(MOVIMENTO.sheetMs + 50);
  });

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('fechar desce o painel', () => {
  it('"Cancelar" só fecha no fim da descida', async () => {
    const aoFechar = jest.fn();
    await montar(aoFechar);
    await esperarSubir();

    await fireEvent.press(screen.getByText('Cancelar'));
    expect(aoFechar).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(MOVIMENTO.sheetMs + 50);
    });
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it('o toque acima do painel também desce antes de fechar', async () => {
    const aoFechar = jest.fn();
    await montar(aoFechar);
    await esperarSubir();

    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(aoFechar).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(MOVIMENTO.sheetMs + 50);
    });
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it('dois toques seguidos fecham uma vez só', async () => {
    const aoFechar = jest.fn();
    await montar(aoFechar);
    await esperarSubir();

    await fireEvent.press(screen.getByText('Cancelar'));
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    await act(async () => {
      jest.advanceTimersByTime(MOVIMENTO.sheetMs * 2);
    });
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it('com "reduzir movimento", fecha na hora', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const aoFechar = jest.fn();
    await montar(aoFechar);
    // a preferência chega por uma promessa: deixa ela resolver
    await act(async () => {});

    await fireEvent.press(screen.getByText('Cancelar'));
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it('a faixa do puxador e do cabeçalho é a que arrasta', async () => {
    await montar(jest.fn());
    const faixa = screen.getByTestId('arrasto-do-sheet');
    expect(faixa.props.onResponderMove).toEqual(expect.any(Function));
    // o "Cancelar" mora dentro dela e continua sendo um botão
    expect(screen.getByText('Cancelar')).toBeTruthy();
  });
});

describe('deveFecharAoSoltar', () => {
  const ALTURA = 700; // um quarto: 175

  it('desceu mais de um quarto da altura: fecha', () => {
    expect(deveFecharAoSoltar(200, 0.2, ALTURA)).toBe(true);
  });

  it('desceu pouco e devagar: volta', () => {
    expect(deveFecharAoSoltar(120, 0.3, ALTURA)).toBe(false);
  });

  it('desceu pouco, mas soltou rápido: fecha', () => {
    expect(deveFecharAoSoltar(60, 1.4, ALTURA)).toBe(true);
  });

  it('arrastou para cima: nunca fecha', () => {
    expect(deveFecharAoSoltar(-80, 2, ALTURA)).toBe(false);
    expect(deveFecharAoSoltar(0, 2, ALTURA)).toBe(false);
  });
});
