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
import { REPOSICAO_INICIAL, useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useCores } from '../../tema/TemaProvider';
import { texto, TIPO } from '../../tema/tipografia';
import { RAIO } from '../../tema/tokens';

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
  const semanas = porSemana(visiveis.slice(0, 24));
  const escolhida = form.janela !== null ? visiveis[form.janela] : null;

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Escolher outro horário</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.suave }]}>
            {`${lista.length} horários possíveis até a validade do pacote`}
          </Text>
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
                selecionada={escolhida?.data === j.data && escolhida?.hora === j.hora}
                aoTocar={() =>
                  atualizar({
                    janela: visiveis.findIndex(
                      (x) => x.data === j.data && x.hora === j.hora,
                    ),
                  })
                }
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
      accessibilityState={{ selected: selecionada }}
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
            style={[texto(12, 400, { altura: 1.45 }), { marginTop: 4, color: cores.suave }]}
          >
            {janela.motivo}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
