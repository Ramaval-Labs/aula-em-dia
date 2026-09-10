/**
 * Máquina de navegação e consistência do registro de telas.
 *
 * O teste de consistência é o mais importante da expansão: `App.tsx` indexa
 * `REGISTRO[tela]` sem rede de proteção, então uma tela que entra na união
 * `Tela` e não entra no registro vira **tela branca silenciosa** — o tipo de
 * bug que nenhum typecheck pega e que só aparece tocando no aparelho.
 */

import { ABA_DA_TELA, TELAS_COM_NAVBAR, useNavegacao } from '../navegacao';
import { REGISTRO } from '../../telas/registro';
import { useFormularios, REGISTRO_INICIAL } from '../formularios';

const inicial = useNavegacao.getState();

beforeEach(() => {
  useNavegacao.setState({
    tela: 'home',
    pilha: [],
    alunoId: null,
    filtro: 'Urgência',
  });
  useFormularios.getState().limparTudo();
});

afterAll(() => {
  useNavegacao.setState(inicial);
});

describe('registro de telas', () => {
  it('toda tela declarada tem componente registrado', () => {
    expect(Object.keys(REGISTRO).sort()).toEqual(Object.keys(ABA_DA_TELA).sort());
  });

  it('nenhum componente do registro é indefinido', () => {
    for (const [tela, componente] of Object.entries(REGISTRO)) {
      expect(componente).toBeDefined();
      expect(typeof componente).toBe('function');
      expect(tela in ABA_DA_TELA).toBe(true);
    }
  });

  it('as telas com navbar são raízes de aba', () => {
    for (const tela of TELAS_COM_NAVBAR) {
      // A raiz de uma aba é a tela cujo nome é o da própria aba.
      expect(ABA_DA_TELA[tela]).toBe(tela);
    }
  });
});

describe('ir', () => {
  it('empilha a tela atual antes de navegar', () => {
    const { ir } = useNavegacao.getState();
    ir('aluno', { alunoId: 'raf' });
    const s = useNavegacao.getState();
    expect(s.tela).toBe('aluno');
    expect(s.alunoId).toBe('raf');
    expect(s.pilha).toEqual([{ tela: 'home', alunoId: null }]);
  });
});

describe('voltar', () => {
  it('desempilha e restaura o aluno do quadro anterior', () => {
    const { ir } = useNavegacao.getState();
    ir('aluno', { alunoId: 'raf' });
    ir('registrar');
    expect(useNavegacao.getState().voltar()).toBe(true);
    const s = useNavegacao.getState();
    expect(s.tela).toBe('aluno');
    expect(s.alunoId).toBe('raf');
  });

  it('na raiz devolve false, para o sistema fechar o app', () => {
    expect(useNavegacao.getState().voltar()).toBe(false);
  });

  it('com a pilha vazia cai na raiz da ABA atual, não na home', () => {
    // Chegar em 'politica' sem pilha simula um estado restaurado: voltar dali
    // para a lista de alunos seria salto de aba, não retorno.
    useNavegacao.setState({ tela: 'politica', pilha: [] });
    useNavegacao.getState().voltar();
    expect(useNavegacao.getState().tela).toBe('ajustes');
  });

  it('não apaga o rascunho — o assistente sobrevive ao voltar', () => {
    useFormularios.getState().abrir('registro', { desfecho: 'avisada', avisoH: 48 });
    const { ir } = useNavegacao.getState();
    ir('registrar');
    useNavegacao.getState().voltar();
    expect(useFormularios.getState().rascunhos.registro).toEqual({
      desfecho: 'avisada',
      avisoH: 48,
    });
  });
});

describe('trocarTab', () => {
  it('zera a pilha e o aluno', () => {
    const { ir } = useNavegacao.getState();
    ir('aluno', { alunoId: 'raf' });
    useNavegacao.getState().trocarTab('financeiro');
    const s = useNavegacao.getState();
    expect(s.tela).toBe('financeiro');
    expect(s.pilha).toEqual([]);
    expect(s.alunoId).toBeNull();
  });

  it('abandona os rascunhos em andamento', () => {
    useFormularios.getState().abrir('registro', REGISTRO_INICIAL);
    useNavegacao.getState().trocarTab('ajustes');
    expect(useFormularios.getState().rascunhos.registro).toBeUndefined();
  });
});

describe('concluir', () => {
  it('zera a pilha para não voltar para dentro do fluxo terminado', () => {
    const { ir } = useNavegacao.getState();
    ir('aluno', { alunoId: 'raf' });
    ir('reposicao');
    useNavegacao.getState().concluir('aluno', 'raf');
    const s = useNavegacao.getState();
    expect(s.tela).toBe('aluno');
    expect(s.alunoId).toBe('raf');
    expect(s.pilha).toEqual([]);
    expect(useNavegacao.getState().voltar()).toBe(false);
  });

  it('sem alunoId preserva o aluno atual', () => {
    useNavegacao.setState({ alunoId: 'mar' });
    useNavegacao.getState().concluir('ajustes');
    expect(useNavegacao.getState().alunoId).toBe('mar');
  });

  it('limpa os rascunhos do fluxo concluído', () => {
    useFormularios.getState().abrir('politica', {
      avisoHoras: 48,
      avisadaDevolve: false,
      limiteReposicoes: 1,
      validadeDias: 30,
    });
    useNavegacao.getState().concluir('ajustes');
    expect(useFormularios.getState().rascunhos.politica).toBeUndefined();
  });
});
