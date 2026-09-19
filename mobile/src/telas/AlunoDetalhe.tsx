/**
 * Tela 2 — Ficha do aluno, no iOS Glass (handoff-ios-glass §2).
 *
 * Identificação → cartão de saldo → blocos de status → extrato → lista "MAIS"
 * → ação. Os blocos só aparecem quando o estado existe, e o primário é um só:
 * "Registrar aula" para quem tem pacote, "Criar pacote de 8 aulas" para quem
 * não tem; "Renovar pacote" entra como secundário quando o saldo está baixo.
 *
 * A lista "MAIS" guarda as ações que o handoff não desenha (ver como o aluno
 * vê, editar, pacote), como manda o mapa de telas.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  CartaoVidro,
  EstadoVazio,
  MedidorPacote,
  BlocoStatus,
} from '../componentes/Blocos';
import { TelaVidro } from '../componentes/Chassi';
import { BotaoPrimario, BotaoSecundario } from '../componentes/Controles';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../componentes/Listas';
import { dinheiro, primeiroNome } from '../dominio/formato';
import { podeRegistrar, saldo, saldoBaixo, temPacote, valorPacote } from '../dominio/politica';
import type { Aluno, Lancamento } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useFormularios } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { LinhaDoExtrato } from './comum/Extrato';
import { linhaDeHorario } from './comum/aluno';

/** Referencia estavel para aluno sem lancamentos. */
const SEM_LANCAMENTOS: Lancamento[] = [];

export function AlunoDetalhe() {
  const { cores } = useCores();
  const { alunoId, ir } = useNavegacao();
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
      <TelaVidro tipo="empilhada" titulo="Aluno" voltarPara="Alunos">
        <CartaoVidro semPadding>
          <EstadoVazio titulo="Aluno não encontrado." />
        </CartaoVidro>
      </TelaVidro>
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
    <TelaVidro
      tipo="empilhada"
      titulo={aluno.name}
      voltarPara="Alunos"
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
      <View style={estilos.identificacao}>
        <Avatar
          nome={aluno.name}
          estado={!com ? 'sem' : baixo ? 'baixo' : 'normal'}
          tamanho={62}
        />
        <View style={estilos.flexivel}>
          <Text
            accessibilityRole="header"
            style={[texto(25, 800, { altura: 1.1, tracking: -0.03 }), { color: cores.tinta }]}
          >
            {aluno.name}
          </Text>
          <Text
            style={[
              comEspaco(texto(13.5, 500, { altura: 1.3 }), { topo: 5 }),
              { color: cores.tinta2 },
            ]}
          >
            {linhaDeHorario(aluno)}
          </Text>
        </View>
      </View>

      {com ? (
        <CartaoVidro estilo={estilos.cartaoSaldo}>
          <View style={estilos.linhaSaldo}>
            <View style={estilos.flexivel}>
              <Text style={[TIPO.rotuloCartao, { color: cores.tinta3 }]}>
                Saldo do pacote
              </Text>
              <View
                accessible
                accessibilityLabel={`${restam} aulas restantes de ${aluno.total}`}
                style={estilos.numeroDoSaldo}
              >
                <Text
                  style={[
                    TIPO.saldoCartao,
                    { color: baixo ? cores.ambarTexto : cores.tint },
                  ]}
                >
                  {String(restam)}
                </Text>
                <Text style={[texto(14, 600), { color: cores.tinta2 }]}>aulas</Text>
              </View>
            </View>
            <View style={estilos.ladoDireito}>
              <Text
                style={[texto(12, 500, { altura: 1.5 }), estilos.direita, { color: cores.tinta2 }]}
              >
                {validadeTexto}
              </Text>
              <Text
                style={[texto(12, 500, { altura: 1.5 }), estilos.direita, { color: cores.tinta2 }]}
              >
                {reposicoesTexto}
              </Text>
            </View>
          </View>

          <MedidorPacote
            total={aluno.total}
            usadas={aluno.usadas}
            baixo={baixo}
            estilo={estilos.medidor}
          />

          <Text
            style={[comEspaco(texto(12.5, 500), { topo: 10 }), { color: cores.tinta2 }]}
          >
            {`${aluno.usadas} de ${aluno.total} usadas`}
          </Text>
        </CartaoVidro>
      ) : null}

      {aluno.pausado ? (
        <BlocoStatus
          estilo={estilos.bloco}
          titulo="Aulas pausadas"
          texto="Fora da lista de registro até o pagamento ser regularizado."
          acao={{
            rotulo: 'Retomar as aulas',
            variante: 'vidro',
            aoTocar: () => {
              alternarPausa(aluno.id);
              avisar(avisos.pausa(aluno, false));
            },
          }}
        />
      ) : null}

      {emAtraso ? (
        <BlocoStatus
          estilo={estilos.bloco}
          tom="vermelho"
          icone="alerta"
          titulo="Pagamento em atraso"
          texto={`${dinheiro(valorPacote(aluno))} venceu em ${aluno.pagamento.venceu}, há ${
            aluno.pagamento.dias
          } dias.`}
          chevron
          aoTocar={() => ir('inadimplencia', { alunoId: aluno.id })}
        />
      ) : null}

      {aluno.pendencia ? (
        <BlocoStatus
          estilo={estilos.bloco}
          tom="ambar"
          titulo="Reposição pendente"
          texto={`Falta avisada em ${aluno.pendencia.origem}.${
            aluno.pendencia.dias > 0
              ? ` Sem horário escolhido há ${aluno.pendencia.dias} dias.`
              : ' Escolha o horário.'
          }`}
          acao={{ rotulo: 'Ver sugestões', aoTocar: () => ir('dispAluno') }}
        />
      ) : null}

      {aluno.proposta ? (
        <BlocoStatus
          estilo={estilos.bloco}
          tom="tint"
          titulo="Proposta aguardando aceite"
          texto={`${aluno.proposta.janela.dia}, ${aluno.proposta.janela.hora}. Enviada em ${aluno.proposta.enviadaEm}.`}
          acao={{ rotulo: 'Acompanhar', aoTocar: () => ir('aguardandoAceite') }}
        />
      ) : null}

      {aluno.agendada ? (
        <BlocoStatus
          estilo={estilos.bloco}
          tom="verde"
          icone="checkBloco"
          titulo="Reposição confirmada"
          texto={`${aluno.agendada.dia}, ${aluno.agendada.hora}. Mensagem enviada ao aluno.`}
        />
      ) : null}

      <CabecalhoGrupo titulo="Extrato" estilo={estilos.tituloExtrato} />
      <ListaAgrupada estilo={estilos.listaExtrato}>
        {extrato.length === 0 ? (
          <EstadoVazio titulo="Nenhum lançamento ainda." />
        ) : (
          extrato.map((l, i) => <LinhaDoExtrato key={`${l.d}-${l.t}-${i}`} lancamento={l} />)
        )}
      </ListaAgrupada>

      <CabecalhoGrupo titulo="Mais" estilo={estilos.tituloMais} />
      <ListaAgrupada estilo={estilos.listaMais}>
        <LinhaLista
          titulo="Ver como o aluno vê"
          subtitulo="A página que ele abre pelo link"
          aoTocar={() => ir('verComoAluno')}
        />
        <LinhaLista
          titulo="Editar dados do aluno"
          subtitulo="Nome, disciplina, horário e telefone"
          aoTocar={() => ir('alunoForm')}
        />
        <LinhaLista
          titulo={com ? 'Renovar pacote' : 'Criar pacote'}
          subtitulo={
            com ? 'Escolher quantidade, valor e validade' : 'Primeiro pacote deste aluno'
          }
          aoTocar={() => ir('pacote')}
        />
      </ListaAgrupada>
    </TelaVidro>
  );
}

