/**
 * Pacotes e valores padrão (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, e o visual segue os cartões de controle de §9.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { CampoDeTexto } from '../../componentes/Campos';
import { BotaoPrimario, Segmentado } from '../../componentes/Controles';
import { dinheiro, plural } from '../../dominio/formato';
import { AULAS_OFERECIDAS } from '../../dominio/pacote';
import { temPacote, VALOR_AULA } from '../../dominio/politica';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { texto } from '../../tema/tipografia';
import { RAIO, TAMANHO } from '../../tema/tokens';
import { estilos } from './estilos';
import { TelaDeAjuste } from './pecas';

export function PacotesPadrao() {
  const { cores } = useCores();
  const { concluir } = useNavegacao();
  const politicas = useDados((s) => s.politicas);
  const alunos = useDados((s) => s.alunos);
  const salvo = useDados((s) => s.pacotePadrao);
  const salvarPacotePadrao = useDados((s) => s.salvarPacotePadrao);
  const avisar = useToast((s) => s.avisar);

  const [cfg, atualizar] = useRascunho(
    'pacote',
    salvo ?? {
      aulas: 8,
      valorPorAula: VALOR_AULA,
      validadeDias: politicas.validadeDias,
      somarSaldo: false,
    },
  );

  const opcoes = AULAS_OFERECIDAS.map((n) => ({ valor: n, rotulo: `${n} aulas` }));

  return (
    <TelaDeAjuste
      comTeclado
      titulo="Pacotes e valores padrão"
      subtitulo="O que já vem preenchido ao criar um pacote novo."
      rodape={
        <BotaoPrimario
          rotulo="Salvar padrão"
          aoTocar={() => {
            salvarPacotePadrao(cfg);
            avisar('Padrão de pacote salvo.');
            concluir('ajustes');
          }}
        />
      }
    >
      <CartaoDeAjuste titulo="Quantidade padrão" estilo={estilos.primeiro}>
        <Segmentado
          opcoes={opcoes}
          valor={cfg.aulas}
          aoTrocar={(aulas) => atualizar({ aulas })}
          porte="cartao"
          rotuloDoGrupo="Quantidade padrão de aulas"
        />
      </CartaoDeAjuste>

      <CartaoVidro estilo={estilos.cartao}>
        <CampoDeTexto
          rotulo="Valor por aula, em R$"
          valor={String(cfg.valorPorAula)}
          aoMudar={(v) => atualizar({ valorPorAula: Number(v.replace(/\D/g, '')) || 0 })}
          teclado="numerico"
          ajuda={`Pacote de ${cfg.aulas} aulas sai por ${dinheiro(
            cfg.aulas * cfg.valorPorAula,
          )}.`}
        />
      </CartaoVidro>

      <View
        style={[proprios.nota, { backgroundColor: cores.preenchimento, borderColor: cores.borda }]}
      >
        <Text style={[texto(13, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
          {`A validade vem da política de faltas: ${
            politicas.validadeDias === 0 ? 'sem prazo' : `${politicas.validadeDias} dias`
          }. Hoje ${plural(
            alunos.filter(temPacote).length,
            'aluno tem',
            'alunos têm',
          )} pacote ativo.`}
        </Text>
      </View>
    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  nota: {
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 17,
    borderRadius: RAIO.cartao,
    borderWidth: TAMANHO.bordaVidro,
  },
});
