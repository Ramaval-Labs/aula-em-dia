/** Tela 2 — Detalhe do aluno: contextos condicionais, extrato e ação primária. */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { linhaDeHorario, LinhaExtrato, PontosPacote } from '../componentes/Aluno';
import { Caixa, Cartao, EstadoVazio, RotuloSecao } from '../componentes/Base';
import { BotaoContorno, BotaoPequeno, BotaoPrimario } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, Heroi } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { dinheiro, primeiroNome } from '../dominio/formato';
import { podeRegistrar, saldo, saldoBaixo, temPacote, valorPacote } from '../dominio/politica';
import type { Aluno } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

/** Cartão de contexto acima do extrato, com a barra colorida à esquerda. */
function CartaoContexto({
  titulo,
  detalhe,
  cor,
  acao,
}: {
  titulo: string;
  detalhe: string;
  cor: string;
  acao?: React.ReactNode;
}) {
  const cores = useCores();
  return (
    <Cartao estilo={{ borderLeftWidth: 4, borderLeftColor: cor, paddingVertical: 14, paddingHorizontal: 16 }}>
      <Text style={[texto(14, 600, { altura: 1.25 }), { color: cores.texto }]}>{titulo}</Text>
      <Text style={[TIPO.corpo, { marginTop: 4, color: cores.suave }]}>{detalhe}</Text>
      {acao ? <View style={{ marginTop: 11 }}>{acao}</View> : null}
    </Cartao>
  );
}

