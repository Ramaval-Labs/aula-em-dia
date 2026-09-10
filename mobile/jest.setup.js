/**
 * Ambiente dos testes.
 *
 * O AsyncStorage é um módulo nativo: sem o mock oficial, qualquer teste que
 * importe uma tela quebra na cadeia tela → TemaProvider → AsyncStorage.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
