/**
 * Fumaça: monta cada uma das 28 telas com a semente e afirma que nenhuma
 * lança.
 *
 * É o teste de melhor custo-benefício da expansão. Ele não checa conteúdo —
 * pega o erro que mais aparece ao acrescentar tela: aluno indefinido, cor
 * indefinida, `.map` num campo opcional. Sem ele, esses erros só apareceriam
 * tocando na tela certa, no aparelho.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDados } from '../../estado/dados';
import { useFormularios } from '../../estado/formularios';
import { ABA_DA_TELA, useNavegacao, type Tela } from '../../estado/navegacao';
import { TemaProvider } from '../../tema/TemaProvider';
import { REGISTRO } from '../registro';

/** Medidas fixas: sem isso o SafeAreaProvider não resolve os insets no teste. */
const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function montar(tela: Tela) {
  const Componente = REGISTRO[tela];
  return render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Componente />
      </TemaProvider>
    </SafeAreaProvider>,
  );
}

const TELAS = Object.keys(REGISTRO) as Tela[];

describe('todas as telas montam', () => {
  beforeEach(() => {
    useFormularios.getState().limparTudo();
  });

  describe('sem aluno selecionado', () => {
    beforeEach(() => {
      useNavegacao.setState({ tela: 'home', pilha: [], alunoId: null });
    });

    it.each(TELAS)('%s', (tela) => {
      expect(() => montar(tela)).not.toThrow();
    });
  });

  describe('com um aluno em atraso selecionado', () => {
    beforeEach(() => {
      useNavegacao.setState({ tela: 'aluno', pilha: [], alunoId: 'val' });
    });

    it.each(TELAS)('%s', (tela) => {
      expect(() => montar(tela)).not.toThrow();
    });
  });

  describe('com um aluno com reposição pendente', () => {
    beforeEach(() => {
      useNavegacao.setState({ tela: 'aluno', pilha: [], alunoId: 'raf' });
    });

    it.each(TELAS)('%s', (tela) => {
      expect(() => montar(tela)).not.toThrow();
    });
  });

  describe('com um aluno sem pacote', () => {
    beforeEach(() => {
      useNavegacao.setState({ tela: 'aluno', pilha: [], alunoId: 'bea' });
    });

    it.each(TELAS)('%s', (tela) => {
      expect(() => montar(tela)).not.toThrow();
    });
  });

  it('toda tela declarada está no registro', () => {
    expect(TELAS.sort()).toEqual(Object.keys(ABA_DA_TELA).sort());
  });

  it('nenhuma tela some quando não há aluno nenhum cadastrado', () => {
    const semente = useDados.getState();
    useDados.setState({ alunos: [], extratos: {} });
    useNavegacao.setState({ tela: 'home', pilha: [], alunoId: null });
    for (const tela of TELAS) {
      expect(() => montar(tela)).not.toThrow();
    }
    useDados.setState({ alunos: semente.alunos, extratos: semente.extratos });
  });
});
