/**
 * Gerador de `supabase/seed.sql` (SCRUM-18).
 *
 * O teste que mais importa é o primeiro: o `seed.sql` comitado tem de ser
 * exatamente o que o gerador produz. Quem mudar `data/seed.json` ou a semente
 * e não regerar quebra o CI aqui, em vez de deixar o banco de demonstração
 * divergir do app em silêncio.
 *
 * O SQL em si é exercitado contra o Postgres pelo pgTAP
 * (`supabase/tests/database/rls.test.sql`), que não roda no CI.
 */

import { SEMENTE_NA_NOTACAO } from '../semente';
import { gerarSeedSql, ID_DO_ALUNO, PROFESSOR_DE_TESTE, tipoPorTitulo } from '../sementeSql';

// O projeto não tem os tipos do Node, e este é o único teste que lê arquivo:
// o `fs` vem pelo jest, e a raiz do repositório sai do caminho deste arquivo
// (mobile/src/dados/__tests__/ fica cinco níveis abaixo dela).
const { readFileSync } = jest.requireActual('fs') as {
  readFileSync(arquivo: string, codificacao: 'utf8'): string;
};
const RAIZ = (expect.getState().testPath as string).split(/[\\/]/).slice(0, -5).join('/');
const ler = (...caminho: string[]) => readFileSync([RAIZ, ...caminho].join('/'), 'utf8');
// Quem clona no Windows pode receber o arquivo com \r\n.
const semCr = (v: string) => v.replace(/\r\n/g, '\n');

describe('o seed.sql comitado', () => {
  it('é o que o gerador produz — se falhar: node scripts/gerar-seed-sql.mjs', () => {
    expect(semCr(ler('supabase', 'seed.sql'))).toBe(gerarSeedSql());
  });

  it('sai de data/seed.json, e a cópia do app é igual a ele', () => {
    expect(semCr(ler('mobile', 'src', 'dados', 'seed.json'))).toBe(
      semCr(ler('data', 'seed.json')),
    );
  });
});

describe('gerarSeedSql', () => {
  const sql = gerarSeedSql();

  it('é determinístico: não tem data nenhuma escrita', () => {
    expect(gerarSeedSql()).toBe(sql);
    expect(sql).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(sql).toContain('pg_temp.hoje() - 12');
  });

  it('não deixa a notação da semente vazar para o SQL', () => {
    expect(sql).not.toMatch(/\{(dia:)?hoje/);
    expect(sql).not.toMatch(/'hoje[+-]\d+'/);
  });

  it('insere uma linha por aluno, por lançamento e por proposta da semente', () => {
    const { alunos, extratos } = SEMENTE_NA_NOTACAO;
    const lancamentos = Object.values(extratos).reduce((n, e) => n + e.length, 0);
    const propostas = alunos.filter((a) => a.proposta).length;
    const linhas = (rotulo: RegExp) => sql.split('\n').filter((l) => rotulo.test(l)).length;

    expect(linhas(/^ {2}-- \w+$/)).toBe(alunos.length + propostas);
    expect(linhas(/^ {2}-- \w+ · /)).toBe(lancamentos);
  });

  it('guarda o travessão das faixas de alunos, que só existe em UTF-8', () => {
    expect(sql).toContain("'1–5'");
  });

  it('só traz a senha do professor de teste, e nenhuma chave', () => {
    expect(sql).toContain(`extensions.crypt('${PROFESSOR_DE_TESTE.senha}'`);
    expect(sql).not.toMatch(/eyJ|service_role|sb_secret|sb_publishable/);
  });

  it('o e-mail do professor no banco é o do login', () => {
    expect(sql).toContain(PROFESSOR_DE_TESTE.email);
    expect(sql).not.toContain(SEMENTE_NA_NOTACAO.perfil.email);
  });
});

describe('os ids e os tipos', () => {
  it('todo aluno da semente tem um uuid, e nenhum se repete', () => {
    const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/;
    const ids = SEMENTE_NA_NOTACAO.alunos.map((a) => ID_DO_ALUNO[a.id]);

    expect(ids.filter((id) => !UUID_V4.test(id))).toEqual([]);
    expect(new Set([...ids, PROFESSOR_DE_TESTE.id]).size).toBe(ids.length + 1);
  });

  it('todo título da semente vira um tipo, nenhum cai em legado', () => {
    const titulos = Object.values(SEMENTE_NA_NOTACAO.extratos).flatMap((e) => e.map((l) => l.t));

    expect(titulos.length).toBeGreaterThan(0);
    expect(titulos.filter((t) => tipoPorTitulo(t) === 'legado')).toEqual([]);
  });

  it.each([
    ['Aula realizada', 'aula'],
    ['Falta avisada', 'falta_avisada'],
    ['Falta sem aviso', 'falta_sem_aviso'],
    ['Aula cancelada por você', 'cancelada_professor'],
    ['Reposição marcada', 'reposicao'],
    ['Reposição realizada', 'reposicao'],
    ['Pagamento recebido', 'pagamento'],
    ['Validade estendida', 'validade'],
    ['Pacote de 6 aulas', 'pacote'],
    ['Pacote de 12 aulas', 'pacote'],
    ['Proposta de reposição enviada', 'proposta'],
    ['Um título que ninguém previu', 'legado'],
    ['Pacote de aulas', 'legado'],
  ])('"%s" → %s', (titulo, tipo) => {
    expect(tipoPorTitulo(titulo)).toBe(tipo);
  });
});
