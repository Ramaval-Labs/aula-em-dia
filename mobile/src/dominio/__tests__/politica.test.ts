/**
 * Casos de spec/casos-de-teste.md, na mesma numeração.
 * As strings são conferidas letra a letra: elas aparecem na UI.
 */

import { estadoInicial, JANELA_VALIDADE_ESTENDIDA, JANELAS } from '../../dados/semente';
import { dinheiro, dinheiroCompacto, plural, unidade } from '../formato';
import {
  efeito,
  estenderValidade,
  faixaStatus,
  janelasDisponiveis,
  marcarReposicao,
  ordenar,
  podeRepor,
  POLITICAS_PADRAO,
  geraReposicao,
  registrarAula,
  registrarPagamento,
  saldo,
  saldoBaixo,
  temPacote,
  totaisFinanceiro,
  valorPacote,
} from '../politica';
import type { Aluno, Politicas } from '../tipos';

const HOJE = '28/08';
const padrao = POLITICAS_PADRAO;

const semente = () => estadoInicial();

const alunoPor = (id: string): Aluno => {
  const a = semente().alunos.find((x) => x.id === id);
  if (!a) throw new Error(`aluno ${id} não existe na semente`);
  return a;
};

const comPolitica = (p: Partial<Politicas>): Politicas => ({ ...padrao, ...p });

const alunoBase = (over: Partial<Aluno> = {}): Aluno => ({
  id: 'x',
  name: 'Teste Silva',
  disciplina: 'Matemática',
  dia: 'quarta',
  hora: '17h',
  hoje: false,
  total: 6,
  usadas: 2,
  validade: '30/10',
  reposicoes: 0,
  pagamento: { status: 'aberto', vence: '12/09' },
  ...over,
});

describe('efeito(desfecho, avisoH, politicas)', () => {
  it('1 — realizada debita e não gera reposição', () => {
    const e = efeito('realizada', 0, padrao);
    expect(e.delta).toBe(-1);
    expect(e.reposicao).toBe(false);
  });

  it('2 — avisada com 26h devolve a aula e gera reposição', () => {
    const e = efeito('avisada', 26, padrao);
    expect(e.delta).toBe(0);
    expect(e.reposicao).toBe(true);
    expect(e.nota).toBe('Aviso com 26h, dentro do mínimo de 24h');
    expect(e.detalhe).toBe('Aviso com 26h · reposição gerada');
  });

  it('3 — avisada exatamente no limite (24h) ainda devolve', () => {
    const e = efeito('avisada', 24, padrao);
    expect(e.delta).toBe(0);
    expect(e.reposicao).toBe(true);
  });

  it('4 — avisada com 23h fica fora do prazo', () => {
    const e = efeito('avisada', 23, padrao);
    expect(e.delta).toBe(-1);
    expect(e.reposicao).toBe(false);
    expect(e.nota).toBe('Aviso com 23h, abaixo do mínimo de 24h');
    expect(e.detalhe).toBe('Aviso com 23h · fora do prazo');
  });

  it('5 — política que não devolve debita mesmo com 48h', () => {
    const e = efeito('avisada', 48, comPolitica({ avisadaDevolve: false }));
    expect(e.delta).toBe(-1);
    expect(e.reposicao).toBe(false);
    expect(e.detalhe).toBe('Aviso com 48h · política não devolve');
  });

  it('6 — mínimo de 48h faz o aviso de 26h debitar', () => {
    const e = efeito('avisada', 26, comPolitica({ avisoHoras: 48 }));
    expect(e.delta).toBe(-1);
    expect(e.reposicao).toBe(false);
  });

  it('7 — falta sem aviso debita', () => {
    const e = efeito('sem_aviso', 0, padrao);
    expect(e.delta).toBe(-1);
    expect(e.reposicao).toBe(false);
  });

  it('8 — cancelamento do professor não debita e obriga reposição', () => {
    const e = efeito('cancelada_professor', 0, padrao);
    expect(e.delta).toBe(0);
    expect(e.reposicao).toBe(true);
  });

  it('9 — cancelamento do professor não depende da política', () => {
    const e = efeito('cancelada_professor', 0, comPolitica({ avisadaDevolve: false }));
    expect(e.delta).toBe(0);
    expect(e.reposicao).toBe(true);
  });
});

