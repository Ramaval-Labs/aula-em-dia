/**
 * Gancho de depuração do Expo Web.
 *
 * Expõe as lojas em `window.__aulaEmDia` para o script de screenshots
 * (`scripts/capturar.mjs`) chegar a qualquer tela sem clicar pelo caminho —
 * a navegação é uma pilha em memória, não uma URL. Só existe em
 * desenvolvimento e no navegador: no aparelho e no build de produção a
 * função não faz nada.
 */

import { Platform } from 'react-native';
import { create } from 'zustand';

import { useDados } from './dados';
import { useFormularios } from './formularios';
import { useNavegacao } from './navegacao';
import { useSessao } from './sessao';

type Catalogo = {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
};

/**
 * Liga o catálogo de componentes do redesign
 * (`componentes/__catalogo__/Catalogo.tsx`) por cima do app. Só tem efeito em
 * desenvolvimento: o `App.tsx` ignora a flag fora do `__DEV__`.
 *
 * No aparelho não há console para chamar o gancho: suba o Metro com
 * `EXPO_PUBLIC_CATALOGO=1` e o app abre direto no catálogo ("Fechar" volta).
 */
export const useCatalogo = create<Catalogo>((set) => ({
  aberto: __DEV__ && process.env.EXPO_PUBLIC_CATALOGO === '1',
  abrir: () => set({ aberto: true }),
  fechar: () => set({ aberto: false }),
}));

export function exporParaDepuracao() {
  if (!__DEV__ || Platform.OS !== 'web') return;
  (globalThis as { __aulaEmDia?: unknown }).__aulaEmDia = {
    catalogo: useCatalogo,
    dados: useDados,
    formularios: useFormularios,
    navegacao: useNavegacao,
    sessao: useSessao,
  };
}
