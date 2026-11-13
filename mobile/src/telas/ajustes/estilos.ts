/**
 * Os estilos que mais de uma tela de Ajustes usa.
 *
 * Só entra aqui a chave compartilhada: o que é de uma tela só mora no arquivo
 * dela, para dois cards de Ajustes não voltarem a abrir o mesmo arquivo.
 */

import { StyleSheet } from 'react-native';

import { PAD } from '../../tema/tokens';

export const estilos = StyleSheet.create({
  primeiro: { marginTop: 18 },
  cartao: { marginTop: 12, ...PAD.cartaoDeAjuste },
  grupo: { marginTop: 24, marginBottom: 9 },
  bloco: { marginTop: 12 },
});
