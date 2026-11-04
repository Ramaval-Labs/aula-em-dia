/**
 * O recorte do que o aluno vê pelo link (SCRUM-69).
 *
 * O ponto da suíte é o que NÃO sai: o resultado vai para o navegador de quem
 * tem o link, sem conta e sem login. Por isso as provas olham o JSON inteiro,
 * que é o que atravessa a rede, e não só os campos que a tela lê.
 *
 * `HOJE` entra como literal e o relógio fica parado nele: a semente resolve
 * `hoje±N` contra o relógio, e o recorte recebe a data pela `referencia`.
 * Nenhuma das duas passa por `hoje()` aqui.
 */

import { estadoInicial, type EstadoPersistivel } from '../../dados/semente';
import { candidatos, melhores, type Candidata } from '../agenda';
import { nomeDoDia } from '../disponibilidade';
import { comoOAlunoVaiLer } from '../mensagens';
import { paginaDoAluno } from '../paginaDoAluno';
import { saldo, temPacote } from '../politica';
import type { Aluno, Janela, Lancamento, Proposta } from '../tipos';

// O tsconfig não carrega os tipos do Node, como em legado.test.ts.
declare const __dirname: string;
const fs: { readFileSync: (arquivo: string, codificacao: 'utf8') => string } = require('fs');

const HOJE = '28/08';
const OUTRO_DIA = '05/09';
const DIAS_ATE_OUTRO_DIA = 8;

let semente: EstadoPersistivel;

beforeAll(() => {
  jest.useFakeTimers({ now: new Date(2026, 7, 28, 12) });
  semente = estadoInicial();
});

afterAll(() => {
  jest.useRealTimers();
});

const alunoPor = (id: string): Aluno => {
  const a = semente.alunos.find((x) => x.id === id);
  if (!a) throw new Error(`aluno ${id} não existe na semente`);
  return a;
};

/** O recorte de um aluno, com todo o resto vindo da semente. */
const pagina = (aluno: Aluno, referencia: string = HOJE) =>
  paginaDoAluno(
    aluno,
    semente.extratos[aluno.id] ?? [],
    semente.perfil,
    semente.politicas,
    semente.alunos,
    semente.disponibilidade,
    referencia,
  );

const comoJson = (aluno: Aluno, referencia?: string) => JSON.stringify(pagina(aluno, referencia));

const propostaEm = (janela: Proposta['janela'], over: Partial<Proposta> = {}): Proposta => ({
  janela,
  enviadaEm: HOJE,
  status: 'enviada',
  alternativas: [],
  ...over,
});

