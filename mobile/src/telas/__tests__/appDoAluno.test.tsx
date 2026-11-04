/**
 * A página do aluno pelo link `/a/<token>` (SCRUM-70).
 *
 * O repositório público é simulado: a Edge Function e o banco têm as suítes
 * deles (dados/__tests__/repositorioPublico.test.ts e o pgTAP). Aqui se cobra
 * o que a página faz com cada resposta: o saldo, a frase do link inválido, e
 * a resposta à proposta indo para a função com a janela que o aluno marcou.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  carregarPagina,
  enviarDisponibilidade,
  ErroDoLink,
  LinkInvalido,
  responder,
} from '../../dados/repositorioPublico';
import type { PaginaDoAluno } from '../../dominio/paginaDoAluno';
import { avisos } from '../../estado/avisos';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';
import { AppDoAluno, tokenDoCaminho } from '../aluno/AppDoAluno';

jest.mock('../../dados/repositorioPublico', () => ({
  ...jest.requireActual('../../dados/repositorioPublico'),
  carregarPagina: jest.fn(),
  responder: jest.fn(),
  enviarDisponibilidade: jest.fn(),
}));

const carregar = jest.mocked(carregarPagina);
const responderNaFuncao = jest.mocked(responder);
const enviar = jest.mocked(enviarDisponibilidade);

const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const TOKEN = '285ee902-e4ad-4ab6-8830-e3b64ccbebc5';

const PAGINA: PaginaDoAluno = {
  nome: 'Rafael',
  disciplina: 'Violão',
  dia: 'segunda',
  hora: '19h',
  saldo: 2,
  total: 8,
  temPacote: true,
  validade: '07/12',
  agendada: null,
  regra: 'Avisando com 24h ou mais, a aula volta para o seu saldo e pode ser reposta.',
  extrato: [{ d: '19/10', t: 'Falta avisada', s: 'Aviso com 30h', delta: 0, saldo: 2 }],
  professor: { nome: 'Caio', disciplina: 'Matemática' },
  proposta: {
    principal: { dia: 'Quinta, 05/11', hora: '17h', razoes: ['Mesmo horário da sua aula fixa'] },
    alternativas: [{ dia: 'Sexta, 06/11', hora: '10h', razoes: [] }],
  },
  disponibilidade: [],
};

const montar = (token: string | null = TOKEN) =>
  render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <AppDoAluno token={token} />
      </TemaProvider>
    </SafeAreaProvider>,
  );

const avisar = jest.fn();
const botao = (nome: string | RegExp) => screen.getByRole('button', { name: nome });

beforeEach(() => {
  jest.clearAllMocks();
  useToast.setState({ avisar });
});

describe('tokenDoCaminho', () => {
  it.each([
    ['/a/abc', 'abc'],
    ['/a/abc/', 'abc'],
    [`/a/${TOKEN}`, TOKEN],
  ])('%s → %s', (caminho, token) => {
    expect(tokenDoCaminho(caminho)).toBe(token);
  });

  it.each(['/', '/a/', '/a', '/a/abc/def', '/alunos'])('%s não é link do aluno', (caminho) => {
    expect(tokenDoCaminho(caminho)).toBeNull();
  });
});

describe('abrir o link', () => {
  it('o token válido mostra o saldo, sem a faixa da prévia', async () => {
    carregar.mockResolvedValue(PAGINA);
    await montar();

    expect(await screen.findByText('Seu saldo')).toBeTruthy();
    expect(carregar).toHaveBeenCalledWith(TOKEN);
    expect(screen.getByLabelText('2 aulas restantes de 8')).toBeTruthy();
    expect(screen.getByText('Pacote de 8 aulas, 6 já usadas. Válido até 07/12.')).toBeTruthy();
    expect(screen.getByText('Página de Caio · Matemática')).toBeTruthy();
    expect(screen.queryByText('Prévia do que o aluno vê')).toBeNull();
  });

  it('o token inválido mostra a frase do link, e nada mais', async () => {
    carregar.mockRejectedValue(new LinkInvalido('abrir a página'));
    await montar();

    expect(await screen.findByText(avisos.linkInvalido)).toBeTruthy();
    expect(screen.queryByText('Seu saldo')).toBeNull();
  });

  it('sem token no caminho, nem pergunta à função', async () => {
    await montar(null);
    expect(await screen.findByText(avisos.linkInvalido)).toBeTruthy();
    expect(carregar).not.toHaveBeenCalled();
  });

  it('sem rede não é link inválido: avisa da conexão e deixa tentar de novo', async () => {
    carregar.mockRejectedValueOnce(new ErroDoLink('abrir a página', null));
    carregar.mockResolvedValueOnce(PAGINA);
    await montar();

    expect(await screen.findByText(avisos.paginaNaoAbriu)).toBeTruthy();
    expect(screen.queryByText(avisos.linkInvalido)).toBeNull();
    await fireEvent.press(botao('Tentar de novo'));
    expect(await screen.findByText('Seu saldo')).toBeTruthy();
  });

  it('sem proposta aberta, o saldo não oferece a proposta', async () => {
    carregar.mockResolvedValue({ ...PAGINA, proposta: null });
    await montar();
    await screen.findByText('Seu saldo');
    expect(screen.queryByRole('button', { name: 'Ver a proposta de reposição' })).toBeNull();
    expect(botao('Informar disponibilidade')).toBeTruthy();
  });
});

describe('responder a proposta', () => {
  const abrirProposta = async () => {
    carregar.mockResolvedValue(PAGINA);
    await montar();
    await screen.findByText('Seu saldo');
    await fireEvent.press(botao('Ver a proposta de reposição'));
    await screen.findByText('Caio propôs uma reposição');
  };

  it('aceitar chama a função com a janela marcada, e volta ao saldo como ficou', async () => {
    const depois: PaginaDoAluno = {
      ...PAGINA,
      proposta: null,
      agendada: { dia: 'Sexta, 06/11', hora: '10h' },
    };
    responderNaFuncao.mockResolvedValue(depois);
    await abrirProposta();

    await fireEvent.press(screen.getByRole('radio', { name: 'Sexta, 06/11, 10h' }));
    await fireEvent.press(botao('Aceitar Sexta, 06/11, 10h'));

    await waitFor(() =>
      expect(responderNaFuncao).toHaveBeenCalledWith(TOKEN, 'aceita', { dia: 'Sexta, 06/11', hora: '10h' }),
    );
    expect(await screen.findByText('Sexta, 06/11 · 10h')).toBeTruthy();
    expect(avisar).toHaveBeenCalledWith(avisos.alunoAceitou({ dia: 'Sexta, 06/11', hora: '10h' }));
  });

  it('recusar chama a função sem janela, e abre a disponibilidade', async () => {
    responderNaFuncao.mockResolvedValue({ ...PAGINA, proposta: null });
    await abrirProposta();

    await fireEvent.press(botao('Recusar'));
    await waitFor(() => expect(responderNaFuncao).toHaveBeenCalledWith(TOKEN, 'recusada'));
    expect(await screen.findByText('Quando você pode repor?')).toBeTruthy();
    expect(avisar).toHaveBeenCalledWith(avisos.alunoRecusou);
  });

  it('a proposta que já foi respondida (409) recarrega e volta ao saldo', async () => {
    responderNaFuncao.mockRejectedValue(new ErroDoLink('responder a proposta', 409));
    await abrirProposta();
    carregar.mockResolvedValue({ ...PAGINA, proposta: null });

    await fireEvent.press(botao('Aceitar Quinta, 05/11, 17h'));
    expect(await screen.findByText('Seu saldo')).toBeTruthy();
    expect(carregar).toHaveBeenCalledTimes(2);
    expect(avisar).not.toHaveBeenCalled();
  });

  it('sem rede na resposta, avisa e a proposta continua na tela', async () => {
    responderNaFuncao.mockRejectedValue(new ErroDoLink('responder a proposta', null));
    await abrirProposta();

    await fireEvent.press(botao('Aceitar Quinta, 05/11, 17h'));
    await waitFor(() => expect(avisar).toHaveBeenCalledWith(avisos.falhaAoSalvar));
    expect(screen.getByText('Caio propôs uma reposição')).toBeTruthy();
  });

  it('o link trocado no meio do caminho mostra a frase do link', async () => {
    responderNaFuncao.mockRejectedValue(new LinkInvalido('responder a proposta'));
    await abrirProposta();

    await fireEvent.press(botao('Aceitar Quinta, 05/11, 17h'));
    expect(await screen.findByText(avisos.linkInvalido)).toBeTruthy();
  });

  it('o voltar leva ao saldo, sem a máquina de navegação', async () => {
    await abrirProposta();
    await fireEvent.press(botao('Voltar para Meu saldo'));
    expect(await screen.findByText('Seu saldo')).toBeTruthy();
  });
});

describe('informar disponibilidade', () => {
  it('envia o que está marcado na grade para a função', async () => {
    const blocos = [{ dia: 'seg' as const, faixa: 'tarde' as const }];
    carregar.mockResolvedValue({ ...PAGINA, disponibilidade: blocos });
    enviar.mockResolvedValue({ ...PAGINA, disponibilidade: blocos });
    await montar();
    await screen.findByText('Seu saldo');

    await fireEvent.press(botao('Informar disponibilidade'));
    await fireEvent.press(botao('Enviar disponibilidade'));

    await waitFor(() => expect(enviar).toHaveBeenCalledWith(TOKEN, blocos));
    expect(await screen.findByText('Seu saldo')).toBeTruthy();
    expect(avisar).toHaveBeenCalledWith(avisos.alunoEnviouDisponibilidade('Caio'));
  });
});
