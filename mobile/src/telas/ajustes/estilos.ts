/**
 * Os estilos que mais de uma tela de Ajustes usa.
 *
 * Só entra aqui a chave compartilhada: o que é de uma tela só mora no arquivo
 * dela, para dois cards de Ajustes não voltarem a abrir o mesmo arquivo.
 */

import { StyleSheet } from 'react-native';

export const estilos = StyleSheet.create({
  primeiro: { marginTop: 18 },
  cartao: { marginTop: 12, paddingVertical: 16, paddingHorizontal: 17 },
  grupo: { marginTop: 24, marginBottom: 9 },
  bloco: { marginTop: 12 },
});
