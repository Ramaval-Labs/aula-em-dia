/**
 * As telas da recuperação de senha (SCRUM-96): o "Esqueci minha senha" da
 * Acesso, o link `/redefinir-senha` e a tela de nova senha.
 *
 * Quem fala com o Supabase é a sessão (SCRUM-62, com teste próprio). Aqui as
 * ações dela são trocadas por dublês, e se cobra o que a tela faz com a
 * resposta: a mesma frase exista a conta ou não, o link que sai da barra de
 * endereço, e o link vencido que oferece pedir outro.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ERRO } from '../../dominio/validacao';
import { useFormularios } from '../../estado/formularios';
import {
  ERRO_DA_RECUPERACAO,
  FRASE_DO_LINK_ENVIADO,
  useSessao,
} from '../../estado/sessao';
import { TemaProvider } from '../../tema/TemaProvider';
import { Acesso } from '../entrada/Acesso';
import {
  esquecerLinkDaNovaSenha,
  lerLinkDaNovaSenha,
  tokenDaNovaSenha,
} from '../entrada/linkDaNovaSenha';
import { NovaSenha, SENHAS_DIFERENTES } from '../entrada/NovaSenha';

// O "Esqueci minha senha" só pede o link no login de verdade.
jest.mock('../../estado/sessao', () => ({
  ...jest.requireActual('../../estado/sessao'),
  loginReal: () => true,
}));

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = (tela: React.ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>{tela}</TemaProvider>
    </SafeAreaProvider>,
  );

const ORIGINAL = {
  pedirRecuperacao: useSessao.getState().pedirRecuperacao,
  redefinirSenha: useSessao.getState().redefinirSenha,
  irPara: useSessao.getState().irPara,
};

beforeEach(() => {
  useFormularios.getState().limparTudo();
  esquecerLinkDaNovaSenha();
});

afterEach(() => {
  useSessao.setState(ORIGINAL);
});

describe('o link do e-mail', () => {
  it('lê o token_hash e tira o endereço da barra', () => {
    const replaceState = jest.fn();
    const token = lerLinkDaNovaSenha(
      { pathname: '/redefinir-senha', search: '?token_hash=abc123&type=recovery' },
      { replaceState },
    );
    expect(token).toBe('abc123');
    expect(tokenDaNovaSenha()).toBe('abc123');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/');
  });

  it('outro caminho não é o link, e a barra fica como está', () => {
    const replaceState = jest.fn();
    expect(lerLinkDaNovaSenha({ pathname: '/a/xyz', search: '' }, { replaceState })).toBeNull();
    expect(tokenDaNovaSenha()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('o caminho sem token ainda abre a tela, com o token vazio', () => {
    expect(lerLinkDaNovaSenha({ pathname: '/redefinir-senha', search: '' }, undefined)).toBe('');
  });
});

describe('"Esqueci minha senha" na Acesso', () => {
  it('com e-mail, pede o link e mostra a mesma frase exista a conta ou não', async () => {
    const pedirRecuperacao = jest.fn().mockResolvedValue(null);
    useSessao.setState({ pedirRecuperacao });
    await montar(<Acesso />);

    await fireEvent.changeText(screen.getByPlaceholderText('voce@email.com'), 'bia@exemplo.com');
    await fireEvent.press(screen.getByText('Esqueci minha senha'));

    expect(pedirRecuperacao).toHaveBeenCalledWith('bia@exemplo.com');
    expect(screen.getByText('Confira seu e-mail')).toBeTruthy();
    expect(screen.getByText(new RegExp(FRASE_DO_LINK_ENVIADO.replace('.', '\\.')))).toBeTruthy();
  });

  it('sem e-mail, a frase da sessão aparece no campo e nada é dito sobre o link', async () => {
    useSessao.setState({ pedirRecuperacao: jest.fn().mockResolvedValue(ERRO.emailVazio) });
    await montar(<Acesso />);

    await fireEvent.press(screen.getByText('Esqueci minha senha'));
    expect(screen.getByText(ERRO.emailVazio)).toBeTruthy();
    expect(screen.queryByText('Confira seu e-mail')).toBeNull();
  });

  it('falha no envio vai para o bloco de erro geral', async () => {
    useSessao.setState({
      pedirRecuperacao: jest.fn().mockResolvedValue(ERRO_DA_RECUPERACAO.falhaNoEnvio),
    });
    await montar(<Acesso />);

    await fireEvent.changeText(screen.getByPlaceholderText('voce@email.com'), 'bia@exemplo.com');
    await fireEvent.press(screen.getByText('Esqueci minha senha'));
    expect(screen.getByText(ERRO_DA_RECUPERACAO.falhaNoEnvio)).toBeTruthy();
  });
});

describe('a tela de nova senha', () => {
  const abrirComLink = () =>
    lerLinkDaNovaSenha(
      { pathname: '/redefinir-senha', search: '?token_hash=tok-1&type=recovery' },
      { replaceState: () => {} },
    );
  const senha = () => screen.getByPlaceholderText('pelo menos 6 caracteres');
  const salvar = () => screen.getByRole('button', { name: 'Salvar e entrar' });

  it('senha curta ou diferente não salva, e a nota diz o que falta', async () => {
    const redefinirSenha = jest.fn().mockResolvedValue(null);
    useSessao.setState({ redefinirSenha });
    abrirComLink();
    await montar(<NovaSenha />);

    await fireEvent.changeText(senha(), 'abc');
    expect(screen.getByText(`${ERRO.senhaCurta}.`)).toBeTruthy();
    expect(salvar()).toBeDisabled();

    await fireEvent.changeText(senha(), 'segredo1');
    expect(screen.getByText(`${SENHAS_DIFERENTES}.`)).toBeTruthy();
    expect(salvar()).toBeDisabled();
    expect(redefinirSenha).not.toHaveBeenCalled();
  });

  it('as duas iguais salvam com o token do link', async () => {
    const redefinirSenha = jest.fn().mockResolvedValue(null);
    useSessao.setState({ redefinirSenha });
    abrirComLink();
    await montar(<NovaSenha />);

    await fireEvent.changeText(senha(), 'segredo1');
    await fireEvent.changeText(screen.getAllByDisplayValue('')[0], 'segredo1');
    await fireEvent.press(salvar());

    expect(redefinirSenha).toHaveBeenCalledWith('tok-1', 'segredo1');
  });

  it('link vencido mostra o aviso e leva para pedir outro', async () => {
    const irPara = jest.fn();
    useSessao.setState({
      irPara,
      redefinirSenha: jest.fn().mockResolvedValue(ERRO_DA_RECUPERACAO.linkVencido),
    });
    abrirComLink();
    await montar(<NovaSenha />);

    await fireEvent.changeText(senha(), 'segredo1');
    await fireEvent.changeText(screen.getAllByDisplayValue('')[0], 'segredo1');
    await fireEvent.press(salvar());

    expect(screen.getByText(`${ERRO_DA_RECUPERACAO.linkVencido}.`)).toBeTruthy();
    await fireEvent.press(screen.getByText('Pedir outro link'));
    expect(irPara).toHaveBeenCalledWith('acesso');
  });

  it('senha igual à atual aparece no campo, e o link continua valendo', async () => {
    useSessao.setState({
      redefinirSenha: jest.fn().mockResolvedValue(ERRO_DA_RECUPERACAO.senhaIgual),
    });
    abrirComLink();
    await montar(<NovaSenha />);

    await fireEvent.changeText(senha(), 'segredo1');
    await fireEvent.changeText(screen.getAllByDisplayValue('')[0], 'segredo1');
    await fireEvent.press(salvar());

    expect(screen.getByText(ERRO_DA_RECUPERACAO.senhaIgual)).toBeTruthy();
    expect(screen.queryByText('Pedir outro link')).toBeNull();
  });
});
