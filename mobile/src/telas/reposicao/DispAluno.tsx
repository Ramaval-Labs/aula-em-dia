/**
 * C2 — Disponibilidade do aluno (passo 1 de 3 do fluxo de reposição).
 *
 * Derivada: o handoff novo não desenha esta tela. Sheet de tarefa (88%) com
 * a pergunta como título, "Passo 1 de 3" na sub-linha (padrão de §5) e a
 * grade semanal dentro de um cartão de vidro.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { CartaoVidro } from '../../componentes/Blocos';
import { BotaoPrimario, BotaoTexto } from '../../componentes/Controles';
import {
  GradeSemanal,
  PAD_CARTAO_DA_GRADE,
  RodapeDaGrade,
} from '../../componentes/GradeSemanal';
import { Sheet, SubLinhaSheet } from '../../componentes/Sheet';
import { alternarBloco, DIAS_UTEIS, resumoMarcados } from '../../dominio/disponibilidade';
import { primeiroNome } from '../../dominio/formato';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';

export function DispAluno() {
  const { cores } = useCores();
  const { alunoId, ir } = useNavegacao();
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
    <Sheet
      titulo={aluno ? `Quando o ${primeiroNome(aluno.name)} pode?` : 'Quando ele pode?'}
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
      <SubLinhaSheet passo="Passo 1 de 3" texto={aluno?.name} />

      <Text
        style={[
          comEspaco(texto(13.5, 500, { altura: 1.5 }), { topo: 14 }),
          estilos.recuo,
          { color: cores.tinta2 },
        ]}
      >
        Marque o que você já sabe. Quanto mais preenchido, melhores as sugestões — e dá
        para pular e sugerir só com a sua agenda.
      </Text>

      <CartaoVidro estilo={estilos.cartao}>
        <GradeSemanal
          marcados={blocos}
          dias={DIAS_UTEIS}
          rotuloDaFaixa="nome"
          aoAlternar={(b) => substituir(alternarBloco(blocos, b))}
        />
        <RodapeDaGrade esquerda={resumoMarcados(blocos)} direita="Sábado indisponível" />
      </CartaoVidro>
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  recuo: { paddingHorizontal: 6 },
  cartao: { marginTop: 14, ...PAD_CARTAO_DA_GRADE },
});
