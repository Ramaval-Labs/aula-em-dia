/**
 * Tela 6 — Financeiro (raiz da aba 2, H§6 do handoff iOS Glass).
 *
 * Cabeçalho com o mês e o título grande, três cartões de resumo, as três
 * listas de cobrança (em atraso, a vencer, recebido) e o cartão de aulas
 * dadas com a barra proporcional.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  BarraProporcional,
  CartaoResumo,
  CartaoVidro,
  EstadoVazio,
  type EstadoDoAvatar,
  type SegmentoProporcional,
  type TomDeStatus,
} from '../componentes/Blocos';
import { TelaVidro, TituloDeConteudo } from '../componentes/Chassi';
import { BotaoPrimario } from '../componentes/Controles';
import { CabecalhoGrupo, LinhaAluno, ListaAgrupada } from '../componentes/Listas';
import { useDoisToques } from '../componentes/useDoisToques';
import { mesPorExtenso } from '../dominio/datas';
import { dinheiro, milhar, plural } from '../dominio/formato';
import { temPacote, totaisFinanceiro, valorPacote } from '../dominio/politica';
import type { Aluno } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';

/** Situação de pagamento em uma linha. */
function detalheDoPagamento(a: Aluno): string {
  const p = a.pagamento;
  if (p.status === 'atraso') return `Venceu ${p.venceu} · ${p.dias} dias`;
  if (p.status === 'aberto') return `Vence ${p.vence}`;
  if (p.status === 'pago') return `Pago em ${p.em} · ${p.meio}`;
  return 'Sem pacote ativo';
}

/** Valor dos cartões de resumo: "R$ N.NNN", sem centavos (handoff §6). */
const semCentavos = (n: number) => `R$ ${milhar(n)}`;

