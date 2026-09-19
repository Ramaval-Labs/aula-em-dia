/** A2 — Boas-vindas: a proposta em três passos, e a bifurcação entrar/criar. */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../componentes/Blocos';
import { BotaoPrimario, BotaoSecundario } from '../../componentes/Controles';
import { ListaAgrupada } from '../../componentes/Listas';
import { useSessao } from '../../estado/sessao';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { definirModoDeAcesso, type ModoDeAcesso } from './modoDeAcesso';
import { TelaDeEntrada } from './TelaDeEntrada';

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
  const irPara = useSessao((s) => s.irPara);

  const abrirAcesso = (modo: ModoDeAcesso) => {
    definirModoDeAcesso(modo);
    irPara('acesso');
  };

  return (
    <TelaDeEntrada
      titulo="Aula em Dia"
      subtitulo="A conta das aulas, sem discussão"
      rodape={
        <>
          <BotaoPrimario rotulo="Criar conta" aoTocar={() => abrirAcesso('criar')} />
          <BotaoSecundario rotulo="Entrar" aoTocar={() => abrirAcesso('entrar')} />
        </>
      }
    >
      <ListaAgrupada>
        {PASSOS.map((p) => (
          <LinhaDePasso key={p.numero} {...p} />
        ))}
      </ListaAgrupada>
    </TelaDeEntrada>
  );
}

/**
 * Linha numerada da lista agrupada. A `LinhaLista` do catálogo não serve: ela
 * não tem ornamento à esquerda, e a `LinhaAluno` corta título e apoio em uma
 * linha só — aqui as duas frases ocupam duas e três linhas.
 *
 * O número usa o `Avatar` do catálogo, que já é o quadrado de 38px em
 * `tintSuave` com o texto em tint.
 */
function LinhaDePasso({
  numero,
  titulo,
  apoio,
}: {
  numero: string;
  titulo: string;
  apoio: string;
}) {
  const { cores } = useVidro();
  return (
    <View accessible accessibilityLabel={`Passo ${numero}. ${titulo} ${apoio}`} style={estilos.linha}>
      <Avatar texto={numero} tamanho={38} />
      <View style={estilos.flexivel}>
        <Text style={[texto(14.5, 700, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta }]}>
          {titulo}
        </Text>
        <Text
          style={[
            comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 4 }),
            { color: cores.tinta2 },
          ]}
        >
          {apoio}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  linha: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
});
