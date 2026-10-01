/**
 * Fumaça: monta cada uma das 28 telas do app e as 7 da entrada com a semente
 * e afirma que nenhuma lança; monta o app inteiro com um sheet aberto; e
 * cobra o contrato de tipo de tela (raiz, empilhada, sheet) de todas.
 *
 * É o teste de melhor custo-benefício da expansão. Ele não checa conteúdo —
 * pega o erro que mais aparece ao acrescentar tela: aluno indefinido, cor
 * indefinida, `.map` num campo opcional. Sem ele, esses erros só apareceriam
 * tocando na tela certa, no aparelho.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { App } from '../../../App';
import { useDados } from '../../estado/dados';
import { useFormularios } from '../../estado/formularios';
import { ABA_DA_TELA, TIPO_DA_TELA, useNavegacao, type Tela } from '../../estado/navegacao';
import { useSessao } from '../../estado/sessao';
import { TemaProvider } from '../../tema/TemaProvider';
import { Acesso } from '../entrada/Acesso';
import { BoasVindas } from '../entrada/BoasVindas';
import { Disponibilidade } from '../entrada/Disponibilidade';
import { Perfil } from '../entrada/Perfil';
import { PoliticaInicial } from '../entrada/PoliticaInicial';
import { PrimeiroAluno } from '../entrada/PrimeiroAluno';
import { Splash } from '../entrada/Splash';
import { REGISTRO } from '../registro';

// O App.tsx importa o expo-font, que puxa o expo-asset (nativo, fora do
// jest). O teste só precisa do shell do App, não das fontes.
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

/** Medidas fixas: sem isso o SafeAreaProvider não resolve os insets no teste. */
const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function montarComponente(Componente: React.ComponentType) {
  return render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Componente />
      </TemaProvider>
    </SafeAreaProvider>,
  );
}

const montar = (tela: Tela) => montarComponente(REGISTRO[tela]);

/** As sete telas da máquina de entrada (estado/sessao.ts), fora do registro. */
const ENTRADA: [string, React.ComponentType][] = [
  ['Splash', Splash],
  ['BoasVindas', BoasVindas],
  ['Acesso', Acesso],
  ['Perfil (passo 1)', Perfil],
  ['Disponibilidade (passo 2)', Disponibilidade],
  ['PoliticaInicial (passo 3)', PoliticaInicial],
  ['PrimeiroAluno (passo 4)', PrimeiroAluno],
];

/** As onze telas de sheet do MAPA-DE-TELAS.md (docs/design/redesign-ios-glass). */
const SHEETS: Tela[] = [
  'alunoForm',
  'confirmarReposicao',
  'dispAluno',
  'lembrete',
  'outroHorario',
  'pacote',
  'pagamento',
  'registrar',
  'reposicao',
  'resultado',
  'semHorario',
];

const TELAS = Object.keys(REGISTRO) as Tela[];

// Timer falso em todo este arquivo. As ~150 montagens daqui deixam
// `requestAnimationFrame` pendente — o preset do React Native o implementa com
// `setTimeout`, e o Animated agenda um por quadro. Quando o ambiente do Jest cai
// antes deles, o processo sai com código 1 mesmo com as 10 suítes passando, e o
// CI fica vermelho sem nenhum teste falhando. Voltar para o timer real descarta
// o que ficou agendado no relógio falso, em vez de deixar vazando.
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

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

  it('toda tela do registro tem tipo em TIPO_DA_TELA', () => {
    expect(Object.keys(TIPO_DA_TELA).sort()).toEqual(TELAS.sort());
  });

  it('os sheets são os onze do mapa de telas', () => {
    const sheets = TELAS.filter((t) => TIPO_DA_TELA[t] === 'sheet');
    expect(sheets.sort()).toEqual([...SHEETS].sort());
  });

  describe('só tela de sheet desenha o painel modal', () => {
    beforeEach(() => {
      useNavegacao.setState({ tela: 'aluno', pilha: [], alunoId: 'raf' });
    });

    it.each(TELAS)('%s', async (tela) => {
      const { toJSON } = await montar(tela);
      // O painel do Sheet é o único `accessibilityViewIsModal` do app.
      const modal = JSON.stringify(toJSON()).includes('"accessibilityViewIsModal":true');
      expect(modal).toBe(TIPO_DA_TELA[tela] === 'sheet');
    });
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

describe('telas de entrada montam', () => {
  beforeEach(() => {
    useFormularios.getState().limparTudo();
    useSessao.setState({ fase: 'entrada', tela: 'boasVindas', passo: 1, email: null });
  });

  it.each(ENTRADA)('%s', (_nome, Componente) => {
    expect(() => montarComponente(Componente)).not.toThrow();
  });
});

describe('app com um sheet aberto', () => {
  beforeEach(() => {
    useFormularios.getState().limparTudo();
    useDados.setState({ carregado: true });
    // Registrar aberto pela lista de alunos: o painel sobe sobre a Home.
    useNavegacao.setState({
      tela: 'registrar',
      pilha: [{ tela: 'home', alunoId: null }],
      alunoId: null,
    });
  });

  it('desenha a tela de fundo e o painel, sem a tab bar', async () => {
    // As consultas vão no resultado do render, não no `screen` global: as
    // montagens síncronas acima podem terminar depois e trocar o `screen`.
    const app = await montarComponente(App);
    // O tema carrega do AsyncStorage antes da primeira pintura.
    expect(await app.findByText('Qual aluno')).toBeTruthy();
    expect(app.getByRole('header', { name: 'Registrar aula' })).toBeTruthy();
    // A tela de baixo continua desenhada atrás do painel, mas fora do
    // leitor de tela: o sheet é modal nos dois sistemas.
    expect(app.getAllByText('Alunos', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    expect(app.queryAllByText('Alunos')).toHaveLength(0);
    // A tab bar some com o sheet aberto.
    expect(app.queryByRole('tab')).toBeNull();
  });
});
