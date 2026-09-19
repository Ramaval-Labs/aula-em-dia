/**
 * C4 — Escolher outro horário: a agenda inteira, filtrada e por semana.
 *
 * Derivada: modelo §5 (sub-linha + cartões de escolha), com o segmentado de
 * filtro no topo e um cabeçalho de grupo por semana.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { EstadoVazio } from '../../componentes/Blocos';
import { BotaoPrimario, CartaoEscolha, Segmentado } from '../../componentes/Controles';
import { CabecalhoGrupo, ListaAgrupada } from '../../componentes/Listas';
import { Sheet, SubLinhaSheet } from '../../componentes/Sheet';
import { candidatos, filtrar, porSemana } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import type { FiltroDeAgenda } from '../../dominio/tipos';
import { useDados } from '../../estado/dados';
import { mesmaJanela, REPOSICAO_INICIAL, useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';

/** A lista mostra os mais próximos; o resto do horizonte fica de fora. */
const MAXIMO_NA_LISTA = 24;

const FILTROS: { valor: FiltroDeAgenda; rotulo: string }[] = [
  { valor: 'livres', rotulo: 'Livres' },
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'fimDeSemana', rotulo: 'Fim de semana' },
];

export function OutroHorario() {
  const { alunoId, ir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);

  const [form, atualizar] = useRascunho('reposicao', REPOSICAO_INICIAL);

  const lista = useMemo(
    () => (aluno ? candidatos(aluno, alunos, disponibilidade, hoje()) : []),
    [aluno, alunos, disponibilidade],
  );
  const visiveis = filtrar(lista, form.filtro);
  const mostradas = visiveis.slice(0, MAXIMO_NA_LISTA);
  const semanas = porSemana(mostradas);
  // Pela identidade, não pelo índice: o C6 monta outra lista.
  const escolhida = visiveis.find((c) => mesmaJanela(form.janela, c)) ?? null;

  const sub =
    visiveis.length > MAXIMO_NA_LISTA
      ? `Os ${MAXIMO_NA_LISTA} mais próximos de ${lista.length} horários possíveis`
      : `${lista.length} horários possíveis até a validade do pacote`;

  return (
    <Sheet
      titulo="Escolher outro horário"
      rodape={
        <BotaoPrimario
          rotulo="Usar este horário"
          desabilitado={!escolhida}
          aoTocar={() => ir('confirmarReposicao')}
        />
      }
    >
      <SubLinhaSheet texto={sub} />

      <Segmentado
        opcoes={FILTROS}
        valor={form.filtro}
        aoTrocar={(filtro) => atualizar({ filtro, janela: null })}
        rotuloDoGrupo="Filtrar horários"
        estilo={estilos.filtro}
      />

      {semanas.length === 0 ? (
        <ListaAgrupada estilo={estilos.vazio}>
          <EstadoVazio
            titulo="Nenhum horário com esse filtro."
            nota="Troque para Todos ou reveja sua disponibilidade."
          />
        </ListaAgrupada>
      ) : (
        semanas.map((semana) => (
          <View key={semana.rotulo} style={estilos.grupo}>
            <CabecalhoGrupo titulo={semana.rotulo} />
            <View style={estilos.cartoes}>
              {semana.janelas.map((j) => (
                <CartaoEscolha
                  key={`${j.data}-${j.hora}`}
                  titulo={j.dia}
                  aoLado={j.hora}
                  subtitulo={j.motivo}
                  selecionado={mesmaJanela(form.janela, j)}
                  aoTocar={() => atualizar({ janela: { data: j.data, hora: j.hora } })}
                  rotuloAcessivel={`${j.dia}, ${j.hora}. ${j.motivo}`}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  filtro: { marginTop: 14 },
  vazio: { marginTop: 16 },
  grupo: { marginTop: 22 },
  cartoes: { marginTop: 9, gap: 9 },
});
