/** C6 — Confirmação com a mensagem pronta (passo 3 de 3). */

import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { BarraDePassos, Cartao, RotuloSecao } from '../../componentes/Base';
import { BotaoPrimario, BotaoTexto } from '../../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../../componentes/Cabecalho';
import { Interruptor } from '../../componentes/Formulario';
import { PreviaDeMensagem } from '../../componentes/PreviaDeMensagem';
import { Tela } from '../../componentes/Tela';
import { candidatos, melhores } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import { mascararTelefone, mensagemDeReposicao } from '../../dominio/mensagens';
import { avisos, useDados } from '../../estado/dados';
import { mesmaJanela, REPOSICAO_INICIAL, useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { texto, TIPO } from '../../tema/tipografia';
import { TAMANHO } from '../../tema/tokens';

export function ConfirmarReposicao() {
  const cores = useCores();
  const { alunoId, concluir, voltar } = useNavegacao();
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

  const texto_ =
    aluno && janela ? mensagemDeReposicao(aluno, janela, politicas) : '';

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
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 12 }}>
            <BarraDePassos total={3} atual={3} rotulo="Passo 3 de 3" />
          </View>
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Confirmar reposição</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>
            {janela ? `${janela.dia}, às ${janela.hora}` : 'Escolha um horário antes'}
          </Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 12 }}
      rodape={
        <>
          <BotaoPrimario
            rotulo={pedirConfirmacao ? 'Enviar e aguardar' : 'Agendar sem avisar'}
            desabilitado={!janela}
            aoTocar={confirmar}
          />
          <BotaoTexto rotulo="Trocar o horário" aoTocar={voltar} />
        </>
      }
    >
      {/* O efeito aparece antes da ação (PRODUCT.md, princípio 2). */}
      {aluno && janela ? (
        <Cartao estilo={{ paddingVertical: 14, paddingHorizontal: 16 }}>
          <RotuloSecao>O que muda</RotuloSecao>
          <View style={{ marginTop: 11, gap: 7 }}>
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
          </View>
        </Cartao>
      ) : null}

      <PreviaDeMensagem
        texto={texto_ || 'Escolha um horário para montar a mensagem.'}
        destino={mascararTelefone(aluno?.telefone)}
        aoCopiar={() => avisar(avisos.mensagemCopiada)}
      />

      <Cartao
        estilo={{
          paddingVertical: 13,
          paddingHorizontal: 15,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
        }}
      >
        <Interruptor
          ligado={pedirConfirmacao}
          aoTrocar={setPedir}
          rotuloAcessivel="Pedir confirmação dele"
        />
        <View style={{ flex: 1 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Pedir confirmação dele
          </Text>
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
            {pedirConfirmacao
              ? 'A reposição fica aguardando o aceite'
              : 'A reposição já entra marcada na agenda'}
          </Text>
        </View>
      </Cartao>

      {msg.editado ? (
        <Text style={[TIPO.nota, { color: cores.textoMedio }]}>
          Mensagem editada por você.
        </Text>
      ) : null}
    </Tela>
  );
}

/** Rótulo à esquerda, valor à direita — o mesmo desenho do resumo de Pacote. */
function LinhaDeResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  const cores = useCores();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>{rotulo}</Text>
      <Text
        style={[
          texto(12.5, 600, { altura: 1.4 }),
          { flexShrink: 1, textAlign: 'right', color: cores.texto },
        ]}
      >
        {valor}
      </Text>
    </View>
  );
}
