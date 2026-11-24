/**
 * A grade de horários livres e a lista sob ela (SCRUM-101).
 *
 * O toque e o arrasto são simulados pelos eventos de responder que a grade
 * escuta: a conta de coluna e de linha é a mesma do aparelho, com a largura
 * dada pelo `onLayout`. A lista é o caminho do leitor de tela, então é cobrada
 * pelo rótulo dos botões.
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { Intervalo } from '../../dominio/tipos';
import { ALVO_MINIMO } from '../../tema/alvoDeToque';
import { TemaProvider } from '../../tema/TemaProvider';
import { GradeLivre, ListaDeHorarios, mascaraDeHorario } from '../GradeLivre';
import { useTravaDaRolagem } from '../travaDaRolagem';

const comTema = (filho: React.ReactElement) => render(<TemaProvider>{filho}</TemaProvider>);

/** 300 de largura: (300 − 30 − 6 × 3) ÷ 6 = 42 por coluna. */
const LARGURA = 300;
const QUARTO = ALVO_MINIMO / 4;
/** O meio da coluna de segunda. */
const X_SEGUNDA = 30 + 3 + 21;
/** A linha das 14h, que é a 32ª de 15 minutos desde as 6h. */
const Y_DAS_14 = 32 * QUARTO + 2;
const PAGINA = 1000;

const toqueEm = (y: number, x = X_SEGUNDA, deslocamento = 0) => ({
  nativeEvent: {
    locationX: x,
    locationY: y,
    pageX: x,
    pageY: PAGINA + y + deslocamento,
    touches: [],
    changedTouches: [],
    identifier: 0,
    target: 0,
    timestamp: 0,
  },
});

async function montarGrade(horarios: Intervalo[] = []) {
  const aoMudar = jest.fn();
  await comTema(<GradeLivre horarios={horarios} aoMudar={aoMudar} />);
  const grade = screen.getByLabelText(/^Grade da semana/);
  await fireEvent(grade, 'layout', { nativeEvent: { layout: { width: LARGURA, height: 800 } } });
  return { grade, aoMudar };
}

afterEach(() => {
  jest.useRealTimers();
  useTravaDaRolagem.getState().travar(false);
});

describe('GradeLivre', () => {
  it('o toque marca a hora cheia sob o dedo', async () => {
    const { grade, aoMudar } = await montarGrade();
    await fireEvent(grade, 'responderGrant', toqueEm(Y_DAS_14));
    await fireEvent(grade, 'responderRelease', toqueEm(Y_DAS_14));
    expect(aoMudar).toHaveBeenCalledWith([{ dia: 'seg', inicio: 840, fim: 900 }]);
  });

  it('o toque num horário marcado apaga a hora', async () => {
    const { grade, aoMudar } = await montarGrade([{ dia: 'seg', inicio: 810, fim: 960 }]);
    await fireEvent(grade, 'responderGrant', toqueEm(Y_DAS_14));
    await fireEvent(grade, 'responderRelease', toqueEm(Y_DAS_14));
    expect(aoMudar).toHaveBeenCalledWith([
      { dia: 'seg', inicio: 810, fim: 840 },
      { dia: 'seg', inicio: 900, fim: 960 },
    ]);
  });

  it('o arrasto rápido é rolagem: não marca nada', async () => {
    const { grade, aoMudar } = await montarGrade();
    await fireEvent(grade, 'responderGrant', toqueEm(Y_DAS_14));
    await fireEvent(grade, 'responderMove', toqueEm(Y_DAS_14, X_SEGUNDA, 40));
    await fireEvent(grade, 'responderRelease', toqueEm(Y_DAS_14, X_SEGUNDA, 40));
    expect(aoMudar).not.toHaveBeenCalled();
  });

  it('segurar e arrastar pinta de 15 em 15 e trava a rolagem só enquanto pinta', async () => {
    jest.useFakeTimers();
    const { grade, aoMudar } = await montarGrade();
    await fireEvent(grade, 'responderGrant', toqueEm(Y_DAS_14));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(useTravaDaRolagem.getState().travada).toBe(true);
    expect(screen.getByText('Marcar segunda, 14h–14h15')).toBeTruthy();

    // duas horas abaixo: a linha das 16h, que entra inteira
    await fireEvent(grade, 'responderMove', toqueEm(Y_DAS_14, X_SEGUNDA, 8 * QUARTO));
    expect(screen.getByText('Marcar segunda, 14h–16h15')).toBeTruthy();
    await fireEvent(grade, 'responderRelease', toqueEm(Y_DAS_14, X_SEGUNDA, 8 * QUARTO));

    expect(aoMudar).toHaveBeenCalledWith([{ dia: 'seg', inicio: 840, fim: 975 }]);
    expect(useTravaDaRolagem.getState().travada).toBe(false);
  });

  it('pintando, a rolagem não leva o toque; antes disso, leva', async () => {
    jest.useFakeTimers();
    const { grade } = await montarGrade();
    await fireEvent(grade, 'responderGrant', toqueEm(Y_DAS_14));
    expect(grade.props.onResponderTerminationRequest()).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(grade.props.onResponderTerminationRequest()).toBe(false);
  });

  it('só leitura não escuta toque', async () => {
    await comTema(<GradeLivre horarios={[]} somenteLeitura />);
    expect(screen.getByLabelText(/^Grade da semana/).props.onStartShouldSetResponder).toBeUndefined();
  });

  it('o rótulo da grade resume os horários', async () => {
    await montarGrade([{ dia: 'seg', inicio: 870, fim: 1080 }]);
    expect(screen.getByLabelText('Grade da semana: 1 horário · 3h30 por semana.')).toBeTruthy();
  });
});

