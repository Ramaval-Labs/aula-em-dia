// ESLint do app (SCRUM-35). Base: a config "flat" do Expo, criada por `npx expo lint`
// (https://docs.expo.dev/guides/using-eslint/), que já conhece React Native, Hermes e o
// resolver do Metro.
//
// Cada regra desligada ou ajustada aqui tem a razão escrita ao lado. Regra desligada sem
// razão parece decisão e não é: se a razão deixar de valer, a regra volta.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Esta regra é do conjunto do React Compiler, que o eslint-plugin-react-hooks 7
      // liga junto com as outras. O app não usa o compilador (app.json não tem
      // `experiments.reactCompiler`), e os achados dela aqui são o idioma
      // `useRef(new Animated.Value(0)).current` da documentação do React Native, que lê
      // a ref durante o render de propósito. Religar junto com o React Compiler, quando
      // as animações passarem para `useState(() => new Animated.Value(0))`.
      'react-hooks/refs': 'off',
      // Também do conjunto do React Compiler. Acusa `const TelaDeFundo = telaDe(fundo)`
      // no App.tsx como "componente criado no render", mas `telaDe` só consulta o mapa
      // de telas/registro.ts: devolve sempre o mesmo componente para a mesma tela, e
      // nada remonta. Religar junto com o React Compiler.
      'react-hooks/static-components': 'off',
      // O CI só trava no que é bug (SCRUM-95): hook fora de ordem, import que não existe,
      // chave duplicada, setState no meio do render (laço infinito). As outras regras do
      // React Compiler medem compatibilidade com um compilador que o app não liga, então
      // ficam como aviso até ele entrar.
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/gating': 'warn',
    },
  },
  {
    // Testes e o setup do jest rodam no jest, não no app.
    files: ['**/__tests__/**', 'jest.setup.js'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      // Nos testes o `require` é deliberado: dentro de `jest.mock` e de um teste que
      // precisa do módulo depois do mock, e para ler arquivo sem os tipos do Node, que o
      // projeto não tem. No código do app a regra continua valendo.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
