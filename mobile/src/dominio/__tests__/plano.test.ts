/**
 * O limite de alunos do plano gratuito (SCRUM-77).
 *
 * O número é o que a tela de Conta já mostrava ("x de 5 alunos usados"). Bloquear
 * o aluno seguinte no cadastro é outra decisão: aqui só a conta.
 */

import { alunosAtivos, atingiuOLimite, LIMITE_GRATUITO } from '../plano';
import type { Aluno } from '../tipos';

const aluno = (id: number, over: Partial<Aluno> = {}): Aluno => ({
  id: `a${id}`,
  name: `Aluno ${id}`,
  disciplina: 'Matemática',
  dia: 'terça',
  hora: '18h',
  hoje: false,
  total: 8,
  usadas: 0,
  validade: '30/09',
  reposicoes: 0,
  pagamento: { status: 'pago' },
  ...over,
});

const ativos = (quantos: number): Aluno[] =>
  Array.from({ length: quantos }, (_, i) => aluno(i));

const arquivados = (quantos: number): Aluno[] =>
  Array.from({ length: quantos }, (_, i) => aluno(100 + i, { arquivado: true }));

describe('LIMITE_GRATUITO', () => {
  it('é 5, o número que a tela de Conta mostra', () => {
    expect(LIMITE_GRATUITO).toBe(5);
  });
});

describe('alunosAtivos', () => {
  it('tira o arquivado', () => {
    const lista = [aluno(1), aluno(2, { arquivado: true }), aluno(3)];
    expect(alunosAtivos(lista).map((a) => a.id)).toEqual(['a1', 'a3']);
  });

  it('conta quem tem arquivado: false e quem nem tem o campo', () => {
    const lista = [aluno(1, { arquivado: false }), aluno(2)];
    expect(alunosAtivos(lista)).toHaveLength(2);
  });

  it('não confunde arquivado com pausado nem com sem pacote', () => {
    const lista = [aluno(1, { pausado: true }), aluno(2, { semPacote: true, total: 0 })];
    expect(alunosAtivos(lista)).toHaveLength(2);
  });

  it('lista vazia fica vazia', () => {
    expect(alunosAtivos([])).toEqual([]);
  });

  it('não muda a lista recebida', () => {
    const lista = [aluno(1, { arquivado: true }), aluno(2)];
    alunosAtivos(lista);
    expect(lista).toHaveLength(2);
  });
});

describe('atingiuOLimite', () => {
  it('no gratuito, 4 ativos ainda têm vaga', () => {
    expect(atingiuOLimite(ativos(4), 'gratuito')).toBe(false);
  });

  it('no gratuito, 5 ativos atingem o limite', () => {
    expect(atingiuOLimite(ativos(5), 'gratuito')).toBe(true);
  });

  it('no gratuito, mais de 5 ativos continuam no limite', () => {
    expect(atingiuOLimite(ativos(6), 'gratuito')).toBe(true);
  });

  it('o arquivado não ocupa vaga', () => {
    expect(atingiuOLimite([...ativos(4), ...arquivados(10)], 'gratuito')).toBe(false);
    expect(atingiuOLimite(arquivados(5), 'gratuito')).toBe(false);
  });

  it('o arquivado também não tira vaga de quem já está no limite', () => {
    expect(atingiuOLimite([...ativos(5), ...arquivados(1)], 'gratuito')).toBe(true);
  });

  it('sem alunos, não atingiu', () => {
    expect(atingiuOLimite([], 'gratuito')).toBe(false);
  });

  it('no pago, 50 ativos não atingem', () => {
    expect(atingiuOLimite(ativos(50), 'pago')).toBe(false);
  });

  it('no pago, 5 ativos também não atingem', () => {
    expect(atingiuOLimite(ativos(LIMITE_GRATUITO), 'pago')).toBe(false);
  });
});
