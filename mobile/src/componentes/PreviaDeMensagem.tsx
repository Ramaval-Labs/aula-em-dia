/**
 * Prévia da mensagem pronta para o aluno (C6 e D5).
 *
 * O botão copia para a área de transferência em vez de abrir o WhatsApp: os
 * alunos do protótipo são fictícios e não têm número válido, então um link
 * `wa.me` mostraria "número inválido" na apresentação. `expo-clipboard` vem
 * embutido no Expo Go, sem build nativa.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Text, View } from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';
import { BotaoPequeno } from './Botoes';
import { Cartao } from './Base';

export function PreviaDeMensagem({
  texto: mensagem,
  destino,
  rotuloDoBotao = 'Copiar mensagem',
  aoCopiar,
  rodape,
}: {
  texto: string;
  /** telefone mascarado, como no handoff: "+55 51 9•••• 4182" */
  destino?: string;
  rotuloDoBotao?: string;
  aoCopiar?: () => void;
  rodape?: React.ReactNode;
}) {
  const cores = useCores();

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(mensagem);
    } catch {
      // Sem área de transferência (raro): o aviso de sucesso não deve mentir,
      // mas também não vale derrubar a tela. Quem chama decide o toast.
    }
    aoCopiar?.();
  };

  return (
    <Cartao estilo={{ overflow: 'hidden' }}>
      <View
        style={{
          paddingVertical: 11,
          paddingHorizontal: 15,
          borderBottomWidth: 1,
          borderBottomColor: cores.linha,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text style={[TIPO.rotulo, { color: cores.suave }]}>
          Mensagem
        </Text>
        {destino ? (
          <Text style={[texto(11.5, 400, { altura: 1 }), { color: cores.textoMedio }]}>
            {destino}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          margin: 15,
          padding: 14,
          borderRadius: RAIO.contador,
          backgroundColor: cores.caixa,
        }}
      >
        <Text
          accessibilityLabel={`Mensagem: ${mensagem}`}
          style={[texto(13, 400, { altura: 1.55 }), { color: cores.texto }]}
        >
          {mensagem}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 15, paddingBottom: 15, gap: 10 }}>
        <BotaoPequeno rotulo={rotuloDoBotao} aoTocar={copiar} />
        {rodape}
      </View>
    </Cartao>
  );
}
