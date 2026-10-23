/**
 * Chaves de persistência. Versionadas no nome: subir a versão descarta o
 * estado antigo em vez de migrá-lo, que é o combinado do handoff.
 *
 * v4 acrescentou `perfil` e `disponibilidade` ao estado gravado. Quem já usava
 * o protótipo volta aos dados de demonstração — é o preço combinado.
 */

export const CHAVE_ESTADO = 'aulaemdia.app.v4';
export const CHAVE_TEMA = 'aulaemdia.app.v3.tema';

/** Sessão em chave separada: "zerar dados de demonstração" não desloga. */
export const CHAVE_SESSAO = 'aulaemdia.sessao.v1';

/**
 * Modo supabase (Parte 4): o último estado que veio do banco, para abrir sem
 * rede. Leva o id do professor junto, e só volta para ele.
 */
export const CHAVE_CACHE = 'aulaemdia.cache.v1';

/**
 * Marca que os dados locais (`CHAVE_ESTADO`) já foram levados para uma conta.
 * Os dados ficam no aparelho; a marca é o que impede de importar duas vezes.
 */
export const CHAVE_IMPORTACAO = 'aulaemdia.importacao.v1';