describe('ListaDeHorarios', () => {
  const HORARIOS: Intervalo[] = [{ dia: 'seg', inicio: 870, fim: 1080 }];

  it('lista cada horário com o dia e o trecho, e remove pelo botão', async () => {
    const aoMudar = jest.fn();
    await comTema(<ListaDeHorarios horarios={HORARIOS} aoMudar={aoMudar} />);
    expect(screen.getByText('Segunda')).toBeTruthy();
    expect(screen.getByText('14h30–18h')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Remover segunda, 14h30–18h'));
    expect(aoMudar).toHaveBeenCalledWith([]);
  });

  it('sem horário, diz que não há nenhum', async () => {
    await comTema(<ListaDeHorarios horarios={[]} aoMudar={jest.fn()} />);
    expect(screen.getByText('Nenhum horário marcado')).toBeTruthy();
  });

  it('acrescenta pelo teclado, juntando com o que encosta', async () => {
    const aoMudar = jest.fn();
    await comTema(<ListaDeHorarios horarios={HORARIOS} aoMudar={aoMudar} />);
    await fireEvent.press(screen.getByText('Adicionar horário'));
    await fireEvent.changeText(screen.getByLabelText('De'), '1800');
    await fireEvent.changeText(screen.getByLabelText('Até'), '1930');
    await fireEvent.press(screen.getByText('Adicionar'));
    expect(aoMudar).toHaveBeenCalledWith([{ dia: 'seg', inicio: 870, fim: 1170 }]);
  });

  it('horário fora do passo mostra o erro e não grava', async () => {
    const aoMudar = jest.fn();
    await comTema(<ListaDeHorarios horarios={[]} aoMudar={aoMudar} />);
    await fireEvent.press(screen.getByText('Adicionar horário'));
    await fireEvent.changeText(screen.getByLabelText('De'), '1420');
    await fireEvent.changeText(screen.getByLabelText('Até'), '1500');
    await fireEvent.press(screen.getByText('Adicionar'));
    expect(screen.getByText('Use minutos de 15 em 15: 00, 15, 30 ou 45')).toBeTruthy();
    expect(aoMudar).not.toHaveBeenCalled();
  });
});

describe('mascaraDeHorario', () => {
  it('põe os dois-pontos que o teclado numérico não tem', async () => {
    expect(mascaraDeHorario('14')).toBe('14');
    expect(mascaraDeHorario('1430')).toBe('14:30');
    expect(mascaraDeHorario('14:30')).toBe('14:30');
    expect(mascaraDeHorario('143099')).toBe('14:30');
  });
});
