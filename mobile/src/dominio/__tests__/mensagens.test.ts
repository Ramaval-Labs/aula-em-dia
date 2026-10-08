/**
 * Textos de `mensagens.ts` (SCRUM-33), conferidos letra a letra.
 *
 * É copy que vai para a tela e para o WhatsApp de um aluno de verdade, então
 * cada caso escreve a frase inteira, com acento e pontuação, em vez de usar
 * snapshot: a ideia é que quem mexer na copy leia o que está mudando.
 *
 * De onde vem cada frase: `comoOAlunoVaiLer` e a máscara do telefone estão nos
 * protótipos (A6, F1 e D5 do handoff). As mensagens de reposição e de cobrança
 * não têm tabela em `spec/casos-de-teste.md` nem texto no handoff; aqui elas
 * ficam travadas como estão no ar.
 *
 * Os `it.failing` são defeitos encontrados escrevendo a suíte. O módulo não foi
 * tocado: cada um diz o que deveria sair e passa a falhar no dia em que for
 * corrigido, que é o aviso para tirar o `.failing`.
 */

import {
  comoOAlunoVaiLer,
  mascararTelefone,
  mensagemDeCobranca,
  mensagemDeReposicao,
  resumoDoPacote,
} from '../mensagens';
import type { Aluno, Politicas, TomDeMensagem } from '../tipos';

/** A política padrão de `spec/casos-de-teste.md`. */
const PADRAO: Politicas = {
  avisoHoras: 24,
  avisadaDevolve: true,
  limiteReposicoes: 3,
  validadeDias: 60,
};
const comPolitica = (p: Partial<Politicas>): Politicas => ({ ...PADRAO, ...p });

/** Valentin da semente: 6 aulas a R$ 80, pagamento vencido em 16/08. */
const alunoBase = (over: Partial<Aluno> = {}): Aluno => ({
  id: 'val',
  name: 'Valentin Klein',
  disciplina: 'Matemática',
  dia: 'quarta',
  hora: '17h',
  hoje: false,
  total: 6,
  usadas: 2,
  validade: '30/10',
  reposicoes: 0,
  pagamento: { status: 'atraso', venceu: '16/08', dias: 12 },
  ...over,
});

const TONS: TomDeMensagem[] = ['cordial', 'direto', 'formal'];

describe('comoOAlunoVaiLer(politicas, comValidade)', () => {
  it('política padrão, como no cartão-espelho do onboarding (A6)', () => {
    expect(comoOAlunoVaiLer(PADRAO)).toBe(
      'Avisando com 24h ou mais, a aula volta para o seu saldo e pode ser reposta, ' +
        'até 3 vezes por pacote. O pacote vale 60 dias.',
    );
  });

  it('sem a validade, como em "A regra combinada" da página do aluno (F1)', () => {
    expect(comoOAlunoVaiLer(PADRAO, false)).toBe(
      'Avisando com 24h ou mais, a aula volta para o seu saldo e pode ser reposta, ' +
        'até 3 vezes por pacote.',
    );
  });

  it('o prazo de aviso da política entra na frase', () => {
    expect(comoOAlunoVaiLer(comPolitica({ avisoHoras: 48 }), false)).toBe(
      'Avisando com 48h ou mais, a aula volta para o seu saldo e pode ser reposta, ' +
        'até 3 vezes por pacote.',
    );
  });

  it('uma reposição só é "1 vez", no singular', () => {
    expect(comoOAlunoVaiLer(comPolitica({ limiteReposicoes: 1 }), false)).toBe(
      'Avisando com 24h ou mais, a aula volta para o seu saldo e pode ser reposta, ' +
        'até 1 vez por pacote.',
    );
  });

  it('limite 0 é sem limite: a frase não fala em vezes', () => {
    expect(comoOAlunoVaiLer(comPolitica({ limiteReposicoes: 0 }), false)).toBe(
      'Avisando com 24h ou mais, a aula volta para o seu saldo e pode ser reposta.',
    );
  });

  it('validade 0 é sem prazo: a frase da validade some', () => {
    expect(comoOAlunoVaiLer(comPolitica({ validadeDias: 0 }))).toBe(
      'Avisando com 24h ou mais, a aula volta para o seu saldo e pode ser reposta, ' +
        'até 3 vezes por pacote.',
    );
  });

  it('política que não devolve a aula: outra frase, e o limite não aparece', () => {
    expect(comoOAlunoVaiLer(comPolitica({ avisadaDevolve: false }))).toBe(
      'Faltas debitam a aula do pacote, mesmo com aviso. O pacote vale 60 dias.',
    );
    expect(comoOAlunoVaiLer(comPolitica({ avisadaDevolve: false }), false)).toBe(
      'Faltas debitam a aula do pacote, mesmo com aviso.',
    );
  });
});

