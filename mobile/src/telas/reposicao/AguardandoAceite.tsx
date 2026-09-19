/**
 * C7 — Reposição aguardando aceite do aluno.
 *
 * Derivada: tela empilhada sob a Ficha (voltar com o primeiro nome). Modelo
 * §7 no cabeçalho (linha de apoio + nome grande) e na lista "O que fazer";
 * §2 no bloco de status âmbar da espera.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { BlocoStatus, EstadoVazio } from '../../componentes/Blocos';
import { TelaVidro } from '../../componentes/Chassi';
import { BotaoCompacto, BotaoPrimario } from '../../componentes/Controles';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import { diasEntre } from '../../dominio/datas';
import { primeiroNome } from '../../dominio/formato';
import { avisos, useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../../tema/tipografia';
import { useDoisToques } from '../../componentes/useDoisToques';

export function AguardandoAceite() {
  const { cores } = useVidro();
  const { alunoId, ir, concluir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const responderProposta = useDados((s) => s.responderProposta);
  const avisar = useToast((s) => s.avisar);

  const proposta = aluno?.proposta;
  const voltarPara = aluno ? primeiroNome(aluno.name) : 'Alunos';

  // Cancelar desfaz a proposta enviada: dois toques.
  const cancelar = useDoisToques(() => {
    if (!aluno) return;
    responderProposta(aluno.id, 'recusada');
    avisar(avisos.propostaCancelada(aluno));
    concluir('aluno', aluno.id);
  });

  if (!aluno || !proposta) {
    return (
      <TelaVidro
        tipo="empilhada"
        titulo="Aguardando resposta"
        voltarPara={voltarPara}
        rodape={
          aluno ? (
            <BotaoCompacto rotulo="Sugerir horários" aoTocar={() => ir('reposicao')} />
          ) : undefined
        }
      >
        <ListaAgrupada>
          <EstadoVazio
            titulo="Nenhuma proposta em aberto."
            nota="Quando você enviar um horário ao aluno, a resposta dele é acompanhada aqui."
          />
        </ListaAgrupada>
      </TelaVidro>
    );
  }

  const dias = diasEntre(proposta.enviadaEm) ?? 0;
  const titulo = `${proposta.janela.dia}, ${proposta.janela.hora}`;

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
    <TelaVidro
      tipo="empilhada"
      titulo={titulo}
      voltarPara={voltarPara}
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
      <Text style={[texto(13, 600, { altura: 1.3 }), estilos.recuo, { color: cores.tinta2 }]}>
        Aguardando resposta
      </Text>
      <Text
        accessibilityRole="header"
        style={[comEspaco(TIPO_VIDRO.tituloEmpilhada, { topo: 7 }), estilos.recuo, { color: cores.tinta }]}
      >
        {titulo}
      </Text>
      <Text
        style={[
          comEspaco(texto(13, 500, { altura: 1.4 }), { topo: 6 }),
          estilos.recuo,
          { color: cores.tinta2 },
        ]}
      >
        {`Enviada em ${proposta.enviadaEm}${dias > 0 ? `, há ${dias} dias` : ', hoje'}`}
      </Text>

      <BlocoStatus
        tom="ambar"
        icone="alerta"
        titulo={`${primeiroNome(aluno.name)} ainda não respondeu`}
        texto="Enquanto isso o horário fica reservado na sua agenda, mas a reposição não conta como marcada."
        estilo={estilos.bloco}
      />

      {proposta.alternativas.length > 0 ? (
        <>
          <CabecalhoGrupo
            titulo="Alternativas que ele também recebeu"
            estilo={estilos.cabecalho}
          />
          <ListaAgrupada estilo={estilos.lista}>
            {proposta.alternativas.map((j) => (
              <LinhaLista key={`${j.dia}-${j.hora}`} titulo={`${j.dia} · ${j.hora}`} />
            ))}
          </ListaAgrupada>
        </>
      ) : null}

      <CabecalhoGrupo titulo="O que fazer" estilo={estilos.cabecalho} />
      <ListaAgrupada estilo={estilos.lista}>
        {acoes.map((a) => (
          <LinhaLista key={a.sub} titulo={a.titulo} subtitulo={a.sub} chevron aoTocar={a.aoTocar} />
        ))}
      </ListaAgrupada>
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  recuo: { paddingHorizontal: 4 },
  bloco: { marginTop: 18 },
  cabecalho: { marginTop: 24 },
  lista: { marginTop: 9 },
});
