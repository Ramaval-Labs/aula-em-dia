/**
 * C5 — Nenhum horário cabe. O estado crítico do fluxo.
 *
 * Só é alcançável quando o motor de agenda devolve lista vazia de verdade —
 * as razões e as saídas saem do estado real, não de texto fixo.
 */

import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Caixa, Cartao, LinhaLista, Lista } from '../../componentes/Base';
import { BotaoContorno } from '../../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../../componentes/Cabecalho';
import { Tela } from '../../componentes/Tela';
import { motivosDaFalta } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import { primeiroNome } from '../../dominio/formato';
import { avisos, useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { TAMANHO } from '../../tema/tokens';

export function SemHorario() {
  const cores = useCores();
  const { alunoId, ir, concluir, voltar } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const estenderValidade = useDados((s) => s.estenderValidade);
  const atualizarAluno = useDados((s) => s.atualizarAluno);
  const salvarDisponibilidade = useDados((s) => s.salvarDisponibilidade);
  const avisar = useToast((s) => s.avisar);

  const razoes = useMemo(
    () => (aluno ? motivosDaFalta(aluno, alunos, disponibilidade, hoje()) : []),
    [aluno, alunos, disponibilidade],
  );

  const saidas = [
    {
      titulo: 'Estender a validade do pacote',
      sub: 'Ganha 15 dias de horizonte para encaixar',
      aoTocar: () => {
        if (!aluno) return;
        const nova = estenderValidade(aluno.id);
        if (nova) {
          avisar(avisos.validade(nova));
          ir('reposicao');
        } else {
          avisar('A validade deste pacote já foi estendida uma vez.');
        }
      },
    },
    {
      titulo: 'Pedir a disponibilidade dele',
      sub: 'Ele marca quando pode e você sugere de novo',
      aoTocar: () => ir('dispAluno'),
    },
    {
      titulo: 'Abrir um horário fora do habitual',
      sub: 'Passa a considerar blocos fora da sua agenda',
      aoTocar: () => {
        salvarDisponibilidade({ ...disponibilidade, aceitaForaDosBlocos: true });
        avisar('Agora as sugestões consideram horários fora dos seus blocos.');
        ir('reposicao');
      },
    },
    {
      titulo: 'Devolver a aula como crédito',
      sub: 'A aula volta ao saldo e a pendência é encerrada',
      aoTocar: () => {
        if (!aluno) return;
        atualizarAluno(aluno.id, { pendencia: null });
        avisar(
          `A aula de ${primeiroNome(aluno.name)} voltou ao saldo, sem reposição marcada.`,
        );
        concluir('aluno', aluno.id);
      },
    },
  ];

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Nenhum horário cabe</TituloTela>
          </View>
          <Text style={[comEspaco(TIPO.corpo, { topo: 6 }), { color: cores.topoFraco }]}>
            {aluno
              ? `Não achei janela para repor a aula do ${primeiroNome(aluno.name)}.`
              : ''}
          </Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 12 }}
    >
      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <Text style={[TIPO.rotulo, { color: cores.suave }]}>
          Por quê
        </Text>
        <View style={{ marginTop: 12, gap: 11 }}>
          {razoes.map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 7,
                  backgroundColor: cores.vermelho,
                }}
              />
              <Text style={[texto(13.5, 400, { altura: 1.5 }), { flex: 1, color: cores.textoMedio }]}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      </Cartao>

      <Lista rotulo="Saídas">
        {saidas.map((s, i) => (
          <LinhaLista
            key={s.titulo}
            titulo={s.titulo}
            sub={s.sub}
            chevron
            aoTocar={s.aoTocar}
            ultima={i === saidas.length - 1}
          />
        ))}
      </Lista>

      <Caixa>
        <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>
          Deixar pendente também é uma escolha: a reposição continua na lista de alunos
          até você resolver.
        </Text>
        <View style={{ marginTop: 11 }}>
          <BotaoContorno
            rotulo="Deixar pendente"
            altura={44}
            aoTocar={() => concluir('aluno', aluno?.id ?? null)}
          />
        </View>
      </Caixa>
    </Tela>
  );
}
