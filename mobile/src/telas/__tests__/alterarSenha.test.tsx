/**
 * "Alterar senha" nos Ajustes (SCRUM-103): a linha em Conta e a tela.
 *
 * Quem confere a senha atual e troca é a sessão (estado/__tests__/sessao.test.ts).
 * Aqui se cobra a tela: no modo local a linha não leva a lugar nenhum; no
 * supabase, leva à tela, que só libera o primário com o formulário completo,
 * mostra cada frase no campo dela e, deu certo, avisa e volta para Conta.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ERRO } from '../../dominio/validacao';
import { avisos } from '../../estado/avisos';
import { useNavegacao } from '../../estado/navegacao';
import { ERRO_DA_RECUPERACAO, podeAlterarSenha, useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { AlterarSenha } from '../ajustes/AlterarSenha';
import { Conta } from '../ajustes/Conta';
import { SENHAS_DIFERENTES } from '../entrada/NovaSenha';

jest.mock('../../estado/sessao', () => ({
  ...jest.requireActual('../../estado/sessao'),
  podeAlterarSenha: jest.fn(() => false),
}));

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const montar = (Tela: React.ComponentType) =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <Tela />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const pode = jest.mocked(podeAlterarSenha);
const ORIGINAL = useSessao.getState().alterarSenha;
const avisar = jest.fn();
const alterar = jest.fn<Promise<string | null>, [string, string]>();

const ATUAL = 'senha-de-antes';
const NOVA = 'senha-de-agora';

const primario = () => screen.getByRole('button', { name: /Salvar senha nova|Salvando/ });
const desabilitado = () => primario().props.accessibilityState?.disabled === true;

/** Preenche os três campos, na ordem em que aparecem. */
async function preencher(atual: string, nova: string, repetida = nova) {
  await fireEvent.changeText(screen.getByLabelText('Senha atual'), atual);
  await fireEvent.changeText(screen.getByLabelText('Senha nova'), nova);
  await fireEvent.changeText(screen.getByLabelText('Repita a senha nova'), repetida);
}

beforeEach(() => {
  jest.clearAllMocks();
  pode.mockReturnValue(true);
  alterar.mockResolvedValue(null);
  useSessao.setState({ alterarSenha: alterar });
  useToast.setState({ avisar });
  useNavegacao.setState({
    // A pilha guarda as telas de trás: Ajustes e Conta.
    tela: 'alterarSenha',
    pilha: [
      { tela: 'ajustes', alunoId: null },
      { tela: 'conta', alunoId: null },
    ],
  });
});

afterEach(() => {
  useSessao.setState({ alterarSenha: ORIGINAL });
});

describe('a linha em Conta', () => {
  // A Conta tem o dois toques, que desarma por um setTimeout: sem o relógio
  // falso, ele dispararia depois de o ambiente da suíte cair.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('no modo local, segue sem ação e diz que chega com o login de verdade', async () => {
    pode.mockReturnValue(false);
    await montar(Conta);
    expect(screen.getByText('Chega junto com o login de verdade')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Alterar senha/ })).toBeNull();
  });

  it('no supabase, leva à tela de alterar a senha', async () => {
    useNavegacao.setState({
      tela: 'conta',
      pilha: [{ tela: 'ajustes', alunoId: null }],
    });
    await montar(Conta);
    await fireEvent.press(screen.getByRole('button', { name: /Alterar senha/ }));
    expect(useNavegacao.getState().tela).toBe('alterarSenha');
  });
});

