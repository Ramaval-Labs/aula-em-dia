/**
 * Chassi dos quatro passos do onboarding no iOS Glass: voltar em tint, o
 * medidor de 4 barras, a sub-linha "Passo N de 4", o título e o rodapé com
 * o botão de avançar.
 *
 * O voltar na tela existe porque o iOS não tem botão físico: sem ele o
 * `voltarEntrada` só seria alcançável no Android (BackHandler do `Portao`).
 */

import React from 'react';

import { MedidorPacote } from '../../componentes/Blocos';
import { BotaoPrimario, BotaoTexto, NotaDoBotao } from '../../componentes/Controles';
import { TOTAL_DE_PASSOS, useSessao } from '../../estado/sessao';
import { TelaDeEntrada } from './TelaDeEntrada';

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
      // O voltar diz o nome da tela anterior, como no resto da entrada: o passo 1
      // volta para a Acesso, aberta em "Criar conta". Dos passos 2 a 4 o título
      // anterior é longo ("Quando você dá aula"), e o iOS troca o nome por "Voltar".
      voltar={{
        rotulo: passo === 1 ? 'Criar conta' : 'Voltar',
        aoTocar: () => voltarEntrada(),
      }}
      acima={<MedidorPacote variante="progresso" total={TOTAL_DE_PASSOS} usadas={passo} />}
      sobrelinha={`Passo ${passo} de ${TOTAL_DE_PASSOS}`}
      titulo={titulo}
      subtitulo={subtitulo}
      rodape={
        <>
          {!podeAvancar && motivoDesabilitado ? (
            <NotaDoBotao texto={motivoDesabilitado} />
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
