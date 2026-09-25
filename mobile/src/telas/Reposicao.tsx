/**
 * Tela 5 — Escolher horário (handoff-ios-glass/README.md §5; C3, passo 2 de 3).
 *
 * Sheet de tarefa (88%). As janelas saem do motor de `dominio/agenda.ts`,
 * calculadas contra a disponibilidade do professor, a do aluno, as folgas e
 * as aulas fixas dos outros alunos — não das três fixas do protótipo. A
 * primeira leva o selo "MELHOR" e cada uma mostra o motivo calculado. Lista
 * vazia leva à tela C5.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BlocoStatus } from '../componentes/Blocos';
import {
  BotaoCompacto,
  BotaoPrimario,
  BotaoTexto,
  CartaoEscolha,
} from '../componentes/Controles';
import { CabecalhoGrupo } from '../componentes/Listas';
import { Sheet, SubLinhaSheet } from '../componentes/Sheet';
import { candidatos, melhores, type Candidata } from '../dominio/agenda';
import { hoje } from '../dominio/datas';
import { podeRepor } from '../dominio/politica';
import { avisos, useDados } from '../estado/dados';
import { mesmaJanela, REPOSICAO_INICIAL, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';

/** "Sexta, 29/08" → "sexta, 29/08", para caber no meio da frase do botão. */
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function Reposicao() {
  const { alunoId, ir } = useNavegacao();

  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const politicas = useDados((s) => s.politicas);
  const estenderValidade = useDados((s) => s.estenderValidade);
  const avisar = useToast((s) => s.avisar);

  const [form, atualizar] = useRascunho('reposicao', REPOSICAO_INICIAL);

  const liberada = !!aluno && podeRepor(aluno, politicas);

  const todas = useMemo(
    () => (aluno ? candidatos(aluno, alunos, disponibilidade, hoje()) : []),
    [aluno, alunos, disponibilidade],
  );
  const janelas = melhores(todas);

  // A melhor opção já vem marcada, como na referência C3: o professor só
  // troca se quiser. Uma escolha feita em C4 que não esteja entre as melhores
  // não marca nenhum cartão, mas continua valendo no C6.
  const marcada =
    form.janela === null ? janelas[0] : janelas.find((j) => mesmaJanela(form.janela, j));

  const continuar = () => {
    if (form.janela === null && marcada) {
      atualizar({ janela: { data: marcada.data, hora: marcada.hora } });
    }
    ir('confirmarReposicao');
  };

  const sub = aluno
    ? `${aluno.name} · validade ${aluno.validade} · ${
        politicas.limiteReposicoes === 0
          ? `${aluno.reposicoes} reposições usadas`
          : `${aluno.reposicoes} de ${politicas.limiteReposicoes} reposições usadas`
      }`
    : '';

  return (
    <Sheet
      titulo="Escolher horário"
      rodape={
        liberada && janelas.length > 0 ? (
          <>
            {/* O botão diz o que vai acontecer; "Nenhum serve" é terciário
                e não disputa peso com ele. */}
            <BotaoPrimario
              rotulo={
                marcada ? `Propor ${minuscula(marcada.dia)} às ${marcada.hora}` : 'Continuar'
              }
              desabilitado={!marcada && form.janela === null}
              aoTocar={continuar}
            />
            <BotaoTexto
              rotulo="Nenhum serve · escolher outro"
              aoTocar={() => ir('outroHorario')}
            />
          </>
        ) : undefined
      }
    >
      <SubLinhaSheet passo="Passo 2 de 3" texto={sub} />

      {!liberada ? (
        <BlocoStatus
          tom="ambar"
          titulo="Limite de reposições atingido"
          texto={
            aluno
              ? `${aluno.reposicoes} de ${politicas.limiteReposicoes} usadas neste pacote. Sua política não permite mais.`
              : undefined
          }
          acao={{ rotulo: 'Rever política', aoTocar: () => ir('politica'), variante: 'vidro' }}
          estilo={estilos.bloco}
        />
      ) : janelas.length === 0 ? (
        <BlocoStatus
          tom="ambar"
          titulo="Nenhum horário cabe"
          texto="A agenda até a validade do pacote está cheia. Veja as saídas possíveis."
          acao={{ rotulo: 'Ver saídas', aoTocar: () => ir('semHorario'), variante: 'vidro' }}
          estilo={estilos.bloco}
        />
      ) : (
        <>
          <CabecalhoGrupo
            titulo={`${todas.length} horários possíveis`}
            contagem={`as ${janelas.length} melhores`}
            estilo={estilos.cabecalho}
          />

          <View style={estilos.cartoes}>
            {janelas.map((j) => (
              <CartaoJanela
                key={`${j.data}-${j.hora}`}
                janela={j}
                selecionada={j === marcada}
                aoTocar={() => atualizar({ janela: { data: j.data, hora: j.hora } })}
              />
            ))}
          </View>

          {aluno && !aluno.validadeEstendida ? (
            <BotaoCompacto
              rotulo="Estender validade em 15 dias"
              aoTocar={() => {
                const nova = estenderValidade(aluno.id);
                if (nova) avisar(avisos.validade(nova));
              }}
              estilo={estilos.estender}
            />
          ) : null}
        </>
      )}
    </Sheet>
  );
}

function CartaoJanela({
  janela,
  selecionada,
  aoTocar,
}: {
  janela: Candidata;
  selecionada: boolean;
  aoTocar: () => void;
}) {
  return (
    <CartaoEscolha
      titulo={janela.dia}
      aoLado={janela.hora}
      selo={janela.melhor ? 'Melhor' : undefined}
      subtitulo={janela.razoes.join(' ')}
      selecionado={selecionada}
      aoTocar={aoTocar}
      rotuloAcessivel={`${janela.melhor ? 'Melhor opção. ' : ''}${janela.dia}, ${
        janela.hora
      }. ${janela.razoes.join(' ')}`}
    />
  );
}

const estilos = StyleSheet.create({
  bloco: { marginTop: 16 },
  cabecalho: { marginTop: 16 },
  cartoes: { marginTop: 9, gap: 9 },
  estender: { marginTop: 12 },
});
