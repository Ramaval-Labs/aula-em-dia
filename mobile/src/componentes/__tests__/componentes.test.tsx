/**
 * Catálogo do iOS Glass: o que os testes cobrem aqui é o contrato que as 35
 * telas vão usar — papel e estado de acessibilidade, limites do stepper e o
 * texto alternativo do delta do extrato (cor não pode ser o único sinal).
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TemaProvider } from '../../tema/TemaProvider';
import { iniciais } from '../Blocos';
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
