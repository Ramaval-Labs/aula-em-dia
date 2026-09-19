/**
 * Controles do iOS Glass: botões, segmentado, switch, stepper e cartão de
 * escolha (handoff-ios-glass/README.md, seções "Botões", "Controle
 * segmentado", "Cartão de escolha (radio)", "Switch" e "Stepper").
 *
 * Toda medida sai de `RAIO_VIDRO`/`TAMANHO_VIDRO`; toda cor, de `useVidro()`.
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

import { useVidro } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../tema/tipografia';
import { duracao, useReduzirMovimento } from '../tema/movimento';
import { MOVIMENTO_VIDRO, RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';
import { Icone, type NomeDeIcone } from './Icone';
import { SuperficieVidro } from './Vidro';

/** Opacidade do pressionado — substitui o `brightness(1.07)` do hover CSS. */
const OPACIDADE_PRESSIONADO = 0.86;

/** Fecha os 44px do alvo de toque em peças mais baixas. */
function folgaDeToque(altura: number) {
  const falta = Math.max(0, TAMANHO_VIDRO.alvoMinimo - altura) / 2;
  return { top: falta, bottom: falta, left: 0, right: 0 };
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
  const { cores, material } = useVidro();
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
      {icone ? <Icone nome={icone} tamanho={TAMANHO_VIDRO.iconeMais} cor={tinta} /> : null}
      <Text style={[TIPO_VIDRO.botao, { color: tinta }]} numberOfLines={1}>
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
      altura={TAMANHO_VIDRO.botaoSecundario}
      raio={RAIO_VIDRO.botao}
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
      altura={TAMANHO_VIDRO.botaoCompacto}
      raio={RAIO_VIDRO.botaoCompacto}
      tipografia={texto(14.5, 600)}
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
}: Comum & {
  icone?: NomeDeIcone;
  desabilitado: boolean;
  altura: number;
  raio: number;
  tipografia: TextStyle;
}) {
  const { cores } = useVidro();
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
        style={[estilos.linhaCentral, { height: altura }]}
      >
        {icone ? <Icone nome={icone} tamanho={TAMANHO_VIDRO.iconeMais} cor={tinta} /> : null}
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
  const { cores } = useVidro();
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
      hitSlop={folgaDeToque(TAMANHO_VIDRO.botaoInline)}
      style={({ pressed }) => [
        estilos.inline,
        { opacity: pressed ? OPACIDADE_PRESSIONADO : 1 },
        estilo,
      ]}
    >
      {emVidro ? (
        <SuperficieVidro
          nivel="vidro2"
          raio={RAIO_VIDRO.botaoInline}
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
              borderRadius: RAIO_VIDRO.botaoInline,
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
  const { cores } = useVidro();
  const cor = desabilitado
    ? cores.tinta3
    : tom === 'destrutivo'
      ? cores.vermelho
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
 * formulário fica válido — o botão apagado nunca fica mudo.
 */
export function NotaDoBotao({ texto: nota }: { texto: string }) {
  const { cores } = useVidro();
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
    altura: TAMANHO_VIDRO.segmentoFiltro,
    trilho: RAIO_VIDRO.trilho,
    segmento: RAIO_VIDRO.segmento,
    pad: 3,
    tipo: texto(13.5, 600, { tracking: -0.01 }),
    espalha: true,
  },
  /** dentro de um cartão (prazo de aviso, validade) */
  cartao: {
    altura: TAMANHO_VIDRO.segmentoCartao,
    trilho: RAIO_VIDRO.trilho,
    segmento: RAIO_VIDRO.segmento,
    pad: 3,
    tipo: texto(13.5, 600, { tracking: -0.01 }),
    espalha: true,
  },
  /** embutido numa linha de lista (Aparência, em Ajustes) */
  linha: {
    altura: TAMANHO_VIDRO.segmentoLinha,
    trilho: RAIO_VIDRO.trilhoLinha,
    segmento: RAIO_VIDRO.segmentoLinha,
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
  const { cores } = useVidro();
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
  const { cores } = useVidro();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: marcada }}
      onPress={aoTocar}
      hitSlop={folgaDeToque(TAMANHO_VIDRO.segmentoCartao)}
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
  TAMANHO_VIDRO.switchLargura - PAD_SWITCH * 2 - TAMANHO_VIDRO.switchBotao;

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
  const { cores } = useVidro();
  const reduzido = useReduzirMovimento();
  const anim = useRef(new Animated.Value(ligado ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ligado ? 1 : 0,
      duration: duracao(MOVIMENTO_VIDRO.switchMs, reduzido),
      useNativeDriver: false,
    }).start();
  }, [ligado, reduzido, anim]);

  const fundo = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [cores.preenchimento2, cores.tint],
  });
  const desloca = anim.interpolate({ inputRange: [0, 1], outputRange: [0, CURSO_SWITCH] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: ligado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={() => aoAlternar(!ligado)}
      hitSlop={folgaDeToque(TAMANHO_VIDRO.switchAltura)}
      style={[{ opacity: desabilitado ? 0.5 : 1 }, estilo]}
    >
      <Animated.View style={[estilos.switchTrilho, { backgroundColor: fundo }]}>
        <Animated.View
          style={[estilos.switchBotao, { transform: [{ translateX: desloca }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

/* ── Stepper ──────────────────────────────────────────────────────────── */

/**
 * Menos / valor / mais dentro do trilho `preenchimento`. O rótulo do valor é
 * derivado por quem chama (`formatar`), porque 0 vira "—" na política.
 */
export function Stepper({
  valor,
  minimo,
  maximo,
  aoTrocar,
  rotulo,
  formatar = String,
  estilo,
}: {
  valor: number;
  minimo: number;
  maximo: number;
  aoTrocar: (v: number) => void;
  /** rótulo do leitor de tela para o grupo */
  rotulo: string;
  formatar?: (v: number) => string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const noMinimo = valor <= minimo;
  const noMaximo = valor >= maximo;

  return (
    <View
      accessibilityLabel={rotulo}
      accessibilityValue={{ text: formatar(valor) }}
      style={[estilos.trilhoStepper, { backgroundColor: cores.preenchimento }, estilo]}
    >
      <BotaoDoStepper
        glifo="−"
        rotulo={`Diminuir ${rotulo}`}
        desabilitado={noMinimo}
        aoTocar={() => aoTrocar(valor - 1)}
      />
      <Text style={[estilos.valorStepper, texto(18, 800), { color: cores.tinta }]}>
        {formatar(valor)}
      </Text>
      <BotaoDoStepper
        glifo="+"
        rotulo={`Aumentar ${rotulo}`}
        desabilitado={noMaximo}
        aoTocar={() => aoTrocar(valor + 1)}
      />
    </View>
  );
}

function BotaoDoStepper({
  glifo,
  rotulo,
  desabilitado,
  aoTocar,
}: {
  glifo: string;
  rotulo: string;
  desabilitado: boolean;
  aoTocar: () => void;
}) {
  const { cores } = useVidro();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      hitSlop={folgaDeToque(TAMANHO_VIDRO.stepperBotaoAltura)}
      style={({ pressed }) => ({ opacity: pressed ? OPACIDADE_PRESSIONADO : 1 })}
    >
      <SuperficieVidro
        nivel="vidro2"
        raio={RAIO_VIDRO.segmento}
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
  const { cores, material } = useVidro();

  const miolo = (
    <>
      <View style={estilos.linhaEscolha}>
        <Marca selecionada={selecionado} />
        <View style={estilos.flexivel}>
          <View style={estilos.tituloEscolha}>
            <Text style={[texto(15.5, 700, { altura: 1.25, tracking: -0.012 }), { color: cores.tinta }]}>
              {titulo}
            </Text>
            {aoLado ? (
              <Text style={[texto(15.5, 800, { altura: 1.25 }), { color: cores.tinta }]}>
                {aoLado}
              </Text>
            ) : null}
            {selo ? <Selo texto={selo} /> : null}
          </View>
          {subtitulo ? (
            <Text
              style={[comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 4 }), { color: cores.tinta2 }]}
            >
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {valor ? (
          <Text style={[texto(14, 800), { color: corDoValor ?? cores.tinta }]}>{valor}</Text>
        ) : null}
      </View>
      {children ? (
        <View style={[estilos.corpoEscolha, { borderTopColor: cores.fio }]}>{children}</View>
      ) : null}
    </>
  );

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={rotuloAcessivel ?? titulo}
      accessibilityState={{ checked: selecionado, selected: selecionado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        { opacity: pressed ? OPACIDADE_PRESSIONADO : desabilitado ? 0.55 : 1 },
        estilo,
      ]}
    >
      {selecionado ? (
        <View
          style={[
            estilos.caixaEscolha,
            {
              backgroundColor: cores.tintSuave,
              borderColor: cores.tint,
              boxShadow: `${material.gin}, 0px 8px 22px ${cores.sombra}`,
            },
          ]}
        >
          {miolo}
        </View>
      ) : (
        <SuperficieVidro nivel="cartao" raio={RAIO_VIDRO.escolha} style={estilos.padEscolha}>
          {miolo}
        </SuperficieVidro>
      )}
    </Pressable>
  );
}

function Marca({ selecionada }: { selecionada: boolean }) {
  const { cores } = useVidro();
  return (
    <View
      style={[
        estilos.marca,
        selecionada
          ? { backgroundColor: cores.tint, borderColor: cores.tint, borderWidth: 0.5 }
          : { borderColor: cores.tinta3, borderWidth: 1.5 },
      ]}
    >
      {selecionada ? (
        <Icone nome="check" tamanho={TAMANHO_VIDRO.checkEscolha} cor={cores.sobreTint} />
      ) : null}
    </View>
  );
}

/** Selo "MELHOR" do primeiro horário sugerido. */
export function Selo({ texto: rotulo }: { texto: string }) {
  const { cores } = useVidro();
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
    height: TAMANHO_VIDRO.segmentoCartao,
    paddingHorizontal: 14,
    borderRadius: RAIO_VIDRO.botaoInline,
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
    height: TAMANHO_VIDRO.botaoPrimario,
    borderRadius: RAIO_VIDRO.botao,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
  },
  inline: { alignSelf: 'flex-start' },
  inlineCaixa: { height: TAMANHO_VIDRO.botaoInline, paddingHorizontal: 18 },
  botaoTexto: {
    height: TAMANHO_VIDRO.botaoTexto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trilho: { flexDirection: 'row', gap: 2 },
  segmento: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: TAMANHO_VIDRO.bordaVidro,
  },
  switchTrilho: {
    width: TAMANHO_VIDRO.switchLargura,
    height: TAMANHO_VIDRO.switchAltura,
    borderRadius: TAMANHO_VIDRO.switchAltura / 2,
    padding: PAD_SWITCH,
    justifyContent: 'center',
  },
  switchBotao: {
    width: TAMANHO_VIDRO.switchBotao,
    height: TAMANHO_VIDRO.switchBotao,
    borderRadius: TAMANHO_VIDRO.switchBotao / 2,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 6px rgba(9,15,30,0.28)',
  },
  trilhoStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 3,
    borderRadius: RAIO_VIDRO.trilho,
    alignSelf: 'flex-start',
  },
  botaoStepper: {
    width: TAMANHO_VIDRO.stepperBotaoLargura,
    height: TAMANHO_VIDRO.stepperBotaoAltura,
  },
  valorStepper: { minWidth: 26, textAlign: 'center' },
  caixaEscolha: {
    borderRadius: RAIO_VIDRO.escolha,
    borderWidth: TAMANHO_VIDRO.bordaVidro,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  padEscolha: { paddingVertical: 14, paddingHorizontal: 15 },
  linhaEscolha: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 42 },
  tituloEscolha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  corpoEscolha: {
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: TAMANHO_VIDRO.bordaVidro,
  },
  marca: {
    width: TAMANHO_VIDRO.marcaEscolha,
    height: TAMANHO_VIDRO.marcaEscolha,
    borderRadius: TAMANHO_VIDRO.marcaEscolha / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selo: {
    height: TAMANHO_VIDRO.selo,
    paddingHorizontal: 7,
    borderRadius: RAIO_VIDRO.selo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
