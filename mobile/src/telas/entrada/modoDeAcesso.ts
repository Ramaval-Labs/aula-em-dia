/**
 * Qual aba a tela de Acesso abre: "Entrar" ou "Criar conta".
 *
 * Mora aqui, e não em `estado/formularios.ts`, porque o rascunho `acesso` é
 * um contrato tipado do estado (`RascunhoAcesso`) e este valor não é
 * preenchimento de formulário: é só a intenção com que a pessoa saiu da tela
 * de Boas-vindas. Morre ao recarregar o app, como o resto da entrada.
 */

export type ModoDeAcesso = 'entrar' | 'criar';

let modo: ModoDeAcesso = 'entrar';

/** Chamado pela Boas-vindas antes de navegar para o Acesso. */
export function definirModoDeAcesso(valor: ModoDeAcesso) {
  modo = valor;
}

export function modoDeAcessoInicial(): ModoDeAcesso {
  return modo;
}
