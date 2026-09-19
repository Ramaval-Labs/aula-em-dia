/**
 * Primitivas do material iOS Glass (handoff-ios-glass/README.md, "Cartão de
 * vidro" e "Design Tokens").
 *
 * As quatro camadas do handoff, na ordem:
 *   1. `FundoRefracao` — as manchas de cor sob tudo. Sem elas o vidro não tem
 *      o que refratar.
 *   2. Miolo translúcido — `SuperficieVidro` desenha o desfoque nativo e, por
 *      cima, a cor do nível (`cartao`, `vidro`, `vidro2`, `sheet`).
 *   3. Reflexo especular (`gin`) + borda de .5px.
 *   4. Anel de refração — só na tab bar (`anel`).
 *
 * Tela nenhuma remonta isto: vidro é sempre `SuperficieVidro`, e a decisão de
 * blur × fallback mora aqui.
 *
 * Por plataforma:
 * - web: `backdropFilter` com o `--bf` literal do handoff. O BlurView do
 *   expo-blur no web soma uma cor de fundo própria do `tint` ao miolo, então
 *   ele não é usado lá.
 * - iOS: `BlurView` nativo (UIVisualEffectView).
 * - Android: `BlurView` com `blurTarget` apontando para o `AlvoDeDesfoque`
 *   (a API estável do expo-blur). A superfície precisa estar FORA do alvo que
 *   desfoca — uma BlurView não desfoca o próprio ancestral —, então vidro
 *   dentro do alvo (cartões na rolagem) cai no fallback. Sob esses cartões só
 *   há o fundo de refração, que já é liso: a perda é pequena.
 */

import { BlurView, BlurTargetView } from 'expo-blur';
import React, { createContext, useContext, useMemo, useRef, type RefObject } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useCores } from '../tema/TemaProvider';
import { FUNDO_REFRACAO, TAMANHO, type Material } from '../tema/tokens';

/* ── Modo do material ─────────────────────────────────────────────────── */

export type ModoVidro = 'blur' | 'fallback' | 'auto';

/**
 * Chave geral do desfoque. `auto`: blur no iOS e no web; no Android só a
 * partir do Android 12 (API 31) — abaixo disso o BlurView pesa e cai no
 * fallback. `blur` força o desfoque em toda plataforma (no Android < 31 usa o
 * método lento). `fallback` desliga o desfoque em toda parte.
 */
export const MODO_VIDRO: ModoVidro = 'auto';

/** API mínima do Android com desfoque no modo `auto`. */
const ANDROID_API_MINIMA = 31;

export function blurLigado(modo: ModoVidro = MODO_VIDRO): boolean {
  if (modo === 'fallback') return false;
  if (modo === 'blur') return true;
  if (Platform.OS === 'android') return Number(Platform.Version) >= ANDROID_API_MINIMA;
  return true;
}

/* ── Alvo de desfoque (Android) ───────────────────────────────────────── */

type ValorDeDesfoque = {
  alvo: RefObject<View | null> | null;
  /** true para quem está dentro do conteúdo que o alvo desfoca */
  dentroDoAlvo: boolean;
};

const ContextoDeDesfoque = createContext<ValorDeDesfoque>({ alvo: null, dentroDoAlvo: false });

/**
 * Guarda a referência do alvo para as superfícies que ficam fora dele
 * (barras, tab bar, sheet). Envolve o alvo e as superfícies juntos.
 */
export function ProvedorDeDesfoque({ children }: { children: React.ReactNode }) {
  const alvo = useRef<View | null>(null);
  const valor = useMemo(() => ({ alvo, dentroDoAlvo: false }), []);
  return <ContextoDeDesfoque.Provider value={valor}>{children}</ContextoDeDesfoque.Provider>;
}

/**
 * O conteúdo que o vidro de fora desfoca (fundo + rolagem). No Android é o
 * `BlurTargetView` do expo-blur; no iOS e no web, um `View` comum. Sem um
 * `ProvedorDeDesfoque` acima, funciona mas nenhuma superfície o encontra.
 */
