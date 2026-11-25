/** Validação de formulário. As mensagens aparecem na tela — conferidas literais. */

import {
  emailValido,
  ERRO,
  formatarTelefone,
  horasDeAvisoDigitadas,
  iniciaisDe,
  LIMITE_HORAS_DE_AVISO,
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

describe('ERRO — as mensagens do login de verdade (SCRUM-58)', () => {
  it.each([
    ['credenciaisInvalidas', 'E-mail ou senha não conferem'],
    ['emailJaCadastrado', 'Já existe uma conta com esse e-mail'],
    ['semConexao', 'Sem conexão. Confira a internet e tente de novo'],
    ['falhaNoAcesso', 'Não deu para entrar agora. Tente de novo em instantes'],
  ] as const)('%s: "%s"', (chave, texto) => {
    expect(ERRO[chave]).toBe(texto);
  });

  it('nenhuma mensagem do dicionário termina em ponto, como as que já existiam', () => {
    expect(Object.values(ERRO).filter((m) => m.endsWith('.'))).toEqual([]);
  });

  it('as mensagens que a tela de Acesso já mostrava não mudaram', () => {
    expect(ERRO.emailVazio).toBe('Informe seu e-mail');
    expect(ERRO.emailInvalido).toBe('Esse e-mail não parece certo');
    expect(ERRO.senhaVazia).toBe('Informe sua senha');
    expect(ERRO.senhaCurta).toBe('A senha precisa de pelo menos 6 caracteres');
  });
});

describe('horasDeAvisoDigitadas (SCRUM-101)', () => {
  it('aceita qualquer número inteiro de horas, inclusive 0 e o limite', () => {
    expect(horasDeAvisoDigitadas('36')).toEqual({ horas: 36 });
    expect(horasDeAvisoDigitadas(' 5 ')).toEqual({ horas: 5 });
    expect(horasDeAvisoDigitadas('0')).toEqual({ horas: 0 });
    expect(horasDeAvisoDigitadas(String(LIMITE_HORAS_DE_AVISO))).toEqual({ horas: 720 });
  });

  it('vazio pede o número', () => {
    expect(horasDeAvisoDigitadas('')).toEqual({ erro: ERRO.avisoVazio });
    expect(horasDeAvisoDigitadas('  ')).toEqual({ erro: ERRO.avisoVazio });
  });

  it('o que não é hora inteira é recusado', () => {
    for (const t of ['abc', '2,5', '-3', '12h']) {
      expect(horasDeAvisoDigitadas(t)).toEqual({ erro: ERRO.avisoInvalido });
    }
  });

  it('acima de 30 dias é engano de digitação', () => {
    expect(horasDeAvisoDigitadas('721')).toEqual({ erro: ERRO.avisoAlto });
  });

  it('as mensagens, literais', () => {
    expect(ERRO.avisoVazio).toBe('Informe com quantas horas ele avisou');
    expect(ERRO.avisoInvalido).toBe('Use só o número de horas, como 24');
    expect(ERRO.avisoAlto).toBe('Use até 720 horas (30 dias)');
  });
});
