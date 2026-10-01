/**
 * E3 — Minha disponibilidade (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, com a `GradeSemanal` nova e a lista de folgas em lista agrupada.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CartaoVidro, EstadoVazio } from '../../componentes/Blocos';
import { BotaoInline, BotaoPrimario } from '../../componentes/Controles';
import {
  GradeSemanal,
  PAD_CARTAO_DA_GRADE,
  RodapeDaGrade,
} from '../../componentes/GradeSemanal';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import { alternarBloco, periodoDaFolga, resumo } from '../../dominio/disponibilidade';
import { avisos, useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { estilos } from './estilos';
import { CartaoComSwitch, TelaDeAjuste } from './pecas';

export function MinhaDisponibilidade() {
  const { concluir } = useNavegacao();
  const salva = useDados((s) => s.disponibilidade);
  const salvarDisponibilidade = useDados((s) => s.salvarDisponibilidade);
  const avisar = useToast((s) => s.avisar);

  const [d, atualizar] = useRascunho('disponibilidadeProfessor', salva);
  const mudou = JSON.stringify(d) !== JSON.stringify(salva);

  const salvar = () => {
    salvarDisponibilidade(d);
    avisar(avisos.disponibilidadeSalva);
    concluir('ajustes');
  };

  return (
    <TelaDeAjuste
      titulo="Minha disponibilidade"
      subtitulo="É a base do cálculo de reposição."
      rodape={<BotaoPrimario rotulo="Salvar" desabilitado={!mudou} aoTocar={salvar} />}
    >
      <CartaoVidro estilo={[proprios.cartaoGrade, estilos.primeiro]}>
        <GradeSemanal
          marcados={d.blocos}
          aoAlternar={(b) => atualizar({ blocos: alternarBloco(d.blocos, b) })}
        />
        <RodapeDaGrade esquerda={resumo(d.blocos)} direita="Domingo fechado" />
      </CartaoVidro>

      <CartaoComSwitch
        titulo="Aceitar reposição fora dos blocos"
        sub="Só quando não houver outra saída"
        ligado={d.aceitaForaDosBlocos}
        aoAlternar={(aceitaForaDosBlocos) => atualizar({ aceitaForaDosBlocos })}
      />
      <CartaoComSwitch
        titulo="Sugerir sábados"
        sub="Entra na lista de horários possíveis"
        ligado={d.sugereSabado}
        aoAlternar={(sugereSabado) => atualizar({ sugereSabado })}
      />

      <View style={estilos.grupo}>
        <CabecalhoGrupo titulo="Folgas e feriados" />
      </View>
      <ListaAgrupada>
        {d.folgas.length === 0 ? (
          <EstadoVazio titulo="Nenhuma folga marcada" />
        ) : (
          d.folgas.map((f) => (
            <LinhaLista
              key={`${f.de}-${f.motivo}`}
              titulo={periodoDaFolga(f)}
              subtitulo={f.motivo}
              direita={
                <BotaoInline
                  rotulo="Remover"
                  variante="vidro"
                  rotuloAcessivel={`Remover folga: ${periodoDaFolga(f)}`}
                  aoTocar={() =>
                    atualizar({ folgas: d.folgas.filter((x) => x.de !== f.de) })
                  }
                />
              }
            />
          ))
        )}
      </ListaAgrupada>
    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  cartaoGrade: { marginTop: 12, ...PAD_CARTAO_DA_GRADE },
});
