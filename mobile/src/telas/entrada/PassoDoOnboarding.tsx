/**
 * Chassi dos quatro passos do onboarding: cabeçalho escuro com o voltar, a
 * barra de progresso, eyebrow "Passo N de 4", título e o botão de avançar.
 *
 * O voltar na tela existe porque o iOS não tem botão físico: sem ele o
 * `voltarEntrada` só seria alcançável no Android (BackHandler do `Portao`).
 */

import React from 'react';
import { Text, View } from 'react-native';

import { BarraDePassos } from '../../componentes/Base';
import { BotaoPrimario, BotaoTexto } from '../../componentes/Botoes';
import {
  BotaoVoltar,
  CabecalhoEscuro,
  Eyebrow,
  TituloTela,
} from '../../componentes/Cabecalho';
import { Tela } from '../../componentes/Tela';
import { TOTAL_DE_PASSOS, useSessao } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { TIPO } from '../../tema/tipografia';
import { TAMANHO } from '../../tema/tokens';

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
  const cores = useCores();
  const voltarEntrada = useSessao((s) => s.voltarEntrada);

  return (
    <Tela
      comTeclado={comTeclado}
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={() => voltarEntrada()} />
          <View style={{ marginTop: 14 }}>
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
          {!podeAvancar && motivoDesabilitado ? (
            <Text style={[TIPO.nota, { textAlign: 'center', color: cores.textoMedio }]}>
              {motivoDesabilitado}
            </Text>
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
    </Tela>
  );
}
