/**
 * Tela 7 — Cobrança (empilhada sob Financeiro, H§7 do handoff iOS Glass):
 * contexto da dívida e as quatro ações.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro, coresDoTom, EstadoVazio, type TomDeStatus } from '../componentes/Blocos';
import { TelaVidro } from '../componentes/Chassi';
import { BotaoPrimario } from '../componentes/Controles';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../componentes/Listas';
import { dinheiro, primeiroNome } from '../dominio/formato';
import { valorPacote } from '../dominio/politica';
import type { Aluno } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { ehSheet, useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useVidro } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';

/** "Disciplina · hoje, 17h" — a linha de apoio do cabeçalho. */
function linhaDeHorario(a: Aluno): string {
  if (!a.hora) return `${a.disciplina} · ${a.dia}`;
  return `${a.disciplina} · ${a.hoje ? 'hoje' : a.dia}, ${a.hora}`;
}

/**
 * Cartão de débito de H§7: fundo suave do status, valor grande à esquerda,
 * duas notas à direita e os pares rótulo/valor depois do fio.
 *
 * Local porque o catálogo não tem um cartão colorido com valor em destaque —
 * o `BlocoStatus` é só título + texto. (Candidato a promover.)
 */
function CartaoDeDebito({
  tom,
  rotulo,
  valor,
  notas,
  linhas,
}: {
  tom: TomDeStatus;
  rotulo: string;
  valor: string;
  notas: string;
  linhas: readonly { rotulo: string; valor: string }[];
}) {
  const { cores, material } = useVidro();
  const { suave, cheia } = coresDoTom(cores, tom);

  return (
    <View
      style={[
        estilos.debito,
        { backgroundColor: suave, borderColor: cores.borda, boxShadow: material.gin },
      ]}
    >
      <View style={estilos.linhaTopo}>
        <View style={estilos.flexivel}>
          <Text style={[TIPO_VIDRO.cabecalhoGrupo, { color: cores.tinta3 }]}>{rotulo}</Text>
          <Text
            style={[
              comEspaco(texto(32, 800, { tracking: -0.045 }), { topo: 9 }),
              { color: cheia },
            ]}
          >
            {valor}
          </Text>
        </View>
        <Text style={[texto(12, 500, { altura: 1.5 }), estilos.direita, { color: cores.tinta2 }]}>
          {notas}
        </Text>
      </View>

      <View style={[estilos.separador, { borderTopColor: cores.fio }]}>
        {linhas.map((l) => (
          <View key={l.rotulo} style={estilos.par}>
            <Text style={[texto(13, 500, { altura: 1.35 }), { color: cores.tinta2 }]}>
              {l.rotulo}
            </Text>
            <Text style={[texto(13, 700, { altura: 1.35 }), { color: cores.tinta }]}>
              {l.valor}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function Inadimplencia() {
  const { cores } = useVidro();
  const { alunoId, ir } = useNavegacao();
  const pilha = useNavegacao((s) => s.pilha);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alternarPausa = useDados((s) => s.alternarPausa);
  const avisar = useToast((s) => s.avisar);

  // O rótulo do voltar é o título curto de onde se veio: a aba Financeiro ou
  // a ficha do aluno (MAPA-DE-TELAS.md, "Tipos de tela").
  const anterior = [...pilha].reverse().find((q) => !ehSheet(q.tela));
  const rotuloVoltar =
    anterior?.tela === 'aluno' && aluno ? primeiroNome(aluno.name) : 'Financeiro';

  if (!aluno) {
    return (
      <TelaVidro tipo="empilhada" titulo="Cobrança" voltarPara="Financeiro">
        <CartaoVidro semPadding>
          <EstadoVazio titulo="Aluno não encontrado." />
        </CartaoVidro>
      </TelaVidro>
    );
  }

  const emAtraso = aluno.pagamento.status === 'atraso';

  const acoes = [
    {
      titulo: 'Enviar lembrete de cobrança',
      sub: 'Mensagem pronta com a chave Pix',
      aoTocar: () => ir('lembrete'),
    },
    {
      titulo: 'Registrar pagamento recebido',
      sub: 'Se ele já pagou por fora',
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
  const situacao: { rotulo: string; tom: TomDeStatus; nota: string | null } =
    p.status === 'atraso'
      ? { rotulo: 'Em atraso', tom: 'vermelho', nota: p.venceu ? `venceu ${p.venceu}` : null }
      : p.status === 'aberto'
        ? { rotulo: 'Em aberto', tom: 'neutro', nota: p.vence ? `vence ${p.vence}` : null }
        : p.status === 'pago'
          ? { rotulo: 'Pago', tom: 'verde', nota: p.em ? `pago em ${p.em}` : null }
          : { rotulo: 'Sem pacote', tom: 'neutro', nota: null };

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
    <TelaVidro
      tipo="empilhada"
      titulo="Cobrança"
      voltarPara={rotuloVoltar}
      rodape={
        emAtraso ? (
          <BotaoPrimario rotulo="Registrar pagamento recebido" aoTocar={() => ir('pagamento')} />
        ) : undefined
      }
    >
      <View style={estilos.cabecalho}>
        <Text style={[texto(13, 600), { color: cores.tinta2 }]}>{linhaDeHorario(aluno)}</Text>
        <Text
          style={[comEspaco(TIPO_VIDRO.tituloEmpilhada, { topo: 7 }), { color: cores.tinta }]}
        >
          {aluno.name}
        </Text>
      </View>

      <View style={estilos.espaco18}>
        <CartaoDeDebito
          tom={situacao.tom}
          rotulo={situacao.rotulo}
          valor={dinheiro(valorPacote(aluno))}
          notas={`Pacote de ${aluno.total}${situacao.nota ? `\n${situacao.nota}` : ''}`}
          linhas={linhas}
        />
      </View>

      <CartaoVidro estilo={estilos.espaco14}>
        <Text style={[texto(14.5, 700, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta }]}>
          {proximaAula}
        </Text>
        <Text
          style={[
            comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 5 }),
            { color: cores.tinta2 },
          ]}
        >
          {emAtraso
            ? `O pagamento venceu há ${aluno.pagamento.dias} dias. Você decide se dá a aula.`
            : 'Pagamento regularizado.'}
        </Text>
      </CartaoVidro>

      <View style={estilos.espaco24}>
        <CabecalhoGrupo titulo="O que fazer" />
        <ListaAgrupada estilo={estilos.lista}>
          {acoes.map((a) => (
            <LinhaLista
              key={a.titulo}
              titulo={a.titulo}
              subtitulo={a.sub}
              aoTocar={a.aoTocar}
              chevron
            />
          ))}
        </ListaAgrupada>
      </View>
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  direita: { textAlign: 'right' },
  cabecalho: { paddingHorizontal: 4 },
  espaco14: { marginTop: 14 },
  espaco18: { marginTop: 18 },
  espaco24: { marginTop: 24 },
  lista: { marginTop: 9 },
  debito: {
    borderRadius: RAIO_VIDRO.cartao,
    borderWidth: TAMANHO_VIDRO.bordaVidro,
    padding: 18,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  separador: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: TAMANHO_VIDRO.bordaVidro,
    gap: 8,
  },
  par: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