export function AlvoDeDesfoque({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const acima = useContext(ContextoDeDesfoque);
  const proprio = useRef<View | null>(null);
  const alvo = acima.alvo ?? proprio;
  const valor = useMemo(() => ({ alvo, dentroDoAlvo: true }), [alvo]);

  const estilo = [styles.cheio, style];
  return (
    <ContextoDeDesfoque.Provider value={valor}>
      {Platform.OS === 'android' ? (
        <BlurTargetView ref={alvo} style={estilo}>
          {children}
        </BlurTargetView>
      ) : (
        <View style={estilo}>{children}</View>
      )}
    </ContextoDeDesfoque.Provider>
  );
}

/* ── Fundo de refração ────────────────────────────────────────────────── */

/**
 * Tela + quatro gradientes radiais elípticos. Em unidades da caixa
 * (`objectBoundingBox`), um círculo de raio 1 escalado por (raioX, raioY) é
 * exatamente o `radial-gradient(raioX raioY at centroX centroY)` do CSS.
 */
export function FundoRefracao({ style }: { style?: StyleProp<ViewStyle> }) {
  const { tema, cores, material } = useCores();
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: cores.tela }, style]}
    >
      <Svg width="100%" height="100%" style={{ opacity: material.opacidadeFundo }}>
        <Defs>
          {FUNDO_REFRACAO.map((g, i) => (
            <RadialGradient
              key={`${tema}-${i}`}
              id={`refracao-${tema}-${i}`}
              gradientUnits="objectBoundingBox"
              cx={0}
              cy={0}
              r={1}
              gradientTransform={`translate(${g.centroX} ${g.centroY}) scale(${g.raioX} ${g.raioY})`}
            >
              <Stop offset={0} stopColor={cores[g.mancha]} stopOpacity={1} />
              <Stop offset={g.fim} stopColor={cores[g.mancha]} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {FUNDO_REFRACAO.map((_, i) => (
          <Rect
            key={i}
            x={0}
            y={0}
            width="100%"
            height="100%"
            fill={`url(#refracao-${tema}-${i})`}
          />
        ))}
      </Svg>
    </View>
  );
}

/* ── Superfície de vidro ──────────────────────────────────────────────── */

export type NivelVidro = 'cartao' | 'vidro' | 'vidro2' | 'sheet';

/** Soma alfa a uma cor `rgba(...)`; outras cores voltam como estão. */
export function somarAlfa(cor: string, extra: number): string {
  const m = cor.match(/^rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)$/);
  if (!m) return cor;
  const alfa = Math.min(0.96, Number(m[4]) + extra);
  return `rgba(${m[1]},${m[2]},${m[3]},${Math.round(alfa * 1000) / 1000})`;
}

type PropsSuperficie = {
  nivel: NivelVidro;
  raio: number;
  /** arredonda só os cantos de cima (painel de sheet) */
  soTopo?: boolean;
  /** anel de refração — só na tab bar */
  anel?: boolean;
  /** soma a sombra difusa `gsh` por fora */
  sombra?: boolean;
  /** sombra externa própria no lugar do `gsh` (tab bar, sheet) */
  sombraExterna?: string;
  /** força um modo só nesta superfície (catálogo, diagnóstico) */
  modo?: ModoVidro;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Recorte arredondado com o material por baixo do conteúdo. `style` recebe
 * layout e padding; o conteúdo é recortado pelo raio.
 *
 * O `gin` fica numa camada própria, sem filhos, acima do desfoque e abaixo
 * do conteúdo: como sombra inset do contêiner ele ficaria sob o BlurView (web)
 * ou por cima do texto (iOS).
 */
export function SuperficieVidro({
  nivel,
  raio,
  soTopo = false,
  anel = false,
  sombra = false,
  sombraExterna,
  modo,
  style,
  children,
}: PropsSuperficie) {
  const { cores, material } = useCores();
  const { alvo, dentroDoAlvo } = useContext(ContextoDeDesfoque);

  const comBlur =
    blurLigado(modo) && (Platform.OS !== 'android' || (alvo !== null && !dentroDoAlvo));
  const miolo = comBlur ? cores[nivel] : somarAlfa(cores[nivel], material.alfaExtraFallback);
  const externa = sombraExterna ?? (sombra ? material.gsh : undefined);
  const canto: ViewStyle = soTopo
    ? { borderTopLeftRadius: raio, borderTopRightRadius: raio }
    : { borderRadius: raio };

  return (
    <View style={[canto, { overflow: 'hidden' }, externa ? { boxShadow: externa } : null, style]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, canto]}>
        {comBlur ? <CamadaDeDesfoque material={material} alvo={alvo} modo={modo} canto={canto} /> : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            canto,
            {
              backgroundColor: miolo,
              borderWidth: TAMANHO.bordaVidro,
              borderColor: cores.borda,
            },
          ]}
        />
        {anel ? (
          <View style={[StyleSheet.absoluteFill, canto, { boxShadow: material.anel }]} />
        ) : null}
        <View style={[StyleSheet.absoluteFill, canto, { boxShadow: material.gin }]} />
      </View>
      {children}
    </View>
  );
}

/** A camada de desfoque em si, por plataforma. */
function CamadaDeDesfoque({
  material,
  alvo,
  modo,
  canto,
}: {
  material: Material;
  alvo: RefObject<View | null> | null;
  modo?: ModoVidro;
  canto: ViewStyle;
}) {
  if (Platform.OS === 'web') {
    // react-native-web repassa backdropFilter ao CSS; o tipo do RN não o tem.
    const filtro = {
      backdropFilter: material.filtroWeb,
      WebkitBackdropFilter: material.filtroWeb,
    } as unknown as ViewStyle;
    return <View style={[StyleSheet.absoluteFill, canto, filtro]} />;
  }
  if (Platform.OS === 'android') {
    return (
      <BlurView
        blurTarget={alvo ?? undefined}
        blurMethod={(modo ?? MODO_VIDRO) === 'blur' ? 'dimezisBlurView' : 'dimezisBlurViewSdk31Plus'}
        intensity={material.intensidadeAndroid}
        blurReductionFactor={material.reducaoAndroid}
        tint={material.tintDesfoque}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return (
    <BlurView
      intensity={material.intensidade}
      tint={material.tintDesfoque}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  cheio: { flex: 1 },
});