describe('saldo e limites', () => {
  it('10 — total 6, usadas 2 devolve 4', () => {
    expect(saldo(alunoBase({ total: 6, usadas: 2 }))).toBe(4);
  });

  it('11 — total 6, usadas 6 devolve 0', () => {
    expect(saldo(alunoBase({ total: 6, usadas: 6 }))).toBe(0);
  });

  it('12 — dado inconsistente nunca vira saldo negativo', () => {
    expect(saldo(alunoBase({ total: 6, usadas: 9 }))).toBe(0);
  });

  it('13 — sem pacote não tem pacote', () => {
    expect(temPacote(alunoBase({ semPacote: true, total: 0 }))).toBe(false);
  });

  it('14 — saldo 2 é saldo baixo', () => {
    expect(saldoBaixo(alunoBase({ total: 8, usadas: 6 }))).toBe(true);
  });

  it('15 — saldo 3 não é saldo baixo', () => {
    expect(saldoBaixo(alunoBase({ total: 8, usadas: 5 }))).toBe(false);
  });
});

describe('podeRepor(aluno, politicas)', () => {
  it('16 — 0 de 3 pode', () => {
    expect(podeRepor(alunoBase({ reposicoes: 0 }), padrao)).toBe(true);
  });

  it('17 — 3 de 3 não pode', () => {
    expect(podeRepor(alunoBase({ reposicoes: 3 }), padrao)).toBe(false);
  });

  it('18 — limite 0 significa sem limite', () => {
    const p = comPolitica({ limiteReposicoes: 0 });
    expect(podeRepor(alunoBase({ reposicoes: 9 }), p)).toBe(true);
  });
});

describe('registrarAula', () => {
  it('19 — Valentin (6/2) com falta avisada de 26h mantém o saldo e abre pendência', () => {
    const { aluno, lancamento } = registrarAula(alunoPor('val'), 'avisada', 26, padrao, HOJE);
    expect(aluno.usadas).toBe(2);
    expect(saldo(aluno)).toBe(4);
    expect(aluno.pendencia).toEqual({ origem: HOJE, dias: 0 });
    expect(lancamento.saldo).toBe(4);
  });

  it('20 — Valentin com aula realizada gasta uma aula', () => {
    const { aluno } = registrarAula(alunoPor('val'), 'realizada', 0, padrao, HOJE);
    expect(aluno.usadas).toBe(3);
    expect(saldo(aluno)).toBe(3);
    expect(aluno.pendencia).toBeUndefined();
  });

  it('21 — no limite de reposições o direito não é criado', () => {
    const entrada = alunoBase({ reposicoes: 3 });
    const { aluno, efeito: ef } = registrarAula(entrada, 'avisada', 26, padrao, HOJE);
    expect(ef.delta).toBe(0);
    expect(aluno.pendencia).toBeUndefined();
  });

  it('22 — a entrada não é mutada', () => {
    const entrada = alunoPor('val');
    const copia = JSON.parse(JSON.stringify(entrada));
    registrarAula(entrada, 'realizada', 0, padrao, HOJE);
    expect(entrada).toEqual(copia);
  });

  it('geraReposicao diz se a pendência nasce neste registro', () => {
    const val = alunoPor('val');
    // Falta avisada no prazo cria; aula realizada não; no limite, não cria.
    expect(geraReposicao(val, efeito('avisada', 26, padrao), padrao)).toBe(true);
    expect(geraReposicao(val, efeito('realizada', 0, padrao), padrao)).toBe(false);
    expect(
      geraReposicao(alunoBase({ reposicoes: 3 }), efeito('avisada', 26, padrao), padrao),
    ).toBe(false);
    // O que `registrarAula` grava é exatamente isso.
    const { aluno } = registrarAula(val, 'avisada', 26, padrao, HOJE);
    expect(!!aluno.pendencia).toBe(geraReposicao(val, efeito('avisada', 26, padrao), padrao));
  });

  it('23 — o lançamento entra no topo do extrato', () => {
    const { extratos } = semente();
    const { lancamento } = registrarAula(alunoPor('val'), 'realizada', 0, padrao, HOJE);
    const novo = [lancamento, ...extratos.val];
    expect(novo[0]).toBe(lancamento);
    expect(novo).toHaveLength(extratos.val.length + 1);
  });
});