describe('a tela', () => {
  it('abre com o primário apagado e a nota do que falta', async () => {
    await montar(AlterarSenha);
    expect(desabilitado()).toBe(true);
    expect(screen.getByText(`${ERRO_DA_RECUPERACAO.senhaAtualVazia}.`)).toBeTruthy();
  });

  it.each([
    ['a nova curta', ATUAL, '123', NOVA.slice(0, 3), `${ERRO.senhaCurta}.`],
    ['a nova igual à atual', ATUAL, ATUAL, ATUAL, `${ERRO_DA_RECUPERACAO.senhaIgual}.`],
    ['a repetida diferente', ATUAL, NOVA, 'outra-coisa', `${SENHAS_DIFERENTES}.`],
  ])('%s: a nota diz, e nada vai à sessão', async (_caso, atual, nova, repetida, nota) => {
    await montar(AlterarSenha);
    await preencher(atual, nova, repetida);
    expect(screen.getByText(nota)).toBeTruthy();
    expect(desabilitado()).toBe(true);
    await fireEvent.press(primario());
    expect(alterar).not.toHaveBeenCalled();
  });

  it('deu certo: chama a sessão, avisa e volta para Conta', async () => {
    await montar(AlterarSenha);
    await preencher(ATUAL, NOVA);
    expect(desabilitado()).toBe(false);

    await fireEvent.press(primario());

    await waitFor(() => expect(avisar).toHaveBeenCalledWith(avisos.senhaAlterada));
    expect(alterar).toHaveBeenCalledWith(ATUAL, NOVA);
    expect(useNavegacao.getState().tela).toBe('conta');
  });

  it('a senha atual errada aparece no campo dela, e a pessoa fica na tela', async () => {
    alterar.mockResolvedValue(ERRO_DA_RECUPERACAO.senhaAtualErrada);
    await montar(AlterarSenha);
    await preencher('chute-errado', NOVA);

    await fireEvent.press(primario());

    expect(await screen.findByText(ERRO_DA_RECUPERACAO.senhaAtualErrada)).toBeTruthy();
    expect(avisar).not.toHaveBeenCalled();
    expect(useNavegacao.getState().tela).toBe('alterarSenha');
  });

  it('digitar de novo apaga a frase do servidor', async () => {
    alterar.mockResolvedValue(ERRO_DA_RECUPERACAO.senhaAtualErrada);
    await montar(AlterarSenha);
    await preencher('chute-errado', NOVA);
    await fireEvent.press(primario());
    await screen.findByText(ERRO_DA_RECUPERACAO.senhaAtualErrada);

    await fireEvent.changeText(screen.getByLabelText('Senha atual'), ATUAL);
    expect(screen.queryByText(ERRO_DA_RECUPERACAO.senhaAtualErrada)).toBeNull();
  });

  it('sem rede: um bloco diz, fora dos campos', async () => {
    alterar.mockResolvedValue(ERRO.semConexao);
    await montar(AlterarSenha);
    await preencher(ATUAL, NOVA);

    await fireEvent.press(primario());

    expect(await screen.findByText(`${ERRO.semConexao}.`)).toBeTruthy();
    expect(useNavegacao.getState().tela).toBe('alterarSenha');
  });

  it('enquanto a sessão não responde, o segundo toque não manda outro pedido', async () => {
    // O toque assíncrono espera a promessa do `salvar`: sem resposta nenhuma,
    // o teste travaria. A sessão responde só no fim.
    let responder!: (r: string | null) => void;
    alterar.mockReturnValue(new Promise<string | null>((r) => (responder = r)));
    await montar(AlterarSenha);
    await preencher(ATUAL, NOVA);

    fireEvent.press(primario());
    expect(await screen.findByText('Salvando…')).toBeTruthy();
    fireEvent.press(primario());
    expect(alterar).toHaveBeenCalledTimes(1);

    responder(null);
    await waitFor(() => expect(avisar).toHaveBeenCalledTimes(1));
  });

  it('se a sessão rejeitar, a tela mostra a falha em vez de quebrar', async () => {
    alterar.mockRejectedValue(new Error('modo local'));
    await montar(AlterarSenha);
    await preencher(ATUAL, NOVA);

    await fireEvent.press(primario());

    expect(await screen.findByText(`${ERRO.falhaNoAcesso}.`)).toBeTruthy();
  });
});
