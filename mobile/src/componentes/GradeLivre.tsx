/**
 * Grade de horários livres no idioma iOS Glass (SCRUM-101) — **derivada**: o
 * handoff não desenha a tela de disponibilidade. Substitui a grade de quatro
 * faixas nas cinco telas que dependem dela (onboarding do professor, Minha
 * disponibilidade, disponibilidade do aluno no assistente, prévia do aluno e
 * a página do link).
 *
 * Uma coluna por dia e o dia em linhas de 15 minutos, como uma agenda:
 * - o trilho é `preenchimento` e o horário marcado é tint, a mesma dupla da
 *   grade de antes, do segmentado e do switch;
 * - **toque** marca ou apaga a hora cheia sob o dedo;
 * - **segure e arraste** pinta de 15 em 15 minutos; começar num horário já
 *   marcado apaga. O arrasto rápido continua rolando a página: só o toque
 *   longo trava a rolagem (`travaDaRolagem.ts`).
 *
 * O leitor de tela não arrasta. O caminho dele é a `ListaDeHorarios`, que mora
 * sob a grade e lista, remove e acrescenta horários pelo teclado — e serve de
 * acerto fino para quem vê.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';

import {
  diaCurto,
  DIAS_DA_SEMANA,
  FIM_DO_DIA,
  formatarHora,
  formatarIntervalo,
  INICIO_DO_DIA,
  intervaloDigitado,
  livreEm,
  nomeDoDia,
  PASSO_MINUTOS,
  pintar,
  removerIntervalo,
  resumoDosHorarios,
} from '../dominio/disponibilidade';
import type { DiaDaSemana, Intervalo } from '../dominio/tipos';
import { ALVO_MINIMO } from '../tema/alvoDeToque';
import { useCores } from '../tema/TemaProvider';
import { texto } from '../tema/tipografia';
import { ESCALA_FONTE, PAD, RAIO } from '../tema/tokens';
import { CartaoVidro, EstadoVazio } from './Blocos';
import { CampoDeTexto } from './Campos';
import { BotaoInline, BotaoSecundario, BotaoTexto, Segmentado } from './Controles';
import { LinhaLista, ListaAgrupada } from './Listas';
import { useTravaDaRolagem } from './travaDaRolagem';

/**
 * Uma hora da grade tem a altura do alvo mínimo (44, ou 48 no Android), para
 * o toque que marca a hora cheia; cada linha de 15 minutos é um quarto dela.
 */
const ALTURA_DA_HORA = ALVO_MINIMO;
const ALTURA_DO_QUARTO = ALTURA_DA_HORA / (60 / PASSO_MINUTOS);
/** A coluna dos rótulos "14h": dois dígitos e o h, a 10,5px. */
const COLUNA_DAS_HORAS = 30;
const VAO = 3;
/** Quanto o dedo fica parado para o toque virar arrasto. */
const ESPERA_DO_ARRASTO = 250;
/** Quanto o dedo pode tremer antes de virar rolagem. */
const TOLERANCIA = 8;

/** Padding do cartão que envolve a grade. */
export const PAD_CARTAO_DA_GRADE = PAD.cartaoDaGrade;

interface Arrasto {
  dia: DiaDaSemana;
  de: number;
  ate: number;
  ligar: boolean;
}

/** O trecho que o arrasto cobre, já em ordem e com a última linha inteira. */
const trechoDo = (a: Arrasto) => ({
  inicio: Math.min(a.de, a.ate),
  fim: Math.max(a.de, a.ate) + PASSO_MINUTOS,
});

/** Só na web: sem seleção de texto nem o menu do toque longo do Safari. */
const SEM_SELECAO = (Platform.OS === 'web'
  ? { userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'pan-y' }
  : {}) as unknown as ViewStyle;

