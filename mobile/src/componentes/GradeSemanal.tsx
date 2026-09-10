/**
 * Grade de disponibilidade semanal.
 *
 * O componente de maior alavancagem da expansão: serve quatro telas do
 * handoff — A5 (onboarding do professor), C2 (disponibilidade do aluno),
 * E3 (ajustes) e F3 (prévia do aluno). Por isso os dias e o estilo de rótulo
 * das faixas vêm de fora: o professor lê "8–12", o aluno lê "manhã".
 *
 * Só toque, sem arrastar. O arraste do mock brigaria com o gesto de rolagem
 * do ScrollView e vale como melhoria separada.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  diaCurto,
  DIAS_DA_SEMANA,
  FAIXAS_HORARIAS,
  horarioDaFaixa,
  nomeDaFaixa,
  nomeDoDia,
  temBloco,
} from '../dominio/disponibilidade';
import type { BlocoSemanal, DiaDaSemana, FaixaHoraria } from '../dominio/tipos';
import { useCores } from '../tema/TemaProvider';
import { texto } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';

/** Largura da coluna de rótulos, à esquerda da grade. */
const COLUNA_DE_ROTULOS = 44;

export function GradeSemanal({
  marcados,
  aoAlternar,
  dias = DIAS_DA_SEMANA,
  faixas = FAIXAS_HORARIAS,
  /** "horario" mostra 8–12; "nome" mostra manhã */
  rotuloDaFaixa = 'horario',
  alturaDaCelula = 44,
  somenteLeitura = false,
}: {
  marcados: BlocoSemanal[];
  aoAlternar?: (bloco: BlocoSemanal) => void;
  dias?: DiaDaSemana[];
  faixas?: FaixaHoraria[];
  rotuloDaFaixa?: 'horario' | 'nome';
  alturaDaCelula?: number;
  somenteLeitura?: boolean;
}) {
  const cores = useCores();
  const legenda = (f: FaixaHoraria) =>
    rotuloDaFaixa === 'nome' ? nomeDaFaixa(f) : horarioDaFaixa(f);

  return (
    <View style={{ gap: 5 }}>
      {/* cabeçalho de colunas */}
      <View style={{ flexDirection: 'row', gap: 5 }}>
        <View style={{ width: COLUNA_DE_ROTULOS }} />
        {dias.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={[
                texto(10, 600, { altura: 1, tracking: 0.06 }),
                { color: cores.suave },
              ]}
            >
              {diaCurto(d)}
            </Text>
          </View>
        ))}
      </View>

      {faixas.map((f) => (
        <View key={f} style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          <View style={{ width: COLUNA_DE_ROTULOS }}>
            <Text
              style={[texto(10.5, 500, { altura: 1.2 }), { color: cores.suave }]}
              numberOfLines={1}
            >
              {legenda(f)}
            </Text>
          </View>

          {dias.map((d) => {
            const bloco: BlocoSemanal = { dia: d, faixa: f };
            const ligado = temBloco(marcados, bloco);
            const rotulo = `${nomeDoDia(d)}, ${legenda(f)}, ${
              ligado ? 'marcado' : 'livre'
            }`;

            if (somenteLeitura || !aoAlternar) {
              return (
                <View
                  key={d}
                  accessible
                  accessibilityLabel={rotulo}
                  style={{
                    flex: 1,
                    height: alturaDaCelula,
                    borderRadius: RAIO.contador,
                    backgroundColor: ligado ? cores.texto : cores.caixa,
                  }}
                />
              );
            }

            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ligado }}
                accessibilityLabel={rotulo}
                onPress={() => aoAlternar(bloco)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: alturaDaCelula,
                  borderRadius: RAIO.contador,
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: ligado ? cores.texto : cores.caixa,
                })}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Rodapé da grade: resumo à esquerda, nota à direita. */
export function RodapeDaGrade({
  esquerda,
  direita,
}: {
  esquerda: string;
  direita?: string;
}) {
  const cores = useCores();
  return (
    <View
      style={{
        marginTop: 13,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: cores.linha,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Text style={[texto(11.5, 400, { altura: 1.4 }), { color: cores.suave }]}>
        {esquerda}
      </Text>
      {direita ? (
        <Text
          style={[
            texto(11.5, 400, { altura: 1.4 }),
            { color: cores.suave, textAlign: 'right' },
          ]}
        >
          {direita}
        </Text>
      ) : null}
    </View>
  );
}
