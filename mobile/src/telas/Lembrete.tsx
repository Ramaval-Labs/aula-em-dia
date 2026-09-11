/** D5 — Lembrete de cobrança, nos três tons. */

import React from 'react';
import { Text, View } from 'react-native';

import { Caixa, Cartao, EstadoVazio } from '../componentes/Base';
import { BotaoPrimario, BotaoTexto, Segmentado } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { PreviaDeMensagem } from '../componentes/PreviaDeMensagem';
import { Tela } from '../componentes/Tela';
import { primeiroNome } from '../dominio/formato';
import { mascararTelefone, mensagemDeCobranca } from '../dominio/mensagens';
import type { TomDeMensagem } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { TIPO } from '../tema/tipografia';
import { TAMANHO } from '../tema/tokens';

const TONS: { valor: TomDeMensagem; rotulo: string }[] = [
  { valor: 'cordial', rotulo: 'Cordial' },
  { valor: 'direto', rotulo: 'Direto' },
  { valor: 'formal', rotulo: 'Formal' },
];

export function Lembrete() {
  const cores = useCores();
  const { alunoId, concluir, voltar } = useNavegacao();
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
      <Tela
        cabecalho={
          <CabecalhoEscuro corDaCurva={cores.tela}>
            <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          </CabecalhoEscuro>
        }
      >
        <EstadoVazio titulo="Aluno não encontrado." />
      </Tela>
    );
  }

  const texto_ = mensagemDeCobranca(aluno, msg.tom, perfil.chavePix);
  const segundoLembrete = (aluno.lembretes ?? 0) > 0;

  const registrar = () => {
    enviarLembrete(aluno.id);
    avisar(avisos.lembrete(aluno));
    concluir('inadimplencia', aluno.id);
  };

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Lembrete de cobrança</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>
            {`Para ${primeiroNome(aluno.name)}`}
          </Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 12 }}
      rodape={
        <>
          <BotaoPrimario rotulo="Marcar como enviado" aoTocar={registrar} />
          {/* Botão de texto: a ação ainda não existe, e contorno escuro dava a
              ela o mesmo peso de "Marcar como enviado". */}
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
        </>
      }
    >
      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[TIPO.eyebrow, { letterSpacing: 1.6, color: cores.suave }]}>
          Tom da mensagem
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={TONS}
            valor={msg.tom}
            aoTrocar={(tom) => atualizar({ tom, editado: false })}
            rotuloAcessivel="Tom da mensagem"
          />
        </View>
      </Cartao>

      <PreviaDeMensagem
        texto={texto_}
        destino={mascararTelefone(aluno.telefone)}
        aoCopiar={() => avisar(avisos.mensagemCopiada)}
      />

      {segundoLembrete ? (
        <Caixa>
          <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>
            {`Este é o ${(aluno.lembretes ?? 0) + 1}º lembrete${
              aluno.ultimoLembrete ? `. O último foi em ${aluno.ultimoLembrete}.` : '.'
            } Vale considerar pausar as aulas ou combinar parcelamento.`}
          </Text>
        </Caixa>
      ) : null}
    </Tela>
  );
}
