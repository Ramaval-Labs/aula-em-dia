/**
 * A sessão nos dois modos (SCRUM-19).
 *
 * O modo local tem de seguir exatamente como antes: é o que a montagem das 35
 * telas e a demonstração usam. O modo supabase roda contra um cliente
 * simulado; os erros simulados têm a forma dos que o Supabase Auth local
 * devolveu de verdade (CLI 2.120, GoTrue 2.197), conferidos ao escrever esta
 * suíte: `invalid_credentials` (400), `user_already_exists` (422),
 * `weak_password` (422) e, sem rede, `AuthRetryableFetchError` com status 0.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAVE_SESSAO } from '../../dados/armazenamento';
import { marcarOnboardingConcluido, onboardingConcluido } from '../../dados/repositorioSupabase';
import { clienteSupabase, usaSupabase } from '../../dados/supabase';
import { ERRO } from '../../dominio/validacao';
import { useDados } from '../dados';
import { fraseDoErroDeAcesso, loginReal, useSessao } from '../sessao';

jest.mock('../../dados/supabase', () => ({
  usaSupabase: jest.fn(() => false),
  clienteSupabase: jest.fn(),
}));
// A marca de onboarding mora no banco (0004); a suíte do repositório cobra a
// leitura e a gravação. Aqui só importa o que a sessão faz com a resposta.
jest.mock('../../dados/repositorioSupabase', () => ({
  onboardingConcluido: jest.fn(),
  marcarOnboardingConcluido: jest.fn(),
}));

const modoSupabase = usaSupabase as jest.MockedFunction<typeof usaSupabase>;
const cliente = clienteSupabase as jest.MockedFunction<typeof clienteSupabase>;
const concluido = onboardingConcluido as jest.MockedFunction<typeof onboardingConcluido>;
const marcar = marcarOnboardingConcluido as jest.MockedFunction<typeof marcarOnboardingConcluido>;

const EMAIL = 'professor@exemplo.test';
const SENHA = 'aulaemdia-local';

// Os erros como o supabase-js os entrega.
const ERRO_CREDENCIAIS = { name: 'AuthApiError', code: 'invalid_credentials', status: 400 };
const ERRO_JA_EXISTE = { name: 'AuthApiError', code: 'user_already_exists', status: 422 };
const ERRO_SENHA_FRACA = { name: 'AuthWeakPasswordError', code: 'weak_password', status: 422 };
const ERRO_SEM_REDE = { name: 'AuthRetryableFetchError', status: 0 };

const usuario = (email = EMAIL) => ({ id: 'u1', email });
const sessaoDe = (email = EMAIL) => ({ access_token: 'token', user: usuario(email) });

/** O cliente simulado: só o `auth` que a sessão usa. */
function simularCliente() {
  const auth = {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  };
  cliente.mockReturnValue({ auth } as unknown as ReturnType<typeof clienteSupabase>);
  return auth;
}

const s = () => useSessao.getState();
const gravado = async () => {
  const bruto = await AsyncStorage.getItem(CHAVE_SESSAO);
  return bruto ? JSON.parse(bruto) : null;
};
const assentar = () => new Promise<void>((pronto) => setImmediate(pronto));

beforeEach(async () => {
  jest.clearAllMocks();
  modoSupabase.mockReturnValue(false);
  concluido.mockResolvedValue(true);
  marcar.mockResolvedValue();
  await AsyncStorage.clear();
  useSessao.setState({
    fase: 'entrada',
    tela: 'acesso',
    passo: 1,
    email: null,
    contaNova: false,
  });
});

describe('modo local, como sempre foi', () => {
  it('entrar vai direto para o app, na hora, e grava fase e e-mail', async () => {
    const resposta = s().entrar(EMAIL);

    // A tela de hoje não espera a promessa: o estado muda antes de ela resolver.
    expect(s().fase).toBe('app');
    expect(s().email).toBe(EMAIL);
    await expect(resposta).resolves.toBeNull();
    await assentar();
    expect(await gravado()).toEqual({ fase: 'app', email: EMAIL });
    expect(cliente).not.toHaveBeenCalled();
  });

  it('a senha não é pedida nem guardada', async () => {
    await expect(s().entrar(EMAIL)).resolves.toBeNull();
    await s().entrar(EMAIL, SENHA);
    await assentar();

    expect(JSON.stringify(await gravado())).not.toContain(SENHA);
  });

  it('criar conta abre o onboarding no passo 1', async () => {
    await expect(s().criarConta(EMAIL)).resolves.toBeNull();

    expect(s()).toMatchObject({ fase: 'onboarding', passo: 1, email: EMAIL, contaNova: true });
  });

  it('carregar restaura quem estava no app', async () => {
    await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify({ fase: 'app', email: EMAIL }));

    await s().carregar();

    expect(s()).toMatchObject({ fase: 'app', email: EMAIL });
  });

  it('carregar sem nada gravado começa pelas boas-vindas', async () => {
    await s().carregar();

    expect(s()).toMatchObject({ fase: 'entrada', tela: 'boasVindas' });
  });

  it('no modo local, o onboarding não vai ao banco', async () => {
    useSessao.setState({ fase: 'onboarding', passo: 4, email: EMAIL });
    s().concluirOnboarding();
    await s().sair();

    expect(marcar).not.toHaveBeenCalled();
    expect(concluido).not.toHaveBeenCalled();
  });

  it('concluir o onboarding grava a fase', async () => {
    await s().criarConta(EMAIL);
    s().concluirOnboarding();
    await assentar();

    expect(await gravado()).toEqual({ fase: 'app', email: EMAIL });
  });

  it('sair apaga o que estava gravado e volta para as boas-vindas', async () => {
    await s().entrar(EMAIL);
    await assentar();

    await s().sair();
    await assentar();

    expect(s()).toMatchObject({ fase: 'entrada', tela: 'boasVindas', email: null });
    expect(await gravado()).toBeNull();
    expect(cliente).not.toHaveBeenCalled();
  });

  it('loginReal é falso', () => {
    expect(loginReal()).toBe(false);
  });
});