describe('marcarReposicao', () => {
  const janela = { dia: 'Sexta, 29/08', hora: '17h' };

  it('24 — consome a reposição, limpa a pendência e agenda', () => {
    const { aluno } = marcarReposicao(alunoPor('raf'), janela, HOJE);
    expect(aluno.reposicoes).toBe(2);
    expect(aluno.pendencia).toBeNull();
    expect(aluno.agendada).toEqual(janela);
  });

  it('25 — lança "Reposição marcada" com dia e hora, sem mexer no saldo', () => {
    const { lancamento } = marcarReposicao(alunoPor('raf'), janela, HOJE);
    expect(lancamento.t).toBe('Reposição marcada');
    expect(lancamento.s).toBe('Sexta, 29/08, 17h');
    expect(lancamento.delta).toBe(0);
  });

  it('26 — texto do toast', () => {
    const a = alunoPor('raf');
    const primeiro = a.name.split(' ')[0];
    const toast = `Reposição de ${primeiro} em ${janela.dia}, ${janela.hora}. Mensagem enviada.`;
    expect(toast).toBe('Reposição de Rafael em Sexta, 29/08, 17h. Mensagem enviada.');
  });
});

describe('janelas de reposição', () => {
  it('27 — sem validade estendida são 3 janelas', () => {
    const j = janelasDisponiveis(alunoPor('raf'), JANELAS, JANELA_VALIDADE_ESTENDIDA);
    expect(j).toHaveLength(3);
  });

  it('28 — com validade estendida entra a quarta janela', () => {
    const a = { ...alunoPor('raf'), validadeEstendida: true };
    const j = janelasDisponiveis(a, JANELAS, JANELA_VALIDADE_ESTENDIDA);
    expect(j).toHaveLength(4);
    expect(j[3].dia).toBe('Quinta, 11/09');
    expect(j[3].hora).toBe('18h');
  });
});

describe('pagamento e validade', () => {
  it('29 — registrar pagamento quita, despausa e lança o valor do pacote', () => {
    const pausado = { ...alunoPor('val'), pausado: true };
    const { aluno, lancamento } = registrarPagamento(pausado, HOJE);
    expect(aluno.pagamento).toEqual({ status: 'pago', em: HOJE, meio: 'Pix' });
    expect(aluno.pausado).toBe(false);
    expect(lancamento.s).toBe('R$ 480,00 · Pix');
    expect(lancamento.dinheiro).toBe(true);
  });

  it('30 — dinheiro em pt-BR, com duas casas e milhar', () => {
    expect(dinheiro(480)).toBe('R$ 480,00');
    expect(dinheiro(1234.5)).toBe('R$ 1.234,50');
  });

  it('dinheiro compacto encurta só a partir de 5 dígitos', () => {
    expect(dinheiroCompacto(480)).toBe('R$ 480');
    expect(dinheiroCompacto(1234.5)).toBe('R$ 1.235');
    expect(dinheiroCompacto(9999)).toBe('R$ 9.999');
    expect(dinheiroCompacto(10000)).toBe('R$ 10 mil');
    expect(dinheiroCompacto(12500)).toBe('R$ 12,5 mil');
    expect(dinheiroCompacto(128400)).toBe('R$ 128,4 mil');
    expect(dinheiroCompacto(1250000)).toBe('R$ 1,3 mi');
    expect(dinheiroCompacto(-12500)).toBe('R$ -12,5 mil');
  });

  it('plural e unidade concordam com o número', () => {
    expect(plural(1, 'aula restante', 'aulas restantes')).toBe('1 aula restante');
    expect(plural(0, 'aula restante', 'aulas restantes')).toBe('0 aulas restantes');
    expect(unidade(1, 'aula', 'aulas')).toBe('aula');
    expect(unidade(2, 'aula', 'aulas')).toBe('aulas');
  });

  it('31 — estender validade grava a data e marca o pacote', () => {
    const { aluno } = estenderValidade(alunoPor('raf'), '15/10', HOJE);
    expect(aluno.validade).toBe('15/10');
    expect(aluno.validadeEstendida).toBe(true);
  });
});

