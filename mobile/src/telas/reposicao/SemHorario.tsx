/**
 * C5 — Nenhum horário cabe. O estado crítico do fluxo.
 *
 * Só é alcançável quando o motor de agenda devolve lista vazia de verdade —
 * as razões e as saídas saem do estado real, não de texto fixo.
 *
 * Derivada: modelo §5 — o bloco âmbar do limite atingido carrega o "por quê",
 * e as saídas são uma lista agrupada. "Deixar pendente" fica no rodapé do
 * sheet como secundário: é a saída de não fazer nada, e não merece o peso de
 * primário (mesmo desenho do "Fechar" do sheet de resultado).
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { BlocoStatus } from '../../componentes/Blocos';
import { BotaoSecundario } from '../../componentes/Controles';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import { Sheet, SubLinhaSheet } from '../../componentes/Sheet';
import { motivosDaFalta } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import { primeiroNome } from '../../dominio/formato';
import { avisos, useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';

export function SemHorario() {
  const { cores } = useVidro();
  const { alunoId, ir, concluir } = useNavegacao();
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
        avisar(`A aula de ${primeiroNome(aluno.name)} voltou ao saldo, sem reposição marcada.`);
        concluir('aluno', aluno.id);
      },
    },
  ];

  return (
    <Sheet
      titulo="Nenhum horário cabe"
      rodape={
        <BotaoSecundario
          rotulo="Deixar pendente"
          aoTocar={() => concluir('aluno', aluno?.id ?? null)}
        />
      }
    >
      <SubLinhaSheet
        texto={
          aluno ? `Não achei janela para repor a aula do ${primeiroNome(aluno.name)}.` : undefined
        }
      />

      {razoes.length > 0 ? (
        <BlocoStatus
          tom="ambar"
          icone="alerta"
          titulo="Por quê"
          texto={razoes.join(' ')}
          estilo={estilos.bloco}
        />
      ) : null}

      <CabecalhoGrupo titulo="Saídas" estilo={estilos.cabecalho} />
      <ListaAgrupada estilo={estilos.lista}>
        {saidas.map((s) => (
          <LinhaLista key={s.titulo} titulo={s.titulo} subtitulo={s.sub} chevron aoTocar={s.aoTocar} />
        ))}
      </ListaAgrupada>

      <Text
        style={[
          comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 14 }),
          estilos.recuo,
          { color: cores.tinta2 },
        ]}
      >
        Deixar pendente também é uma escolha: a reposição continua na lista de alunos até
        você resolver.
      </Text>
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  bloco: { marginTop: 16 },
  cabecalho: { marginTop: 24 },
  lista: { marginTop: 9 },
  recuo: { paddingHorizontal: 6 },
});
