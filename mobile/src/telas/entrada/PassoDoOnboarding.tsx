/**
 * Chassi dos quatro passos do onboarding no iOS Glass: voltar em tint, o
 * medidor de 4 barras, a sub-linha "Passo N de 4", o título e o rodapé com
 * o botão de avançar.
 *
 * O voltar na tela existe porque o iOS não tem botão físico: sem ele o
 * `voltarEntrada` só seria alcançável no Android (BackHandler do `Portao`).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BotaoPrimario, BotaoTexto } from '../../componentes/Controles';
import { TOTAL_DE_PASSOS, useSessao } from '../../estado/sessao';
import { useVidro } from '../../tema/TemaProvider';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../../tema/tokens';
import { MotivoDoBotao, TelaDeEntrada } from './TelaDeEntrada';

export function PassoDoOnboarding({
  passo,
  titulo,
  subtitulo,
  children,
  rotuloDoBotao = 'Continuar',
  aoAvancar,
  podeAvancar = true,
  motivoDesabilitado,
  acaoSecundaria,
  comTeclado = false,
}: {
  passo: number;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  rotuloDoBotao?: string;
  aoAvancar: () => void;
  podeAvancar?: boolean;
  /** o que falta para o botão acender; aparece logo acima dele */
  motivoDesabilitado?: string;
  acaoSecundaria?: { rotulo: string; aoTocar: () => void };
  comTeclado?: boolean;
}) {
  const voltarEntrada = useSessao((s) => s.voltarEntrada);

  return (
    <TelaDeEntrada
      comTeclado={comTeclado}
      voltar={{ rotulo: 'Voltar', aoTocar: () => voltarEntrada() }}
      acima={<MedidorDePassos total={TOTAL_DE_PASSOS} atual={passo} />}
      sobrelinha={`Passo ${passo} de ${TOTAL_DE_PASSOS}`}
      titulo={titulo}
      subtitulo={subtitulo}
      rodape={
        <>
          {!podeAvancar && motivoDesabilitado ? (
            <MotivoDoBotao texto={motivoDesabilitado} />
          ) : null}
          <BotaoPrimario
            rotulo={rotuloDoBotao}
            desabilitado={!podeAvancar}
            aoTocar={aoAvancar}
          />
          {acaoSecundaria ? (
            <BotaoTexto rotulo={acaoSecundaria.rotulo} aoTocar={acaoSecundaria.aoTocar} />
          ) : null}
        </>
      }
    >
      {children}
    </TelaDeEntrada>
  );
}

/**
 * Progresso do onboarding no desenho do medidor de pacote (barras de 7px,
 * raio 4, vão 4). O `MedidorPacote` do catálogo pinta as *usadas* de
 * `preenchimento2` e as restantes de tint — aqui é o contrário: passo atual e
 * anteriores em tint, futuros em `preenchimento2`.
 *
 * Decorativo: quem anuncia o progresso é a sub-linha "Passo N de 4".
 */
function MedidorDePassos({ total, atual }: { total: number; atual: number }) {
  const { cores } = useVidro();
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={estilos.medidor}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            estilos.barra,
            { backgroundColor: i < atual ? cores.tint : cores.preenchimento2 },
          ]}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  medidor: { flexDirection: 'row', gap: 4 },
  barra: { flex: 1, height: TAMANHO_VIDRO.medidor, borderRadius: RAIO_VIDRO.medidor },
});
