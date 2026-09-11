/** C2 — Disponibilidade do aluno (passo 1 de 3 do fluxo de reposição). */

import React from 'react';
import { Text, View } from 'react-native';

import { BarraDePassos, Cartao } from '../../componentes/Base';
import { BotaoPrimario, BotaoTexto } from '../../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, Eyebrow, TituloTela } from '../../componentes/Cabecalho';
import { GradeSemanal, RodapeDaGrade } from '../../componentes/GradeSemanal';
import { Tela } from '../../componentes/Tela';
import { alternarBloco, DIAS_UTEIS, resumoMarcados } from '../../dominio/disponibilidade';
import { primeiroNome } from '../../dominio/formato';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { TIPO } from '../../tema/tipografia';

export function DispAluno() {
  const cores = useCores();
  const { alunoId, ir, voltar } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const salvar = useDados((s) => s.salvarDisponibilidadeDoAluno);
  const avisar = useToast((s) => s.avisar);

  const [blocos, , substituir] = useRascunho(
    'disponibilidadeAluno',
    aluno?.disponibilidade ?? [],
  );

  const continuar = () => {
    if (!aluno) return;
    salvar(aluno.id, blocos);
    ir('reposicao');
  };

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 12 }}>
            <BarraDePassos total={3} atual={1} rotulo="Passo 1 de 3" />
          </View>
          <View style={{ marginTop: 14 }}>
            <Eyebrow>{aluno ? `Passo 1 de 3 · ${aluno.name}` : 'Passo 1 de 3'}</Eyebrow>
          </View>
          <View style={{ marginTop: 10 }}>
            <TituloTela tamanho={22}>
              {aluno ? `Quando o ${primeiroNome(aluno.name)} pode?` : 'Quando ele pode?'}
            </TituloTela>
          </View>
        </CabecalhoEscuro>
      }
      rodape={
        <>
          <BotaoPrimario rotulo="Ver sugestões" aoTocar={continuar} />
          <BotaoTexto
            rotulo="Enviar link para ele preencher"
            aoTocar={() =>
              avisar(
                aluno
                  ? `Link de disponibilidade copiado para ${primeiroNome(aluno.name)}.`
                  : 'Link copiado.',
              )
            }
          />
        </>
      }
    >
      <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>
        Marque o que você já sabe. Quanto mais preenchido, melhores as sugestões — e dá
        para pular e sugerir só com a sua agenda.
      </Text>

      <Cartao estilo={{ paddingVertical: 14, paddingHorizontal: 12 }}>
        <GradeSemanal
          marcados={blocos}
          dias={DIAS_UTEIS}
          rotuloDaFaixa="nome"
          aoAlternar={(b) => substituir(alternarBloco(blocos, b))}
        />
        <RodapeDaGrade
          esquerda={resumoMarcados(blocos)}
          direita="Sábado indisponível"
        />
      </Cartao>
    </Tela>
  );
}
