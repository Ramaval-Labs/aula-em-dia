/**
 * Chave Pix e cobrança (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes — campo em cartão de vidro e `PreviaDeMensagem`.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { View } from 'react-native';

import { CartaoVidro } from '../../componentes/Blocos';
import { AcaoDoCampo, CampoDeTexto } from '../../componentes/Campos';
import { BotaoPrimario } from '../../componentes/Controles';
import { PreviaDeMensagem } from '../../componentes/PreviaDeMensagem';
import { mensagemDeCobranca } from '../../dominio/mensagens';
import { temPacote } from '../../dominio/politica';
import { avisos, useDados } from '../../estado/dados';
import { ehSheet, useNavegacao, type Tela } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { estilos } from './estilos';
import { TelaDeAjuste } from './pecas';

/** Título curto de cada tela que pode abrir a Chave Pix (rótulo do voltar). */
const ROTULO_DA_ORIGEM: Partial<Record<Tela, string>> = {
  ajustes: 'Ajustes',
  inadimplencia: 'Cobrança',
  financeiro: 'Financeiro',
  aluno: 'Aluno',
};

export function ChavePix() {
  const { concluir, voltar } = useNavegacao();
  const pilha = useNavegacao((s) => s.pilha);
  const perfil = useDados((s) => s.perfil);
  const alunos = useDados((s) => s.alunos);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const avisar = useToast((s) => s.avisar);
  const [chave, setChave] = React.useState(perfil.chavePix ?? '');
  const mudou = chave.trim() !== (perfil.chavePix ?? '');

  // A Chave Pix também abre pelo sheet de pagamento: o voltar leva o rótulo
  // de onde se veio e Salvar desempilha em vez de saltar para Ajustes
  // (o mesmo padrão de `Inadimplencia.tsx`).
  const origem = [...pilha].reverse().find((q) => !ehSheet(q.tela))?.tela;
  const deAjustes = origem === undefined || origem === 'ajustes';

  // Prévia com um aluno de verdade, para mostrar onde a chave entra na
  // cobrança. Sem aluno com pacote, não há cobrança para mostrar.
  const exemplo = alunos.find((a) => !a.arquivado && temPacote(a));
  const previa = exemplo
    ? mensagemDeCobranca(exemplo, 'cordial', chave.trim() || undefined)
    : null;

  return (
    <TelaDeAjuste
      comTeclado
      titulo="Chave Pix e cobrança"
      subtitulo="Entra automaticamente na mensagem de cobrança."
      voltarPara={(origem && ROTULO_DA_ORIGEM[origem]) ?? 'Ajustes'}
      rodape={
        <BotaoPrimario
          rotulo="Salvar"
          desabilitado={!mudou}
          aoTocar={() => {
            salvarPerfil({ ...perfil, chavePix: chave.trim() || undefined });
            avisar('Chave Pix salva.');
            if (deAjustes) concluir('ajustes');
            else voltar();
          }}
        />
      }
    >
      <CartaoVidro estilo={[estilos.cartao, estilos.primeiro]}>
        <CampoDeTexto
          rotulo="Chave Pix"
          valor={chave}
          aoMudar={setChave}
          placeholder="e-mail, telefone ou aleatória"
          capitalizar="none"
          sufixo={
            chave ? (
              <AcaoDoCampo
                rotulo="copiar"
                rotuloAcessivel="Copiar chave Pix"
                aoTocar={() => {
                  Clipboard.setStringAsync(chave.trim()).catch(() => {});
                  avisar('Chave Pix copiada.');
                }}
              />
            ) : undefined
          }
        />
      </CartaoVidro>

      {previa ? (
        <View style={estilos.bloco}>
          <PreviaDeMensagem
            texto={previa}
            aoCopiar={() => avisar(avisos.mensagemCopiada)}
          />
        </View>
      ) : null}
    </TelaDeAjuste>
  );
}
