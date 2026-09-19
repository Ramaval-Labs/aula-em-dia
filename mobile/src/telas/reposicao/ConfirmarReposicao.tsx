/**
 * C6 — Confirmação com a mensagem pronta (passo 3 de 3).
 *
 * Derivada: sheet de tarefa com o resumo "O que muda" em cartão de vidro, a
 * prévia da mensagem e o switch de pedir confirmação. O efeito aparece antes
 * da ação (PRODUCT.md, princípio 2), como em §3.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro } from '../../componentes/Blocos';
import { BotaoPrimario, BotaoTexto, Switch } from '../../componentes/Controles';
import { CabecalhoGrupo } from '../../componentes/Listas';
import { PreviaDeMensagemVidro } from '../../componentes/PreviaVidro';
import { Sheet } from '../../componentes/Sheet';
import { candidatos, melhores } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import { mascararTelefone, mensagemDeReposicao } from '../../dominio/mensagens';
import { avisos, useDados } from '../../estado/dados';
import { mesmaJanela, REPOSICAO_INICIAL, useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { SubLinhaSheet } from './pecas';

export function ConfirmarReposicao() {
  const { cores } = useVidro();
  const { alunoId, concluir, ir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const politicas = useDados((s) => s.politicas);
  const marcarReposicao = useDados((s) => s.marcarReposicao);
  const enviarProposta = useDados((s) => s.enviarProposta);
  const avisar = useToast((s) => s.avisar);

  const [form] = useRascunho('reposicao', REPOSICAO_INICIAL);
  const [msg] = useRascunho('mensagem', {
    tom: 'cordial' as const,
    texto: '',
    editado: false,
  });

  const todas = useMemo(
    () => (aluno ? candidatos(aluno, alunos, disponibilidade, hoje()) : []),
    [aluno, alunos, disponibilidade],
  );
  const lista = melhores(todas, 8);
  // A janela vem pela identidade gravada em C3 ou C4 — procurada na lista
  // inteira, porque um horário escolhido em C4 pode não estar entre as 8
  // melhores. Sem escolha (atalho direto), cai na melhor.
  const janela =
    form.janela !== null ? todas.find((c) => mesmaJanela(form.janela, c)) : lista[0];
  const alternativas = lista.filter((c) => !janela || !mesmaJanela(janela, c)).slice(0, 2);

  const texto_ = aluno && janela ? mensagemDeReposicao(aluno, janela, politicas) : '';

  const [pedirConfirmacao, setPedir] = React.useState(true);

  const confirmar = () => {
    if (!aluno || !janela) return;
    const alvo = { dia: janela.dia, hora: janela.hora };

    if (pedirConfirmacao) {
      enviarProposta(aluno.id, alvo, alternativas);
      avisar(avisos.propostaEnviada(aluno, janela.dia, janela.hora));
      concluir('aguardandoAceite', aluno.id);
      return;
    }

    // "Agendar sem avisar": não sai mensagem nenhuma, e o aviso não diz que saiu.
    marcarReposicao(aluno.id, alvo);
    avisar(avisos.reposicaoMarcada(aluno, alvo));
    concluir('aluno', aluno.id);
  };

  return (
    <Sheet
      titulo="Confirmar reposição"
      rodape={
        <>
          <BotaoPrimario
            rotulo={pedirConfirmacao ? 'Confirmar e avisar o aluno' : 'Agendar sem avisar'}
            desabilitado={!janela}
            aoTocar={confirmar}
          />
          {/* Sheet → sheet troca o conteúdo do painel: `voltar()` aqui fecharia
              o painel inteiro, então a troca de horário volta às sugestões. */}
          <BotaoTexto rotulo="Trocar o horário" aoTocar={() => ir('reposicao')} />
        </>
      }
    >
      <SubLinhaSheet
        passo="Passo 3 de 3"
        texto={janela ? `${janela.dia}, às ${janela.hora}` : 'Escolha um horário antes'}
      />

      {aluno && janela ? (
        <>
          <CabecalhoGrupo titulo="O que muda" estilo={estilos.cabecalho} />
          <CartaoVidro estilo={estilos.resumo}>
            <LinhaDeResumo rotulo="Reposição" valor={`${janela.dia} · ${janela.hora}`} />
            {aluno.pendencia ? (
              <LinhaDeResumo rotulo="Aula reposta" valor={`falta de ${aluno.pendencia.origem}`} />
            ) : null}
            <LinhaDeResumo
              rotulo="Reposições, contando esta"
              valor={
                politicas.limiteReposicoes === 0
                  ? `${aluno.reposicoes + 1}, sem limite`
                  : `${aluno.reposicoes + 1} de ${politicas.limiteReposicoes}`
              }
            />
            <LinhaDeResumo rotulo="Efeito no saldo" valor="sem alteração" />
          </CartaoVidro>
        </>
      ) : null}

      <View style={estilos.bloco}>
        <PreviaDeMensagemVidro
          texto={texto_ || 'Escolha um horário para montar a mensagem.'}
          destino={mascararTelefone(aluno?.telefone)}
          aoCopiar={() => avisar(avisos.mensagemCopiada)}
        />
      </View>

      <CartaoVidro estilo={[estilos.bloco, estilos.linhaSwitch]}>
        <View style={estilos.flexivel}>
          <Text style={[texto(15, 700, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta }]}>
            Pedir confirmação dele
          </Text>
          <Text
            style={[
              comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 3 }),
              { color: cores.tinta2 },
            ]}
          >
            {pedirConfirmacao
              ? 'A reposição fica aguardando o aceite'
              : 'A reposição já entra marcada na agenda'}
          </Text>
        </View>
        <Switch ligado={pedirConfirmacao} aoAlternar={setPedir} rotulo="Pedir confirmação dele" />
      </CartaoVidro>

      {msg.editado ? (
        <Text
          style={[
            comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 10 }),
            estilos.recuo,
            { color: cores.tinta2 },
          ]}
        >
          Mensagem editada por você.
        </Text>
      ) : null}
    </Sheet>
  );
}

/** Rótulo à esquerda, valor à direita — o par rótulo/valor do cartão de débito de §7. */
function LinhaDeResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  const { cores } = useVidro();
  return (
    <View style={estilos.linhaResumo}>
      <Text style={[texto(13, 500, { altura: 1.4 }), { color: cores.tinta2 }]}>{rotulo}</Text>
      <Text
        style={[
          texto(13, 700, { altura: 1.4 }),
          estilos.valorResumo,
          { color: cores.tinta },
        ]}
      >
        {valor}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { marginTop: 16 },
  resumo: { marginTop: 9, gap: 8 },
  bloco: { marginTop: 14 },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  flexivel: { flex: 1, minWidth: 0 },
  recuo: { paddingHorizontal: 6 },
  linhaResumo: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  valorResumo: { flexShrink: 1, textAlign: 'right' },
});
