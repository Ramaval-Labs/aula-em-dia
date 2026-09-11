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

import { useDados } from './dados';
import { useFormularios } from './formularios';
import { useNavegacao } from './navegacao';
import { useSessao } from './sessao';

export function exporParaDepuracao() {
  if (!__DEV__ || Platform.OS !== 'web') return;
  (globalThis as { __aulaEmDia?: unknown }).__aulaEmDia = {
    dados: useDados,
    formularios: useFormularios,
    navegacao: useNavegacao,
    sessao: useSessao,
  };
}