describe('o que não sai do recorte', () => {
  const IDS = ['val', 'raf', 'mar', 'bea'];

  it.each(IDS)('%s: nem telefone nem e-mail do aluno', (id) => {
    const a = alunoPor(id);
    const json = comoJson(a);

    expect(a.telefone).toBeTruthy();
    expect(json).not.toContain(a.telefone as string);
    expect(a.email).toBeTruthy();
    expect(json).not.toContain(a.email as string);
  });

  it.each(IDS)('%s: nem o nome nem o sobrenome de outro aluno', (id) => {
    const json = comoJson(alunoPor(id));

    for (const outro of semente.alunos.filter((a) => a.id !== id)) {
      for (const parte of outro.name.split(' ')) expect(json).not.toContain(parte);
    }
  });

  it.each(IDS)('%s: nem o sobrenome dele mesmo', (id) => {
    const [, ...sobrenome] = alunoPor(id).name.split(' ');

    expect(sobrenome.length).toBeGreaterThan(0);
    for (const parte of sobrenome) expect(comoJson(alunoPor(id))).not.toContain(parte);
  });

  it.each(IDS)('%s: do professor, só o primeiro nome', (id) => {
    const json = comoJson(alunoPor(id));
    const { nome, email, iniciais } = semente.perfil;

    expect(nome.split(' ')).toHaveLength(2);
    expect(json).not.toContain(nome.split(' ')[1]);
    expect(json).not.toContain(email);
    expect(json).not.toContain(iniciais);
  });

  it('nem a chave Pix do professor', () => {
    const json = JSON.stringify(
      paginaDoAluno(
        alunoPor('raf'),
        [],
        { ...semente.perfil, chavePix: 'pix-do-professor@exemplo.test' },
        semente.politicas,
        semente.alunos,
        semente.disponibilidade,
        HOJE,
      ),
    );

    expect(json).not.toContain('pix-do-professor');
  });

  it('nem o preço, a cobrança ou os campos internos do aluno', () => {
    const a: Aluno = {
      ...alunoPor('val'),
      valorPorAula: 123,
      lembretes: 7,
      ultimoLembrete: '20/08',
      atrasosHistoricos: 9,
      pagamento: { status: 'atraso', venceu: '16/08', dias: 12 },
    };
    const json = JSON.stringify(
      paginaDoAluno(
        a,
        [],
        semente.perfil,
        semente.politicas,
        semente.alunos,
        semente.disponibilidade,
        HOJE,
      ),
    );

    for (const chave of [
      'id',
      'name',
      'valorPorAula',
      'pagamento',
      'lembretes',
      'ultimoLembrete',
      'atrasosHistoricos',
      'pendencia',
      'reposicoes',
      'usadas',
    ]) {
      expect(json).not.toContain(`"${chave}"`);
    }
    expect(json).not.toContain('123');
    expect(json).not.toContain('16/08');
  });

  it('nem a grade do professor: a disponibilidade é só a que o aluno informou', () => {
    const a: Aluno = { ...alunoPor('val'), disponibilidade: [{ dia: 'seg', faixa: 'manha' }] };

    expect(pagina(a).disponibilidade).toEqual([{ dia: 'seg', faixa: 'manha' }]);
    expect(comoJson(a)).not.toContain('"folgas"');
    expect(comoJson(a)).not.toContain(semente.disponibilidade.folgas[0].motivo);
    expect(comoJson(a)).not.toContain('"aceitaForaDosBlocos"');
    expect(comoJson(a)).not.toContain('"sugereSabado"');
  });

  it('o motivo gravado na alternativa não sai: é texto solto e pode citar outro aluno', () => {
    const [alvo] = candidatos(alunoPor('val'), semente.alunos, semente.disponibilidade, HOJE);
    const alternativa: Janela = {
      dia: 'Quinta, 03/09',
      hora: '19h',
      motivo: 'Emenda na aula do Rafael, sem intervalo entre as duas',
    };
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: alvo.dia, hora: alvo.hora }, { alternativas: [alternativa] }),
    };

    expect(comoJson(a)).not.toContain('Rafael');
    expect(comoJson(a)).not.toContain('Emenda');
  });

  it('a alternativa gravada é uma Candidata inteira, e os campos do motor não saem', () => {
    // ConfirmarReposicao grava as próprias candidatas em `alternativas`.
    const lista = candidatos(alunoPor('val'), semente.alunos, semente.disponibilidade, HOJE);
    const [alvo, segunda] = melhores(lista, 2);
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: alvo.dia, hora: alvo.hora }, { alternativas: [segunda] }),
    };

    expect(pagina(a).proposta?.alternativas).toEqual([
      { dia: segunda.dia, hora: segunda.hora, razoes: segunda.razoes },
    ]);
    for (const chave of ['bloco', 'pontos', 'emDias', 'melhor', 'motivo', 'data']) {
      expect(comoJson(a)).not.toContain(`"${chave}"`);
    }
  });

  it('do extrato, só os campos de um lançamento', () => {
    const comSobra = {
      d: '20/08',
      t: 'Aula realizada',
      s: 'Quarta, 17h',
      delta: -1,
      saldo: 4,
      professor_id: 'id-interno',
    } as Lancamento;
    const json = JSON.stringify(
      paginaDoAluno(
        alunoPor('val'),
        [comSobra],
        semente.perfil,
        semente.politicas,
        semente.alunos,
        semente.disponibilidade,
        HOJE,
      ),
    );

    expect(json).not.toContain('id-interno');
  });
});

