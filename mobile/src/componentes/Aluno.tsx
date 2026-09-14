/** Peças da aba Alunos: cartão, contador, pontos, faixa e linha de extrato. */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { faixaStatus, saldo, saldoBaixo, temPacote } from '../dominio/politica';
import type { Aluno, Lancamento, TipoDeFaixa } from '../dominio/tipos';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

/** Linha 2 do cartão: "{disciplina} · hoje, {hora}" ou "{disciplina} · {dia}, {hora}". */
export function linhaDeHorario(a: Aluno): string {
  if (!a.hora) return `${a.disciplina} · ${a.dia}`;
  return `${a.disciplina} · ${a.hoje ? 'hoje' : a.dia}, ${a.hora}`;
}

/** Linha 3: uso do pacote, ou o encerramento para quem não tem pacote. */
export function linhaDePacote(a: Aluno): string {
  return a.semPacote
    ? `Pacote encerrado em ${a.encerrado}`
    : `${a.usadas} usadas · validade ${a.validade}`;
}

/** Um ponto por aula do pacote. Decorativo: a informação está no contador. */
export function PontosPacote({
  total,
  usadas,
  baixo,
  cresce,
}: {
  total: number;
  usadas: number;
  baixo: boolean;
  cresce?: boolean;
}) {
  const cores = useCores();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', gap: 3 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: cresce ? undefined : 10,
            flex: cresce ? 1 : undefined,
            height: cresce ? 6 : 5,
            borderRadius: 3,
            backgroundColor:
              i < usadas ? cores.linha : baixo ? MARCA.amarelo : cores.texto,
          }}
        />
      ))}
    </View>
  );
}

const CORES_DA_FAIXA: Record<
  TipoDeFaixa,
  (c: ReturnType<typeof useCores>) => { fundo: string; tinta: string }
> = {
  pausado: (c) => ({ fundo: c.caixa, tinta: c.textoMedio }),
  atraso: (c) => ({ fundo: c.vermelho, tinta: c.tintaSobreVermelho }),
  pendente: () => ({ fundo: MARCA.amarelo, tinta: MARCA.tintaSobreAmarelo }),
  marcada: (c) => ({ fundo: c.caixa, tinta: c.textoMedio }),
};

export function FaixaStatus({ aluno }: { aluno: Aluno }) {
  const cores = useCores();
  const faixa = faixaStatus(aluno);
  if (!faixa) return null;

  const { fundo, tinta } = CORES_DA_FAIXA[faixa.tipo](cores);

  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: fundo,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <Text
        style={[texto(10, 600, { altura: 1.2, tracking: 0.14, maiuscula: true }), { color: tinta }]}
      >
        {faixa.texto}
      </Text>
      <Text
        style={[texto(10, 600, { altura: 1.2, tracking: 0.14, maiuscula: true }), { color: tinta }]}
      >
        {faixa.sufixo}
      </Text>
    </View>
  );
}

