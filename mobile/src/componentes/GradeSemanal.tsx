/**
 * Grade de disponibilidade semanal no idioma iOS Glass — **derivada**: o
 * handoff não desenha a tela de disponibilidade, mas quatro telas do app
 * dependem dela (onboarding do professor, disponibilidade do aluno, ajustes
 * e prévia do aluno).
 *
 * Mesma API da grade da direção anterior; o que mudou foi o visual:
 * - célula livre em `preenchimento` (o trilho do sistema), marcada em tint —
 *   a mesma dupla do segmentado e do switch;
 * - raio 9, o do segmento;
 * - rótulos em `tinta3`/`tinta2`, nunca texto pequeno sobre o material.
 *
 * Só toque, sem arrastar: o arraste brigaria com a rolagem do ScrollView.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

/**
 * Largura das células ≥ 44px (alvo mínimo) na tela mais estreita que o app
 * atende, 360dp. A conta, com a lateral de 16 da tela (ou do corpo do sheet)
 * e o `PAD_CARTAO_DA_GRADE` de 8:
 *
 *   interior = 360 − 2 × 16 − 2 × 8 = 312
 *   horário (8–12), 6 dias: (312 − 30 − 6 × 3) ÷ 6 = 44,0
 *   nome (fim da tarde), 5 dias: (312 − 38 − 5 × 3) ÷ 5 = 51,8
 *
 * Em 375pt a grade de 6 dias dá 46,5; em 390 (o aparelho do handoff), 49.
 * O rótulo por nome ("fim da tarde") quebra em duas linhas e pede a coluna
 * mais larga; o de horário cabe em 30.
 */
const COLUNA_HORARIO = 30;
const COLUNA_NOME = 38;
const VAO = 3;

/** Padding do cartão que envolve a grade — o resto da conta acima. */
export const PAD_CARTAO_DA_GRADE = { paddingVertical: 14, paddingHorizontal: 8 } as const;

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
  const { cores } = useCores();
  const legenda = (f: FaixaHoraria) =>
    rotuloDaFaixa === 'nome' ? nomeDaFaixa(f) : horarioDaFaixa(f);

  const corDaCelula = (ligado: boolean) => (ligado ? cores.tint : cores.preenchimento);
  const coluna = { width: rotuloDaFaixa === 'nome' ? COLUNA_NOME : COLUNA_HORARIO };

  return (
    <View style={estilos.grade}>
      <View style={estilos.linha}>
        <View style={coluna} />
        {dias.map((d) => (
          <View key={d} style={estilos.cabecalhoDoDia}>
            <Text style={[texto(10, 600, { tracking: 0.06 }), { color: cores.tinta3 }]}>
              {diaCurto(d)}
            </Text>
          </View>
        ))}
      </View>

      {faixas.map((f) => (
        <View key={f} style={estilos.linhaDeCelulas}>
          <View style={coluna}>
            <Text
              style={[texto(10.5, 500, { altura: 1.2 }), { color: cores.tinta2 }]}
              numberOfLines={2}
            >
              {legenda(f)}
            </Text>
          </View>

          {dias.map((d) => {
            const bloco: BlocoSemanal = { dia: d, faixa: f };
            const ligado = temBloco(marcados, bloco);
            const rotulo = `${nomeDoDia(d)}, ${legenda(f)}, ${ligado ? 'marcado' : 'livre'}`;
            const caixa = {
              flex: 1,
              height: alturaDaCelula,
              borderRadius: RAIO.segmento,
              backgroundColor: corDaCelula(ligado),
            };

            if (somenteLeitura || !aoAlternar) {
              return <View key={d} accessible accessibilityLabel={rotulo} style={caixa} />;
            }

            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ligado }}
                accessibilityLabel={rotulo}
                onPress={() => aoAlternar(bloco)}
                style={({ pressed }) => [caixa, pressed ? { opacity: 0.7 } : null]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Rodapé da grade: resumo à esquerda, nota à direita, separados por um fio. */
export function RodapeDaGrade({
  esquerda,
  direita,
}: {
  esquerda: string;
  direita?: string;
}) {
  const { cores } = useCores();
  return (
    <View style={[estilos.rodape, { borderTopColor: cores.fio }]}>
      <Text style={[texto(11.5, 500, { altura: 1.4 }), { color: cores.tinta2 }]}>{esquerda}</Text>
      {direita ? (
        <Text
          style={[texto(11.5, 500, { altura: 1.4 }), estilos.direita, { color: cores.tinta2 }]}
        >
          {direita}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grade: { gap: VAO },
  linha: { flexDirection: 'row', gap: VAO },
  linhaDeCelulas: { flexDirection: 'row', gap: VAO, alignItems: 'center' },
  cabecalhoDoDia: { flex: 1, alignItems: 'center' },
  direita: { textAlign: 'right' },
  rodape: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
