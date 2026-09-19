/**
 * Controles do iOS Glass: botões, segmentado, switch, stepper e cartão de
 * escolha (handoff-ios-glass/README.md, seções "Botões", "Controle
 * segmentado", "Cartão de escolha (radio)", "Switch" e "Stepper").
 *
 * Toda medida sai de `RAIO`/`TAMANHO`; toda cor, de `useCores()`.
 * Vidro só por `SuperficieVidro`.
 *
 * **Pressionado.** O handoff descreve *hover* de mouse (`brightness(1.07)`),
 * que não existe no toque e não tem equivalente direto no React Native. Aqui
 * o retorno de toque é escurecimento por opacidade, como o resto do iOS.
 *
 * **Alvo de toque.** Peças mais baixas que 44px (inline de 40, segmento de
 * 34/36/30, switch de 32, stepper de 34) recebem `hitSlop` até fechar os
 * 44px de `spec/acessibilidade.md`.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { duracao, useReduzirMovimento } from '../tema/movimento';
import { MOVIMENTO, RAIO, TAMANHO } from '../tema/tokens';
import { useAnuncio } from './anunciar';
import { Icone, type NomeDeIcone } from './Icone';
import { SuperficieVidro } from './Vidro';

/** Opacidade do pressionado — substitui o `brightness(1.07)` do hover CSS. */
const OPACIDADE_PRESSIONADO = 0.86;

/**
 * Fecha os 44px do alvo de toque em peças mais baixas — e, com `largura`, nas
 * mais estreitas também.
 */
function folgaDeToque(altura: number, largura?: number) {
  const falta = Math.max(0, TAMANHO.alvoMinimo - altura) / 2;
  const lado = largura === undefined ? 0 : Math.max(0, TAMANHO.alvoMinimo - largura) / 2;
  return { top: falta, bottom: falta, left: lado, right: lado };
}

type Comum = {
  rotulo: string;
  aoTocar: () => void;
  desabilitado?: boolean;
  /** rótulo do leitor de tela quando o texto do botão não basta */
  rotuloAcessivel?: string;
  estilo?: StyleProp<ViewStyle>;
};

/* ── Botões ───────────────────────────────────────────────────────────── */

/**
 * Ação principal da tela — **uma por tela**. 54px, raio 18, fundo tint com a
 * sombra colorida (`tintSombra`). Desabilitado troca para `preenchimento2` e
 * `tinta3`, sem sombra.
 */
export function BotaoPrimario({
  rotulo,
  aoTocar,
  desabilitado = false,
  icone,
  rotuloAcessivel,
  estilo,
}: Comum & { icone?: NomeDeIcone }) {
  const { cores, material } = useCores();
  const tinta = desabilitado ? cores.tinta3 : cores.sobreTint;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        estilos.botaoPrimario,
        {
          backgroundColor: desabilitado ? cores.preenchimento2 : cores.tint,
          opacity: pressed ? OPACIDADE_PRESSIONADO : 1,
        },
        desabilitado
          ? null
          : { boxShadow: `${material.gin}, 0px 10px 26px ${cores.tintSombra}` },
        estilo,
      ]}
    >
      {icone ? <Icone nome={icone} tamanho={TAMANHO.iconeMais} cor={tinta} /> : null}
      <Text style={[TIPO.botao, { color: tinta }]} numberOfLines={1}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

/** Ação secundária de largura cheia: 52px, raio 18, vidro2 com borda. */
export function BotaoSecundario({
  rotulo,
  aoTocar,
  desabilitado = false,
  icone,
  rotuloAcessivel,
  estilo,
}: Comum & { icone?: NomeDeIcone }) {
  return (
    <BotaoDeVidro
      rotulo={rotulo}
      aoTocar={aoTocar}
      desabilitado={desabilitado}
      icone={icone}
      rotuloAcessivel={rotuloAcessivel}
      estilo={estilo}
      altura={TAMANHO.botaoSecundario}
      raio={RAIO.botao}
      tipografia={texto(16, 700, { tracking: -0.015 })}
    />
  );
}

