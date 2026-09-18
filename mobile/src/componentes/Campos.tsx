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
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useVidro } from '../tema/TemaProvider';
import { comEspaco, texto, textoDeCampo } from '../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../tema/tokens';

export type TipoDeTeclado = 'texto' | 'email' | 'numerico' | 'telefone';

const TECLADOS: Record<TipoDeTeclado, KeyboardTypeOptions> = {
  texto: 'default',
  email: 'email-address',
  numerico: 'number-pad',
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
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useVidro();
  const [focado, setFocado] = useState(false);
  const corDaBorda = erro ? cores.vermelho : focado ? cores.tint : 'transparent';

  return (
    <View style={estilo}>
      <Text
        style={[
          texto(11.5, 600, { tracking: 0.04, maiuscula: true }),
          { color: erro ? cores.vermelho : cores.tinta3 },
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
            minHeight: multilinha ? ALTURA_MULTILINHA : TAMANHO_VIDRO.campo,
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
          onBlur={() => setFocado(false)}
          onSubmitEditing={aoEnviar}
          returnKeyType={aoEnviar ? 'done' : undefined}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? ajuda}
          selectionColor={cores.tint}
          style={[
            textoDeCampo(15.5, senha ? 600 : 500, {
              altura: 1.3,
              tracking: senha && valor ? 0.18 : undefined,
              tabular: teclado === 'numerico' || teclado === 'telefone',
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
            { color: cores.vermelho },
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

const estilos = StyleSheet.create({
  trilho: {
    borderRadius: RAIO_VIDRO.botaoInline,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
  },
  entrada: { flex: 1, minWidth: 0 },
  nota: { paddingHorizontal: 2 },
});
