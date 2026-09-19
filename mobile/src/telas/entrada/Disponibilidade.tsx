/** A5 — Onboarding, passo 2: quando o professor dá aula. */

import React from 'react';
import { StyleSheet } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { Switch } from '../../componentes/Controles';
import { GradeSemanal, RodapeDaGrade } from '../../componentes/GradeSemanal';
import { alternarBloco, resumo } from '../../dominio/disponibilidade';
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
      subtitulo="Toque nos blocos. É a base do cálculo de reposição."
      podeAvancar={form.blocos.length > 0}
      motivoDesabilitado="Marque pelo menos um bloco para continuar."
      aoAvancar={continuar}
    >
      {/* A grade pede mais largura que o padding de 17 dos cartões de ajuste. */}
      <CartaoVidro estilo={estilos.grade}>
        <GradeSemanal
          marcados={form.blocos}
          aoAlternar={(b) => atualizar({ blocos: alternarBloco(form.blocos, b) })}
        />
        <RodapeDaGrade esquerda={resumo(form.blocos)} direita="Domingo fechado" />
      </CartaoVidro>

      <CartaoDeAjuste
        titulo="Aceitar reposição fora desses blocos"
        subtitulo="Só quando não houver outra saída"
        direita={
          <Switch
            ligado={form.aceitaForaDosBlocos}
            aoAlternar={(aceitaForaDosBlocos) => atualizar({ aceitaForaDosBlocos })}
            rotulo="Aceitar reposição fora desses blocos"
          />
        }
      />
    </PassoDoOnboarding>
  );
}

const estilos = StyleSheet.create({
  grade: { paddingVertical: 14, paddingHorizontal: 12 },
});
