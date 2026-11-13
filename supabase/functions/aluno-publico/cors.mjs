// O CORS da página do aluno (SCRUM-82, P3-4).
//
// Em JS puro (.mjs), e não em TS, para o teste em Node importar este mesmo arquivo:
// o Kong do Supabase local responde o preflight sozinho e reescreve o
// `Access-Control-Allow-Origin` para `*`, então pelo HTTP local não dá para ver
// o que a função manda. O gateway da nuvem repassa tudo à função (conferido em
// 12/11/2026 com `curl -X OPTIONS`), e lá vale o que está aqui.

/**
 * As origens da página do aluno: a publicada e o Expo Web local. Mudou o
 * domínio da Vercel? Muda aqui, ou a página para de abrir.
 */
export const ORIGENS = new Set([
  'https://aula-em-dia-three.vercel.app',
  'http://localhost:8081',
  'http://localhost:8099',
]);

/**
 * Pedido com uma origem fora da lista. Sem origem (curl, o teste do CI) não é
 * estranho: o CORS só protege o navegador, e quem não é navegador manda o
 * cabeçalho que quiser.
 *
 * @param {string | null} origem
 * @returns {boolean}
 */
export function origemEstranha(origem) {
  return origem !== null && !ORIGENS.has(origem);
}

/**
 * Os cabeçalhos de CORS de um pedido: só uma origem da lista recebe o
 * `Access-Control-Allow-Origin`, e com o valor dela, nunca `*`. O `Vary` diz a
 * um cache no caminho que a resposta muda com a origem.
 *
 * @param {string | null} origem
 * @returns {Record<string, string>}
 */
export function corsPara(origem) {
  if (!origem || !ORIGENS.has(origem)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}
