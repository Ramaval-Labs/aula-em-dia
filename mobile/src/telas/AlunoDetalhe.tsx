/** Tela 2 — Detalhe do aluno: contextos condicionais, extrato e ação primária. */

import React from 'react';
import { Text, View } from 'react-native';

import { linhaDeHorario, LinhaExtrato, PontosPacote } from '../componentes/Aluno';
import {
  Caixa,
  Cartao,
  CartaoContexto,
  EstadoVazio,
  LinhaLista,
  Lista,
  RotuloSecao,
} from '../componentes/Base';
import { BotaoContorno, BotaoPequeno, BotaoPrimario } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, Heroi } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { dinheiro, primeiroNome } from '../dominio/formato';
import { podeRegistrar, saldo, saldoBaixo, temPacote, valorPacote } from '../dominio/politica';
import type { Aluno, Lancamento } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useFormularios } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA } from '../tema/tokens';

/** Referencia estavel para aluno sem lancamentos. */
const SEM_LANCAMENTOS: Lancamento[] = [];

export function AlunoDetalhe() {
  const cores = useCores();
  const { alunoId, ir, voltar } = useNavegacao();
  const reiniciarRascunho = useFormularios((s) => s.substituir);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  // O `?? []` NAO pode ficar dentro do seletor: devolveria um array novo a cada
  // chamada e o zustand entraria em loop de render. A constante e estavel.
  const extrato =
    useDados((s) => (alunoId ? s.extratos[alunoId] : undefined)) ?? SEM_LANCAMENTOS;
  const politicas = useDados((s) => s.politicas);
  const alternarPausa = useDados((s) => s.alternarPausa);
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
              <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>
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
          aoRegistrar={() => {
            reiniciarRascunho('registro', REGISTRO_INICIAL);
            ir('registrar');
          }}
          aoCriarPacote={() => ir('pacote')}
          aoRenovar={() => ir('pacote')}
        />
      }
    >
      {aluno.pausado ? (
        <Cartao estilo={{ paddingVertical: 14, paddingHorizontal: 16 }}>
          <Text style={[texto(14, 600, { altura: 1.25 }), { color: cores.textoMedio }]}>
            Aulas pausadas
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.textoMedio }]}>
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
        </Cartao>
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
              aoTocar={() => ir('dispAluno')}
            />
          }
        />
      ) : null}

      {aluno.proposta ? (
        <CartaoContexto
          cor={MARCA.amarelo}
          titulo="Proposta aguardando aceite"
          detalhe={`${aluno.proposta.janela.dia}, ${aluno.proposta.janela.hora}. Enviada em ${aluno.proposta.enviadaEm}.`}
          acao={
            <BotaoPequeno
              rotulo="Acompanhar"
              aoTocar={() => ir('aguardandoAceite')}
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
        <CartaoContexto
          escuro
          cor={cores.vermelho}
          titulo="Pagamento em atraso"
          detalhe={`${dinheiro(valorPacote(aluno))} venceu em ${aluno.pagamento.venceu}, há ${
            aluno.pagamento.dias
          } dias.`}
          aoTocar={() => ir('inadimplencia', { alunoId: aluno.id })}
          rotuloAcessivel={`Pagamento em atraso. ${dinheiro(
            valorPacote(aluno),
          )} venceu em ${aluno.pagamento.venceu}, há ${aluno.pagamento.dias} dias. Abrir cobrança.`}
        />
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
            <Text style={[texto(11.5, 400, { altura: 1 }), { color: cores.textoMedio }]}>
              {validadeTexto}
            </Text>
          </View>
          <View style={{ marginTop: 13 }}>
            <PontosPacote total={aluno.total} usadas={aluno.usadas} baixo={baixo} cresce />
          </View>
          <View
            style={{ marginTop: 11, flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={[TIPO.legenda, { color: cores.textoMedio }]}>
              {`${aluno.usadas} de ${aluno.total} usadas`}
            </Text>
            <Text style={[TIPO.legenda, { color: cores.textoMedio }]}>{reposicoesTexto}</Text>
          </View>
        </Cartao>
      ) : null}

      <Lista rotulo="Mais">
        <LinhaLista
          titulo="Ver como o aluno vê"
          sub="A página que ele abre pelo link"
          chevron
          aoTocar={() => ir('verComoAluno')}
        />
        <LinhaLista
          titulo="Editar dados do aluno"
          sub="Nome, disciplina, horário e telefone"
          chevron
          aoTocar={() => ir('alunoForm')}
        />
        <LinhaLista
          titulo={com ? 'Renovar pacote' : 'Criar pacote'}
          sub={com ? 'Escolher quantidade, valor e validade' : 'Primeiro pacote deste aluno'}
          chevron
          ultima
          aoTocar={() => ir('pacote')}
        />
      </Lista>

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
          style={[TIPO.nota, { color: cores.textoMedio, textAlign: 'center', paddingHorizontal: 8 }]}
        >
          {`Registro bloqueado enquanto as aulas de ${primeiroNome(
            aluno.name,
          )} estiverem pausadas.`}
        </Text>
      ) : null}
    </>
  );
}
