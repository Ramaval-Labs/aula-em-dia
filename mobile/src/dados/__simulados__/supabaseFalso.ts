/**
 * Um Supabase de mentira, em memória, para os testes da Parte 4.
 *
 * Responde ao pedaço do supabase-js que o app usa — `auth.getSession` e
 * `from(tabela)` com `select`, `insert`, `update`, `delete`, `eq`, `in`,
 * `order`, `range` e `single` — sobre tabelas que o teste preenche. Tem a forma
 * da resposta de verdade (`{ data, error }`, sem lançar) e guarda cada consulta,
 * para o teste conferir tabela, filtro e valores.
 *
 * Fica fora de `__tests__` porque o jest trataria o arquivo como uma suíte. O
 * app não importa nada daqui, então o Metro não o leva para o bundle.
 *
 * O que ele não faz: RLS, tipos de coluna e os padrões do banco, fora o
 * professor e o `criado_em` de quem é inserido. Isso quem prova
 * é o pgTAP (`supabase/tests/database/`) e a ponta a ponta contra o banco local.
 */

type Linha = Record<string, unknown>;
type Erro = { message: string; code?: string };
export type RespostaFalsa = { data: unknown; error: Erro | null };

export interface Consulta {
  tabela: string;
  operacao: 'select' | 'insert' | 'update' | 'delete';
  valores?: unknown;
  filtros: { coluna: string; valor: unknown; em?: boolean }[];
  ordem: { coluna: string; crescente: boolean }[];
  faixa?: [number, number];
  unica: boolean;
}

export interface OpcoesDoFalso {
  /** id do professor logado; `null` é sem sessão */
  usuario?: string | null;
  tabelas?: Record<string, Linha[]>;
  /** devolva um erro para a consulta falhar como falharia sem rede */
  falhar?: (consulta: Consulta) => Erro | null;
}

export const SEM_REDE: Erro = { message: 'TypeError: Network request failed' };

function casa(linha: Linha, consulta: Consulta): boolean {
  return consulta.filtros.every(({ coluna, valor, em }) =>
    em ? (valor as unknown[]).includes(linha[coluna]) : linha[coluna] === valor,
  );
}

function ordenar(linhas: Linha[], ordem: Consulta['ordem']): Linha[] {
  return [...linhas].sort((a, b) => {
    for (const { coluna, crescente } of ordem) {
      const x = String(a[coluna]);
      const y = String(b[coluna]);
      if (x !== y) return (x < y ? -1 : 1) * (crescente ? 1 : -1);
    }
    return 0;
  });
}

export function criarSupabaseFalso(opcoes: OpcoesDoFalso = {}) {
  const tabelas: Record<string, Linha[]> = {};
  for (const [nome, linhas] of Object.entries(opcoes.tabelas ?? {})) {
    tabelas[nome] = linhas.map((l) => ({ ...l }));
  }
  const consultas: Consulta[] = [];
  const estado = { usuario: opcoes.usuario === undefined ? 'prof-a' : opcoes.usuario };

  function executar(consulta: Consulta): RespostaFalsa {
    consultas.push(consulta);
    const erro = opcoes.falhar?.(consulta) ?? null;
    if (erro) return { data: null, error: erro };

    const tabela = (tabelas[consulta.tabela] ??= []);
    switch (consulta.operacao) {
      case 'insert': {
        // Os dois padrões que o app conta com o banco para pôr: o professor é
        // `auth.uid()`, e `criado_em` é `now()`.
        const novas = ([] as Linha[])
          .concat(consulta.valores as Linha | Linha[])
          .map((l) => ({
            ...(consulta.tabela === 'professores' ? {} : { professor_id: estado.usuario }),
            criado_em: new Date().toISOString(),
            ...l,
          }));
        tabela.push(...novas.map((l) => ({ ...l })));
        return { data: novas, error: null };
      }
      case 'update': {
        const alvo = tabela.filter((l) => casa(l, consulta));
        for (const l of alvo) Object.assign(l, consulta.valores);
        return { data: alvo.map((l) => ({ ...l })), error: null };
      }
      case 'delete': {
        const fica = tabela.filter((l) => !casa(l, consulta));
        tabelas[consulta.tabela] = fica;
        return { data: null, error: null };
      }
      default: {
        let linhas = ordenar(tabela.filter((l) => casa(l, consulta)), consulta.ordem);
        if (consulta.faixa) linhas = linhas.slice(consulta.faixa[0], consulta.faixa[1] + 1);
        if (!consulta.unica) return { data: linhas.map((l) => ({ ...l })), error: null };
        if (linhas.length !== 1) {
          return { data: null, error: { message: 'linha não encontrada', code: 'PGRST116' } };
        }
        return { data: { ...linhas[0] }, error: null };
      }
    }
  }

  function construtor(tabela: string) {
    const consulta: Consulta = { tabela, operacao: 'select', filtros: [], ordem: [], unica: false };
    const b = {
      // Depois de um insert ou update, `select` só pede as linhas de volta.
      select: () => b,
      insert: (valores: unknown) => ((consulta.operacao = 'insert'), (consulta.valores = valores), b),
      update: (valores: unknown) => ((consulta.operacao = 'update'), (consulta.valores = valores), b),
      delete: () => ((consulta.operacao = 'delete'), b),
      eq: (coluna: string, valor: unknown) => (consulta.filtros.push({ coluna, valor }), b),
      in: (coluna: string, valor: unknown[]) => (consulta.filtros.push({ coluna, valor, em: true }), b),
      order: (coluna: string, o?: { ascending?: boolean }) => (
        consulta.ordem.push({ coluna, crescente: o?.ascending !== false }), b
      ),
      range: (de: number, ate: number) => ((consulta.faixa = [de, ate]), b),
      single: () => ((consulta.unica = true), b),
      then: (ok: (r: RespostaFalsa) => unknown, falha?: (e: unknown) => unknown) =>
        Promise.resolve(executar(consulta)).then(ok, falha),
    };
    return b;
  }

  const cliente = {
    auth: {
      getSession: async () => ({
        data: { session: estado.usuario ? { user: { id: estado.usuario } } : null },
        error: null,
      }),
    },
    from: (tabela: string) => construtor(tabela),
  };

  return {
    cliente,
    consultas,
    tabelas,
    /** troca quem está logado, ou desloga com `null` */
    logar: (usuario: string | null) => {
      estado.usuario = usuario;
    },
    gravacoes: () => consultas.filter((c) => c.operacao !== 'select'),
  };
}

export type SupabaseFalso = ReturnType<typeof criarSupabaseFalso>;
