/**
 * Ação destrutiva ou em lote em dois toques: o primeiro arma (e o rótulo do
 * botão avisa), o segundo executa. Desarma sozinho no tempo de um toast, para
 * um toque perdido não deixar a ação engatilhada.
 *
 * Usado por arquivar aluno, sair da conta, cobrar todos em atraso e cancelar
 * a proposta de reposição.
 */

import { useCallback, useEffect, useState } from 'react';

import { MOVIMENTO_VIDRO } from '../tema/tokens';

export function useDoisToques(acao: () => void): { armado: boolean; tocar: () => void } {
  const [armado, setArmado] = useState(false);

  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), MOVIMENTO_VIDRO.toastDuracaoMs);
    return () => clearTimeout(t);
  }, [armado]);

  const tocar = useCallback(() => {
    if (!armado) {
      setArmado(true);
      return;
    }
    setArmado(false);
    acao();
  }, [armado, acao]);

  return { armado, tocar };
}
