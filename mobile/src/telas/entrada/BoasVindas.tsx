/** A2 — Boas-vindas: a proposta em três passos, e a bifurcação entrar/criar. */

import React from 'react';
import { Text, View } from 'react-native';

import { BotaoPrimario, BotaoTexto } from '../../componentes/Botoes';
import { CabecalhoEscuro } from '../../componentes/Cabecalho';
import { Barras } from '../../componentes/Marca';
import { Tela } from '../../componentes/Tela';
import { useSessao } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { texto } from '../../tema/tipografia';
import { MARCA, TAMANHO } from '../../tema/tokens';

const PASSOS = [
  {
    numero: '01',
    titulo: 'Você define a política de faltas uma vez.',
    apoio:
      'Prazo de aviso, se falta avisada devolve a aula, quantas reposições cabem no pacote.',
  },
  {
    numero: '02',
    titulo: 'O app aplica a regra e mostra o saldo.',
    apoio:
      'Cada aula registrada em dois toques, com o efeito no saldo visível antes de confirmar.',
  },
  {
    numero: '03',
    titulo: 'A reposição vira três horários prontos.',
    apoio: 'Calculados contra sua agenda real. O aluno confirma pelo navegador.',
  },
];

export function BoasVindas() {
  const cores = useCores();
  const irPara = useSessao((s) => s.irPara);

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <View style={{ marginTop: 26 }}>
            <Barras altura={22} espaco={4} cor="#FFFFFF" />
          </View>
          <Text
            style={[
              texto(27, 600, { altura: 1.2, tracking: -0.03 }),
              { marginTop: 14, color: '#FFFFFF' },
            ]}
          >
            Aula em Dia
          </Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ paddingTop: 24, gap: 16 }}
      rodape={
        <>
          <BotaoPrimario rotulo="Começar" aoTocar={() => irPara('acesso')} />
          <BotaoTexto rotulo="Já tenho conta" aoTocar={() => irPara('acesso')} />
        </>
      }
      semMascara
    >
      {PASSOS.map((p, i) => (
        <View key={p.numero} style={{ gap: 16 }}>
          {i > 0 ? <View style={{ height: 1, backgroundColor: cores.linha }} /> : null}
          <View>
            <Text
              style={[texto(15, 800, { altura: 1 }), { color: cores.texto }]}
            >
              {p.numero}
            </Text>
            <Text
              style={[
                texto(19, 600, { altura: 1.3 }),
                { marginTop: 8, color: cores.texto },
              ]}
            >
              {p.titulo}
            </Text>
            <Text
              style={[
                texto(14, 400, { altura: 1.5 }),
                { marginTop: 6, color: cores.textoMedio },
              ]}
            >
              {p.apoio}
            </Text>
          </View>
        </View>
      ))}
    </Tela>
  );
}