describe('o que sai do recorte', () => {
  it('os dados do aluno', () => {
    const a = alunoPor('val');

    expect(pagina(a)).toMatchObject({
      nome: 'Valentin',
      disciplina: a.disciplina,
      dia: a.dia,
      hora: a.hora,
      total: a.total,
      validade: a.validade,
      agendada: null,
      disponibilidade: [],
    });
  });

  it('a reposição já marcada', () => {
    const agendada = { dia: 'Sexta, 04/09', hora: '17h' };

    expect(pagina({ ...alunoPor('val'), agendada }).agendada).toEqual(agendada);
  });

  it('a regra combinada é a mesma frase da página do aluno', () => {
    expect(pagina(alunoPor('val')).regra).toBe(comoOAlunoVaiLer(semente.politicas, false));
  });

  it('o extrato do aluno, na mesma ordem', () => {
    const a = alunoPor('val');
    const extrato = semente.extratos.val;

    expect(extrato.length).toBeGreaterThan(0);
    expect(pagina(a).extrato).toEqual(extrato);
  });

  it('o extrato mantém a marca de lançamento em dinheiro', () => {
    const pagamento: Lancamento = {
      d: '20/08',
      t: 'Pagamento recebido',
      s: 'R$ 480,00 · Pix',
      delta: 0,
      saldo: 4,
      dinheiro: true,
    };
    const { extrato } = paginaDoAluno(
      alunoPor('val'),
      [pagamento],
      semente.perfil,
      semente.politicas,
      semente.alunos,
      semente.disponibilidade,
      HOJE,
    );

    expect(extrato).toEqual([pagamento]);
  });

  it('o professor: primeiro nome e primeira disciplina', () => {
    expect(pagina(alunoPor('val')).professor).toEqual({
      nome: semente.perfil.nome.split(' ')[0],
      disciplina: semente.perfil.disciplinas[0],
    });
  });

  it('professor sem disciplina cadastrada fica com null', () => {
    const { professor } = paginaDoAluno(
      alunoPor('val'),
      [],
      { ...semente.perfil, disciplinas: [] },
      semente.politicas,
      semente.alunos,
      semente.disponibilidade,
      HOJE,
    );

    expect(professor.disciplina).toBeNull();
  });
});

describe('saldo e pacote batem com politica.ts', () => {
  it.each(['val', 'raf', 'mar', 'bea'])('%s', (id) => {
    const a = alunoPor(id);

    expect(pagina(a).saldo).toBe(saldo(a));
    expect(pagina(a).temPacote).toBe(temPacote(a));
  });

  it('o aluno sem pacote da semente', () => {
    expect(pagina(alunoPor('bea'))).toMatchObject({ saldo: 0, total: 0, temPacote: false });
  });

  it('o aluno pausado continua vendo o saldo e o pacote', () => {
    // A semente não tem aluno pausado: a falta de pagamento pausa em execução.
    const a: Aluno = { ...alunoPor('val'), pausado: true };

    expect(pagina(a).saldo).toBe(saldo(a));
    expect(pagina(a).temPacote).toBe(true);
    expect(comoJson(a)).not.toContain('"pausado"');
  });

  it('o saldo sai de saldo(), que nunca fica negativo', () => {
    expect(pagina({ ...alunoPor('val'), total: 6, usadas: 9 }).saldo).toBe(0);
  });
});