/** Rodapé da ficha: registrar, criar ou renovar pacote, conforme o estado. */
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
  const { cores } = useCores();
  const com = temPacote(aluno);

  return (
    <View style={estilos.acoes}>
      {com ? (
        <BotaoPrimario
          rotulo="Registrar aula"
          desabilitado={!podeRegistrar(aluno)}
          aoTocar={aoRegistrar}
        />
      ) : null}

      {aluno.semPacote ? (
        <BotaoPrimario rotulo="Criar pacote de 8 aulas" aoTocar={aoCriarPacote} />
      ) : null}

      {com && saldoBaixo(aluno) ? (
        <BotaoSecundario rotulo="Renovar pacote" aoTocar={aoRenovar} />
      ) : null}

      {com && aluno.pausado ? (
        <Text
          style={[
            texto(12.5, 500, { altura: 1.45 }),
            estilos.nota,
            { color: cores.tinta2 },
          ]}
        >
          {`Registro bloqueado enquanto as aulas de ${primeiroNome(
            aluno.name,
          )} estiverem pausadas.`}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  direita: { textAlign: 'right' },
  identificacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
  },
  cartaoSaldo: { marginTop: 18 },
  linhaSaldo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  numeroDoSaldo: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  ladoDireito: { alignItems: 'flex-end' },
  medidor: { marginTop: 16 },
  bloco: { marginTop: 14 },
  tituloExtrato: { marginTop: 26 },
  listaExtrato: { marginTop: 9 },
  tituloMais: { marginTop: 22 },
  listaMais: { marginTop: 9 },
  acoes: { gap: 10 },
  nota: { textAlign: 'center', paddingHorizontal: 8 },
});
