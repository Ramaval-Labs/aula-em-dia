/**
 * Peças locais da fatia de registro e reposição (Onda 3, T2).
 *
 * Só a sub-linha de sheet, que o handoff descreve no corpo da tela 5 mas o
 * catálogo ainda não expõe: a linha de contexto logo abaixo do cabeçalho do
 * painel, com padding `4 6 0` e texto 13/500 em `tinta2`.
 *
 * O `passo` acima dela é como a fatia resolve o "Passo N de 3" do assistente
 * de reposição, que o handoff novo não desenha: mesma família, um degrau
 * menor e em `tinta3`, para dar a posição no fluxo sem virar título.
 *
 * E `useDoisToques`, porte do hook de `componentes/Botoes.tsx` (sistema antigo,
 * que a tela migrada não pode importar): a ação destrutiva pede um segundo
 * toque dentro da duração do toast.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { MOVIMENTO_VIDRO } from '../../tema/tokens';

export function SubLinhaSheet({ passo, texto: linha }: { passo?: string; texto?: string }) {
  const { cores } = useVidro();
  if (!passo && !linha) return null;

  return (
    <View style={estilos.bloco}>
      {passo ? (
        <Text style={[texto(11.5, 600, { altura: 1.3 }), { color: cores.tinta3 }]}>{passo}</Text>
      ) : null}
      {linha ? (
        <Text
          style={[
            comEspaco(texto(13, 500, { altura: 1.4 }), { topo: passo ? 2 : 0 }),
            { color: cores.tinta2 },
          ]}
        >
          {linha}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { paddingTop: 4, paddingHorizontal: 6 },
});

/** Primeiro toque arma; o segundo, dentro de 3,6s, executa. */
export function useDoisToques(acao: () => void) {
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