describe('a proposta', () => {
  const lista = () => candidatos(alunoPor('val'), semente.alunos, semente.disponibilidade, HOJE);

  it('sem proposta é null', () => {
    expect(pagina(alunoPor('val')).proposta).toBeNull();
    expect(pagina({ ...alunoPor('val'), proposta: null }).proposta).toBeNull();
  });

  it.each(['recusada', 'aceita', 'confirmadaPeloProfessor'] as const)(
    'proposta %s não está aberta e é null',
    (status) => {
      const [alvo] = lista();
      const a: Aluno = {
        ...alunoPor('val'),
        proposta: propostaEm({ dia: alvo.dia, hora: alvo.hora }, { status }),
      };

      expect(pagina(a).proposta).toBeNull();
    },
  );

  it('a principal é a janela da proposta do Rafael da semente', () => {
    const a = alunoPor('raf');

    expect(a.proposta?.status).toBe('enviada');
    expect(pagina(a).proposta?.principal).toMatchObject(a.proposta?.janela as object);
  });

  it('a principal é a proposta, não a melhor sugestão, e os motivos são os dela', () => {
    const [primeira, , terceira] = lista();
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: terceira.dia, hora: terceira.hora }),
    };

    expect(terceira.razoes).not.toEqual([]);
    expect(terceira.dia).not.toBe(primeira.dia);
    expect(pagina(a).proposta?.principal).toEqual({
      dia: terceira.dia,
      hora: terceira.hora,
      razoes: terceira.razoes,
    });
  });

  it('janela que o motor não sugere mais sai sem motivos', () => {
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: 'Domingo, 30/08', hora: '3h' }),
    };

    expect(pagina(a).proposta?.principal).toEqual({
      dia: 'Domingo, 30/08',
      hora: '3h',
      razoes: [],
    });
  });

  it('as alternativas são as enviadas, com os motivos do motor', () => {
    const [alvo, segunda, terceira] = lista();
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm(
        { dia: alvo.dia, hora: alvo.hora },
        { alternativas: [terceira, segunda] },
      ),
    };

    expect(pagina(a).proposta?.alternativas).toEqual([
      { dia: terceira.dia, hora: terceira.hora, razoes: terceira.razoes },
      { dia: segunda.dia, hora: segunda.hora, razoes: segunda.razoes },
    ]);
  });

  it('no máximo 2 alternativas', () => {
    const [alvo, ...resto] = lista();
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: alvo.dia, hora: alvo.hora }, { alternativas: resto.slice(0, 5) }),
    };

    expect(pagina(a).proposta?.alternativas).toHaveLength(2);
  });

  it('proposta enviada sem alternativas não inventa nenhuma', () => {
    const [alvo] = lista();
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: alvo.dia, hora: alvo.hora }, { alternativas: [] }),
    };

    expect(pagina(a).proposta?.alternativas).toEqual([]);
  });

  it('gravada sem o campo, as alternativas saem de melhores(), sem repetir a principal', () => {
    const [primeira, segunda, terceira] = melhores(lista(), 3);
    const semCampo = {
      janela: { dia: primeira.dia, hora: primeira.hora },
      enviadaEm: HOJE,
      status: 'enviada',
    } as Proposta;

    expect(pagina({ ...alunoPor('val'), proposta: semCampo }).proposta?.alternativas).toEqual([
      { dia: segunda.dia, hora: segunda.hora, razoes: segunda.razoes },
      { dia: terceira.dia, hora: terceira.hora, razoes: terceira.razoes },
    ]);
  });

  it('a referência é a data usada pelo motor', () => {
    // Uma janela da semana que vem deixa de ser candidata quando a referência
    // passa por ela.
    const alvo = lista().find((c) => c.emDias < DIAS_ATE_OUTRO_DIA) as Candidata;
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: alvo.dia, hora: alvo.hora }),
    };

    expect(pagina(a, HOJE).proposta?.principal.razoes).toEqual(alvo.razoes);
    expect(alvo.razoes).not.toEqual([]);
    expect(pagina(a, OUTRO_DIA).proposta?.principal.razoes).toEqual([]);
  });

  it('os outros alunos entram na conta: bloco ocupado por outro não é mais sugerido', () => {
    const [alvo] = lista();
    const a: Aluno = {
      ...alunoPor('val'),
      proposta: propostaEm({ dia: alvo.dia, hora: alvo.hora }),
    };
    const ocupa: Aluno = {
      ...alunoPor('mar'),
      dia: nomeDoDia(alvo.bloco.dia).toLowerCase(),
      hora: alvo.hora,
    };
    const semOutros = [a, ...semente.alunos.filter((x) => x.id !== 'val' && x.id !== 'mar')];
    const { proposta } = paginaDoAluno(
      a,
      [],
      semente.perfil,
      semente.politicas,
      [...semOutros, ocupa],
      semente.disponibilidade,
      HOJE,
    );

    expect(alvo.razoes).not.toEqual([]);
    expect(proposta?.principal.razoes).toEqual([]);
  });
});

