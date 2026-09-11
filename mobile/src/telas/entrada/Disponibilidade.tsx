/** A5 — Onboarding, passo 2: quando o professor dá aula. */

import React from 'react';
import { Text, View } from 'react-native';

import { Cartao } from '../../componentes/Base';
import { Interruptor } from '../../componentes/Formulario';
import { GradeSemanal, RodapeDaGrade } from '../../componentes/GradeSemanal';
import { alternarBloco, resumo } from '../../dominio/disponibilidade';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { PassoDoOnboarding } from './PassoDoOnboarding';

export function Disponibilidade() {
  const cores = useCores();
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
      <Cartao estilo={{ paddingVertical: 14, paddingHorizontal: 12 }}>
        <GradeSemanal
          marcados={form.blocos}
          aoAlternar={(b) => atualizar({ blocos: alternarBloco(form.blocos, b) })}
        />
        <RodapeDaGrade esquerda={resumo(form.blocos)} direita="Domingo fechado" />
      </Cartao>

      <Cartao
        estilo={{
          paddingVertical: 13,
          paddingHorizontal: 15,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
        }}
      >
        <Interruptor
          ligado={form.aceitaForaDosBlocos}
          aoTrocar={(aceitaForaDosBlocos) => atualizar({ aceitaForaDosBlocos })}
          rotuloAcessivel="Aceitar reposição fora desses blocos"
        />
        <View style={{ flex: 1 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Aceitar reposição fora desses blocos
          </Text>
          <Text style={[comEspaco(TIPO.nota, { topo: 3 }), { color: cores.textoMedio }]}>
            Só quando não houver outra saída
          </Text>
        </View>
      </Cartao>
    </PassoDoOnboarding>
  );
}
