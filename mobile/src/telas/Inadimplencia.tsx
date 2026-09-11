/** Tela 7 — Aluno em atraso (Fluxo D4): contexto da dívida e as quatro ações. */

import React from 'react';
import { Text, View } from 'react-native';

import { linhaDeHorario } from '../componentes/Aluno';
import { Cartao, EstadoVazio, LinhaLista, Lista } from '../componentes/Base';
import { BotaoPrimario } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, Eyebrow, Heroi } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { dinheiro, primeiroNome } from '../dominio/formato';
import { saldo, temPacote, valorPacote } from '../dominio/politica';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';

export function Inadimplencia() {
  const cores = useCores();
  const { alunoId, ir, voltar } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alternarPausa = useDados((s) => s.alternarPausa);
  const avisar = useToast((s) => s.avisar);

  if (!aluno) {
    return (
      <Tela
        cabecalho={
          <CabecalhoEscuro corDaCurva={cores.tela}>
            <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          </CabecalhoEscuro>
        }
      >
        <EstadoVazio titulo="Aluno não encontrado." />
      </Tela>
    );
  }

  const emAtraso = aluno.pagamento.status === 'atraso';
  const com = temPacote(aluno);

  const acoes = [
    {
      titulo: 'Enviar lembrete de cobrança',
      sub: 'Mensagem pronta com a chave Pix',
      aoTocar: () => ir('lembrete'),
    },
    {
      titulo: 'Registrar pagamento recebido',
      sub: 'Escolher o meio e o valor',
      aoTocar: () => ir('pagamento'),
    },
    {
      titulo: aluno.pausado ? 'Retomar as próximas aulas' : 'Pausar as próximas aulas',
      sub: aluno.pausado
        ? 'Volta para a lista de registro'
        : 'Sai da lista de registro até regularizar',
      aoTocar: () => avisar(avisos.pausa(aluno, alternarPausa(aluno.id))),
    },
    {
      titulo: 'Combinar parcelamento',
      sub: `2 × ${dinheiro(valorPacote(aluno) / 2)}, registrado à mão`,
      // O app não guarda parcelas: o aviso diz isso em vez de fingir que anotou.
      aoTocar: () =>
        avisar(
          `O app ainda não guarda parcelas. Combine com ${primeiroNome(
            aluno.name,
          )} e registre cada pagamento quando chegar.`,
        ),
    },
  ];

  // Uma situação por status, sem "em aberto" pintado de verde.
  const p = aluno.pagamento;
  const situacao =
    p.status === 'atraso'
      ? { rotulo: 'Em atraso', cor: cores.vermelho, nota: p.venceu ? `venceu ${p.venceu}` : null }
      : p.status === 'aberto'
        ? { rotulo: 'Em aberto', cor: cores.texto, nota: p.vence ? `vence ${p.vence}` : null }
        : p.status === 'pago'
          ? { rotulo: 'Pago', cor: cores.verde, nota: p.em ? `pago em ${p.em}` : null }
          : { rotulo: 'Sem pacote', cor: cores.textoMedio, nota: null };

  const proximaAula = aluno.hoje
    ? `Aula marcada para hoje, ${aluno.hora}`
    : aluno.hora
      ? `Próxima aula: ${aluno.dia}, ${aluno.hora}`
      : 'Sem horário fixo';

  const linhas = [
    { rotulo: 'Aulas dadas sem pagamento', valor: String(aluno.usadas) },
    { rotulo: 'Último lembrete', valor: aluno.ultimoLembrete ?? 'nenhum' },
    { rotulo: 'Histórico de atrasos', valor: `${aluno.atrasosHistoricos ?? 0} em 6 meses` },
  ];

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow>{linhaDeHorario(aluno)}</Eyebrow>
              <Text
                style={[
                  comEspaco(texto(22, 600, { altura: 1.15, tracking: -0.02 }), { topo: 8 }),
                  { color: '#FFFFFF' },
                ]}
              >
                {aluno.name}
              </Text>
            </View>
            <Heroi
              numero={com ? String(saldo(aluno)) : '—'}
              rotulo="aulas"
              tamanho={28}
              cor="#FFFFFF"
              rotuloAcessivel={com ? `${saldo(aluno)} aulas restantes` : 'sem pacote'}
            />
          </View>
        </CabecalhoEscuro>
      }
      rodape={
        emAtraso ? (
          <BotaoPrimario
            rotulo="Registrar pagamento recebido"
            aoTocar={() => ir('pagamento')}
          />
        ) : undefined
      }
      semMascara
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
            {proximaAula}
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.elevadoSuave }]}>
            {emAtraso
              ? `O pagamento venceu há ${aluno.pagamento.dias} dias. Você decide se dá a aula.`
              : 'Pagamento regularizado.'}
          </Text>
        </View>
      </View>

      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View>
            <Text style={[TIPO.eyebrow, { letterSpacing: 1.6, color: cores.suave }]}>
              {situacao.rotulo}
            </Text>
            <Text
              style={[
                comEspaco(texto(28, 800, { altura: 1, tracking: -0.04 }), { topo: 8 }),
                { color: situacao.cor },
              ]}
            >
              {dinheiro(valorPacote(aluno))}
            </Text>
          </View>
          <Text style={[TIPO.legenda, { color: cores.suave, textAlign: 'right' }]}>
            {`Pacote de ${aluno.total}${situacao.nota ? `\n${situacao.nota}` : ''}`}
          </Text>
        </View>

        <View
          style={{
            marginTop: 13,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: cores.linha,
            gap: 7,
          }}
        >
          {linhas.map((l) => (
            <View
              key={l.rotulo}
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
            >
              <Text style={[TIPO.corpo, { color: cores.suave }]}>{l.rotulo}</Text>
              <Text style={[texto(12.5, 600, { altura: 1.4 }), { color: cores.texto }]}>
                {l.valor}
              </Text>
            </View>
          ))}
        </View>
      </Cartao>

      <Lista rotulo="O que fazer">
        {acoes.map((a, i) => (
          <LinhaLista
            key={a.titulo}
            titulo={a.titulo}
            sub={a.sub}
            aoTocar={a.aoTocar}
            chevron
            ultima={i === acoes.length - 1}
          />
        ))}
      </Lista>
    </Tela>
  );
}