/** Secundário compacto: 50px, raio 17, texto 14.5/600. */
export function BotaoCompacto({
  rotulo,
  aoTocar,
  desabilitado = false,
  icone,
  rotuloAcessivel,
  estilo,
}: Comum & { icone?: NomeDeIcone }) {
  return (
    <BotaoDeVidro
      rotulo={rotulo}
      aoTocar={aoTocar}
      desabilitado={desabilitado}
      icone={icone}
      rotuloAcessivel={rotuloAcessivel}
      estilo={estilo}
      altura={TAMANHO.botaoCompacto}
      raio={RAIO.botaoCompacto}
      tipografia={texto(14.5, 600)}
      semDesfoque
    />
  );
}

function BotaoDeVidro({
  rotulo,
  aoTocar,
  desabilitado,
  icone,
  rotuloAcessivel,
  estilo,
  altura,
  raio,
  tipografia,
  semDesfoque = false,
}: Comum & {
  icone?: NomeDeIcone;
  desabilitado: boolean;
  altura: number;
  raio: number;
  tipografia: TextStyle;
  /** o compacto é `--glass2` sem `--bf` no handoff */
  semDesfoque?: boolean;
}) {
  const { cores } = useCores();
  const tinta = desabilitado ? cores.tinta3 : cores.tint;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [{ opacity: pressed ? OPACIDADE_PRESSIONADO : 1 }, estilo]}
    >
      <SuperficieVidro
        nivel="vidro2"
        raio={raio}
        semDesfoque={semDesfoque}
        style={[estilos.linhaCentral, { height: altura }]}
      >
        {icone ? <Icone nome={icone} tamanho={TAMANHO.iconeMais} cor={tinta} /> : null}
        <Text style={[tipografia, { color: tinta }]} numberOfLines={1}>
          {rotulo}
        </Text>
      </SuperficieVidro>
    </Pressable>
  );
}

/**
 * Botão dentro de um bloco de status: 40px, raio 13, largura do conteúdo.
 * `tint` para a ação que continua o fluxo; `vidro` para a alternativa.
 */
export function BotaoInline({
  rotulo,
  aoTocar,
  desabilitado = false,
  variante = 'tint',
  rotuloAcessivel,
  estilo,
}: Comum & { variante?: 'tint' | 'vidro' }) {
  const { cores } = useCores();
  const emVidro = variante === 'vidro';
  const tinta = desabilitado ? cores.tinta3 : emVidro ? cores.tint : cores.sobreTint;
  const conteudo = (
    <Text style={[texto(14, 700), { color: tinta }]} numberOfLines={1}>
      {rotulo}
    </Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      hitSlop={folgaDeToque(TAMANHO.botaoInline)}
      style={({ pressed }) => [
        estilos.inline,
        { opacity: pressed ? OPACIDADE_PRESSIONADO : 1 },
        estilo,
      ]}
    >
      {emVidro ? (
        <SuperficieVidro
          nivel="vidro2"
          raio={RAIO.botaoInline}
          semDesfoque
          style={[estilos.linhaCentral, estilos.inlineCaixa]}
        >
          {conteudo}
        </SuperficieVidro>
      ) : (
        <View
          style={[
            estilos.linhaCentral,
            estilos.inlineCaixa,
            {
              borderRadius: RAIO.botaoInline,
              backgroundColor: desabilitado ? cores.preenchimento2 : cores.tint,
            },
          ]}
        >
          {conteudo}
        </View>
      )}
    </Pressable>
  );
}

/** Ação terciária, sem caixa: 46px, texto 15/600. */
export function BotaoTexto({
  rotulo,
  aoTocar,
  desabilitado = false,
  tom = 'neutro',
  rotuloAcessivel,
  estilo,
}: Comum & { tom?: 'neutro' | 'destrutivo' }) {
  const { cores } = useCores();
  const cor = desabilitado
    ? cores.tinta3
    : tom === 'destrutivo'
      ? cores.vermelhoTexto
      : cores.tinta2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        estilos.botaoTexto,
        { opacity: pressed ? OPACIDADE_PRESSIONADO : 1 },
        estilo,
      ]}
    >
      {({ pressed }) => (
        <Text
          style={[
            texto(15, 600),
            { color: pressed && !desabilitado && tom === 'neutro' ? cores.tinta : cor },
          ]}
          numberOfLines={1}
        >
          {rotulo}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * O que falta para o primário acender, dito logo acima dele (12.5/500,
 * centralizado, `tinta2`). Live region: o texto aparece e some conforme o
 * formulário fica válido — o botão apagado nunca fica mudo. No iOS, onde a
 * live region não existe, a mudança é anunciada (`anunciar.ts`).
 */
export function NotaDoBotao({ texto: nota }: { texto: string }) {
  const { cores } = useCores();
  useAnuncio(nota);
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[texto(12.5, 500, { altura: 1.4 }), estilos.centro, { color: cores.tinta2 }]}
    >
      {nota}
    </Text>
  );
}

