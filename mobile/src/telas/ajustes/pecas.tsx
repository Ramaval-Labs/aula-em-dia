/**
 * As duas peças que as seis telas de Ajustes dividem (Fluxo E), no iOS Glass.
 *
 * Continuam locais, e não em `src/componentes/`: ainda são o molde deste
 * fluxo, não um componente do catálogo. Peça que sair daqui entra no catálogo
 * antes de entrar numa tela.
 */

import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { CartaoDeAjuste } from '../../componentes/Blocos';
import { TelaVidro, TituloDeConteudo } from '../../componentes/Chassi';
import { Switch } from '../../componentes/Controles';

/**
 * Molde comum: empilhada sob Ajustes, título de §9 no conteúdo (29/800, com
 * o recuo de 6px do handoff) e uma linha de apoio opcional em `tinta2`.
 */
export function TelaDeAjuste({
  titulo,
  subtitulo,
  children,
  rodape,
  comTeclado = false,
  voltarPara = 'Ajustes',
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  comTeclado?: boolean;
  /** de onde se veio, quando não foi de Ajustes (a Chave Pix abre da Cobrança) */
  voltarPara?: string;
}) {
  return (
    <TelaVidro
      tipo="empilhada"
      titulo={titulo}
      voltarPara={voltarPara}
      rodape={rodape}
      comTeclado={comTeclado}
    >
      <TituloDeConteudo titulo={titulo} abaixo={subtitulo} />
      {children}
    </TelaVidro>
  );
}

/** Cartão de §9 com título, sub-linha e switch à direita. */
export function CartaoComSwitch({
  titulo,
  sub,
  ligado,
  aoAlternar,
  estilo,
}: {
  titulo: string;
  sub: string;
  ligado: boolean;
  aoAlternar: (v: boolean) => void;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <CartaoDeAjuste
      titulo={titulo}
      subtitulo={sub}
      direita={<Switch ligado={ligado} aoAlternar={aoAlternar} rotulo={titulo} />}
      estilo={[proprios.espacoCartao, estilo]}
    />
  );
}

const proprios = StyleSheet.create({
  espacoCartao: { marginTop: 12 },
});
