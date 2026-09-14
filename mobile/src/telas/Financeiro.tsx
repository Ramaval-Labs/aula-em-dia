/** Tela 6 — Financeiro (raiz da aba 2, Fluxo D3). */

import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Cartao, EstadoVazio, Lista, LinhaLista } from '../componentes/Base';
import { BotaoPrimario, useDoisToques } from '../componentes/Botoes';
import { CabecalhoEscuro, Eyebrow, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { mesPorExtenso } from '../dominio/datas';
import { dinheiro, milhar } from '../dominio/formato';
import { temPacote, totaisFinanceiro, valorPacote } from '../dominio/politica';
import type { Aluno } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

/** Situação de pagamento em uma linha. */
function detalheDoPagamento(a: Aluno): string {
  const p = a.pagamento;
  if (p.status === 'atraso') return `Venceu ${p.venceu} · ${p.dias} dias`;
  if (p.status === 'aberto') return `Vence ${p.vence}`;
  if (p.status === 'pago') return `Pago em ${p.em} · ${p.meio}`;
  return 'Sem pacote ativo';
}

export function Financeiro() {
  const cores = useCores();
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

  const segmentos = [
    { chave: 'aulas', peso: resumo.aulasDadas, cor: cores.texto },
    { chave: 'reposicoes', peso: resumo.reposicoes, cor: MARCA.amarelo },
    { chave: 'faltas', peso: resumo.faltasDebitadas, cor: cores.vermelho },
  ].filter((b) => b.peso > 0);

  const totaisTopo = [
    { rotulo: 'A receber', valor: totais.aReceber, cor: MARCA.amarelo },
    { rotulo: 'Recebido', valor: totais.recebido, cor: cores.topoTexto },
    { rotulo: 'Em atraso', valor: totais.emAtraso, cor: cores.vermelhoSobreTopo },
  ];

  return (
    <Tela
      comNavbar
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela}>
          <Eyebrow>{mesPorExtenso()}</Eyebrow>
          <View style={{ marginTop: 8 }}>
            <TituloTela tamanho={22}>Financeiro</TituloTela>
          </View>
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 9 }}>
            {totaisTopo.map((t) => (
              <View
                key={t.rotulo}
                accessible
                accessibilityLabel={`${t.rotulo}: ${dinheiro(t.valor)}`}
                style={{
                  flex: 1,
                  backgroundColor: cores.topoCartao,
                  borderRadius: RAIO.cartao,
                  paddingVertical: 12,
                  paddingHorizontal: 13,
                }}
              >
                <Text style={[TIPO.micro, { color: cores.topoFraco }]}>{t.rotulo}</Text>
                <Text
                  style={[
                    comEspaco(texto(19, 800, { altura: 1, tracking: -0.03 }), { topo: 8 }),
                    { color: t.valor ? t.cor : cores.topoFraco },
                  ]}
                >
                  {milhar(t.valor)}
                </Text>
              </View>
            ))}
          </View>
        </CabecalhoEscuro>
      }
      rodape={
        atrasos.length ? (
          <BotaoPrimario
            rotulo={
              cobrar.armado
                ? `Tocar de novo para cobrar ${atrasos.length} ${
                    atrasos.length > 1 ? 'alunos' : 'aluno'
                  }`
                : atrasos.length > 1
                  ? `Cobrar os ${atrasos.length} em atraso`
                  : 'Cobrar quem está em atraso'
            }
            aoTocar={cobrar.tocar}
          />
        ) : undefined
      }
    >
      {atrasos.length ? (
        <Lista
          rotulo="Em atraso"
          direita={
            <Text style={[texto(11.5, 600, { altura: 1 }), { color: cores.vermelho }]}>
              {`${atrasos.length} ${atrasos.length > 1 ? 'alunos' : 'aluno'}`}
            </Text>
          }
        >
          {atrasos.map((a, i) => (
            <LinhaLista
              key={a.id}
              titulo={a.name}
              sub={detalheDoPagamento(a)}
              alturaMinima={0}
              ultima={i === atrasos.length - 1}
              aoTocar={() => ir('inadimplencia', { alunoId: a.id })}
              rotuloAcessivel={`${a.name}, ${detalheDoPagamento(a)}, ${dinheiro(valorPacote(a))}`}
              direita={
                <Text style={[texto(14, 700, { altura: 1 }), { color: cores.vermelho }]}>
                  {dinheiro(valorPacote(a))}
                </Text>
              }
            />
          ))}
        </Lista>
      ) : null}

      {aVencer.length ? (
        <Lista rotulo="A vencer">
          {aVencer.map((a, i) => (
            <LinhaLista
              key={a.id}
              titulo={a.name}
              sub={detalheDoPagamento(a)}
              alturaMinima={0}
              ultima={i === aVencer.length - 1}
              aoTocar={() => ir('aluno', { alunoId: a.id })}
              direita={
                <Text style={[texto(14, 700, { altura: 1 }), { color: cores.texto }]}>
                  {dinheiro(valorPacote(a))}
                </Text>
              }
            />
          ))}
        </Lista>
      ) : null}

      {pagos.length ? (
        <Lista rotulo="Recebido">
          {pagos.map((a, i) => (
            <LinhaLista
              key={a.id}
              titulo={a.name}
              sub={detalheDoPagamento(a)}
              alturaMinima={0}
              ultima={i === pagos.length - 1}
              aoTocar={() => ir('aluno', { alunoId: a.id })}
              direita={
                <Text style={[texto(14, 700, { altura: 1 }), { color: cores.verde }]}>
                  {dinheiro(valorPacote(a))}
                </Text>
              }
            />
          ))}
        </Lista>
      ) : null}

      {comPacote.length === 0 ? (
        <Cartao>
          <EstadoVazio
            titulo="Nenhum pacote ativo."
            nota="Crie um pacote na ficha do aluno para acompanhar o financeiro."
          />
        </Cartao>
      ) : null}

      <Cartao estilo={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text style={[TIPO.rotulo, { color: cores.suave }]}>
          {`Aulas dadas em ${mesPorExtenso().split(' de ')[0].toLowerCase()}`}
        </Text>
        <View
          style={{
            marginTop: 11,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={[TIPO.heroi, { color: cores.texto }]}>{resumo.aulasDadas}</Text>
          <Text style={[TIPO.legenda, { color: cores.textoMedio, textAlign: 'right' }]}>
            {`${resumo.reposicoes} ${resumo.reposicoes === 1 ? 'reposição' : 'reposições'}\n${
              resumo.faltasDebitadas
            } ${resumo.faltasDebitadas === 1 ? 'falta debitada' : 'faltas debitadas'}`}
          </Text>
        </View>
        {/* Segmento de peso zero não aparece: um tracinho vermelho com zero
            faltas seria um débito que não existiu. Sem nada no mês, sem barra. */}
        {segmentos.length ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ marginTop: 13, flexDirection: 'row', gap: 3 }}
          >
            {segmentos.map((b) => (
              <View
                key={b.chave}
                style={{ flex: b.peso, height: 6, borderRadius: 3, backgroundColor: b.cor }}
              />
            ))}
          </View>
        ) : null}
      </Cartao>
    </Tela>
  );
}
