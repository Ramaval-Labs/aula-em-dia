/**
 * Prévia da mensagem pronta para o aluno no idioma iOS Glass —
 * **derivada**: o handoff não desenha o envio de mensagem, mas o app tem
 * duas telas que dependem dela (confirmar reposição e lembrete de cobrança).
 *
 * Como foi derivada: cartão de vidro (o contêiner de tudo no sistema) com um
 * cabeçalho de grupo "MENSAGEM" e o destino à direita, o texto dentro de uma
 * caixa `preenchimento` de raio 13 — o mesmo trilho do campo de texto, que é
 * o jeito do sistema de dizer "isto é conteúdo editável/copiável" — e um
 * botão secundário compacto para copiar.
 *
 * O botão copia em vez de abrir o WhatsApp: os alunos do protótipo são
 * fictícios e um link `wa.me` mostraria "número inválido" na apresentação.
 * Por isso a nota abaixo do botão diz que o envio é manual — instrução mora
 * na tela, não no toast, que só confirma o que foi feito.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';
import { CartaoVidro } from './Blocos';
import { BotaoCompacto } from './Controles';

export function PreviaDeMensagem({
  texto: mensagem,
  destino,
  rotuloDoBotao = 'Copiar mensagem',
  nota = 'O envio é seu: cole a mensagem na conversa com o aluno.',
  aoCopiar,
  rodape,
}: {
  texto: string;
  /** telefone mascarado, como no handoff antigo: "+55 51 9•••• 4182" */
  destino?: string;
  rotuloDoBotao?: string;
  /** o que fazer com a mensagem depois de copiar */
  nota?: string;
  aoCopiar?: () => void;
  rodape?: React.ReactNode;
}) {
  const { cores } = useCores();

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(mensagem);
    } catch {
      // Sem área de transferência (raro): não vale derrubar a tela. Quem
      // chama decide o toast.
    }
    aoCopiar?.();
  };

  return (
    <CartaoVidro>
      <View style={estilos.cabecalho}>
        <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>Mensagem</Text>
        {destino ? (
          <Text style={[texto(11.5, 500), { color: cores.tinta2 }]}>{destino}</Text>
        ) : null}
      </View>

      <View style={[estilos.caixa, { backgroundColor: cores.preenchimento }]}>
        <Text
          accessibilityLabel={`Mensagem: ${mensagem}`}
          style={[texto(13, 500, { altura: 1.55 }), { color: cores.tinta }]}
        >
          {mensagem}
        </Text>
      </View>

      <BotaoCompacto rotulo={rotuloDoBotao} aoTocar={copiar} />
      {nota ? (
        <Text style={[estilos.nota, texto(12, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
          {nota}
        </Text>
      ) : null}
      {rodape ? <View style={estilos.rodape}>{rodape}</View> : null}
    </CartaoVidro>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  caixa: {
    marginTop: 12,
    marginBottom: 14,
    padding: 14,
    borderRadius: RAIO.botaoInline,
  },
  nota: { marginTop: 10, textAlign: 'center' },
  rodape: { marginTop: 10 },
});