describe('a janela que outro aluno ocupou sai da página (SCRUM-83)', () => {
  const lista = () => candidatos(alunoPor('val'), semente.alunos, semente.disponibilidade, HOJE);
  /** O recorte do val com a proposta dada, e outro aluno com a reposição marcada. */
  const comOcupada = (proposta: Proposta, agendada: { dia: string; hora: string }, extra: Partial<Aluno> = {}) => {
    const val: Aluno = { ...alunoPor('val'), proposta };
    const outro: Aluno = { ...alunoPor('mar'), agendada, ...extra };
    const alunos = semente.alunos.map((a) => (a.id === 'val' ? val : a.id === 'mar' ? outro : a));
    return paginaDoAluno(val, [], semente.perfil, semente.politicas, alunos, semente.disponibilidade, HOJE);
  };

  it('a alternativa ocupada sai, e as livres ficam', () => {
    const [a, b, c] = lista();
    const j = (x: typeof a) => ({ dia: x.dia, hora: x.hora });
    const alt = (x: typeof a) => ({ ...j(x), motivo: x.motivo });
    const p = comOcupada(propostaEm(j(a), { alternativas: [alt(b), alt(c)] }), j(b)).proposta;

    expect(p?.principal).toMatchObject(j(a));
    expect(p?.alternativas.map((x) => x.dia + x.hora)).toEqual([c.dia + c.hora]);
  });

  it('a principal ocupada cede o lugar à primeira alternativa livre', () => {
    const [a, b] = lista();
    const j = (x: typeof a) => ({ dia: x.dia, hora: x.hora });
    const p = comOcupada(propostaEm(j(a), { alternativas: [{ ...j(b), motivo: b.motivo }] }), j(a)).proposta;

    expect(p?.principal).toMatchObject(j(b));
    expect(p?.alternativas).toEqual([]);
  });

  it('com tudo ocupado, não há o que responder: a proposta é null', () => {
    const [a] = lista();
    expect(comOcupada(propostaEm({ dia: a.dia, hora: a.hora }), { dia: a.dia, hora: a.hora }).proposta).toBeNull();
  });

  it('o aluno arquivado não ocupa a janela', () => {
    const [a] = lista();
    const j = { dia: a.dia, hora: a.hora };
    expect(comOcupada(propostaEm(j), j, { arquivado: true }).proposta?.principal).toMatchObject(j);
  });
});

describe('é pura', () => {
  it('não altera nada do que recebe', () => {
    const a = alunoPor('raf');
    const antes = JSON.stringify([a, semente]);

    pagina(a);

    expect(JSON.stringify([a, semente])).toBe(antes);
  });

  it('a mesma entrada dá a mesma saída', () => {
    expect(comoJson(alunoPor('raf'))).toBe(comoJson(alunoPor('raf')));
  });

  it('só importa outros módulos do domínio: vai num bundle para o Deno', () => {
    const fonte = fs.readFileSync(`${__dirname}/../paginaDoAluno.ts`, 'utf8');
    const importados = [...fonte.matchAll(/from '([^']+)'/g)].map((m) => m[1]);

    expect(importados.length).toBeGreaterThan(0);
    for (const caminho of importados) expect(caminho).toMatch(/^\.\/\w+$/);
  });
});
