/** C4 — Escolher outro horário: a agenda inteira, filtrada e por semana. */

import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { EstadoVazio, Radio, RotuloSecao } from '../../componentes/Base';
import { BotaoPrimario, Segmentado } from '../../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../../componentes/Cabecalho';
import { Tela } from '../../componentes/Tela';
import { candidatos, filtrar, porSemana, type Candidata } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import type { FiltroDeAgenda } from '../../dominio/tipos';
import { useDados } from '../../estado/dados';
import { mesmaJanela, REPOSICAO_INICIAL, useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { RAIO, TAMANHO } from '../../tema/tokens';

/** A lista mostra os mais próximos; o resto do horizonte fica de fora. */
const MAXIMO_NA_LISTA = 24;

const FILTROS: { valor: FiltroDeAgenda; rotulo: string }[] = [
  { valor: 'livres', rotulo: 'Livres' },
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'fimDeSemana', rotulo: 'Fim de semana' },
];

export function OutroHorario() {
  const cores = useCores();
  const { alunoId, ir, voltar } = useNavegacao();
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
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Escolher outro horário</TituloTela>
          </View>
          <Text style={[comEspaco(TIPO.corpo, { topo: 6 }), { color: cores.topoFraco }]}>{sub}</Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 12 }}
      rodape={
        <BotaoPrimario
          rotulo="Usar este horário"
          desabilitado={!escolhida}
          aoTocar={() => ir('confirmarReposicao')}
        />
      }
    >
      <Segmentado
        opcoes={FILTROS}
        valor={form.filtro}
        altura={36}
        aoTrocar={(filtro) => atualizar({ filtro, janela: null })}
        rotuloAcessivel="Filtrar horários"
      />

      {semanas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum horário com esse filtro."
          nota="Troque para Todos ou reveja sua disponibilidade."
        />
      ) : (
        semanas.map((semana) => (
          <View key={semana.rotulo} style={{ gap: 8 }}>
            <RotuloSecao>{semana.rotulo}</RotuloSecao>
            {semana.janelas.map((j) => (
              <LinhaDeHorario
                key={`${j.data}-${j.hora}`}
                janela={j}
                selecionada={mesmaJanela(form.janela, j)}
                aoTocar={() => atualizar({ janela: { data: j.data, hora: j.hora } })}
              />
            ))}
          </View>
        ))
      )}
    </Tela>
  );
}

function LinhaDeHorario({
  janela,
  selecionada,
  aoTocar,
}: {
  janela: Candidata;
  selecionada: boolean;
  aoTocar: () => void;
}) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionada }}
      accessibilityLabel={`${janela.dia}, ${janela.hora}. ${janela.motivo}`}
      onPress={aoTocar}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          minHeight: 64,
          paddingVertical: 13,
          paddingHorizontal: 15,
          backgroundColor: cores.cartao,
          borderRadius: RAIO.cartao,
          borderWidth: selecionada ? 1.5 : 1,
          borderColor: selecionada ? cores.texto : cores.linha,
        }}
      >
        <Radio selecionado={selecionada} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={[TIPO.nome, { color: cores.texto }]}>{janela.dia}</Text>
            <Text style={[texto(15, 700, { altura: 1.25 }), { color: cores.texto }]}>
              {janela.hora}
            </Text>
          </View>
          <Text
            style={[comEspaco(texto(12, 400, { altura: 1.45 }), { topo: 4 }), { color: cores.textoMedio }]}
          >
            {janela.motivo}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
