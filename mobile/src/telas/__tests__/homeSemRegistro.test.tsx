/**
 * O lembrete da Home: aulas de hoje que terminaram sem registro (SCRUM-101).
 *
 * A regra está em `dominio/avisos.ts` (testada lá); aqui se cobra o bloco: ele
 * aparece com os nomes, o atalho abre o Registrar do primeiro aluno, e some
 * quando a aula foi registrada. O relógio é fixado em 23h.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { estadoInicial } from '../../dados/semente';
import { diaDaSemanaDe } from '../../dominio/disponibilidade';
import { hoje } from '../../dominio/datas';
import type { Aluno, DiaDaSemana } from '../../dominio/tipos';
import { useDados } from '../../estado/dados';
import { useFormularios } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { Home } from '../Home';

jest.mock('../../dominio/datas', () => ({
  ...jest.requireActual('../../dominio/datas'),
  minutosAgora: () => 23 * 60,
}));

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

const DIA = diaDaSemanaDe(hoje()) as DiaDaSemana;

/** Só o Mateus tem aula hoje, às 18h; os outros ficam sem aula fixa. */
function soMateusHoje() {
  useDados.setState((s) => ({
    alunos: s.alunos.map(
      (a): Aluno =>
        a.id === 'mar'
          ? { ...a, pausado: false, aulaFixa: { dias: [DIA], hora: 18 } }
          : { ...a, aulaFixa: { dias: [], hora: null } },
    ),
  }));
}

beforeEach(() => {
  jest.useFakeTimers();
  useDados.setState({ ...estadoInicial() });
  useFormularios.getState().limparTudo();
  useNavegacao.setState({ tela: 'home', pilha: [], alunoId: null });
  useToast.setState({ avisar: jest.fn() });
});

afterEach(() => {
  jest.useRealTimers();
});

it('a aula de hoje que terminou sem registro aparece, com o atalho', async () => {
  soMateusHoje();
  await montar();
  expect(screen.getByText('1 aula de hoje sem registro')).toBeTruthy();
  await fireEvent.press(screen.getByText('Registrar Mateus'));
  expect(useNavegacao.getState().tela).toBe('registrar');
  expect(useNavegacao.getState().alunoId).toBe('mar');
});

it('registrada a aula, o lembrete some', async () => {
  soMateusHoje();
  useDados.getState().registrarAula('mar', 'realizada', 0);
  await montar();
  expect(screen.queryByText(/sem registro$/)).toBeNull();
});