export function GradeLivre({
  horarios,
  aoMudar,
  dias = DIAS_DA_SEMANA,
  de = INICIO_DO_DIA,
  ate = FIM_DO_DIA,
  somenteLeitura = false,
}: {
  horarios: Intervalo[];
  aoMudar?: (horarios: Intervalo[]) => void;
  dias?: DiaDaSemana[];
  /** o começo e o fim do dia que a grade mostra, em minutos */
  de?: number;
  ate?: number;
  somenteLeitura?: boolean;
}) {
  const { cores } = useCores();
  const travar = useTravaDaRolagem((s) => s.travar);
  const editavel = !somenteLeitura && !!aoMudar;

  const [largura, setLargura] = useState(0);
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);

  // O que os manipuladores do toque leem sem esperar o próximo render.
  const atuais = useRef(horarios);
  atuais.current = horarios;
  const toque = useRef<{
    x0: number;
    y0: number;
    origemX: number;
    origemY: number;
    dia: DiaDaSemana;
    minuto: number;
    movido: boolean;
    arrasto: Arrasto | null;
    espera: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  // Desmontar no meio do arrasto não deixa a rolagem presa.
  useEffect(
    () => () => {
      if (toque.current?.espera) clearTimeout(toque.current.espera);
      travar(false);
    },
    [travar],
  );

  const horas: number[] = [];
  for (let m = Math.ceil(de / 60) * 60; m < ate; m += 60) horas.push(m);
  const altura = ((ate - de) / PASSO_MINUTOS) * ALTURA_DO_QUARTO;
  const larguraDaColuna = largura
    ? (largura - COLUNA_DAS_HORAS - VAO * dias.length) / dias.length
    : 0;

  /** O dia e a linha sob o ponto, ou `null` fora das colunas. */
  const celulaEm = (x: number, y: number): { dia: DiaDaSemana; minuto: number } | null => {
    if (!larguraDaColuna) return null;
    const i = Math.floor((x - COLUNA_DAS_HORAS - VAO) / (larguraDaColuna + VAO));
    if (i < 0 || i >= dias.length) return null;
    return { dia: dias[i], minuto: minutoEm(y) };
  };
  const minutoEm = (y: number) => {
    const linha = Math.floor(y / ALTURA_DO_QUARTO);
    return Math.min(Math.max(de + linha * PASSO_MINUTOS, de), ate - PASSO_MINUTOS);
  };

  const soltar = () => {
    if (toque.current?.espera) clearTimeout(toque.current.espera);
    toque.current = null;
    setArrasto(null);
    travar(false);
  };

  const aoComecar = (e: GestureResponderEvent) => {
    const { pageX, pageY, locationX, locationY } = e.nativeEvent;
    const celula = celulaEm(locationX, locationY);
    if (!celula) return;
    const t = {
      x0: pageX,
      y0: pageY,
      // Os filhos não recebem toque: a origem do `location` é a da grade.
      origemX: pageX - locationX,
      origemY: pageY - locationY,
      ...celula,
      movido: false,
      arrasto: null as Arrasto | null,
      espera: null as ReturnType<typeof setTimeout> | null,
    };
    t.espera = setTimeout(() => {
      if (toque.current !== t || t.movido) return;
      t.arrasto = {
        dia: t.dia,
        de: t.minuto,
        ate: t.minuto,
        ligar: !livreEm(atuais.current, t.dia, t.minuto),
      };
      travar(true);
      setArrasto(t.arrasto);
    }, ESPERA_DO_ARRASTO);
    toque.current = t;
  };

  const aoMover = (e: GestureResponderEvent) => {
    const t = toque.current;
    if (!t) return;
    const { pageX, pageY } = e.nativeEvent;
    if (!t.arrasto) {
      if (Math.abs(pageX - t.x0) > TOLERANCIA || Math.abs(pageY - t.y0) > TOLERANCIA) {
        t.movido = true;
      }
      return;
    }
    const minuto = minutoEm(pageY - t.origemY);
    if (minuto !== t.arrasto.ate) {
      t.arrasto = { ...t.arrasto, ate: minuto };
      setArrasto(t.arrasto);
    }
  };

  const aoTerminar = () => {
    const t = toque.current;
    if (t && aoMudar) {
      if (t.arrasto) {
        const { inicio, fim } = trechoDo(t.arrasto);
        aoMudar(pintar(atuais.current, t.dia, inicio, fim, t.arrasto.ligar));
      } else if (!t.movido) {
        // O toque marca, ou apaga, a hora cheia sob o dedo.
        const hora = Math.max(Math.floor(t.minuto / 60) * 60, de);
        const ligar = !livreEm(atuais.current, t.dia, t.minuto);
        aoMudar(pintar(atuais.current, t.dia, hora, Math.min(hora + 60, ate), ligar));
      }
    }
    soltar();
  };

  const responder = editavel
    ? {
        onStartShouldSetResponder: () => true,
        // Pintando, o arrasto é da grade; antes disso, a rolagem pode levar.
        onResponderTerminationRequest: () => !toque.current?.arrasto,
        onResponderGrant: aoComecar,
        onResponderMove: aoMover,
        onResponderRelease: aoTerminar,
        onResponderTerminate: soltar,
      }
    : {};

  const topo = (m: number) => ((m - de) / PASSO_MINUTOS) * ALTURA_DO_QUARTO;
  const previa = arrasto ? trechoDo(arrasto) : null;

  return (
    <View style={estilos.grade}>
      <View style={estilos.linha}>
        <View style={{ width: COLUNA_DAS_HORAS }} />
        {dias.map((d) => (
          <View key={d} style={estilos.cabecalhoDoDia}>
            <Text style={[texto(10, 600, { tracking: 0.06 }), { color: cores.tinta3 }]}>
              {diaCurto(d)}
            </Text>
          </View>
        ))}
      </View>

      {editavel ? (
        <Text
          accessibilityLiveRegion="polite"
          maxFontSizeMultiplier={ESCALA_FONTE.compacta}
          style={[texto(11.5, 500, { altura: 1.4 }), { color: arrasto ? cores.tint : cores.tinta2 }]}
        >
          {arrasto && previa
            ? `${arrasto.ligar ? 'Marcar' : 'Apagar'} ${nomeDoDia(arrasto.dia).toLowerCase()}, ${formatarIntervalo(previa)}`
            : 'Toque marca uma hora. Segure e arraste para marcar de 15 em 15 min.'}
        </Text>
      ) : null}

      <View
        {...responder}
        accessible
        accessibilityLabel={`Grade da semana: ${resumoDosHorarios(horarios)}.`}
        accessibilityHint={editavel ? 'Ajuste os horários na lista abaixo da grade.' : undefined}
        onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}
        style={[estilos.linha, { height: altura }, editavel ? SEM_SELECAO : null]}
      >
        <View pointerEvents="none" style={{ width: COLUNA_DAS_HORAS, height: altura }}>
          {horas.map((m) => (
            <Text
              key={m}
              maxFontSizeMultiplier={ESCALA_FONTE.compacta}
              style={[
                texto(10.5, 500, { altura: 1.2 }),
                estilos.rotuloDaHora,
                // o rótulo centra no fio da hora; o primeiro encosta no topo
                { top: Math.max(topo(m) - 6, 0), color: cores.tinta3 },
              ]}
            >
              {formatarHora(m)}
            </Text>
          ))}
        </View>

        {dias.map((dia) => (
          <View
            key={dia}
            pointerEvents="none"
            style={[estilos.coluna, { height: altura, backgroundColor: cores.preenchimento }]}
          >
            {horas
              .filter((m) => m > de)
              .map((m) => (
                <View
                  key={m}
                  style={[estilos.fio, { top: topo(m), backgroundColor: cores.fio }]}
                />
              ))}

            {horarios
              .filter((i) => i.dia === dia && i.fim > de && i.inicio < ate)
              .map((i) => {
                const inicio = Math.max(i.inicio, de);
                const fim = Math.min(i.fim, ate);
                const alto = topo(fim) - topo(inicio);
                return (
                  <View
                    key={`${i.inicio}-${i.fim}`}
                    style={[
                      estilos.marcado,
                      { top: topo(inicio), height: alto, backgroundColor: cores.tint },
                    ]}
                  >
                    {alto >= ALTURA_DO_QUARTO * 2 ? (
                      <Text
                        numberOfLines={alto >= ALTURA_DA_HORA ? 2 : 1}
                        maxFontSizeMultiplier={ESCALA_FONTE.compacta}
                        style={[texto(10, 600, { altura: 1.2 }), { color: cores.sobreTint }]}
                      >
                        {alto >= ALTURA_DA_HORA
                          ? `${formatarHora(i.inicio)}\n${formatarHora(i.fim)}`
                          : formatarHora(i.inicio)}
                      </Text>
                    ) : null}
                  </View>
                );
              })}

            {arrasto && previa && arrasto.dia === dia ? (
              <View
                style={[
                  estilos.marcado,
                  estilos.previa,
                  {
                    top: topo(previa.inicio),
                    height: topo(previa.fim) - topo(previa.inicio),
                    borderColor: cores.tint,
                    backgroundColor: arrasto.ligar ? cores.tintSuave : cores.preenchimento2,
                  },
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** "1430" → "14:30": o teclado numérico do iOS não tem dois-pontos. */
export const mascaraDeHorario = (v: string): string => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

/**
 * Os horários marcados, um por linha ("Segunda · 14h30–18h", com Remover), e
 * o formulário que acrescenta um pelo teclado. É o caminho do leitor de tela
 * e o acerto fino de quem pinta na grade.
 */
export function ListaDeHorarios({
  horarios,
  aoMudar,
  dias = DIAS_DA_SEMANA,
  vazio = 'Nenhum horário marcado',
}: {
  horarios: Intervalo[];
  aoMudar: (horarios: Intervalo[]) => void;
  dias?: DiaDaSemana[];
  vazio?: string;
}) {
  const [abrindo, setAbrindo] = useState(false);
  const [dia, setDia] = useState<DiaDaSemana>(dias[0]);
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [erro, setErro] = useState<{ texto: string; campo: 'de' | 'ate' } | null>(null);

  const fechar = () => {
    setAbrindo(false);
    setDe('');
    setAte('');
    setErro(null);
  };

  const adicionar = () => {
    const lido = intervaloDigitado(dia, de, ate);
    if ('erro' in lido) {
      setErro({ texto: lido.erro, campo: lido.campo });
      return;
    }
    aoMudar(pintar(horarios, lido.intervalo.dia, lido.intervalo.inicio, lido.intervalo.fim, true));
    fechar();
  };

  return (
    <View style={estilos.lista}>
      <ListaAgrupada>
        {horarios.length === 0 ? (
          <EstadoVazio titulo={vazio} />
        ) : (
          horarios.map((i) => (
            <LinhaLista
              key={`${i.dia}-${i.inicio}`}
              titulo={nomeDoDia(i.dia)}
              subtitulo={formatarIntervalo(i)}
              direita={
                <BotaoInline
                  rotulo="Remover"
                  variante="vidro"
                  rotuloAcessivel={`Remover ${nomeDoDia(i.dia).toLowerCase()}, ${formatarIntervalo(i)}`}
                  aoTocar={() => aoMudar(removerIntervalo(horarios, i))}
                />
              }
            />
          ))
        )}
      </ListaAgrupada>

      {abrindo ? (
        <CartaoVidro estilo={estilos.formulario}>
          <Segmentado
            rotuloDoGrupo="Dia"
            porte="cartao"
            opcoes={dias.map((d) => ({ valor: d, rotulo: diaCurto(d) }))}
            valor={dia}
            aoTrocar={setDia}
          />
          <View style={estilos.campos}>
            <CampoDeTexto
              rotulo="De"
              valor={de}
              aoMudar={(v) => {
                setDe(mascaraDeHorario(v));
                setErro(null);
              }}
              placeholder="14:30"
              teclado="numerico"
              erro={erro?.campo === 'de' ? erro.texto : undefined}
              autoFoco
              estilo={estilos.flexivel}
            />
            <CampoDeTexto
              rotulo="Até"
              valor={ate}
              aoMudar={(v) => {
                setAte(mascaraDeHorario(v));
                setErro(null);
              }}
              placeholder="18:00"
              teclado="numerico"
              erro={erro?.campo === 'ate' ? erro.texto : undefined}
              aoEnviar={adicionar}
              estilo={estilos.flexivel}
            />
          </View>
          <BotaoSecundario rotulo="Adicionar" aoTocar={adicionar} desabilitado={!de || !ate} />
          <BotaoTexto rotulo="Cancelar" aoTocar={fechar} />
        </CartaoVidro>
      ) : (
        <BotaoSecundario rotulo="Adicionar horário" aoTocar={() => setAbrindo(true)} />
      )}
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
  grade: { gap: 8 },
  linha: { flexDirection: 'row', gap: VAO },
  cabecalhoDoDia: { flex: 1, alignItems: 'center' },
  rotuloDaHora: { position: 'absolute', left: 0 },
  coluna: { flex: 1, borderRadius: RAIO.segmento, overflow: 'hidden' },
  fio: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  marcado: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: RAIO.segmento,
    paddingHorizontal: 4,
    paddingTop: 3,
    overflow: 'hidden',
  },
  previa: { borderWidth: 1.5 },
  lista: { gap: 12 },
  formulario: { gap: 16 },
  campos: { flexDirection: 'row', gap: 12 },
  flexivel: { flex: 1, minWidth: 0 },
  direita: { textAlign: 'right' },
  rodape: {
    marginTop: 13,
    ...PAD.rodapeDoCartao,
    borderTopWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