/** Cartão de aluno da home. O cartão inteiro é tocável. */
export function CartaoAluno({ aluno, aoTocar }: { aluno: Aluno; aoTocar: () => void }) {
  const cores = useCores();
  const com = temPacote(aluno);
  const restam = saldo(aluno);
  const baixo = saldoBaixo(aluno);
  const faixa = faixaStatus(aluno);

  const rotulo = [
    aluno.name,
    faixa ? `${faixa.texto}, ${faixa.sufixo}` : null,
    com ? `${restam} aulas restantes de ${aluno.total}` : 'sem pacote',
    linhaDeHorario(aluno),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} onPress={aoTocar}>
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: cores.cartao,
            borderRadius: RAIO.cartao,
            overflow: 'hidden',
            borderWidth: 1,
            borderStyle: com ? 'solid' : 'dashed',
            borderColor: pressed ? cores.suave : com ? cores.linha : cores.fraco,
          }}
        >
          <FaixaStatus aluno={aluno} />
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, paddingVertical: 13, paddingHorizontal: 14, minWidth: 0 }}>
              <Text
                style={[
                  texto(15.5, 600, { altura: 1.2 }),
                  { color: com ? cores.texto : cores.textoMedio },
                ]}
              >
                {aluno.name}
              </Text>
              <Text style={[comEspaco(TIPO.legenda, { topo: 4 }), { color: cores.textoMedio }]}>
                {linhaDeHorario(aluno)}
              </Text>
              {com ? (
                <View style={{ marginTop: 10 }}>
                  <PontosPacote total={aluno.total} usadas={aluno.usadas} baixo={baixo} />
                </View>
              ) : null}
              <Text
                style={[
                  comEspaco(texto(11.5, 400, { altura: 1 }), { topo: 9 }),
                  { color: cores.textoMedio },
                ]}
              >
                {linhaDePacote(aluno)}
              </Text>
            </View>

            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                minWidth: 76,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: com ? cores.elevado : cores.caixa,
                borderLeftWidth: com ? 0 : 1,
                borderLeftColor: cores.fraco,
                borderStyle: com ? 'solid' : 'dashed',
              }}
            >
              <Text
                style={[
                  texto(24, 800, { altura: 0.9, tracking: -0.04 }),
                  { color: !com ? cores.fraco : baixo ? MARCA.amarelo : cores.topoTexto },
                ]}
              >
                {com ? String(restam) : '—'}
              </Text>
              <Text
                style={[
                  comEspaco(texto(8.5, 600, { altura: 1.15, tracking: 0.16, maiuscula: true }), {
                    topo: 5,
                  }),
                  // Sobre `elevado`, elevadoSuave passa nos dois temas (topoFraco
                  // dava 4.1:1 no noturno); sem pacote o fundo é claro (caixa).
                  { color: com ? cores.elevadoSuave : cores.textoMedio, textAlign: 'center' },
                ]}
              >
                {com ? 'aulas' : 'sem pacote'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** Caixa de contador usada na escolha de aluno da tela Registrar. */
export function ContadorSaldo({ numero }: { numero: string }) {
  const cores = useCores();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 11,
        backgroundColor: cores.caixa,
        borderRadius: RAIO.contador,
      }}
    >
      <Text style={[TIPO.saldo, { color: cores.texto }]}>{numero}</Text>
      <Text
        style={[
          texto(10, 600, { altura: 1, tracking: 0.14, maiuscula: true }),
          { color: cores.textoMedio },
        ]}
      >
        aulas
      </Text>
    </View>
  );
}

/** Alternativa em texto para o delta — cor não pode ser o único sinal. */
function deltaEmPalavras(l: Lancamento): string {
  if (l.dinheiro) return 'pagamento recebido';
  if (l.delta < 0) return `${Math.abs(l.delta)} aula debitada`;
  if (l.delta > 0) return `${l.delta} aulas adicionadas`;
  return 'sem efeito no saldo';
}

export function LinhaExtrato({ lancamento, ultima }: { lancamento: Lancamento; ultima?: boolean }) {
  const cores = useCores();

  const cor = lancamento.dinheiro
    ? cores.verde
    : lancamento.delta < 0
      ? cores.vermelho
      : lancamento.delta > 0
        ? cores.texto
        : cores.verde;

  const deltaTexto = lancamento.dinheiro
    ? '✓'
    : lancamento.delta > 0
      ? `+${lancamento.delta}`
      : String(lancamento.delta);

  const saldoTexto = lancamento.dinheiro ? 'recebido' : `saldo ${lancamento.saldo}`;

  return (
    <View
      accessible
      accessibilityLabel={`${lancamento.d}. ${lancamento.t}. ${lancamento.s}. ${deltaEmPalavras(
        lancamento,
      )}. ${saldoTexto}.`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderBottomWidth: ultima ? 0 : 1,
        borderBottomColor: cores.linha,
      }}
    >
      <Text style={[texto(11, 500, { altura: 1.3 }), { width: 36, color: cores.textoMedio }]}>
        {lancamento.d}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          {lancamento.t}
        </Text>
        <Text style={[comEspaco(TIPO.nota, { topo: 3 }), { color: cores.textoMedio }]}>{lancamento.s}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[texto(13.5, 700, { altura: 1 }), { color: cor }]}>{deltaTexto}</Text>
        <Text
          style={[comEspaco(texto(11, 400, { altura: 1 }), { topo: 4 }), { color: cores.textoMedio }]}
        >
          {saldoTexto}
        </Text>
      </View>
    </View>
  );
}
