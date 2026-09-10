/**
 * Textos gerados a partir da política e dos dados — módulo puro.
 *
 * `comoOAlunoVaiLer` é usada em dois lugares do handoff: o cartão-espelho do
 * onboarding (A6) e o bloco "A regra combinada" da página do aluno (F1).
 * É a mesma frase de propósito — o que o professor declara é literalmente o
 * que o aluno lê.
 */

import { dinheiro, primeiroNome } from './formato';
import { valorPacote } from './politica';
import type { Aluno, Politicas, TomDeMensagem } from './tipos';

/** A política em linguagem de aluno. */
export function comoOAlunoVaiLer(p: Politicas, comValidade = true): string {
  const prazo = p.avisadaDevolve
    ? `Avisando com ${p.avisoHoras}h ou mais, a aula volta para o seu saldo e pode ser reposta`
    : `Faltas debitam a aula do pacote, mesmo com aviso`;

  const limite =
    p.avisadaDevolve && p.limiteReposicoes > 0
      ? `, até ${p.limiteReposicoes} ${
          p.limiteReposicoes === 1 ? 'vez' : 'vezes'
        } por pacote`
      : '';

  const validade =
    comValidade && p.validadeDias > 0 ? ` O pacote vale ${p.validadeDias} dias.` : '';

  return `${prazo}${limite}.${validade}`;
}

/** "+55 51 9•••• 4182" — como o handoff mostra o destino da mensagem. */
export function mascararTelefone(telefone?: string): string {
  const d = (telefone ?? '').replace(/\D/g, '');
  if (d.length < 10) return 'sem telefone cadastrado';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const inicio = resto.slice(0, 1);
  const fim = resto.slice(-4);
  return `+55 ${ddd} ${inicio}${'•'.repeat(4)} ${fim}`;
}

/** Mensagem de proposta de reposição (C6). */
export function mensagemDeReposicao(
  aluno: Aluno,
  janela: { dia: string; hora: string },
  p: Politicas,
): string {
  return [
    `Oi, ${primeiroNome(aluno.name)}!`,
    '',
    `Consegui encaixar a reposição da sua aula em ${janela.dia}, às ${janela.hora}.`,
    '',
    comoOAlunoVaiLer(p, false),
    '',
    'Confirma pra mim se serve?',
  ].join('\n');
}

const ABERTURA: Record<TomDeMensagem, (nome: string) => string> = {
  cordial: (n) => `Oi, ${n}! Tudo bem?`,
  direto: (n) => `Oi, ${n}.`,
  formal: (n) => `Olá, ${n}. Espero que esteja bem.`,
};

const FECHAMENTO: Record<TomDeMensagem, string> = {
  cordial: 'Qualquer coisa é só me chamar. Obrigado!',
  direto: 'Pode me avisar quando pagar?',
  formal: 'Fico à disposição para qualquer esclarecimento.',
};

/** Mensagem de cobrança nos três tons de D5. */
export function mensagemDeCobranca(
  aluno: Aluno,
  tom: TomDeMensagem,
  chavePix?: string,
): string {
  const nome = primeiroNome(aluno.name);
  const valor = dinheiro(valorPacote(aluno));
  const vencimento = aluno.pagamento.venceu ?? aluno.pagamento.vence;

  const corpo =
    tom === 'formal'
      ? `Consta em aberto o valor de ${valor}, referente ao pacote de ${aluno.total} aulas, com vencimento em ${vencimento}.`
      : `Passando pra lembrar do pacote de ${aluno.total} aulas: ${valor}, que venceu em ${vencimento}.`;

  const pix = chavePix
    ? `Minha chave Pix é ${chavePix}.`
    : 'Me avisa como prefere pagar que eu te mando os dados.';

  return [ABERTURA[tom](nome), '', corpo, '', pix, '', FECHAMENTO[tom]].join('\n');
}

/** Frase do cartão de resumo do pacote (A7 e D1). */
export function resumoDoPacote(aulas: number, valorTotal: number, validade: string): string {
  return `${aulas} aulas · ${dinheiro(valorTotal)} · validade ${validade}`;
}