describe('mascararTelefone(telefone)', () => {
  it('celular com DDD, como o handoff mostra o destino da mensagem', () => {
    expect(mascararTelefone('51999994182')).toBe('+55 51 9•••• 4182');
  });

  it('a pontuação do formulário não muda a máscara', () => {
    expect(mascararTelefone('(51) 99999-4182')).toBe('+55 51 9•••• 4182');
  });

  it('fixo com DDD (10 dígitos) também é mascarado', () => {
    expect(mascararTelefone('5133334182')).toBe('+55 51 3•••• 4182');
  });

  it.each([
    ['vazio', ''],
    ['ausente', undefined],
    ['sem DDD, 9 dígitos', '999994182'],
    ['sem DDD, 8 dígitos', '33334182'],
    ['só texto', 'sem número'],
  ])('%s: avisa que não há telefone', (_caso, telefone) => {
    expect(mascararTelefone(telefone)).toBe('sem telefone cadastrado');
  });

  // Defeito: com o 55 na frente, a função lê o DDI como DDD e devolve
  // "+55 55 5•••• 4182". O botão do WhatsApp (SCRUM-25) já entende o número com
  // país; a máscara ao lado dele mostra outro destino.
  it.failing('com DDI, o DDD mostrado é o do número, não o 55', () => {
    expect(mascararTelefone('5551999994182')).toBe('+55 51 9•••• 4182');
    expect(mascararTelefone('+55 51 99999-4182')).toBe('+55 51 9•••• 4182');
  });
});

describe('mensagemDeReposicao(aluno, janela, politicas)', () => {
  const rafael = alunoBase({ id: 'raf', name: 'Rafael Dornelas' });
  const janela = { dia: 'Sexta, 29/08', hora: '17h' };

  it('a mensagem inteira, com a regra combinada e sem a validade', () => {
    expect(mensagemDeReposicao(rafael, janela, PADRAO)).toBe(
      [
        'Oi, Rafael!',
        '',
        'Consegui encaixar a reposição da sua aula em Sexta, 29/08, às 17h.',
        '',
        'Avisando com 24h ou mais, a aula volta para o seu saldo e pode ser reposta, ' +
          'até 3 vezes por pacote.',
        '',
        'Confirma pra mim se serve?',
      ].join('\n'),
    );
  });

  it('chama o aluno pelo primeiro nome, mesmo com espaço sobrando', () => {
    const mensagem = mensagemDeReposicao(
      alunoBase({ name: '  Maria Clara  de Souza ' }),
      janela,
      PADRAO,
    );

    expect(mensagem.split('\n')[0]).toBe('Oi, Maria!');
  });

  it('a regra que vai é a da política do professor, não a padrão', () => {
    const mensagem = mensagemDeReposicao(
      rafael,
      janela,
      comPolitica({ avisoHoras: 12, limiteReposicoes: 0 }),
    );

    expect(mensagem.split('\n')[4]).toBe(
      'Avisando com 12h ou mais, a aula volta para o seu saldo e pode ser reposta.',
    );
  });

  it('com política que não devolve, a linha da regra é a da falta debitada', () => {
    // Acontece: aula cancelada pelo professor gera reposição mesmo assim.
    const mensagem = mensagemDeReposicao(rafael, janela, comPolitica({ avisadaDevolve: false }));

    expect(mensagem.split('\n')[4]).toBe('Faltas debitam a aula do pacote, mesmo com aviso.');
  });
});

