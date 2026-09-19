/**
 * D5 — Lembrete de cobrança, nos três tons (sheet 88%, derivada).
 *
 * Tom em segmentado dentro de cartão (padrão dos cartões de H§9), mensagem na
 * `PreviaDeMensagemVidro` e o aviso de lembrete repetido como bloco âmbar.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BlocoStatus, CartaoDeAjuste, EstadoVazio } from '../componentes/Blocos';
import { BotaoPrimario, BotaoTexto, Segmentado } from '../componentes/Controles';
import { PreviaDeMensagemVidro } from '../componentes/PreviaVidro';
import { Sheet, SubLinhaSheet } from '../componentes/Sheet';
import { primeiroNome } from '../dominio/formato';
import { mascararTelefone, mensagemDeCobranca } from '../dominio/mensagens';
import type { TomDeMensagem } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';

const TONS: { valor: TomDeMensagem; rotulo: string }[] = [
  { valor: 'cordial', rotulo: 'Cordial' },
  { valor: 'direto', rotulo: 'Direto' },
  { valor: 'formal', rotulo: 'Formal' },
];

const TITULO = 'Lembrete de cobrança';

export function Lembrete() {
  const { alunoId, concluir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const perfil = useDados((s) => s.perfil);
  const enviarLembrete = useDados((s) => s.enviarLembrete);
  const avisar = useToast((s) => s.avisar);

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

  const registrar = () => {
    enviarLembrete(aluno.id);
    avisar(avisos.lembrete(aluno));
    concluir('inadimplencia', aluno.id);
  };

  return (
    <Sheet
      titulo={TITULO}
      rodape={
        <View style={estilos.rodape}>
          <BotaoPrimario rotulo="Marcar como enviado" aoTocar={registrar} />
          {/* Botão de texto: a ação ainda não existe, e não pode ter o peso
              de "Marcar como enviado". */}
          <BotaoTexto
            rotulo="Agendar para amanhã, 9h"
            // Não existe agendamento no app: o aviso diz isso e a tela fica,
            // para o professor copiar a mensagem.
            aoTocar={() =>
              avisar(
                `O agendamento de lembretes ainda não existe nesta versão. Copie a mensagem para ${primeiroNome(
                  aluno.name,
                )} e envie quando quiser.`,
              )
            }
          />
        </View>
      }
    >
      <SubLinhaSheet texto={`Para ${primeiroNome(aluno.name)}`} />

      <CartaoDeAjuste titulo="Tom da mensagem" estilo={estilos.espaco16}>
        <Segmentado
          porte="cartao"
          opcoes={TONS}
          valor={msg.tom}
          aoTrocar={(tom) => atualizar({ tom, editado: false })}
          rotuloDoGrupo="Tom da mensagem"
          estilo={estilos.segmentado}
        />
      </CartaoDeAjuste>

      <View style={estilos.espaco14}>
        <PreviaDeMensagemVidro
          texto={mensagem}
          destino={mascararTelefone(aluno.telefone)}
          aoCopiar={() => avisar(avisos.mensagemCopiada)}
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
  // O trilho do catálogo se encolhe ao conteúdo; aqui ele ocupa o cartão.
  segmentado: { alignSelf: 'stretch' },
  rodape: { gap: 4 },
});