/* ── Controle segmentado ──────────────────────────────────────────────── */

export type PorteDoSegmentado = 'filtro' | 'cartao' | 'linha';

const PORTES = {
  /** filtros de tela (Urgência / A–Z / Hoje) */
  filtro: {
    altura: TAMANHO.segmentoFiltro,
    trilho: RAIO.trilho,
    segmento: RAIO.segmento,
    pad: 3,
    tipo: texto(13.5, 600, { tracking: -0.01 }),
    espalha: true,
  },
  /** dentro de um cartão (prazo de aviso, validade) */
  cartao: {
    altura: TAMANHO.segmentoCartao,
    trilho: RAIO.trilho,
    segmento: RAIO.segmento,
    pad: 3,
    tipo: texto(13.5, 600, { tracking: -0.01 }),
    espalha: true,
  },
  /** embutido numa linha de lista (Aparência, em Ajustes) */
  linha: {
    altura: TAMANHO.segmentoLinha,
    trilho: RAIO.trilhoLinha,
    segmento: RAIO.segmentoLinha,
    pad: 2.5,
    tipo: texto(12.5, 600),
    espalha: false,
  },
} as const satisfies Record<PorteDoSegmentado, unknown>;

export type OpcaoSegmentada<T> = { valor: T; rotulo: string };

/**
 * Trilho `preenchimento` com um segmento ativo em `vidro2`. Uma escolha por
 * vez; para o leitor de tela é um grupo de rádios.
 */
