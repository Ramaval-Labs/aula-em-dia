/**
 * Campo de texto do iOS Glass — **derivado**: o handoff não desenha
 * formulário nenhum ("O que deliberadamente não está no design"), mas o app
 * tem login, cadastro de aluno, chave Pix e perfil.
 *
 * Como foi derivado, no idioma do sistema:
 * - trilho em `preenchimento`, o mesmo fundo do trilho do segmentado e do
 *   stepper — é o que o handoff usa para "campo de controle";
 * - raio 13 e altura 50, a escala do botão inline e do secundário compacto;
 * - rótulo acima em 11.5/600 `.04em` caixa alta `tinta3`, o mesmo do
 *   sub-cabeçalho "ANTECEDÊNCIA DO AVISO" da tela Registrar;
 * - foco: borda de 1px em tint (o handoff não tem estado de foco; o tint é a
 *   cor de interação do sistema);
 * - erro: borda e mensagem em `vermelho`, com a mensagem como live region —
 *   o handoff diz "não há mensagem de erro em nenhum formulário", mas os
 *   formulários do app validam (`dominio/validacao.ts`).
 *
 * `textoDeCampo()` no lugar de `texto()`: a compensação de margem da
 * tipografia é para `<Text>` em fluxo e desloca o texto dentro do
 * `TextInput`.
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { dinheiro, lerDinheiro } from '../dominio/formato';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, textoDeCampo } from '../tema/tipografia';
import { RAIO, TAMANHO } from '../tema/tokens';
import { useAnuncio } from './anunciar';

export type TipoDeTeclado = 'texto' | 'email' | 'numerico' | 'decimal' | 'telefone';

const TECLADOS: Record<TipoDeTeclado, KeyboardTypeOptions> = {
  texto: 'default',
  email: 'email-address',
  // o `number-pad` do iOS não tem separador; o `decimal-pad` traz a vírgula
  // (ou o ponto, conforme a região do aparelho — `lerDinheiro` lê os dois)
  numerico: 'number-pad',
  decimal: 'decimal-pad',
  telefone: 'phone-pad',
};

/** Altura do campo de várias linhas (3 linhas de 15.5px + padding). */
const ALTURA_MULTILINHA = 96;

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
  aoEnviar,
  aoSair,
  estilo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  senha?: boolean;
  teclado?: TipoDeTeclado;
  /** mensagem de erro — pinta o campo e é lida como live region */
  erro?: string;
  /** dica fixa sob o campo, quando não há erro */
  ajuda?: string;
  autoFoco?: boolean;
  capitalizar?: 'none' | 'sentences' | 'words';
  multilinha?: boolean;
  /** ação à direita dentro do trilho ("mostrar" da senha) */
  sufixo?: React.ReactNode;
  aoEnviar?: () => void;
  /** o campo perdeu o foco — quem valida no fim da digitação escuta aqui */
  aoSair?: () => void;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const [focado, setFocado] = useState(false);
  // A live region não existe no iOS: lá o erro novo é anunciado.
  useAnuncio(erro ? `${rotulo}: ${erro}` : undefined);
  const corDaBorda = erro ? cores.vermelho : focado ? cores.tint : 'transparent';

  return (
    <View style={estilo}>
      <Text
        style={[
          texto(11.5, 600, { tracking: 0.04, maiuscula: true }),
          { color: erro ? cores.vermelhoTexto : cores.tinta3 },
        ]}
      >
        {rotulo}
      </Text>

      <View
        style={[
          estilos.trilho,
          {
            marginTop: 8,
            backgroundColor: cores.preenchimento,
            borderColor: corDaBorda,
            minHeight: multilinha ? ALTURA_MULTILINHA : TAMANHO.campo,
            alignItems: multilinha ? 'flex-start' : 'center',
            paddingVertical: multilinha ? 13 : 0,
          },
        ]}
      >
        <TextInput
          value={valor}
          onChangeText={aoMudar}
          placeholder={placeholder}
          placeholderTextColor={cores.tinta3}
          secureTextEntry={senha}
          keyboardType={TECLADOS[teclado]}
          autoCapitalize={teclado === 'email' ? 'none' : capitalizar}
          autoCorrect={teclado !== 'email'}
          autoFocus={autoFoco}
          multiline={multilinha}
          onFocus={() => setFocado(true)}
          onBlur={() => {
            setFocado(false);
            aoSair?.();
          }}
          onSubmitEditing={aoEnviar}
          returnKeyType={aoEnviar ? 'done' : undefined}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? ajuda}
          selectionColor={cores.tint}
          style={[
            textoDeCampo(15.5, senha ? 600 : 500, {
              altura: 1.3,
              tracking: senha && valor ? 0.18 : undefined,
              tabular: teclado === 'numerico' || teclado === 'decimal' || teclado === 'telefone',
            }),
            estilos.entrada,
            {
              color: cores.tinta,
              textAlignVertical: multilinha ? 'top' : 'center',
            },
          ]}
        />
        {sufixo}
      </View>

      {erro ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            comEspaco(texto(12, 500, { altura: 1.4 }), { topo: 6 }),
            estilos.nota,
            { color: cores.vermelhoTexto },
          ]}
        >
          {erro}
        </Text>
      ) : ajuda ? (
        <Text
          style={[
            comEspaco(texto(12, 500, { altura: 1.4 }), { topo: 6 }),
            estilos.nota,
            { color: cores.tinta2 },
          ]}
        >
          {ajuda}
        </Text>
      ) : null}
    </View>
  );
}

