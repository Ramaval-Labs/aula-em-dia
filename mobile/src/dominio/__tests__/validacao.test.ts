/** Validação de formulário. As mensagens aparecem na tela — conferidas literais. */

import {
  emailValido,
  ERRO,
  formatarTelefone,
  iniciaisDe,
  nomeValido,
  semErros,
  senhaValida,
  somenteDigitos,
  telefoneValido,
  validarAcesso,
} from '../validacao';

describe('emailValido', () => {
  it('aceita o e-mail do mock do handoff', () => {
    expect(emailValido('camila.torres@gmail.com')).toBe(true);
  });

  it('ignora espaço nas pontas', () => {
    expect(emailValido('  a@b.co  ')).toBe(true);
  });

  it.each(['', 'camila', 'camila@', '@gmail.com', 'camila@gmail', 'a b@c.com'])(
    'recusa %p',
    (v) => {
      expect(emailValido(v)).toBe(false);
    },
  );
});

describe('senhaValida', () => {
  it('exige seis caracteres', () => {
    expect(senhaValida('12345')).toBe(false);
    expect(senhaValida('123456')).toBe(true);
  });
});

describe('nomeValido', () => {
  it('recusa vazio e uma letra só', () => {
    expect(nomeValido('   ')).toBe(false);
    expect(nomeValido('C')).toBe(false);
  });

  it('aceita nome de verdade', () => {
    expect(nomeValido('Marina Alves')).toBe(true);
  });
});

describe('telefone', () => {
  it('tira tudo que não é dígito', () => {
    expect(somenteDigitos('(51) 99999-4182')).toBe('51999994182');
  });

  it('aceita fixo com DDD e celular', () => {
    expect(telefoneValido('5133334182')).toBe(true);
    expect(telefoneValido('51999994182')).toBe(true);
  });

  it('recusa incompleto e longo demais', () => {
    expect(telefoneValido('519999')).toBe(false);
    expect(telefoneValido('519999941820')).toBe(false);
  });

  it('formata enquanto se digita, sem forçar o que ainda não veio', () => {
    expect(formatarTelefone('5')).toBe('5');
    expect(formatarTelefone('51')).toBe('51');
    expect(formatarTelefone('5199')).toBe('(51) 99');
    expect(formatarTelefone('5133334182')).toBe('(51) 3333-4182');
    expect(formatarTelefone('51999994182')).toBe('(51) 99999-4182');
  });

  it('não passa de onze dígitos', () => {
    expect(formatarTelefone('519999941829999')).toBe('(51) 99999-4182');
  });
});

describe('iniciaisDe', () => {
  it('pega a primeira e a última palavra', () => {
    expect(iniciaisDe('Camila Torres')).toBe('CT');
    expect(iniciaisDe('Caio Torres')).toBe('CT');
    expect(iniciaisDe('Maria da Silva Alves')).toBe('MA');
  });

  it('nome de uma palavra devolve uma letra', () => {
    expect(iniciaisDe('Marina')).toBe('M');
  });

  it('vazio devolve vazio', () => {
    expect(iniciaisDe('   ')).toBe('');
  });
});

describe('validarAcesso', () => {
  it('sem erros quando os dois campos estão certos', () => {
    const e = validarAcesso('camila.torres@gmail.com', 'segredo123');
    expect(semErros(e)).toBe(true);
  });

  it('campo vazio tem mensagem própria, diferente de inválido', () => {
    expect(validarAcesso('', 'segredo123').email).toBe(ERRO.emailVazio);
    expect(validarAcesso('camila', 'segredo123').email).toBe(ERRO.emailInvalido);
  });

  it('senha curta avisa o mínimo', () => {
    expect(validarAcesso('a@b.co', '123').senha).toBe(
      'A senha precisa de pelo menos 6 caracteres',
    );
  });

  it('acumula os dois erros', () => {
    const e = validarAcesso('', '');
    expect(e.email).toBe(ERRO.emailVazio);
    expect(e.senha).toBe(ERRO.senhaVazia);
    expect(semErros(e)).toBe(false);
  });
});
