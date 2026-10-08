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
 *
 * Sem telefone, quem chama pode oferecer o atalho para cadastrar um
 * (`aoCadastrarTelefone`): um botão texto abaixo da nota, que some assim que o
 * aluno tem número discável.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';
import { CartaoVidro } from './Blocos';
import { BotaoCompacto, BotaoTexto } from './Controles';

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

/**
 * Se este telefone faz o botão abrir o WhatsApp em vez de copiar. A tela que
 * escreve a própria nota precisa saber disso para não prometer o que o botão
 * não vai fazer — quem decide continua sendo a função acima, uma só.
 */
export function abreNoWhatsApp(telefone?: string): boolean {
  return numeroParaWhatsApp(telefone) !== null;
}

/**
 * O link que abre a conversa com o texto preenchido.
 *
 * No aparelho é o esquema `whatsapp://`, e não o `https://wa.me`: todo
 * aparelho tem quem abra `https` (o navegador), então sem WhatsApp o `wa.me`
 * abria uma página no navegador e o `openURL` nunca falhava — o fallback de
 * copiar ficava inalcançável. O esquema próprio só tem um dono, e sem ele o
 * `openURL` rejeita. Também não perguntamos antes com `canOpenURL`: no Android
 * ele só responde `true` para esquema declarado em `queries` no manifesto, o
 * que o Expo Go não deixa configurar, e viria `false` com o WhatsApp
 * instalado. Tentar abrir e tratar a falha serve aos dois.
 *
 * Na web não há esquema para tentar, e o `wa.me` leva ao WhatsApp Web.
 */
function linkDoWhatsApp(numero: string, mensagem: string): string {
  // `encodeURIComponent` sempre: a mensagem tem acento, quebra de linha e
  // `R$`, e sem codificar chega truncada na conversa.
  const texto = encodeURIComponent(mensagem);
  return Platform.OS === 'web'
    ? `https://wa.me/${numero}?text=${texto}`
    : `whatsapp://send?phone=${numero}&text=${texto}`;
}

/**
 * Por que a mensagem foi copiada: a pessoa escolheu copiar, ou tentou abrir o
 * WhatsApp e ele não abriu. Quem chama precisa saber, porque o toast é outro.
 */
export type MotivoDaCopia = 'escolha' | 'whatsappNaoAbriu';

export function PreviaDeMensagem({
  texto: mensagem,
  destino,
  telefone,
  rotuloDoBotao,
  nota,
  aoCopiar,
  aoAbrir,
  aoCadastrarTelefone,
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
  /** a mensagem foi copiada — inclusive quando o WhatsApp não abriu, e o motivo diz qual */
  aoCopiar?: (motivo: MotivoDaCopia) => void;
  /** o WhatsApp abriu com a mensagem; não quer dizer que foi enviada */
  aoAbrir?: () => void;
  /** atalho para cadastrar o telefone, mostrado só quando não há número discável */
  aoCadastrarTelefone?: () => void;
  rodape?: React.ReactNode;
}) {
  const { cores } = useCores();
  const numero = numeroParaWhatsApp(telefone);

  const copiar = async (motivo: MotivoDaCopia) => {
    try {
      await Clipboard.setStringAsync(mensagem);
    } catch {
      // Sem área de transferência (raro): não vale derrubar a tela. Quem
      // chama decide o toast.
    }
    aoCopiar?.(motivo);
  };

  const abrir = async (discavel: string) => {
    try {
      await Linking.openURL(linkDoWhatsApp(discavel, mensagem));
    } catch {
      // Sem WhatsApp instalado: copia, para a pessoa não perder o texto, e
      // quem chama avisa que foi isso que aconteceu — sem o nome da exceção.
      await copiar('whatsappNaoAbriu');
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

      <BotaoCompacto
        rotulo={rotulo}
        aoTocar={() => (numero ? abrir(numero) : copiar('escolha'))}
      />
      {notaDoBotao ? (
        <Text style={[estilos.nota, texto(12, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
          {notaDoBotao}
        </Text>
      ) : null}
      {!numero && aoCadastrarTelefone ? (
        <BotaoTexto
          rotulo="Cadastrar telefone"
          rotuloAcessivel="Cadastrar o telefone do aluno"
          aoTocar={aoCadastrarTelefone}
          estilo={estilos.atalho}
        />
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
  // A nota acima já respira 10; o botão texto tem 44 de alvo e o rótulo
  // centrado nele, então 4 basta para não colar.
  atalho: { marginTop: 4 },
  rodape: { marginTop: 10 },
});