describe('modo supabase', () => {
  beforeEach(() => {
    modoSupabase.mockReturnValue(true);
  });

  it('loginReal é verdadeiro', () => {
    expect(loginReal()).toBe(true);
  });

  it('entrar certo: vai para o app com o e-mail do login', async () => {
    const auth = simularCliente();
    auth.signInWithPassword.mockResolvedValue({
      data: { user: usuario(), session: sessaoDe() },
      error: null,
    });

    await expect(s().entrar(EMAIL, SENHA)).resolves.toBeNull();

    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: SENHA });
    expect(s()).toMatchObject({ fase: 'app', email: EMAIL, contaNova: false });
  });

  it('entrar com a senha errada: a frase de credenciais e a tela não sai do lugar', async () => {
    simularCliente().signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: ERRO_CREDENCIAIS,
    });

    await expect(s().entrar(EMAIL, 'errada')).resolves.toBe(ERRO.credenciaisInvalidas);

    expect(s()).toMatchObject({ fase: 'entrada', tela: 'acesso' });
  });

  it('criar conta com um e-mail que já existe: a frase de e-mail cadastrado', async () => {
    simularCliente().signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: ERRO_JA_EXISTE,
    });

    await expect(s().criarConta(EMAIL, SENHA)).resolves.toBe(ERRO.emailJaCadastrado);

    expect(s().fase).toBe('entrada');
  });

  it('sem rede: a frase de sem conexão, devolvida ou lançada', async () => {
    const auth = simularCliente();
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: ERRO_SEM_REDE,
    });
    await expect(s().entrar(EMAIL, SENHA)).resolves.toBe(ERRO.semConexao);

    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    auth.signUp.mockRejectedValue(ERRO_SEM_REDE);
    await expect(s().criarConta(EMAIL, SENHA)).resolves.toBe(ERRO.semConexao);
    aviso.mockRestore();

    expect(s().fase).toBe('entrada');
  });

  it('carregar restaura a sessão que o supabase-js guardou', async () => {
    simularCliente().getSession.mockResolvedValue({
      data: { session: sessaoDe() },
      error: null,
    });

    await s().carregar();

    expect(s()).toMatchObject({ fase: 'app', email: EMAIL });
  });

  it('carregar ignora a chave do modo local: sem sessão, é a entrada', async () => {
    simularCliente();
    await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify({ fase: 'app', email: EMAIL }));

    await s().carregar();

    expect(s()).toMatchObject({ fase: 'entrada', tela: 'boasVindas' });
  });

  it('sair chama o signOut e volta para as boas-vindas', async () => {
    const auth = simularCliente();
    useSessao.setState({ fase: 'app', email: EMAIL });

    await s().sair();

    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(s()).toMatchObject({ fase: 'entrada', tela: 'boasVindas', email: null });
  });

  it('sair sem rede ainda tira a pessoa do app', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    simularCliente().signOut.mockRejectedValue(ERRO_SEM_REDE);
    useSessao.setState({ fase: 'app', email: EMAIL });

    await s().sair();

    expect(s().fase).toBe('entrada');
    aviso.mockRestore();
  });

  it('criar conta certo: abre o onboarding no passo 1', async () => {
    simularCliente().signUp.mockResolvedValue({
      data: { user: usuario(), session: sessaoDe() },
      error: null,
    });

    await expect(s().criarConta(EMAIL, SENHA)).resolves.toBeNull();

    expect(s()).toMatchObject({ fase: 'onboarding', passo: 1, email: EMAIL, contaNova: true });
  });

  it('cadastro sem sessão (confirmação de e-mail ligada) não abre o onboarding', async () => {
    simularCliente().signUp.mockResolvedValue({
      data: { user: usuario(), session: null },
      error: null,
    });

    await expect(s().criarConta(EMAIL, SENHA)).resolves.toBe(ERRO.falhaNoAcesso);
    expect(s().fase).toBe('entrada');
  });

  it('sem senha, ou com e-mail inválido, nem vai à rede', async () => {
    const auth = simularCliente();

    await expect(s().entrar(EMAIL)).resolves.toBe(ERRO.senhaVazia);
    await expect(s().entrar(EMAIL, '')).resolves.toBe(ERRO.senhaVazia);
    await expect(s().criarConta('professor', SENHA)).resolves.toBe(ERRO.emailInvalido);
    await expect(s().criarConta(EMAIL, '123')).resolves.toBe(ERRO.senhaCurta);

    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('nada vai para a chave do modo local, nem depois do onboarding', async () => {
    simularCliente().signUp.mockResolvedValue({
      data: { user: usuario(), session: sessaoDe() },
      error: null,
    });

    await s().criarConta(EMAIL, SENHA);
    s().concluirOnboarding();
    await assentar();

    expect(s().fase).toBe('app');
    expect(await gravado()).toBeNull();
  });

  it('quem parou no meio do onboarding volta para o passo 1, e não para o app', async () => {
    simularCliente().getSession.mockResolvedValue({ data: { session: sessaoDe() }, error: null });
    concluido.mockResolvedValue(false);

    await s().carregar();

    expect(s()).toMatchObject({ fase: 'onboarding', passo: 1, email: EMAIL, contaNova: true });
  });

  it('entrar com o onboarding pela metade (conta criada noutro aparelho) também volta a ele', async () => {
    simularCliente().signInWithPassword.mockResolvedValue({
      data: { user: usuario(), session: sessaoDe() },
      error: null,
    });
    concluido.mockResolvedValue(false);

    await expect(s().entrar(EMAIL, SENHA)).resolves.toBeNull();
    expect(s()).toMatchObject({ fase: 'onboarding', passo: 1, contaNova: true });
  });

  it('sem rede para saber do onboarding, vale o app, que abre pelo cache', async () => {
    simularCliente().getSession.mockResolvedValue({ data: { session: sessaoDe() }, error: null });
    concluido.mockResolvedValue(null);

    await s().carregar();

    expect(s().fase).toBe('app');
  });

  it('concluir o onboarding grava a marca no banco', async () => {
    useSessao.setState({ fase: 'onboarding', passo: 4, email: EMAIL });

    s().concluirOnboarding();

    expect(s().fase).toBe('app');
    expect(marcar).toHaveBeenCalledTimes(1);
  });

  it('a marca que não grava não segura ninguém fora do app', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    marcar.mockRejectedValue(new Error('sem rede'));
    useSessao.setState({ fase: 'onboarding', passo: 4, email: EMAIL });

    s().concluirOnboarding();
    await assentar();

    expect(s().fase).toBe('app');
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });

  it('sair esquece os alunos da conta: quem entrar depois não os vê', async () => {
    simularCliente();
    const esquecer = jest.spyOn(useDados.getState(), 'esquecer');
    useSessao.setState({ fase: 'app', email: EMAIL });

    await s().sair();

    expect(esquecer).toHaveBeenCalledTimes(1);
    esquecer.mockRestore();
  });

  it('variável faltando: a falha genérica, e o motivo no console', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    cliente.mockImplementation(() => {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL faltando');
    });

    await expect(s().entrar(EMAIL, SENHA)).resolves.toBe(ERRO.falhaNoAcesso);
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });
});