export function Financeiro() {
  const { cores } = useCores();
  const alunos = useDados((s) => s.alunos);
  const extratos = useDados((s) => s.extratos);
  const cobrarTodos = useDados((s) => s.cobrarTodosEmAtraso);
  const { ir } = useNavegacao();
  const avisar = useToast((s) => s.avisar);

  // Ação em lote sobre vários alunos: dois toques.
  const cobrar = useDoisToques(() => avisar(avisos.lembreteEmLote(cobrarTodos())));

  const totais = useMemo(() => totaisFinanceiro(alunos), [alunos]);
  const comPacote = alunos.filter(temPacote);
  const atrasos = comPacote.filter((a) => a.pagamento.status === 'atraso');
  const aVencer = comPacote.filter((a) => a.pagamento.status === 'aberto');
  const pagos = comPacote.filter((a) => a.pagamento.status === 'pago');

  // Resumo do mês, lido do extrato: aulas dadas, reposições e faltas debitadas.
  const resumo = useMemo(() => {
    let aulasDadas = 0;
    let faltasDebitadas = 0;
    Object.values(extratos).forEach((lista) =>
      lista.forEach((e) => {
        if (e.t === 'Aula realizada' || e.t === 'Reposição realizada') aulasDadas += 1;
        if (e.t.startsWith('Falta') && e.delta < 0) faltasDebitadas += 1;
      }),
    );
    const reposicoes = alunos.reduce((t, a) => t + a.reposicoes, 0);
    return { aulasDadas, faltasDebitadas, reposicoes };
  }, [extratos, alunos]);

  const textoReposicoes = plural(resumo.reposicoes, 'reposição', 'reposições');
  const textoFaltas = plural(resumo.faltasDebitadas, 'falta debitada', 'faltas debitadas');

  // Segmento de peso zero não aparece: um tracinho vermelho com zero faltas
  // seria um débito que não existiu. Sem nada no mês, sem barra.
  const segmentos: SegmentoProporcional[] = (
    [
      {
        peso: resumo.aulasDadas,
        tom: 'tint',
        rotulo: plural(resumo.aulasDadas, 'aula dada', 'aulas dadas'),
      },
      { peso: resumo.reposicoes, tom: 'ambar', rotulo: textoReposicoes },
      { peso: resumo.faltasDebitadas, tom: 'vermelho', rotulo: textoFaltas },
    ] as SegmentoProporcional[]
  ).filter((s) => s.peso > 0);

  const totaisTopo: { rotulo: string; valor: number; tom: TomDeStatus }[] = [
    { rotulo: 'A receber', valor: totais.aReceber, tom: 'ambar' },
    { rotulo: 'Recebido', valor: totais.recebido, tom: 'verde' },
    { rotulo: 'Em atraso', valor: totais.emAtraso, tom: 'vermelho' },
  ];

  /** As três listas têm a mesma linha; muda a cor, o avatar e o destino. */
  const grupo = (
    titulo: string,
    lista: Aluno[],
    estado: EstadoDoAvatar,
    corDoValor: string,
    aoTocar: (a: Aluno) => void,
    comChevron: boolean,
    contagem?: string,
  ) => (
    <View style={estilos.grupo}>
      <CabecalhoGrupo titulo={titulo} contagem={contagem} tom={contagem ? 'atraso' : 'neutro'} />
      <ListaAgrupada estilo={estilos.lista}>
        {lista.map((a) => (
          <LinhaAluno
            key={a.id}
            porte="cobranca"
            nome={a.name}
            apoio={detalheDoPagamento(a)}
            estadoDoAvatar={estado}
            valor={dinheiro(valorPacote(a))}
            corDoValor={corDoValor}
            chevron={comChevron}
            aoTocar={() => aoTocar(a)}
            rotuloAcessivel={`${a.name}, ${detalheDoPagamento(a)}, ${dinheiro(valorPacote(a))}`}
          />
        ))}
      </ListaAgrupada>
    </View>
  );

  return (
    <TelaVidro
      tipo="raiz"
      titulo="Financeiro"
      rodape={
        atrasos.length ? (
          <BotaoPrimario
            rotulo={
              cobrar.armado
                ? `Tocar de novo para cobrar ${plural(atrasos.length, 'aluno', 'alunos')}`
                : atrasos.length > 1
                  ? `Cobrar os ${atrasos.length} em atraso`
                  : 'Cobrar quem está em atraso'
            }
            aoTocar={cobrar.tocar}
          />
        ) : undefined
      }
    >
      <TituloDeConteudo porte="grande" acima={mesPorExtenso()} titulo="Financeiro" />

      <View style={estilos.resumo}>
        {totaisTopo.map((t) => (
          <View
            key={t.rotulo}
            accessible
            accessibilityLabel={`${t.rotulo}: ${dinheiro(t.valor)}`}
            style={estilos.flexivel}
          >
            <CartaoResumo
              rotulo={t.rotulo}
              valor={semCentavos(t.valor)}
              tom={t.tom}
              zerado={!t.valor}
            />
          </View>
        ))}
      </View>

      {atrasos.length
        ? grupo(
            'Em atraso',
            atrasos,
            'atraso',
            cores.vermelho,
            (a) => ir('inadimplencia', { alunoId: a.id }),
            true,
            plural(atrasos.length, 'aluno', 'alunos'),
          )
        : null}

      {aVencer.length
        ? grupo(
            'A vencer',
            aVencer,
            'sem',
            cores.tinta,
            (a) => ir('aluno', { alunoId: a.id }),
            false,
          )
        : null}

      {pagos.length
        ? grupo('Recebido', pagos, 'pago', cores.verde, (a) => ir('aluno', { alunoId: a.id }), false)
        : null}

      {comPacote.length === 0 ? (
        <CartaoVidro estilo={estilos.grupo} semPadding>
          <EstadoVazio
            titulo="Nenhum pacote ativo."
            nota="Crie um pacote na ficha do aluno para acompanhar o financeiro."
          />
        </CartaoVidro>
      ) : null}

      <CartaoVidro estilo={estilos.grupo}>
        <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>
          {`Aulas dadas em ${mesPorExtenso().split(' de ')[0].toLowerCase()}`}
        </Text>
        <View style={estilos.linhaNumero}>
          <Text
            style={[
              comEspaco(texto(34, 800, { tracking: -0.045 }), { topo: 12 }),
              { color: cores.tinta },
            ]}
          >
            {resumo.aulasDadas}
          </Text>
          <Text style={[texto(12, 500, { altura: 1.5 }), estilos.direita, { color: cores.tinta2 }]}>
            {`${textoReposicoes}\n${textoFaltas}`}
          </Text>
        </View>
        {segmentos.length ? (
          <BarraProporcional estilo={estilos.barra} segmentos={segmentos} />
        ) : null}
      </CartaoVidro>
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1 },
  resumo: { marginTop: 18, flexDirection: 'row', gap: 9 },
  grupo: { marginTop: 24 },
  lista: { marginTop: 9 },
  linhaNumero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  direita: { textAlign: 'right' },
  barra: { marginTop: 15 },
});
