/**
 * Catálogo do iOS Glass: o que os testes cobrem aqui é o contrato que as 35
 * telas vão usar — papel e estado de acessibilidade, limites do stepper e o
 * texto alternativo do delta do extrato (cor não pode ser o único sinal).
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { TemaProvider } from '../../tema/TemaProvider';
import { iniciais } from '../Blocos';
import { CampoDeDinheiro, useCampoDeDinheiro } from '../Campos';
import { BotaoPrimario, CartaoEscolha, Segmentado, Stepper, Switch } from '../Controles';
import { LinhaAluno, LinhaExtrato, ListaAgrupada } from '../Listas';

const comTema = (no: React.ReactElement) => render(<TemaProvider>{no}</TemaProvider>);

describe('controles', () => {
  it('botão primário desabilitado não dispara e se anuncia como desabilitado', async () => {
    const aoTocar = jest.fn();
    await comTema(<BotaoPrimario rotulo="Confirmar" aoTocar={aoTocar} desabilitado />);

    const botao = screen.getByRole('button', { name: 'Confirmar' });
    expect(botao).toBeDisabled();
    fireEvent.press(botao);
    expect(aoTocar).not.toHaveBeenCalled();
  });

  it('segmentado marca só o ativo e devolve o valor escolhido', async () => {
    const aoTrocar = jest.fn();
    await comTema(
      <Segmentado
        opcoes={[
          { valor: 'a', rotulo: 'Urgência' },
          { valor: 'b', rotulo: 'A–Z' },
        ]}
        valor="a"
        aoTrocar={aoTrocar}
        rotuloDoGrupo="Ordenar"
      />,
    );

    expect(screen.getByRole('radio', { name: 'Urgência' })).toBeSelected();
    fireEvent.press(screen.getByRole('radio', { name: 'A–Z' }));
    expect(aoTrocar).toHaveBeenCalledWith('b');
  });

  it('switch tem papel próprio e alterna o valor', async () => {
    const aoAlternar = jest.fn();
    await comTema(
      <Switch ligado={false} aoAlternar={aoAlternar} rotulo="Falta avisada devolve a aula" />,
    );

    const alavanca = screen.getByRole('switch', { name: 'Falta avisada devolve a aula' });
    expect(alavanca).not.toBeChecked();
    fireEvent.press(alavanca);
    expect(aoAlternar).toHaveBeenCalledWith(true);
  });

  it('stepper trava nos limites e formata o valor', async () => {
    const aoTrocar = jest.fn();
    await comTema(
      <Stepper
        valor={0}
        minimo={0}
        maximo={5}
        aoTrocar={aoTrocar}
        rotulo="Reposições por pacote"
        formatar={(v) => (v === 0 ? '—' : String(v))}
        rotuloDoValor={(v) => (v === 0 ? 'sem limite' : String(v))}
      />,
    );

    expect(screen.getByText('—')).toBeTruthy();
    // Um controle ajustável só; o travessão não se lê: o valor falado é o
    // que ele significa.
    const controle = screen.getByRole('adjustable', { name: 'Reposições por pacote' });
    expect(controle.props.accessibilityValue).toEqual({
      min: 0,
      max: 5,
      now: 0,
      text: 'sem limite',
    });
    await fireEvent(controle, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    await fireEvent.press(screen.getByText('−'));
    expect(aoTrocar).not.toHaveBeenCalled();
    await fireEvent(controle, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(aoTrocar).toHaveBeenCalledWith(1);
    await fireEvent.press(screen.getByText('+'));
    expect(aoTrocar).toHaveBeenCalledTimes(2);
  });

  it('cartão de escolha deixa o sub-controle fora do rádio', async () => {
    const aoTocar = jest.fn();
    const aoTrocar = jest.fn();
    await comTema(
      <CartaoEscolha titulo="Falta avisada" selecionado aoTocar={aoTocar}>
        <Segmentado
          opcoes={[
            { valor: 48, rotulo: '48h' },
            { valor: 10, rotulo: '10h' },
          ]}
          valor={48}
          aoTrocar={aoTrocar}
          rotuloDoGrupo="Antecedência do aviso"
        />
      </CartaoEscolha>,
    );

    const radio = screen.getByRole('radio', { name: 'Falta avisada' });
    // O segmentado não é descendente do rádio: o leitor de tela alcança os dois.
    expect(screen.queryAllByRole('radio', { name: '10h' })).toHaveLength(1);
    expect(radio).not.toContainElement(screen.getByRole('radio', { name: '10h' }));
    await fireEvent.press(screen.getByRole('radio', { name: '10h' }));
    expect(aoTrocar).toHaveBeenCalledWith(10);
    expect(aoTocar).not.toHaveBeenCalled();
  });
});

describe('listas', () => {
  it('a linha de extrato diz em palavras o que a cor mostra', async () => {
    await comTema(
      <ListaAgrupada>
        <LinhaExtrato
          data="28/08"
          titulo="Aula realizada"
          subtitulo="Matemática · 19h"
          delta="−1"
          deltaEmPalavras="1 aula debitada"
          rodape="saldo 3"
          tom="debito"
        />
      </ListaAgrupada>,
    );

    expect(
      screen.getByLabelText('28/08. Aula realizada. Matemática · 19h. 1 aula debitada. saldo 3'),
    ).toBeTruthy();
  });

  it('a linha de aluno junta nome, apoio, faixa e saldo no rótulo', async () => {
    await comTema(
      <ListaAgrupada>
        <LinhaAluno
          nome="Valentina Rocha"
          apoio="Violão · hoje, 17h"
          faixa={{ tipo: 'atraso', texto: 'Atraso de 12 dias' }}
          valor="2"
          unidade="aulas"
          aoTocar={() => {}}
        />
      </ListaAgrupada>,
    );

    expect(
      screen.getByRole('button', {
        name: 'Valentina Rocha. Violão · hoje, 17h. Atraso de 12 dias. 2 aulas',
      }),
    ).toBeTruthy();
  });
});

describe('avatar', () => {
  it('iniciais são a primeira letra dos dois primeiros nomes', () => {
    expect(iniciais('Valentina Rocha')).toBe('VR');
    expect(iniciais('  marina  alves  costa ')).toBe('MA');
    expect(iniciais('Caio')).toBe('C');
    expect(iniciais('')).toBe('');
  });
});

describe('sheet e toast', () => {
  it('o sheet aberto reserva a base para o toast e devolve ao fechar', async () => {
    const { Sheet } = require('../Sheet');
    const { useToast } = require('../../estado/toast');
    const { Text } = require('react-native');
    const { SafeAreaProvider } = require('react-native-safe-area-context');
    const metrica = {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, left: 0, right: 0, bottom: 34 },
    };
    const r = await comTema(
      <SafeAreaProvider initialMetrics={metrica}>
        <Sheet titulo="Registrar aula" rodape={<Text>Confirmar</Text>}>
          <Text>corpo</Text>
        </Sheet>
      </SafeAreaProvider>,
    );
    expect(useToast.getState().reservaDoSheet).not.toBeNull();
    await r.unmount();
    expect(useToast.getState().reservaDoSheet).toBeNull();
  });
});

describe('campo de dinheiro', () => {
  const ERRO = 'Valor inválido. Use números, como 62,50.';

  function CampoDeValor({
    aoMudar,
    aoConfirmar = () => {},
  }: {
    aoMudar: (reais: number) => void;
    aoConfirmar?: (ok: boolean) => void;
  }) {
    const { campo, confirmar } = useCampoDeDinheiro(80, aoMudar);
    return (
      <>
        <CampoDeDinheiro {...campo} rotulo="Valor por aula" />
        <BotaoPrimario rotulo="Salvar" aoTocar={() => aoConfirmar(confirmar())} />
      </>
    );
  }

  it('abre formatado e lê vírgula ou ponto como centavos, devolvendo reais', async () => {
    const aoMudar = jest.fn();
    await comTema(<CampoDeValor aoMudar={aoMudar} />);

    const campo = screen.getByLabelText('Valor por aula');
    expect(campo.props.value).toBe('R$ 80,00');

    await fireEvent.changeText(campo, '62,50');
    expect(aoMudar).toHaveBeenLastCalledWith(62.5);
    await fireEvent.changeText(campo, '62.50');
    expect(aoMudar).toHaveBeenLastCalledWith(62.5);
  });

  it('texto inválido não muda o valor e só mostra erro ao sair do campo', async () => {
    const aoMudar = jest.fn();
    await comTema(<CampoDeValor aoMudar={aoMudar} />);

    const campo = screen.getByLabelText('Valor por aula');
    await fireEvent.changeText(campo, 'abc');
    expect(aoMudar).not.toHaveBeenCalled();
    expect(screen.queryByText(ERRO)).toBeNull();

    await fireEvent(campo, 'blur');
    expect(screen.getByText(ERRO)).toBeTruthy();

    await fireEvent.changeText(campo, '62,5');
    expect(screen.queryByText(ERRO)).toBeNull();
    expect(aoMudar).toHaveBeenLastCalledWith(62.5);
  });

  it('confirmar recusa texto inválido e revela o erro', async () => {
    const aoConfirmar = jest.fn();
    await comTema(<CampoDeValor aoMudar={() => {}} aoConfirmar={aoConfirmar} />);

    await fireEvent.changeText(screen.getByLabelText('Valor por aula'), '80,555');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(aoConfirmar).toHaveBeenLastCalledWith(false);
    expect(screen.getByText(ERRO)).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Valor por aula'), '80,55');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(aoConfirmar).toHaveBeenLastCalledWith(true);
  });
});

// A prévia é o único componente do catálogo que sai do app (abre o WhatsApp)
// e o único cujo botão tem dois comportamentos. O mock evita depender do
// módulo nativo da área de transferência para afirmar qual dos dois rodou.
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

describe('prévia de mensagem', () => {
  const { Linking } = require('react-native');
  const Clipboard = require('expo-clipboard');
  const { PreviaDeMensagem } = require('../PreviaDeMensagem');

  // Acento, quebra de linha e `R$`: é o que a mensagem de reposição tem e o
  // que chega corrompido se alguém esquecer o `encodeURIComponent`.
  const MENSAGEM = 'Oi, Caio!\n\nA reposição ficou em ter, às 17h.\nValor: R$ 90,00.';

  beforeEach(() => {
    (Clipboard.setStringAsync as jest.Mock).mockClear();
  });

  it('com telefone, abre o WhatsApp com o país na frente e o texto codificado', async () => {
    const abriu = jest.fn();
    const copiou = jest.fn();
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await comTema(
      <PreviaDeMensagem
        texto={MENSAGEM}
        telefone="51900000101"
        aoAbrir={abriu}
        aoCopiar={copiou}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Abrir no WhatsApp' }));
    await waitFor(() => expect(abriu).toHaveBeenCalled());

    expect(openURL).toHaveBeenCalledWith(
      `whatsapp://send?phone=5551900000101&text=${encodeURIComponent(MENSAGEM)}`,
    );
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
    expect(copiou).not.toHaveBeenCalled();
    openURL.mockRestore();
  });

  it('telefone que já vem com o código do país não ganha outro 55', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await comTema(<PreviaDeMensagem texto={MENSAGEM} telefone="+55 51 90000-0101" />);

    fireEvent.press(screen.getByRole('button', { name: 'Abrir no WhatsApp' }));
    await waitFor(() => expect(openURL).toHaveBeenCalled());

    expect(openURL.mock.calls[0][0]).toContain('phone=5551900000101&');
    openURL.mockRestore();
  });

  it('sem telefone copia — é o que a chave Pix e o catálogo usam', async () => {
    const copiou = jest.fn();
    await comTema(<PreviaDeMensagem texto={MENSAGEM} aoCopiar={copiou} />);

    expect(screen.queryByRole('button', { name: 'Abrir no WhatsApp' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Copiar mensagem' }));
    await waitFor(() => expect(copiou).toHaveBeenCalledWith('escolha'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(MENSAGEM);
  });

  it('telefone sem DDD não vira link: aluno incompleto não quebra a tela', async () => {
    const copiou = jest.fn();
    await comTema(<PreviaDeMensagem texto={MENSAGEM} telefone="90000101" aoCopiar={copiou} />);

    fireEvent.press(screen.getByRole('button', { name: 'Copiar mensagem' }));
    await waitFor(() => expect(copiou).toHaveBeenCalled());
  });

  // A cobrança leva a chave Pix dentro do texto, e chave de e-mail ou
  // aleatória tem `@`, `+`, `/` e `-`: sem codificar, elas cortam a URL no
  // primeiro caractere reservado e chegam truncadas na conversa.
  it.each([
    ['chave de e-mail', 'professor+aulas@escola.com.br'],
    ['chave aleatória', 'a1b2c3d4-e5f6/7890+abcd=='],
  ])('a %s chega inteira dentro do link', async (_rotulo, chave) => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const comChave = `Oi, Valentin!\n\nMinha chave Pix é ${chave}.\nSão R$ 480,00.`;

    await comTema(<PreviaDeMensagem texto={comChave} telefone="51900000101" />);
    fireEvent.press(screen.getByRole('button', { name: 'Abrir no WhatsApp' }));
    await waitFor(() => expect(openURL).toHaveBeenCalled());

    const url = openURL.mock.calls[0][0] as string;
    expect(decodeURIComponent(url.split('&text=')[1])).toBe(comChave);
    openURL.mockRestore();
  });

  it('abreNoWhatsApp responde o mesmo que o botão faz', () => {
    const { abreNoWhatsApp } = require('../PreviaDeMensagem');
    expect(abreNoWhatsApp('51900000101')).toBe(true);
    expect(abreNoWhatsApp('+55 51 90000-0101')).toBe(true);
    expect(abreNoWhatsApp('90000101')).toBe(false);
    expect(abreNoWhatsApp(undefined)).toBe(false);
  });

  it('WhatsApp que não abre cai no copiar, e o aviso de abertura não sai', async () => {
    const abriu = jest.fn();
    const copiou = jest.fn();
    const openURL = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValue(new Error('sem aplicativo para o link'));

    await comTema(
      <PreviaDeMensagem
        texto={MENSAGEM}
        telefone="51900000101"
        aoAbrir={abriu}
        aoCopiar={copiou}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Abrir no WhatsApp' }));
    // O motivo é o que faz o toast dizer que o WhatsApp não abriu, em vez de
    // um "copiada" igual ao de quem escolheu copiar.
    await waitFor(() => expect(copiou).toHaveBeenCalledWith('whatsappNaoAbriu'));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(MENSAGEM);
    expect(abriu).not.toHaveBeenCalled();
    openURL.mockRestore();
  });

  // O `https://wa.me` tem sempre quem o abra (o navegador), então sem
  // WhatsApp ele não falhava e o fallback acima nunca rodava no aparelho.
  // Na web não há esquema próprio para tentar, e o wa.me é o WhatsApp Web.
  it('no aparelho tenta o esquema whatsapp://; na web, o wa.me', async () => {
    const { Platform } = require('react-native');
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const original = Platform.OS;

    await comTema(<PreviaDeMensagem texto={MENSAGEM} telefone="51900000101" />);
    fireEvent.press(screen.getByRole('button', { name: 'Abrir no WhatsApp' }));
    await waitFor(() => expect(openURL).toHaveBeenCalledTimes(1));
    expect(openURL.mock.calls[0][0]).toMatch(/^whatsapp:\/\/send\?/);

    Platform.OS = 'web';
    try {
      fireEvent.press(screen.getByRole('button', { name: 'Abrir no WhatsApp' }));
      await waitFor(() => expect(openURL).toHaveBeenCalledTimes(2));
      expect(openURL.mock.calls[1][0]).toMatch(/^https:\/\/wa\.me\/5551900000101\?text=/);
    } finally {
      Platform.OS = original;
      openURL.mockRestore();
    }
  });

  it('sem telefone, oferece cadastrar um; com telefone, o atalho some', async () => {
    const cadastrar = jest.fn();
    await comTema(<PreviaDeMensagem texto={MENSAGEM} aoCadastrarTelefone={cadastrar} />);

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar o telefone do aluno' }));
    expect(cadastrar).toHaveBeenCalled();

    await comTema(
      <PreviaDeMensagem
        texto={MENSAGEM}
        telefone="51900000101"
        aoCadastrarTelefone={cadastrar}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Cadastrar o telefone do aluno' })).toBeNull();
  });
});