const ERRO_DE_DINHEIRO = 'Valor inválido. Use números, como 62,50.';

/** O que `useCampoDeDinheiro` entrega para espalhar no `CampoDeDinheiro`. */
export interface EstadoDoCampoDeDinheiro {
  digitado: string;
  aoDigitar: (v: string) => void;
  aoSair: () => void;
  erro?: string;
}

/**
 * Estado do campo de dinheiro. O texto digitado mora aqui, separado do valor:
 * no meio da digitação ("62,") ele ainda não é um valor, e não pode zerar o
 * que estava salvo. `aoMudar` só é chamado com valor lido.
 *
 * O erro não aparece enquanto a pessoa digita — só ao sair do campo ou quando
 * a tela chama `confirmar()` antes de gravar. Senão o leitor de tela anunciaria
 * erro a cada tecla.
 */
export function useCampoDeDinheiro(
  reais: number,
  aoMudar: (reais: number) => void,
): { campo: EstadoDoCampoDeDinheiro; confirmar: () => boolean } {
  const [digitado, setDigitado] = useState(() => dinheiro(reais));
  const [revelado, setRevelado] = useState(false);
  const invalido = lerDinheiro(digitado) === null;

  const aoDigitar = (v: string) => {
    setDigitado(v);
    setRevelado(false);
    const centavos = lerDinheiro(v);
    // `lerDinheiro` devolve centavos; `ConfigPacote.valorPorAula` guarda reais
    // até o backend (`valor_por_aula_centavos`). Esta divisão é a borda: é
    // aqui que o bug do 100× volta se alguém trocar a unidade de um dos lados.
    if (centavos !== null) aoMudar(centavos / 100);
  };

  return {
    campo: {
      digitado,
      aoDigitar,
      aoSair: () => setRevelado(true),
      erro: revelado && invalido ? ERRO_DE_DINHEIRO : undefined,
    },
    confirmar: () => {
      setRevelado(true);
      return !invalido;
    },
  };
}

/**
 * Campo de valor em reais: abre com `dinheiro()` ("R$ 80,00"), aceita
 * vírgula ou ponto pelo teclado decimal e lê com `lerDinheiro`. O estado vem
 * de `useCampoDeDinheiro`, na tela que grava.
 */
export function CampoDeDinheiro({
  rotulo,
  digitado,
  aoDigitar,
  aoSair,
  erro,
  ajuda,
  estilo,
}: EstadoDoCampoDeDinheiro & {
  rotulo: string;
  ajuda?: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <CampoDeTexto
      rotulo={rotulo}
      valor={digitado}
      aoMudar={aoDigitar}
      aoSair={aoSair}
      erro={erro}
      ajuda={ajuda}
      teclado="decimal"
      capitalizar="none"
      estilo={estilo}
    />
  );
}

/**
 * Ação de texto em tint para o `sufixo` do campo: "mostrar"/"ocultar" da
 * senha, "copiar" da chave Pix. Ocupa a altura do alvo mínimo, então o toque
 * pega a faixa inteira do trilho.
 */
export function AcaoDoCampo({
  rotulo,
  aoTocar,
  rotuloAcessivel,
}: {
  rotulo: string;
  aoTocar: () => void;
  /** o que o leitor de tela diz ("Mostrar senha"), quando o rótulo é curto */
  rotuloAcessivel?: string;
}) {
  const { cores } = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      onPress={aoTocar}
      hitSlop={{ left: 10, right: 10 }}
      style={({ pressed }) => [estilos.acao, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text style={[texto(13.5, 600), { color: cores.tint }]}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  acao: { height: TAMANHO.alvoMinimo, justifyContent: 'center' },
  trilho: {
    borderRadius: RAIO.botaoInline,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
  },
  entrada: { flex: 1, minWidth: 0 },
  nota: { paddingHorizontal: 2 },
});
