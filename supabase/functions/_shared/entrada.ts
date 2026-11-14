/**
 * O que as Edge Functions usam do app, num bundle só (Parte 6, SCRUM-22).
 *
 * Os imports do `dominio/` e do conversor são sem extensão (`./tipos`), e o
 * Deno exige o caminho inteiro. Em vez de copiar o código, o esbuild junta
 * tudo em `_shared/dominio.js`:
 *
 *   cd mobile && npm run bundle:dominio
 *
 * O `dominio.js` é gerado e fica fora do git: rode o bundle antes de
 * `npx supabase functions serve` e antes de publicar. Sem ele a função não
 * sobe, em vez de rodar com uma regra velha.
 *
 * A regra não é reescrita aqui (decisão D3): o recorte é o `paginaDoAluno` do
 * SCRUM-69, a reposição é o `marcarReposicao` que a store já usa, e o caminho
 * de ida e volta do banco é o mesmo conversor do repositório do app.
 */

export { janelaVencida, paginaDoAluno } from '../../../mobile/src/dominio/paginaDoAluno';
export { marcarReposicao } from '../../../mobile/src/dominio/politica';
export { hoje } from '../../../mobile/src/dominio/datas';
export { DIAS, FAIXAS_HORARIAS } from '../../../mobile/src/dominio/disponibilidade';
export {
  alunoDoBanco,
  alunoParaBanco,
  datasDoBanco,
  lancamentoDoMovimento,
  montarPersistido,
  preferenciasDeAvisoDe,
} from '../../../mobile/src/dados/conversor';
// Os lembretes do professor (SCRUM-91), para a função `avisos` (SCRUM-23).
export {
  aulasDaProximaHora,
  avisoDaAula,
  avisosDoDia,
  resumoDoDia,
} from '../../../mobile/src/dominio/avisos';
