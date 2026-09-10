/**
 * Chassi dos quatro passos do onboarding: cabeçalho escuro com a barra de
 * progresso, eyebrow "Passo N de 4", título e o botão de avançar.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { BarraDePassos } from '../../componentes/Base';
import { BotaoPrimario, BotaoTexto } from '../../componentes/Botoes';
import { CabecalhoEscuro, Eyebrow, TituloTela } from '../../componentes/Cabecalho';
import { Tela } from '../../componentes/Tela';
import { TOTAL_DE_PASSOS } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { TIPO } from '../../tema/tipografia';

export function PassoDoOnboarding({
  passo,
  titulo,
  subtitulo,
  children,
  rotuloDoBotao = 'Continuar',
  aoAvancar,
  podeAvancar = true,
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
  acaoSecundaria?: { rotulo: string; aoTocar: () => void };
  comTeclado?: boolean;
}) {
  const cores = useCores();

  return (
    <Tela
      comTeclado={comTeclado}
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={38}>
          <View style={{ marginTop: 8 }}>
            <BarraDePassos total={TOTAL_DE_PASSOS} atual={passo} />
          </View>
          <View style={{ marginTop: 16 }}>
            <Eyebrow>{`Passo ${passo} de ${TOTAL_DE_PASSOS}`}</Eyebrow>
          </View>
          <View style={{ marginTop: 10 }}>
            <TituloTela tamanho={22}>{titulo}</TituloTela>
          </View>
          {subtitulo ? (
            <Text style={[TIPO.corpo, { marginTop: 9, color: cores.topoFraco }]}>
              {subtitulo}
            </Text>
          ) : null}
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 10 }}
      rodape={
        <>
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
    </Tela>
  );
}
