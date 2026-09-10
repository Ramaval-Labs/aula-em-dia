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