describe('mensagemDeCobranca(aluno, tom, chavePix)', () => {
  const valentin = alunoBase();
  const PIX = 'caio@exemplo.test';

  it('tom cordial', () => {
    expect(mensagemDeCobranca(valentin, 'cordial', PIX)).toBe(
      [
        'Oi, Valentin! Tudo bem?',
        '',
        'Passando pra lembrar do pacote de 6 aulas: R$ 480,00, que venceu em 16/08.',
        '',
        'Minha chave Pix é caio@exemplo.test.',
        '',
        'Qualquer coisa é só me chamar. Obrigado!',
      ].join('\n'),
    );
  });

  it('tom direto', () => {
    expect(mensagemDeCobranca(valentin, 'direto', PIX)).toBe(
      [
        'Oi, Valentin.',
        '',
        'Passando pra lembrar do pacote de 6 aulas: R$ 480,00, que venceu em 16/08.',
        '',
        'Minha chave Pix é caio@exemplo.test.',
        '',
        'Pode me avisar quando pagar?',
      ].join('\n'),
    );
  });

  it('tom formal', () => {
    expect(mensagemDeCobranca(valentin, 'formal', PIX)).toBe(
      [
        'Olá, Valentin. Espero que esteja bem.',
        '',
        'Consta em aberto o valor de R$ 480,00, referente ao pacote de 6 aulas, ' +
          'com vencimento em 16/08.',
        '',
        'Minha chave Pix é caio@exemplo.test.',
        '',
        'Fico à disposição para qualquer esclarecimento.',
      ].join('\n'),
    );
  });

  it('os três tons dão três mensagens diferentes', () => {
    const mensagens = TONS.map((tom) => mensagemDeCobranca(valentin, tom, PIX));

    expect(new Set(mensagens).size).toBe(3);
  });

  // O lembrete de cobrança (SCRUM-26) abre o WhatsApp com este texto: professor
  // sem chave Pix não pode sair com uma linha vazia nem com "undefined".
  it.each(TONS)('professor sem chave Pix, tom %s: pede para combinar o pagamento', (tom) => {
    const linhas = mensagemDeCobranca(valentin, tom).split('\n');

    expect(linhas).toHaveLength(7);
    expect(linhas[4]).toBe('Me avisa como prefere pagar que eu te mando os dados.');
    expect(linhas.join('\n')).not.toMatch(/Pix|undefined/);
  });

  it('chave Pix vazia vale como sem chave', () => {
    expect(mensagemDeCobranca(valentin, 'cordial', '')).toBe(
      mensagemDeCobranca(valentin, 'cordial'),
    );
  });

  it('a chave entra como foi digitada, seja e-mail, telefone ou aleatória', () => {
    const chave = (pix: string) => mensagemDeCobranca(valentin, 'direto', pix).split('\n')[4];

    expect(chave('+55 51 90000-0101')).toBe('Minha chave Pix é +55 51 90000-0101.');
    expect(chave('7d9f3c1e-2b4a-4f6d-9c8e-1a2b3c4d5e6f')).toBe(
      'Minha chave Pix é 7d9f3c1e-2b4a-4f6d-9c8e-1a2b3c4d5e6f.',
    );
  });

  describe('o valor sai pelo dinheiro(), com centavos e milhar em pt-BR', () => {
    const corpo = (aluno: Aluno) => mensagemDeCobranca(aluno, 'cordial').split('\n')[2];

    it('nunca "R$ 480" cru: sempre com as duas casas', () => {
      expect(corpo(valentin)).toContain('R$ 480,00');
      expect(corpo(valentin)).not.toMatch(/R\$ 480(?!,00)/);
    });

    it('valor por aula do aluno sobrepõe o padrão, com centavos', () => {
      const aluno = alunoBase({ total: 4, valorPorAula: 62.5 });

      expect(corpo(aluno)).toBe(
        'Passando pra lembrar do pacote de 4 aulas: R$ 250,00, que venceu em 16/08.',
      );
    });

    it('acima de mil, o milhar vai com ponto', () => {
      const aluno = alunoBase({ total: 12, valorPorAula: 150 });

      expect(corpo(aluno)).toBe(
        'Passando pra lembrar do pacote de 12 aulas: R$ 1.800,00, que venceu em 16/08.',
      );
    });
  });

  it('no tom formal, pagamento ainda a vencer usa a data do vencimento', () => {
    const aberto = alunoBase({ pagamento: { status: 'aberto', vence: '12/09' } });

    expect(mensagemDeCobranca(aberto, 'formal').split('\n')[2]).toBe(
      'Consta em aberto o valor de R$ 480,00, referente ao pacote de 6 aulas, ' +
        'com vencimento em 12/09.',
    );
  });

  // Defeito latente: nos tons cordial e direto o texto diz "que venceu em",
  // mesmo quando a data ainda não chegou. Hoje a tela só abre o lembrete para
  // quem está em atraso, então não aparece; a função aceita qualquer aluno.
  it.failing('pagamento a vencer não é cobrado como vencido', () => {
    const aberto = alunoBase({ pagamento: { status: 'aberto', vence: '12/09' } });

    expect(mensagemDeCobranca(aberto, 'cordial')).not.toContain('que venceu em');
  });

  // Defeito latente: sem data de vencimento, a mensagem sai com "undefined".
  it.failing.each(TONS)('aluno sem vencimento, tom %s: não escreve "undefined"', (tom) => {
    const semData = alunoBase({ pagamento: { status: 'sem' } });

    expect(mensagemDeCobranca(semData, tom)).not.toContain('undefined');
  });
});

describe('resumoDoPacote(aulas, valorTotal, validade)', () => {
  it.each([
    [4, 320, '30/10', '4 aulas · R$ 320,00 · validade 30/10'],
    [8, 640, '27/10', '8 aulas · R$ 640,00 · validade 27/10'],
    [12, 960, '30/11', '12 aulas · R$ 960,00 · validade 30/11'],
  ])('%d aulas por %d: "%s"', (aulas, valor, validade, frase) => {
    expect(resumoDoPacote(aulas, valor, validade)).toBe(frase);
  });

  it('pacote sem prazo', () => {
    expect(resumoDoPacote(8, 640, 'sem prazo')).toBe('8 aulas · R$ 640,00 · validade sem prazo');
  });

  it('valor com centavos e com milhar', () => {
    expect(resumoDoPacote(8, 500.5, '30/10')).toBe('8 aulas · R$ 500,50 · validade 30/10');
    expect(resumoDoPacote(12, 1800, '30/10')).toBe('12 aulas · R$ 1.800,00 · validade 30/10');
  });
});
