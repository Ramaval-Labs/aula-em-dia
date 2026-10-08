/**
 * D5 — Lembrete de cobrança, nos três tons (sheet 88%, derivada).
 *
 * Tom em segmentado dentro de cartão (padrão dos cartões de H§9), mensagem na
 * `PreviaDeMensagem` e o aviso de lembrete repetido como bloco âmbar.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BlocoStatus, CartaoDeAjuste, EstadoVazio } from '../componentes/Blocos';
import { BotaoPrimario, Segmentado } from '../componentes/Controles';
import { abreNoWhatsApp, PreviaDeMensagem } from '../componentes/PreviaDeMensagem';
import { Sheet, SubLinhaSheet } from '../componentes/Sheet';
import { primeiroNome } from '../dominio/formato';
import { mascararTelefone, mensagemDeCobranca } from '../dominio/mensagens';
import type { TomDeMensagem } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { rascunhoDeAluno, useFormularios, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';

const TONS: { valor: TomDeMensagem; rotulo: string }[] = [
  { valor: 'cordial', rotulo: 'Cordial' },
  { valor: 'direto', rotulo: 'Direto' },
  { valor: 'formal', rotulo: 'Formal' },
];

const TITULO = 'Lembrete de cobrança';

export function Lembrete() {
  const { alunoId, concluir, ir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const perfil = useDados((s) => s.perfil);
  const enviarLembrete = useDados((s) => s.enviarLembrete);
  const avisar = useToast((s) => s.avisar);
  const reiniciarRascunho = useFormularios((s) => s.substituir);

  const [msg, atualizar] = useRascunho('mensagem', {
    tom: 'cordial' as TomDeMensagem,
    texto: '',
    editado: false,
  });

  if (!aluno) {
    return (
      <Sheet titulo={TITULO}>
        <EstadoVazio titulo="Aluno não encontrado." />
      </Sheet>
    );
  }

  const mensagem = mensagemDeCobranca(aluno, msg.tom, perfil.chavePix);
  const segundoLembrete = (aluno.lembretes ?? 0) > 0;
  // A nota é escrita aqui (ela carrega a limitação de agendamento, que é
  // desta tela), então precisa saber qual dos dois caminhos o botão vai
  // tomar. Sem chave Pix a mensagem não quebra: `mensagemDeCobranca` troca a
  // linha da chave por "me avisa como prefere pagar".
  const abre = abreNoWhatsApp(aluno.telefone);
  const nome = primeiroNome(aluno.name);

  const registrar = () => {
    enviarLembrete(aluno.id);
    avisar(avisos.lembrete(aluno));
    concluir('inadimplencia', aluno.id);
  };

  return (
    <Sheet
      titulo={TITULO}
      // Um primário só: agendar o envio não existe no app, e um botão que só
      // explica isso ocupava o lugar da ação de verdade. A limitação está na
      // nota abaixo da prévia. O botão da prévia abre o WhatsApp, mas quem
      // diz que o lembrete saiu continua sendo o professor, aqui — abrir uma
      // conversa não é prova de envio.
      rodape={<BotaoPrimario rotulo="Marcar como enviado" aoTocar={registrar} />}
    >
      <SubLinhaSheet texto={`Para ${nome}`} />

      <CartaoDeAjuste titulo="Tom da mensagem" estilo={estilos.espaco16}>
        <Segmentado
          porte="cartao"
          opcoes={TONS}
          valor={msg.tom}
          aoTrocar={(tom) => atualizar({ tom, editado: false })}
          rotuloDoGrupo="Tom da mensagem"
        />
      </CartaoDeAjuste>

      <View style={estilos.espaco14}>
        <PreviaDeMensagem
          texto={mensagem}
          destino={mascararTelefone(aluno.telefone)}
          telefone={aluno.telefone}
          nota={
            abre
              ? `O WhatsApp abre com a mensagem para ${nome}. Agendar o envio ainda não existe nesta versão.`
              : `Copie e envie para ${nome} quando quiser: agendar o envio ainda não existe nesta versão.`
          }
          aoAbrir={() => avisar(avisos.whatsappAberto)}
          aoCopiar={(motivo) =>
            avisar(motivo === 'whatsappNaoAbriu' ? avisos.whatsappNaoAbriu : avisos.mensagemCopiada)
          }
          // Salvar o telefone volta para cá, com o tom escolhido intacto.
          aoCadastrarTelefone={() => {
            reiniciarRascunho('aluno', rascunhoDeAluno(aluno, 'lembrete'));
            ir('alunoForm');
          }}
        />
      </View>

      {segundoLembrete ? (
        <BlocoStatus
          tom="ambar"
          titulo={`Este é o ${(aluno.lembretes ?? 0) + 1}º lembrete`}
          texto={`${
            aluno.ultimoLembrete ? `O último foi em ${aluno.ultimoLembrete}. ` : ''
          }Vale considerar pausar as aulas ou combinar parcelamento.`}
          estilo={estilos.espaco14}
        />
      ) : null}
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  espaco14: { marginTop: 14 },
  espaco16: { marginTop: 16 },
});
