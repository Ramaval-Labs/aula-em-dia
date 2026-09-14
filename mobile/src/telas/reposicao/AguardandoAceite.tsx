/** C7 — Reposição aguardando aceite do aluno. */

import React from 'react';
import { Text, View } from 'react-native';

import { Cartao, CartaoContexto, EstadoVazio, LinhaLista, Lista } from '../../componentes/Base';
import { BotaoPequeno, BotaoPrimario, useDoisToques } from '../../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, Eyebrow, TituloTela } from '../../componentes/Cabecalho';
import { Tela } from '../../componentes/Tela';
import { diasEntre } from '../../dominio/datas';
import { primeiroNome } from '../../dominio/formato';
import { avisos, useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { MARCA, TAMANHO } from '../../tema/tokens';

export function AguardandoAceite() {
  const cores = useCores();
  const { alunoId, ir, concluir, voltar } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const responderProposta = useDados((s) => s.responderProposta);
  const avisar = useToast((s) => s.avisar);

  const proposta = aluno?.proposta;

  // Cancelar desfaz a proposta enviada: dois toques.
  const cancelar = useDoisToques(() => {
    if (!aluno) return;
    responderProposta(aluno.id, 'recusada');
    avisar(avisos.propostaCancelada(aluno));
    concluir('aluno', aluno.id);
  });

  if (!aluno || !proposta) {
    return (
      <Tela
        cabecalho={
          <CabecalhoEscuro corDaCurva={cores.tela}>
            <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          </CabecalhoEscuro>
        }
      >
        <EstadoVazio
          titulo="Nenhuma proposta em aberto."
          nota="Quando você enviar um horário ao aluno, a resposta dele é acompanhada aqui."
        />
        {aluno ? (
          <BotaoPequeno
            rotulo="Sugerir horários"
            aoTocar={() => ir('reposicao')}
            estilo={{ alignSelf: 'center' }}
          />
        ) : null}
      </Tela>
    );
  }

  const dias = diasEntre(proposta.enviadaEm) ?? 0;

  const acoes = [
    {
      titulo: 'Reenviar a proposta',
      sub: 'Manda a mesma mensagem de novo',
      aoTocar: () => avisar(`Proposta reenviada para ${primeiroNome(aluno.name)}.`),
    },
    {
      titulo: 'Trocar o horário proposto',
      sub: 'Volta para a lista de sugestões',
      aoTocar: () => ir('reposicao'),
    },
    {
      titulo: cancelar.armado ? 'Tocar de novo para cancelar' : 'Cancelar a proposta',
      sub: 'A reposição volta a ficar pendente',
      aoTocar: cancelar.tocar,
    },
  ];

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <Eyebrow>Aguardando resposta</Eyebrow>
          </View>
          <View style={{ marginTop: 10 }}>
            <TituloTela tamanho={22}>
              {`${proposta.janela.dia}, ${proposta.janela.hora}`}
            </TituloTela>
          </View>
          <Text style={[comEspaco(TIPO.corpo, { topo: 6 }), { color: cores.topoFraco }]}>
            {`Enviada em ${proposta.enviadaEm}${dias > 0 ? `, há ${dias} dias` : ', hoje'}`}
          </Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 12 }}
      rodape={
        <BotaoPrimario
          rotulo="Confirmar e marcar na agenda"
          // A única confirmação da tela (a lista tinha um "Confirmar por ele"
          // que fazia o mesmo): é o professor confirmando pelo aluno.
          aoTocar={() => {
            responderProposta(aluno.id, 'confirmadaPeloProfessor');
            avisar(avisos.reposicaoMarcada(aluno, proposta.janela));
            concluir('aluno', aluno.id);
          }}
        />
      }
    >
      <CartaoContexto
        cor={MARCA.amarelo}
        titulo={`${primeiroNome(aluno.name)} ainda não respondeu`}
        detalhe="Enquanto isso o horário fica reservado na sua agenda, mas a reposição não conta como marcada."
      />

      {proposta.alternativas.length > 0 ? (
        <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
          <Text style={[TIPO.rotulo, { color: cores.suave }]}>
            Alternativas que ele também recebeu
          </Text>
          <View style={{ marginTop: 11, gap: 8 }}>
            {proposta.alternativas.map((j) => (
              <Text
                key={`${j.dia}-${j.hora}`}
                style={[texto(13.5, 500, { altura: 1.4 }), { color: cores.textoMedio }]}
              >
                {`${j.dia} · ${j.hora}`}
              </Text>
            ))}
          </View>
        </Cartao>
      ) : null}

      <Lista rotulo="O que fazer">
        {acoes.map((a, i) => (
          <LinhaLista
            key={a.titulo}
            titulo={a.titulo}
            sub={a.sub}
            chevron
            aoTocar={a.aoTocar}
            ultima={i === acoes.length - 1}
          />
        ))}
      </Lista>
    </Tela>
  );
}
