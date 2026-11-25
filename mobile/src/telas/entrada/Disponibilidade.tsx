/** A5 — Onboarding, passo 2: quando o professor dá aula. */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { Switch } from '../../componentes/Controles';
import {
  GradeLivre,
  ListaDeHorarios,
  PAD_CARTAO_DA_GRADE,
  RodapeDaGrade,
} from '../../componentes/GradeLivre';
import { resumoDosHorarios } from '../../dominio/disponibilidade';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { PassoDoOnboarding } from './PassoDoOnboarding';

export function Disponibilidade() {
  const avancar = useSessao((s) => s.avancar);
  const salvar = useDados((s) => s.salvarDisponibilidade);

  const [form, atualizar] = useRascunho('disponibilidadeProfessor', {
    blocos: [],
    aceitaForaDosBlocos: true,
    sugereSabado: false,
    folgas: [],
  });

  const continuar = () => {
    salvar(form);
    avancar();
  };

  return (
    <PassoDoOnboarding
      passo={2}
      titulo="Quando você dá aula"
      subtitulo="Marque os horários em que você dá aula. É a base do cálculo de reposição."
      podeAvancar={form.blocos.length > 0}
      motivoDesabilitado="Marque pelo menos um horário para continuar."
      aoAvancar={continuar}
    >
      {/* A grade pede mais largura que o padding de 17 dos cartões de ajuste. */}
      <CartaoVidro estilo={estilos.grade}>
        <GradeLivre horarios={form.blocos} aoMudar={(blocos) => atualizar({ blocos })} />
        <RodapeDaGrade
          esquerda={resumoDosHorarios(form.blocos)}
          direita={form.sugereSabado ? 'Domingo fechado' : 'Sábado e domingo fora'}
        />
      </CartaoVidro>
      <View>
        <ListaDeHorarios recolhida horarios={form.blocos} aoMudar={(blocos) => atualizar({ blocos })} />
      </View>

      <CartaoDeAjuste
        titulo="Aceitar reposição fora desses horários"
        subtitulo="Só quando não houver outra saída"
        direita={
          <Switch
            ligado={form.aceitaForaDosBlocos}
            aoAlternar={(aceitaForaDosBlocos) => atualizar({ aceitaForaDosBlocos })}
            rotulo="Aceitar reposição fora desses horários"
          />
        }
      />
    </PassoDoOnboarding>
  );
}

const estilos = StyleSheet.create({
  grade: PAD_CARTAO_DA_GRADE,
});
