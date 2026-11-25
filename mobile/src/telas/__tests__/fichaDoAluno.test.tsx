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

describe('horário diferente em cada dia (SCRUM-101)', () => {
  beforeEach(() => {
    useNavegacao.setState({ tela: 'alunoForm', pilha: [], alunoId: 'mar' });
  });

  const interruptor = () => screen.getByRole('switch', { name: 'Horário diferente em cada dia' });

  it('com um dia só, o interruptor não aparece', async () => {
    await montar();
    await fireEvent.press(dia('Quinta'));
    expect(screen.queryByRole('switch', { name: 'Horário diferente em cada dia' })).toBeNull();
  });

  it('ligado, cada dia ganha o seu campo, e salvar grava o começo de cada um', async () => {
    await montar();
    await fireEvent.press(interruptor());
    // os dois campos começam com a hora que já estava: 18
    expect(screen.getAllByDisplayValue('18')).toHaveLength(2);
    await fireEvent.changeText(screen.getByLabelText('Hora · Quinta'), '1930');
    await fireEvent.press(screen.getByText('Salvar alterações'));

    const mar = aluno('mar');
    expect(mar?.aulaFixa).toEqual({ dias: ['ter', 'qui'], hora: 18, porDia: { qui: 19 * 60 + 30 } });
    expect(mar?.dia).toBe('terça e quinta');
    expect(mar?.hora).toBe('18h e 19h30');
  });

  it('um dia com hora inválida segura o botão', async () => {
    await montar();
    await fireEvent.press(interruptor());
    await fireEvent.changeText(screen.getByLabelText('Hora · Terça'), '1820');
    expect(screen.getByText('Use minutos de 15 em 15: 00, 15, 30 ou 45')).toBeTruthy();
    await fireEvent.press(screen.getByText('Salvar alterações'));
    // nada foi salvo: o Mateus da semente segue sem a estrutura
    expect(aluno('mar')?.aulaFixa).toBeUndefined();
    expect(aluno('mar')?.hora).toBe('18h');
  });

  it('a edição de quem tem horário por dia abre com o interruptor ligado', async () => {
    useDados.setState((s) => ({
      alunos: s.alunos.map((a) =>
        a.id === 'mar'
          ? { ...a, aulaFixa: { dias: ['ter', 'qui'], hora: 18, porDia: { qui: 1170 } } }
          : a,
      ),
    }));
    useFormularios.getState().limparTudo();
    await montar();
    expect(interruptor().props.accessibilityState?.checked).toBe(true);
    expect(screen.getByDisplayValue('19:30')).toBeTruthy();
  });

  it('horarioDoRascunho: desligado, vale a hora única mesmo com horaPorDia guardado', () => {
    const r = { dias: ['ter', 'qui'] as const, hora: '18', horaPorDia: { qui: '19:30' } };
    expect(horarioDoRascunho({ ...r, dias: [...r.dias], porDia: false }).aulaFixa).toEqual({
      dias: ['ter', 'qui'],
      hora: 18,
    });
  });
});