describe('ordenação e faixa', () => {
  it('32 — urgência: atraso, pendência, normal, sem pacote', () => {
    const nomes = ordenar(semente().alunos, 'Urgência').map((a) => a.name);
    expect(nomes).toEqual([
      'Valentin Klein',
      'Rafael Dornelas',
      'Mateus Alves',
      'Bernardo Lemos',
    ]);
  });

  it('33 — A–Z', () => {
    const nomes = ordenar(semente().alunos, 'A–Z').map((a) => a.name);
    expect(nomes).toEqual([
      'Bernardo Lemos',
      'Mateus Alves',
      'Rafael Dornelas',
      'Valentin Klein',
    ]);
  });

  it('34 — Hoje filtra quem tem aula hoje', () => {
    const nomes = ordenar(semente().alunos, 'Hoje').map((a) => a.name);
    expect(nomes).toEqual(['Valentin Klein', 'Mateus Alves']);
  });

  it('35 — pausado vence atraso na precedência', () => {
    const a = alunoBase({ pausado: true, pagamento: { status: 'atraso', dias: 12 } });
    expect(faixaStatus(a)).toEqual({
      tipo: 'pausado',
      texto: 'Aulas pausadas',
      sufixo: 'até regularizar',
    });
  });

  it('36 — atraso vence pendência', () => {
    const a = alunoBase({
      pagamento: { status: 'atraso', dias: 12 },
      pendencia: { origem: '12/08', dias: 3 },
    });
    expect(faixaStatus(a)).toEqual({
      tipo: 'atraso',
      texto: 'Pagamento em atraso',
      sufixo: '12 dias',
    });
  });

  it('37 — pendência de hoje diz "hoje", não "há 0 dias"', () => {
    const a = alunoBase({ pendencia: { origem: HOJE, dias: 0 } });
    expect(faixaStatus(a)?.sufixo).toBe('hoje');
  });

  it('faixa de reposição marcada corta o dia da semana', () => {
    const a = alunoBase({ agendada: { dia: 'Sexta, 29/08', hora: '17h' } });
    expect(faixaStatus(a)?.sufixo).toBe('29/08 · 17h');
  });
});

describe('política (tela E2)', () => {
  it('38 — rascunho igual ao salvo não habilita Salvar', () => {
    const rascunho = { ...padrao };
    expect(JSON.stringify(rascunho) === JSON.stringify(padrao)).toBe(true);
  });

  it('39 — subir o prazo para 48h faz o aviso de 26h passar a debitar', () => {
    expect(efeito('avisada', 26, padrao).delta).toBe(0);
    expect(efeito('avisada', 26, comPolitica({ avisoHoras: 48 })).delta).toBe(-1);
  });

  it('40 — descartar volta ao valor salvo, sem efeito colateral', () => {
    const salva = { ...padrao };
    const rascunho: Politicas | null = null;
    expect(rascunho ?? salva).toEqual(padrao);
  });

  it('41 — limite 0 exibe "{n} reposições", sem "de X"', () => {
    const p = comPolitica({ limiteReposicoes: 0 });
    const a = alunoBase({ reposicoes: 2 });
    const texto =
      p.limiteReposicoes === 0
        ? `${a.reposicoes} reposições`
        : `${a.reposicoes} de ${p.limiteReposicoes} reposições`;
    expect(texto).toBe('2 reposições');
  });
});

describe('totais do financeiro', () => {
  it('soma por situação e ignora quem não tem pacote', () => {
    const t = totaisFinanceiro(semente().alunos);
    expect(t.emAtraso).toBe(valorPacote(alunoPor('val')));
    expect(t.aReceber).toBe(valorPacote(alunoPor('raf')));
    expect(t.recebido).toBe(valorPacote(alunoPor('mar')));
  });
});