describe('fraseDoErroDeAcesso — o erro do Supabase vira frase pelo código', () => {
  it.each([
    ['senha ou e-mail errados', ERRO_CREDENCIAIS, ERRO.credenciaisInvalidas],
    ['e-mail já cadastrado', ERRO_JA_EXISTE, ERRO.emailJaCadastrado],
    ['o outro código de e-mail repetido', { code: 'email_exists', status: 422 }, ERRO.emailJaCadastrado],
    ['senha fraca', ERRO_SENHA_FRACA, ERRO.senhaCurta],
    ['sem rede', ERRO_SEM_REDE, ERRO.semConexao],
    ['servidor fora do ar (502)', { name: 'AuthRetryableFetchError', status: 502 }, ERRO.falhaNoAcesso],
    ['limite de tentativas', { code: 'over_request_rate_limit', status: 429 }, ERRO.falhaNoAcesso],
    ['e-mail não confirmado', { code: 'email_not_confirmed', status: 400 }, ERRO.falhaNoAcesso],
    ['erro qualquer', new Error('boom'), ERRO.falhaNoAcesso],
    ['nada', undefined, ERRO.falhaNoAcesso],
  ])('%s', (_caso, erro, frase) => {
    expect(fraseDoErroDeAcesso(erro)).toBe(frase);
  });

  it('o texto em inglês da mensagem não decide nada', () => {
    expect(fraseDoErroDeAcesso({ message: 'Invalid login credentials' })).toBe(ERRO.falhaNoAcesso);
  });
});
