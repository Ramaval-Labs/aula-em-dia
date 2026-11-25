/**
 * C2 — Disponibilidade do aluno (passo 1 de 3 do fluxo de reposição).
 *
 * Derivada: o handoff novo não desenha esta tela. Sheet de tarefa (88%) com
 * a pergunta como título, "Passo 1 de 3" na sub-linha (padrão de §5) e a
 * grade de horários livres (SCRUM-101) dentro de um cartão de vidro, com a lista
 * dos horários logo abaixo.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro } from '../../componentes/Blocos';
import { BotaoPrimario } from '../../componentes/Controles';
import {
  GradeLivre,
  ListaDeHorarios,
  PAD_CARTAO_DA_GRADE,
  RodapeDaGrade,
} from '../../componentes/GradeLivre';
import { Sheet, SubLinhaSheet } from '../../componentes/Sheet';
import { DIAS_UTEIS, intervalosDe, resumoDosMarcados } from '../../dominio/disponibilidade';
import type { Intervalo } from '../../dominio/tipos';
import { primeiroNome } from '../../dominio/formato';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { PAD } from '../../tema/tokens';

/** Constante fora do componente: o rascunho não ganha uma lista nova a cada render. */
const SEM_HORARIOS: Intervalo[] = [];

export function DispAluno() {
  const { cores } = useCores();
  const { alunoId, ir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const salvar = useDados((s) => s.salvarDisponibilidadeDoAluno);

  const [blocos, , substituir] = useRascunho(
    'disponibilidadeAluno',
    aluno?.disponibilidade ? intervalosDe(aluno.disponibilidade) : SEM_HORARIOS,
  );

  const continuar = () => {
    if (!aluno) return;
    salvar(aluno.id, blocos);
    ir('reposicao');
  };

  return (
    <Sheet
      titulo={aluno ? `Quando o ${primeiroNome(aluno.name)} pode?` : 'Quando ele pode?'}
      // "Enviar link para ele preencher" saiu (SCRUM-100): o toque dizia ter
      // copiado um link que não existia. O aluno marca a disponibilidade pela
      // página dele, no link da ficha.
      rodape={<BotaoPrimario rotulo="Ver sugestões" aoTocar={continuar} />}
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
        <GradeLivre horarios={blocos} dias={DIAS_UTEIS} aoMudar={substituir} />
        <RodapeDaGrade esquerda={resumoDosMarcados(blocos)} direita="Sábado indisponível" />
      </CartaoVidro>
      <View style={estilos.lista}>
        <ListaDeHorarios recolhida horarios={blocos} dias={DIAS_UTEIS} aoMudar={substituir} />
      </View>
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  recuo: PAD.recuo,
  cartao: { marginTop: 14, ...PAD_CARTAO_DA_GRADE },
  lista: { marginTop: 12 },
});
