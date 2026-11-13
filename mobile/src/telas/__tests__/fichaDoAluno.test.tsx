/**
 * A ficha do aluno escolhe os dias e a hora da aula (SCRUM-90).
 *
 * O texto que a lista mostra ("terça e quinta", "18h") sai do domínio
 * (`rotuloDaAulaFixa`), e a estrutura vai junto para o motor de reposição.
 * Aqui se cobra a tela: o que ela abre marcado, o que ela grava, e que a hora
 * sozinha, sem dia, não vira aula fixa.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { estadoInicial } from '../../dados/semente';
import { blocosDaAulaFixa } from '../../dominio/agenda';
import { useDados } from '../../estado/dados';
import { horarioDoRascunho, useFormularios } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { AlunoForm } from '../AlunoForm';

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <AlunoForm />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const dia = (nome: string) => screen.getByRole('checkbox', { name: nome });
const marcado = (nome: string) => dia(nome).props.accessibilityState?.checked;
const aluno = (id: string) => useDados.getState().alunos.find((a) => a.id === id);

beforeEach(() => {
  jest.useFakeTimers();
  useDados.setState({ ...estadoInicial() });
  useFormularios.getState().limparTudo();
  useToast.setState({ avisar: jest.fn() });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('editar o Mateus (terça e quinta, 18h)', () => {
  beforeEach(() => {
    useNavegacao.setState({ tela: 'alunoForm', pilha: [], alunoId: 'mar' });
  });

  it('abre com terça e quinta marcadas e 18 na hora', async () => {
    await montar();
    expect(marcado('Terça')).toBe(true);
    expect(marcado('Quinta')).toBe(true);
    expect(marcado('Segunda')).toBe(false);
    expect(marcado('Sábado')).toBe(false);
    expect(screen.getByDisplayValue('18')).toBeTruthy();
  });

  it('a fileira vai de segunda a sábado, sem domingo', async () => {
    await montar();
    for (const nome of ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']) {
      expect(dia(nome)).toBeTruthy();
    }
    expect(screen.queryByRole('checkbox', { name: 'Domingo' })).toBeNull();
  });

  it('salvar grava a estrutura e o texto que a lista mostra', async () => {
    await montar();
    await fireEvent.press(dia('Quinta'));
    await fireEvent.press(dia('Segunda'));
    await fireEvent.changeText(screen.getByDisplayValue('18'), '19');
    await fireEvent.press(screen.getByText('Salvar alterações'));

    const mar = aluno('mar');
    expect(mar?.aulaFixa).toEqual({ dias: ['seg', 'ter'], hora: 19 });
    expect(mar?.dia).toBe('segunda e terça');
    expect(mar?.hora).toBe('19h');
    // o motor de reposição passa a descartar a aula nova
    expect(blocosDaAulaFixa(mar!)).toEqual([
      { dia: 'seg', faixa: 'fimTarde' },
      { dia: 'ter', faixa: 'fimTarde' },
    ]);
  });

  it('salvar sem mudar nada mantém o texto da semente', async () => {
    await montar();
    await fireEvent.press(screen.getByText('Salvar alterações'));
    const mar = aluno('mar');
    expect(mar?.dia).toBe('terça e quinta');
    expect(mar?.hora).toBe('18h');
    expect(mar?.aulaFixa).toEqual({ dias: ['ter', 'qui'], hora: 18 });
  });
});

describe('aluno novo', () => {
  beforeEach(() => {
    useNavegacao.setState({ tela: 'alunoForm', pilha: [], alunoId: null });
  });

  it('sem dia marcado, a hora não aparece e a dica explica', async () => {
    await montar();
    expect(screen.getByText('Sem dia marcado, ele fica sem horário fixo.')).toBeTruthy();
    expect(screen.queryByText('Hora')).toBeNull();
  });

  it('criar sem dia grava "sem horário fixo"', async () => {
    await montar();
    await fireEvent.changeText(screen.getByPlaceholderText('Nome do aluno'), 'Ana Souza');
    await fireEvent.press(screen.getByText('Criar aluno'));

    const ana = useDados.getState().alunos.find((a) => a.name === 'Ana Souza');
    expect(ana?.dia).toBe('sem horário fixo');
    expect(ana?.hora).toBe('');
    expect(ana?.aulaFixa).toEqual({ dias: [], hora: null });
  });
});

describe('horarioDoRascunho', () => {
  it('a hora sozinha, sem dia, não vira aula fixa', () => {
    expect(horarioDoRascunho({ dias: [], hora: '18' })).toEqual({
      aulaFixa: { dias: [], hora: null },
      dia: 'sem horário fixo',
      hora: '',
    });
  });

  it('dia sem hora fica sem hora', () => {
    expect(horarioDoRascunho({ dias: ['sab'], hora: '' })).toEqual({
      aulaFixa: { dias: ['sab'], hora: null },
      dia: 'sábado',
      hora: '',
    });
  });
});
