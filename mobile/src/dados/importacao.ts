/**
 * Levar os dados do aparelho para a conta (Parte 4 do backend, item 4).
 *
 * Quem usou o app no modo local tem os alunos em `aulaemdia.app.v4`. No
 * primeiro login de verdade, a tela pergunta "Levar seus alunos para a conta?"
 * (`SCRUM-61`, do Rafael) e, se a resposta for sim, chama `importarDadosLocais()`.
 * A pergunta é da tela; o que importa é daqui.
 *
 * - Vão os alunos, com o extrato e a proposta de cada um. Perfil, política e
 *   disponibilidade ficam: a conta já tem os seus, do onboarding.
 * - Os alunos da semente (`val`, `raf`, `mar`, `bea`) são demonstração e não
 *   vão. Quem só abriu o app de demonstração não tem nada a levar.
 * - Cada aluno ganha um uuid novo, e o mapa troca o id antigo no aluno, nas
 *   chaves do extrato e na proposta, uma vez só (Parte 1, decisão 2).
 * - O lançamento antigo não tem a `Mudanca` de onde sair o tipo: vale o
 *   título, e o que não casar vira `legado` (Parte 1, decisão 1).
 * - Nada é apagado do aparelho. Uma marca em `CHAVE_IMPORTACAO` impede de
 *   importar duas vezes, inclusive para outra conta.
 *
 * Depois de importar, quem chamou recarrega a store (`useDados.carregar()`):
 * este arquivo é da camada de dados e não conhece a store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { repositorioLocal } from './adaptador';
import { CHAVE_IMPORTACAO } from './armazenamento';
import { alunoParaBanco, extratoParaBanco, propostaParaBanco } from './conversor';
import { exigir, exigirProfessor, repositorioSupabase } from './repositorioSupabase';
import { SEMENTE_NA_NOTACAO } from './semente';
import { clienteSupabase, usaSupabase } from './supabase';

const DA_SEMENTE = new Set(SEMENTE_NA_NOTACAO.alunos.map((a) => a.id));

/** O que o aparelho tem do professor: tudo menos os alunos de demonstração. */
async function dadosLocais() {
  const gravado = await repositorioLocal.carregar();
  if (!gravado) return null;
  return {
    alunos: gravado.alunos.filter((a) => !DA_SEMENTE.has(a.id)),
    extratos: gravado.extratos,
  };
}

/**
 * Se a pergunta deve aparecer: modo supabase, nada importado ainda neste
 * aparelho, e ao menos um aluno que não é da semente. Nunca lança: na
 * dúvida, não pergunta.
 */
export async function temDadosLocaisParaImportar(): Promise<boolean> {
  if (!usaSupabase()) return false;
  try {
    if (await AsyncStorage.getItem(CHAVE_IMPORTACAO)) return false;
    return ((await dadosLocais())?.alunos.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Envia os alunos locais para a conta logada e devolve quantos foram. Lança
 * se não conseguir, e nesse caso nada fica pela metade no banco.
 */
export async function importarDadosLocais(): Promise<number> {
  const professorId = await exigirProfessor();
  const locais = await dadosLocais();
  if (!locais || locais.alunos.length === 0) return 0;

  // Toda a conversão antes da primeira chamada: um dado estranho para aqui,
  // sem nada enviado.
  const novoId = new Map(locais.alunos.map((a) => [a.id, repositorioSupabase.novoIdDeAluno()]));
  const idNovo = (antigo: string) => novoId.get(antigo) as string;
  const agora = Date.now();
  const alunos = locais.alunos.map((a, i) => ({
    ...alunoParaBanco({ ...a, id: idNovo(a.id) }),
    professor_id: professorId,
    // Um milissegundo por posição: a lista volta do banco na ordem do aparelho.
    criado_em: new Date(agora + i).toISOString(),
  }));
  const lancamentos = locais.alunos.flatMap((a) =>
    extratoParaBanco(locais.extratos[a.id] ?? [], idNovo(a.id), professorId),
  );
  const propostas = locais.alunos.flatMap((a) =>
    a.proposta ? [propostaParaBanco(a.proposta, idNovo(a.id), professorId)] : [],
  );

  const c = clienteSupabase();
  exigir(await c.from('alunos').insert(alunos).select('id'), 'importar os alunos');
  try {
    if (lancamentos.length > 0) {
      exigir(await c.from('lancamentos').insert(lancamentos).select('id'), 'importar o extrato');
    }
    if (propostas.length > 0) {
      exigir(await c.from('propostas').insert(propostas).select('id'), 'importar as propostas');
    }
  } catch (erro) {
    // Sem transação entre chamadas, o desfazer é à mão: apagar os alunos leva
    // junto o que entrou deles (on delete cascade). Assim a pessoa pode
    // tentar de novo sem duplicar ninguém.
    await c.from('alunos').delete().in('id', [...novoId.values()]);
    throw erro;
  }

  // A marca é conveniência: falhar aqui só faz a pergunta voltar.
  await AsyncStorage.setItem(CHAVE_IMPORTACAO, professorId).catch(() => {});
  return alunos.length;
}