export function Segmentado<T extends string | number>({
  opcoes,
  valor,
  aoTrocar,
  porte = 'filtro',
  rotuloDoGrupo,
  desabilitado = false,
  estilo,
}: {
  opcoes: readonly OpcaoSegmentada<T>[];
  valor: T;
  aoTrocar: (v: T) => void;
  porte?: PorteDoSegmentado;
  rotuloDoGrupo?: string;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const p = PORTES[porte];

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={rotuloDoGrupo}
      style={[
        estilos.trilho,
        {
          backgroundColor: cores.preenchimento,
          borderRadius: p.trilho,
          padding: p.pad,
          // Filtro e cartão ocupam a largura; o embutido em linha encolhe.
          alignSelf: p.espalha ? 'stretch' : 'flex-start',
        },
        estilo,
      ]}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={String(o.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: ativo, selected: ativo, disabled: desabilitado }}
            disabled={desabilitado}
            onPress={() => aoTrocar(o.valor)}
            hitSlop={folgaDeToque(p.altura + p.pad * 2)}
            style={({ pressed }) => [
              estilos.segmento,
              {
                height: p.altura,
                borderRadius: p.segmento,
                flex: p.espalha ? 1 : undefined,
                paddingHorizontal: p.espalha ? 6 : 14,
                opacity: pressed && !ativo ? OPACIDADE_PRESSIONADO : 1,
              },
              ativo
                ? {
                    backgroundColor: cores.vidro2,
                    borderColor: cores.borda,
                    boxShadow: `0px 1px 4px ${cores.sombra}`,
                  }
                : { borderColor: 'transparent' },
            ]}
          >
            <Text
              style={[
                p.tipo,
                { color: desabilitado ? cores.tinta3 : ativo ? cores.tinta : cores.tinta2 },
              ]}
              numberOfLines={1}
            >
              {o.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Ficha de escolha ─────────────────────────────────────────────────── */

/**
 * Ficha de escolha **múltipla** (as disciplinas do perfil) — derivada: o
 * `Segmentado` é de escolha única. Mesma dupla de cor do segmentado e do
 * switch: desligada no trilho `preenchimento` com `tinta2`, ligada em tint
 * com `sobreTint`. Para o leitor de tela é uma caixa de seleção.
 */
export function FichaDeEscolha({
  rotulo,
  marcada,
  aoTocar,
}: {
  rotulo: string;
  marcada: boolean;
  aoTocar: () => void;
}) {
  const { cores } = useCores();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: marcada }}
      onPress={aoTocar}
      hitSlop={folgaDeToque(TAMANHO.ficha)}
      style={({ pressed }) => [
        estilos.ficha,
        {
          backgroundColor: marcada ? cores.tint : cores.preenchimento,
          opacity: pressed ? OPACIDADE_PRESSIONADO : 1,
        },
      ]}
    >
      <Text style={[texto(13.5, 600), { color: marcada ? cores.sobreTint : cores.tinta2 }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

/* ── Switch ───────────────────────────────────────────────────────────── */

const PAD_SWITCH = 2.5;
const CURSO_SWITCH =
  TAMANHO.switchLargura - PAD_SWITCH * 2 - TAMANHO.switchBotao;

/** 52 × 32, botão branco de 27. Muda de fundo em 200ms. */
export function Switch({
  ligado,
  aoAlternar,
  rotulo,
  desabilitado = false,
  estilo,
}: {
  ligado: boolean;
  aoAlternar: (v: boolean) => void;
  /** rótulo do leitor de tela — o switch não tem texto próprio */
  rotulo: string;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores, material } = useCores();
  const reduzido = useReduzirMovimento();
  const anim = useRef(new Animated.Value(ligado ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ligado ? 1 : 0,
      duration: duracao(MOVIMENTO.switchMs, reduzido),
      useNativeDriver: false,
    }).start();
  }, [ligado, reduzido, anim]);

  // Desabilitado por cor, não por opacidade: ligado vira `tinta3` no lugar
  // do tint (desligado já é o trilho neutro).
  const fundo = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [cores.preenchimento2, desabilitado ? cores.tinta3 : cores.tint],
  });
  const desloca = anim.interpolate({ inputRange: [0, 1], outputRange: [0, CURSO_SWITCH] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: ligado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={() => aoAlternar(!ligado)}
      hitSlop={folgaDeToque(TAMANHO.switchAltura)}
      style={estilo}
    >
      <Animated.View style={[estilos.switchTrilho, { backgroundColor: fundo }]}>
        <Animated.View
          style={[
            estilos.switchBotao,
            {
              backgroundColor: cores.botaoSwitch,
              boxShadow: material.sombraBotaoSwitch,
              transform: [{ translateX: desloca }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

/* ── Stepper ──────────────────────────────────────────────────────────── */

/**
 * Menos / valor / mais dentro do trilho `preenchimento`. O texto do valor é
 * derivado por quem chama (`formatar`), porque 0 vira "—" na política; como o
 * travessão não se lê, `rotuloDoValor` diz ao leitor de tela o que ele
 * significa ("sem limite").
 *
 * Para o leitor de tela o trilho inteiro é **um** controle ajustável: o
 * valor é lido junto do rótulo e o gesto de subir/descer (iOS) ou as ações
 * de aumentar/diminuir (Android) trocam o número. Os botões continuam para o
 * toque.
 */
export function Stepper({
  valor,
  minimo,
  maximo,
  aoTrocar,
  rotulo,
  formatar = String,
  rotuloDoValor,
  estilo,
}: {
  valor: number;
  minimo: number;
  maximo: number;
  aoTrocar: (v: number) => void;
  /** rótulo do leitor de tela para o controle */
  rotulo: string;
  formatar?: (v: number) => string;
  /** valor falado; o padrão é o mesmo texto de `formatar` */
  rotuloDoValor?: (v: number) => string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const noMinimo = valor <= minimo;
  const noMaximo = valor >= maximo;
  const diminuir = () => {
    if (!noMinimo) aoTrocar(valor - 1);
  };
  const aumentar = () => {
    if (!noMaximo) aoTrocar(valor + 1);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ min: minimo, max: maximo, now: valor, text: (rotuloDoValor ?? formatar)(valor) }}
      accessibilityActions={[
        { name: 'increment', label: `Aumentar ${rotulo}` },
        { name: 'decrement', label: `Diminuir ${rotulo}` },
      ]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') aumentar();
        if (e.nativeEvent.actionName === 'decrement') diminuir();
      }}
      style={[estilos.trilhoStepper, { backgroundColor: cores.preenchimento }, estilo]}
    >
      <BotaoDoStepper glifo="−" desabilitado={noMinimo} aoTocar={diminuir} />
      <Text style={[estilos.valorStepper, texto(18, 800), { color: cores.tinta }]}>
        {formatar(valor)}
      </Text>
      <BotaoDoStepper glifo="+" desabilitado={noMaximo} aoTocar={aumentar} />
    </View>
  );
}

/**
 * 38 × 34: a folga fecha 44 nos dois eixos. Na largura são 3px de cada lado,
 * que cabem no `padding` de 3 do trilho e no vão de 4 até o valor — sem
 * sobrepor o botão vizinho.
 */
function BotaoDoStepper({
  glifo,
  desabilitado,
  aoTocar,
}: {
  glifo: string;
  desabilitado: boolean;
  aoTocar: () => void;
}) {
  const { cores } = useCores();
  return (
    <Pressable
      disabled={desabilitado}
      onPress={aoTocar}
      hitSlop={folgaDeToque(TAMANHO.stepperBotaoAltura, TAMANHO.stepperBotaoLargura)}
      style={({ pressed }) => ({ opacity: pressed ? OPACIDADE_PRESSIONADO : 1 })}
    >
      <SuperficieVidro
        nivel="vidro2"
        raio={RAIO.segmento}
        semDesfoque
        style={[estilos.linhaCentral, estilos.botaoStepper]}
      >
        <Text style={[texto(19, 700), { color: desabilitado ? cores.tinta3 : cores.tint }]}>
          {glifo}
        </Text>
      </SuperficieVidro>
    </Pressable>
  );
}

/* ── Cartão de escolha (radio) ────────────────────────────────────────── */

/**
 * O radio do handoff: raio 20, marca redonda de 24px com check, e um corpo
 * opcional (`children`) abaixo de um fio — é onde mora o sub-controle de
 * antecedência da tela Registrar.
 *
 * Selecionado usa `tintSuave` com borda tint; não selecionado é cartão de
 * vidro. `valor` e `apoio` cobrem as duas formas do handoff: título + efeito
 * (Registrar) e dia + hora + selo (Escolher horário).
 */
export function CartaoEscolha({
  titulo,
  subtitulo,
  valor,
  corDoValor,
  aoLado,
  selo,
  selecionado,
  aoTocar,
  desabilitado = false,
  rotuloAcessivel,
  children,
  estilo,
}: {
  titulo: string;
  subtitulo?: string;
  /** efeito à direita, como "4 → 3" */
  valor?: string;
  corDoValor?: string;
  /** acompanha o título na mesma linha, em 800 tabular (a hora da janela) */
  aoLado?: string;
  /** selo "MELHOR" */
  selo?: string;
  selecionado: boolean;
  aoTocar: () => void;
  desabilitado?: boolean;
  rotuloAcessivel?: string;
  children?: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores, material } = useCores();
  // Desabilitado por cor, não por opacidade: o vidro fica intacto e só o
  // texto e a marca descem para `tinta3`.
  const tintaTitulo = desabilitado ? cores.tinta3 : cores.tinta;
  const tintaApoio = desabilitado ? cores.tinta3 : cores.tinta2;

  // O rádio é só a linha de cima. O corpo (`children`) é **irmão** dele dentro
  // da mesma caixa: aninhado no Pressable, o leitor de tela trataria o cartão
  // como um elemento só e nunca alcançaria o segmentado de antecedência.
  const radio = (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={rotuloAcessivel ?? titulo}
      accessibilityState={{ checked: selecionado, selected: selecionado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        estilos.padEscolha,
        children ? estilos.padEscolhaComCorpo : null,
        { opacity: pressed ? OPACIDADE_PRESSIONADO : 1 },
      ]}
    >
      <View style={estilos.linhaEscolha}>
        <Marca selecionada={selecionado} desabilitada={desabilitado} />
        <View style={estilos.flexivel}>
          <View style={estilos.tituloEscolha}>
            <Text style={[texto(15.5, 700, { altura: 1.25, tracking: -0.012 }), { color: tintaTitulo }]}>
              {titulo}
            </Text>
            {aoLado ? (
              <Text style={[texto(15.5, 800, { altura: 1.25 }), { color: tintaTitulo }]}>
                {aoLado}
              </Text>
            ) : null}
            {selo ? <Selo texto={selo} /> : null}
          </View>
          {subtitulo ? (
            <Text
              style={[comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 4 }), { color: tintaApoio }]}
            >
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {valor ? (
          <Text
            style={[texto(14, 800), { color: desabilitado ? cores.tinta3 : (corDoValor ?? cores.tinta) }]}
          >
            {valor}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  const corpo = children ? (
    <View style={[estilos.corpoEscolha, { borderTopColor: cores.fio }]}>{children}</View>
  ) : null;

  if (selecionado) {
    return (
      <View
        style={[
          estilos.caixaEscolha,
          {
            backgroundColor: cores.tintSuave,
            borderColor: cores.tint,
            boxShadow: `${material.gin}, 0px 8px 22px ${cores.sombra}`,
          },
          estilo,
        ]}
      >
        {radio}
        {corpo}
      </View>
    );
  }
  return (
    <SuperficieVidro nivel="cartao" raio={RAIO.escolha} style={estilo}>
      {radio}
      {corpo}
    </SuperficieVidro>
  );
}

function Marca({ selecionada, desabilitada }: { selecionada: boolean; desabilitada: boolean }) {
  const { cores } = useCores();
  const cheia = desabilitada ? cores.tinta3 : cores.tint;
  return (
    <View
      style={[
        estilos.marca,
        selecionada
          ? { backgroundColor: cheia, borderColor: cheia, borderWidth: 0.5 }
          : { borderColor: cores.tinta3, borderWidth: 1.5 },
      ]}
    >
      {selecionada ? (
        <Icone nome="check" tamanho={TAMANHO.checkEscolha} cor={cores.sobreTint} />
      ) : null}
    </View>
  );
}

/** Selo "MELHOR" do primeiro horário sugerido. */
export function Selo({ texto: rotulo }: { texto: string }) {
  const { cores } = useCores();
  return (
    <View style={[estilos.selo, { backgroundColor: cores.tintSuave }]}>
      <Text
        style={[texto(10, 700, { tracking: 0.04, maiuscula: true }), { color: cores.tint }]}
      >
        {rotulo}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  centro: { textAlign: 'center' },
  ficha: {
    height: TAMANHO.ficha,
    paddingHorizontal: 14,
    borderRadius: RAIO.ficha,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaCentral: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  botaoPrimario: {
    height: TAMANHO.botaoPrimario,
    borderRadius: RAIO.botao,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
  },
  inline: { alignSelf: 'flex-start' },
  inlineCaixa: { height: TAMANHO.botaoInline, paddingHorizontal: 18 },
  botaoTexto: {
    height: TAMANHO.botaoTexto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trilho: { flexDirection: 'row', gap: 2 },
  segmento: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: TAMANHO.bordaVidro,
  },
  switchTrilho: {
    width: TAMANHO.switchLargura,
    height: TAMANHO.switchAltura,
    borderRadius: TAMANHO.switchAltura / 2,
    padding: PAD_SWITCH,
    justifyContent: 'center',
  },
  switchBotao: {
    width: TAMANHO.switchBotao,
    height: TAMANHO.switchBotao,
    borderRadius: TAMANHO.switchBotao / 2,
  },
  trilhoStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 3,
    borderRadius: RAIO.trilho,
    alignSelf: 'flex-start',
  },
  botaoStepper: {
    width: TAMANHO.stepperBotaoLargura,
    height: TAMANHO.stepperBotaoAltura,
  },
  valorStepper: { minWidth: 26, textAlign: 'center' },
  caixaEscolha: {
    borderRadius: RAIO.escolha,
    borderWidth: TAMANHO.bordaVidro,
  },
  /** o padding mora no rádio, para a faixa inteira da linha ser tocável */
  padEscolha: { paddingVertical: 14, paddingHorizontal: 15 },
  padEscolhaComCorpo: { paddingBottom: 0 },
  linhaEscolha: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 42 },
  tituloEscolha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  corpoEscolha: {
    marginTop: 13,
    marginHorizontal: 15,
    marginBottom: 14,
    paddingTop: 13,
    borderTopWidth: TAMANHO.bordaVidro,
  },
  marca: {
    width: TAMANHO.marcaEscolha,
    height: TAMANHO.marcaEscolha,
    borderRadius: TAMANHO.marcaEscolha / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selo: {
    height: TAMANHO.selo,
    paddingHorizontal: 7,
    borderRadius: RAIO.selo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