export function AlunoDetalhe() {
  const cores = useCores();
  const { alunoId, ir, voltar } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const extrato = useDados((s) => (alunoId ? (s.extratos[alunoId] ?? []) : []));
  const politicas = useDados((s) => s.politicas);
  const alternarPausa = useDados((s) => s.alternarPausa);
  const criarPacote = useDados((s) => s.criarPacote);
  const renovarPacote = useDados((s) => s.renovarPacote);
  const avisar = useToast((s) => s.avisar);

  if (!aluno) {
    return (
      <Tela
        cabecalho={
          <CabecalhoEscuro corDaCurva={cores.tela}>
            <BotaoVoltar rotulo="Alunos" aoTocar={voltar} />
          </CabecalhoEscuro>
        }
      >
        <EstadoVazio titulo="Aluno não encontrado." />
      </Tela>
    );
  }

  const com = temPacote(aluno);
  const restam = saldo(aluno);
  const baixo = saldoBaixo(aluno);
  const emAtraso = aluno.pagamento.status === 'atraso';

  const validadeTexto = `validade ${aluno.validade || '—'}${
    aluno.validadeEstendida ? ' · estendida' : ''
  }`;
  const reposicoesTexto =
    politicas.limiteReposicoes === 0
      ? `${aluno.reposicoes} reposições`
      : `${aluno.reposicoes} de ${politicas.limiteReposicoes} reposições`;

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela}>
          <BotaoVoltar rotulo="Alunos" aoTocar={voltar} />
          <View
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[TIPO.tituloInterno, { color: '#FFFFFF' }]}>{aluno.name}</Text>
              <Text style={[TIPO.corpo, { marginTop: 6, color: cores.suave }]}>
                {linhaDeHorario(aluno)}
              </Text>
            </View>
            <Heroi
              numero={com ? String(restam) : '—'}
              rotulo="restam"
              tamanho={34}
              cor={!com ? cores.fraco : baixo ? MARCA.amarelo : '#FFFFFF'}
              rotuloAcessivel={
                com ? `${restam} aulas restantes de ${aluno.total}` : 'sem pacote ativo'
              }
            />
          </View>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 12 }}
      rodape={
        <AcoesDoAluno
          aluno={aluno}
          aoRegistrar={() => ir('registrar', { desfecho: null })}
          aoCriarPacote={() => avisar(`Pacote de 8 aulas criado, validade ${criarPacote(aluno.id)}.`)}
          aoRenovar={() => {
            const { saldo: novo, validade } = renovarPacote(aluno.id);
            avisar(`Pacote renovado. Saldo agora é ${novo}, validade ${validade}.`);
          }}
        />
      }
    >
      {aluno.pausado ? (
        <Caixa>
          <Text style={[texto(14, 600, { altura: 1.25 }), { color: cores.textoMedio }]}>
            Aulas pausadas
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.suave }]}>
            Fora da lista de registro até o pagamento ser regularizado.
          </Text>
          <View style={{ marginTop: 11 }}>
            <BotaoPequeno
              rotulo="Retomar as aulas"
              aoTocar={() => {
                alternarPausa(aluno.id);
                avisar(avisos.pausa(aluno, false));
              }}
            />
          </View>
        </Caixa>
      ) : null}

      {aluno.pendencia ? (
        <CartaoContexto
          cor={MARCA.amarelo}
          titulo="Reposição pendente"
          detalhe={`Falta avisada em ${aluno.pendencia.origem}.${
            aluno.pendencia.dias > 0
              ? ` Sem horário escolhido há ${aluno.pendencia.dias} dias.`
              : ' Escolha o horário.'
          }`}
          acao={
            <BotaoPequeno
              variante="amarelo"
              rotulo="Ver sugestões"
              aoTocar={() => ir('reposicao', { janela: null })}
            />
          }
        />
      ) : null}

      {aluno.agendada ? (
        <CartaoContexto
          cor={cores.verde}
          titulo="Reposição confirmada"
          detalhe={`${aluno.agendada.dia}, ${aluno.agendada.hora}. Mensagem enviada ao aluno.`}
        />
      ) : null}

      {emAtraso ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pagamento em atraso. ${dinheiro(valorPacote(aluno))} venceu em ${
            aluno.pagamento.venceu
          }, há ${aluno.pagamento.dias} dias. Abrir cobrança.`}
          onPress={() => ir('inadimplencia', { alunoId: aluno.id })}
        >
          <View
            style={{
              backgroundColor: cores.elevado,
              borderRadius: RAIO.cartao,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 4,
                alignSelf: 'stretch',
                backgroundColor: cores.vermelho,
                borderRadius: 2,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[texto(14, 600, { altura: 1.25 }), { color: '#FFFFFF' }]}>
                Pagamento em atraso
              </Text>
              <Text style={[TIPO.corpo, { marginTop: 4, color: cores.elevadoSuave }]}>
                {`${dinheiro(valorPacote(aluno))} venceu em ${aluno.pagamento.venceu}, há ${
                  aluno.pagamento.dias
                } dias.`}
              </Text>
            </View>
            <Text
              style={[texto(16, 600, { altura: 1 }), { color: cores.topoFraco, alignSelf: 'center' }]}
            >
              ›
            </Text>
          </View>
        </Pressable>
      ) : null}

      {com ? (
        <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <Text style={[TIPO.eyebrow, { letterSpacing: 1.6, color: cores.suave }]}>
              Pacote atual
            </Text>
            <Text style={[texto(11.5, 400, { altura: 1 }), { color: cores.suave }]}>
              {validadeTexto}
            </Text>
          </View>
          <View style={{ marginTop: 13 }}>
            <PontosPacote total={aluno.total} usadas={aluno.usadas} baixo={baixo} cresce />
          </View>
          <View
            style={{ marginTop: 11, flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={[TIPO.legenda, { color: cores.suave }]}>
              {`${aluno.usadas} de ${aluno.total} usadas`}
            </Text>
            <Text style={[TIPO.legenda, { color: cores.suave }]}>{reposicoesTexto}</Text>
          </View>
        </Cartao>
      ) : null}

      <View>
        <RotuloSecao estilo={{ marginBottom: 9 }}>Extrato</RotuloSecao>
        <Cartao estilo={{ overflow: 'hidden' }}>
          {extrato.length === 0 ? (
            <EstadoVazio titulo="Nenhum lançamento ainda." />
          ) : (
            extrato.map((l, i) => (
              <LinhaExtrato
                key={`${l.d}-${l.t}-${i}`}
                lancamento={l}
                ultima={i === extrato.length - 1}
              />
            ))
          )}
        </Cartao>
      </View>
    </Tela>
  );
}

/** Rodapé do detalhe: registrar, criar ou renovar pacote, conforme o estado. */
function AcoesDoAluno({
  aluno,
  aoRegistrar,
  aoCriarPacote,
  aoRenovar,
}: {
  aluno: Aluno;
  aoRegistrar: () => void;
  aoCriarPacote: () => void;
  aoRenovar: () => void;
}) {
  const cores = useCores();
  const com = temPacote(aluno);

  return (
    <>
      {com ? (
        <BotaoPrimario
          rotulo="Registrar aula"
          altura={50}
          desabilitado={!podeRegistrar(aluno)}
          aoTocar={aoRegistrar}
        />
      ) : null}

      {aluno.semPacote ? (
        <BotaoPrimario rotulo="Criar pacote de 8 aulas" altura={50} aoTocar={aoCriarPacote} />
      ) : null}

      {com && saldoBaixo(aluno) ? (
        <BotaoContorno rotulo="Renovar pacote" altura={48} aoTocar={aoRenovar} />
      ) : null}

      {com && aluno.pausado ? (
        <Text
          style={[TIPO.nota, { color: cores.suave, textAlign: 'center', paddingHorizontal: 8 }]}
        >
          {`Registro bloqueado enquanto as aulas de ${primeiroNome(
            aluno.name,
          )} estiverem pausadas.`}
        </Text>
      ) : null}
    </>
  );
}
