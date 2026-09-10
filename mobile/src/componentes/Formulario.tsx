/**
 * Peças de formulário.
 *
 * O app não tinha nenhum campo de entrada até aqui — todas as nove telas
 * originais eram leitura e toque. Por isso o `CampoDeTexto` usa
 * `textoDeCampo()` em vez de `texto()`: a compensação de margem negativa da
 * tipografia é feita para `<Text>` em fluxo e desloca o texto dentro de um
 * `TextInput` de altura própria.
 */

import React, { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ViewStyle,
} from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto, textoDeCampo, TIPO } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';

export type TipoDeTeclado = 'texto' | 'email' | 'numerico' | 'telefone';

const TECLADOS: Record<TipoDeTeclado, KeyboardTypeOptions> = {
  texto: 'default',
  email: 'email-address',
  numerico: 'number-pad',
  telefone: 'phone-pad',
};

/**
 * Campo de texto em cartão, como no Fluxo A: rótulo em micro-maiúsculas
 * acima e o valor em corpo grande. A borda engrossa no foco.
 */
export function CampoDeTexto({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  senha = false,
  teclado = 'texto',
  erro,
  ajuda,
  autoFoco = false,
  capitalizar = 'sentences',
  multilinha = false,
  sufixo,
  tamanhoDoValor = 15,
  aoEnviar,
  estilo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  senha?: boolean;
  teclado?: TipoDeTeclado;
  erro?: string;
  ajuda?: string;
  autoFoco?: boolean;
  capitalizar?: 'none' | 'sentences' | 'words';
  multilinha?: boolean;
  /** ação à direita do valor: "mostrar" em A3, "Copiar" em D2 */
  sufixo?: React.ReactNode;
  tamanhoDoValor?: number;
  aoEnviar?: () => void;
  estilo?: ViewStyle;
}) {
  const cores = useCores();
  const [focado, setFocado] = useState(false);

  const corDaBorda = erro ? cores.vermelho : focado ? cores.texto : cores.linha;

  return (
    <View style={estilo}>
      <View
        style={{
          backgroundColor: cores.cartao,
          borderRadius: RAIO.cartao,
          borderWidth: focado || erro ? 1.5 : 1,
          borderColor: corDaBorda,
          paddingVertical: 13,
          paddingHorizontal: 15,
        }}
      >
        <Text
          style={[
            texto(10, 600, { altura: 1, tracking: 0.16, maiuscula: true }),
            { color: erro ? cores.vermelho : cores.suave },
          ]}
        >
          {rotulo}
        </Text>

        <View
          style={{
            marginTop: 9,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <TextInput
            value={valor}
            onChangeText={aoMudar}
            placeholder={placeholder}
            placeholderTextColor={cores.fraco}
            secureTextEntry={senha}
            keyboardType={TECLADOS[teclado]}
            autoCapitalize={teclado === 'email' ? 'none' : capitalizar}
            autoCorrect={teclado !== 'email'}
            autoFocus={autoFoco}
            multiline={multilinha}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            onSubmitEditing={aoEnviar}
            returnKeyType={aoEnviar ? 'done' : undefined}
            accessibilityLabel={rotulo}
            selectionColor={cores.textoMedio}
            style={[
              textoDeCampo(tamanhoDoValor, senha ? 600 : 500, {
                altura: 1.25,
                tracking: senha && valor ? 0.18 : undefined,
                tabular: teclado === 'numerico' || teclado === 'telefone',
              }),
              {
                flex: 1,
                color: cores.texto,
                minHeight: multilinha ? 88 : undefined,
                textAlignVertical: multilinha ? 'top' : 'center',
              },
            ]}
          />
          {sufixo}
        </View>
      </View>

      {erro ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[TIPO.nota, { marginTop: 6, paddingHorizontal: 2, color: cores.vermelho }]}
        >
          {erro}
        </Text>
      ) : ajuda ? (
        <Text style={[TIPO.nota, { marginTop: 6, paddingHorizontal: 2, color: cores.suave }]}>
          {ajuda}
        </Text>
      ) : null}
    </View>
  );
}

