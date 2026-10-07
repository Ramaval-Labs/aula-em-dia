/**
 * Prévia da mensagem pronta para o aluno no idioma iOS Glass —
 * **derivada**: o handoff não desenha o envio de mensagem, mas o app tem
 * duas telas que dependem dela (confirmar reposição e lembrete de cobrança).
 *
 * Como foi derivada: cartão de vidro (o contêiner de tudo no sistema) com um
 * cabeçalho de grupo "MENSAGEM" e o destino à direita, o texto dentro de uma
 * caixa `preenchimento` de raio 13 — o mesmo trilho do campo de texto, que é
 * o jeito do sistema de dizer "isto é conteúdo editável/copiável" — e um
 * botão secundário compacto.
 *
 * O botão tem dois comportamentos, e quem decide é a presença de `telefone`:
 * com telefone ele abre a conversa no WhatsApp já com o texto preenchido; sem
 * telefone ele copia, que é o que a chave Pix de Ajustes e o catálogo usam.
 * Abrir o WhatsApp **não é prova de envio** — o app só sabe que abriu o link,
 * e é isso que a nota abaixo do botão e o toast de quem chama dizem.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';
import { CartaoVidro } from './Blocos';
import { BotaoCompacto } from './Controles';

/**
 * O telefone como o `wa.me` espera: só dígitos, com o código do país na
 * frente. A semente guarda DDD + número ("51900000101"), e sem o 55 o
 * WhatsApp leria o 51 como país (Peru) e abriria conversa com outra pessoa.
 * Devolve `null` quando não dá para discar — aí o botão volta a copiar, que é
 * o mesmo corte de `mascararTelefone` no domínio (menos de 10 dígitos).
 */
function numeroParaWhatsApp(telefone?: string): string | null {
  const d = (telefone ?? '').replace(/\D/g, '');
  if (d.length < 10) return null;
  // 10 ou 11 dígitos é número brasileiro sem país (DDD + 8 ou 9); acima
  // disso já vem internacional, com 55 ou com outro país.
  return d.length <= 11 ? `55${d}` : d;
}

export function PreviaDeMensagem({
  texto: mensagem,
  destino,
  telefone,
  rotuloDoBotao,
  nota,
  aoCopiar,
  aoAbrir,
  rodape,
}: {
  texto: string;
  /** telefone mascarado, como no handoff antigo: "+55 51 9•••• 4182" */
  destino?: string;
  /** telefone de verdade. Com ele o botão abre o WhatsApp; sem ele, copia. */
  telefone?: string;
  rotuloDoBotao?: string;
  /** o que fazer com a mensagem depois da ação */
  nota?: string;
  /** a mensagem foi copiada — inclusive quando o WhatsApp não abriu */
  aoCopiar?: () => void;
  /** o WhatsApp abriu com a mensagem; não quer dizer que foi enviada */
  aoAbrir?: () => void;
  rodape?: React.ReactNode;
}) {
  const { cores } = useCores();
  const numero = numeroParaWhatsApp(telefone);

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(mensagem);
    } catch {
      // Sem área de transferência (raro): não vale derrubar a tela. Quem
      // chama decide o toast.
    }
    aoCopiar?.();
  };

  const abrir = async () => {
    try {
      // `encodeURIComponent` sempre: a mensagem tem acento, quebra de linha e
      // `R$`, e sem codificar chega truncada na conversa.
      await Linking.openURL(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`);
    } catch {
      // Sem WhatsApp instalado ou sem quem abra o link: copia, para a pessoa
      // não perder o texto, e quem chama avisa que foi isso que aconteceu.
      await copiar();
      return;
    }
    aoAbrir?.();
  };

  const rotulo = rotuloDoBotao ?? (numero ? 'Abrir no WhatsApp' : 'Copiar mensagem');
  const notaDoBotao =
    nota ??
    (numero
      ? 'O WhatsApp abre com a mensagem pronta. Apertar enviar é com você.'
      : 'O envio é seu: cole a mensagem na conversa com o aluno.');

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

      <BotaoCompacto rotulo={rotulo} aoTocar={numero ? abrir : copiar} />
      {notaDoBotao ? (
        <Text style={[estilos.nota, texto(12, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
          {notaDoBotao}
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