/** Ação textual dentro do campo — o "mostrar" da senha em A3. */
export function AcaoDoCampo({ rotulo, aoTocar }: { rotulo: string; aoTocar: () => void }) {
  const cores = useCores();
  return (
    <Pressable accessibilityRole="button" onPress={aoTocar} hitSlop={10}>
      <Text style={[texto(12, 600, { altura: 1 }), { color: cores.suave }]}>{rotulo}</Text>
    </Pressable>
  );
}

/**
 * Interruptor 44×26 — extraído de `Politica.tsx`, onde estava inline.
 * O visual não muda: mesma trilha, mesmo botão de 20px.
 */
export function Interruptor({
  ligado,
  aoTrocar,
  rotuloAcessivel,
}: {
  ligado: boolean;
  aoTrocar: (v: boolean) => void;
  rotuloAcessivel: string;
}) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={rotuloAcessivel}
      accessibilityState={{ checked: ligado }}
      onPress={() => aoTrocar(!ligado)}
      hitSlop={8}
      style={{
        width: 44,
        height: 26,
        borderRadius: RAIO.pastilha,
        padding: 3,
        flexDirection: 'row',
        justifyContent: ligado ? 'flex-end' : 'flex-start',
        backgroundColor: ligado ? cores.texto : cores.linha,
      }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: cores.cartao }} />
    </Pressable>
  );
}

/**
 * Contador de passo (−/valor/+) — extraído de `PassoDoLimite`, que era local
 * a `Politica.tsx`. O botão de somar é escuro; o de subtrair, discreto.
 */
export function Contador({
  valor,
  minimo,
  maximo,
  aoMudar,
  formatar,
  rotuloAcessivel,
}: {
  valor: number;
  minimo: number;
  maximo: number;
  aoMudar: (v: number) => void;
  formatar?: (v: number) => string;
  rotuloAcessivel: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <PassoDoContador
        rotulo="−"
        acessivel="Diminuir"
        ativo={valor > minimo}
        variante="menos"
        aoTocar={() => aoMudar(Math.max(minimo, valor - 1))}
      />
      <ValorDoContador
        texto={formatar ? formatar(valor) : String(valor)}
        rotuloAcessivel={rotuloAcessivel}
      />
      <PassoDoContador
        rotulo="+"
        acessivel="Aumentar"
        ativo={valor < maximo}
        variante="mais"
        aoTocar={() => aoMudar(Math.min(maximo, valor + 1))}
      />
    </View>
  );
}

function ValorDoContador({
  texto: valor,
  rotuloAcessivel,
}: {
  texto: string;
  rotuloAcessivel: string;
}) {
  const cores = useCores();
  return (
    <Text
      accessibilityLabel={rotuloAcessivel}
      style={[
        texto(20, 800, { altura: 1 }),
        { minWidth: 18, textAlign: 'center', color: cores.texto },
      ]}
    >
      {valor}
    </Text>
  );
}

function PassoDoContador({
  rotulo,
  acessivel,
  ativo,
  variante,
  aoTocar,
}: {
  rotulo: string;
  acessivel: string;
  ativo: boolean;
  variante: 'menos' | 'mais';
  aoTocar: () => void;
}) {
  const cores = useCores();

  const fundo = ativo
    ? variante === 'mais'
      ? cores.texto
      : cores.caixa
    : variante === 'mais'
      ? cores.caixa
      : cores.hover;
  const tinta = ativo
    ? variante === 'mais'
      ? cores.botaoTexto
      : cores.suave
    : variante === 'mais'
      ? cores.fraco
      : cores.inativo;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ disabled: !ativo }}
      disabled={!ativo}
      onPress={aoTocar}
      hitSlop={5}
      style={{
        width: 38,
        height: 38,
        borderRadius: RAIO.contador,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: fundo,
      }}
    >
      <Text style={[texto(17, 600, { altura: 1 }), { color: tinta }]}>{rotulo}</Text>
    </Pressable>
  );
}
