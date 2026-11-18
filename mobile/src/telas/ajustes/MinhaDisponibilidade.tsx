/**
 * E3 — Minha disponibilidade (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, com a `GradeSemanal` nova e a lista de folgas em lista agrupada.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CartaoVidro, EstadoVazio } from '../../componentes/Blocos';
import { CampoDeTexto } from '../../componentes/Campos';
import {
  BotaoInline,
  BotaoPrimario,
  BotaoSecundario,
  BotaoTexto,
} from '../../componentes/Controles';
import {
  GradeSemanal,
  PAD_CARTAO_DA_GRADE,
  RodapeDaGrade,
} from '../../componentes/GradeSemanal';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import {
  adicionarFolga,
  alternarBloco,
  ERRO_FOLGA,
  folgaValida,
  periodoDaFolga,
  resumo,
} from '../../dominio/disponibilidade';
import type { Folga } from '../../dominio/tipos';
import { somenteDigitos } from '../../dominio/validacao';
import { avisos, useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { estilos } from './estilos';
import { CartaoComSwitch, TelaDeAjuste } from './pecas';

/** "0709" → "07/09": o teclado numérico do iOS não tem barra. */
const mascaraDdMm = (v: string): string => {
  const d = somenteDigitos(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Em qual campo o erro do domínio aparece. */
const CAMPO_DO_ERRO: Record<string, 'de' | 'ate'> = {
  [ERRO_FOLGA.fimInvalido]: 'ate',
  [ERRO_FOLGA.fimAntesDoInicio]: 'ate',
};

export function MinhaDisponibilidade() {
  const { concluir } = useNavegacao();
  const salva = useDados((s) => s.disponibilidade);
  const salvarDisponibilidade = useDados((s) => s.salvarDisponibilidade);
  const avisar = useToast((s) => s.avisar);

  const [d, atualizar, , descartar] = useRascunho('disponibilidadeProfessor', salva);
  const mudou = JSON.stringify(d) !== JSON.stringify(salva);
  // Sair pelo voltar não passa por `concluir` nem `trocarTab`, que limpam os
  // rascunhos: sem isto, a folga não salva reaparece na próxima visita.
  useEffect(() => descartar, [descartar]);

  // Só o cartão aberto e o texto dos campos morrem com a tela; a lista de
  // folgas mora no rascunho, como o resto.
  const [abrindo, setAbrindo] = useState(false);
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const fecharFolga = () => {
    setAbrindo(false);
    setDe('');
    setAte('');
    setMotivo('');
    setErro(null);
  };

  const adicionar = () => {
    // Um dia só: "até" vazio vira o próprio "de", que é o contrato de `Folga`.
    const nova: Folga = { de, ate: ate || de, motivo: motivo.trim() };
    const problema = folgaValida(nova, d.folgas);
    if (problema) {
      setErro(problema);
      return;
    }
    atualizar({ folgas: adicionarFolga(d.folgas, nova) });
    fecharFolga();
  };

  const campoDoErro = erro ? (CAMPO_DO_ERRO[erro] ?? 'de') : null;

  // Folga digitada e não adicionada: o Salvar a inclui, se for válida, em vez de
  // descartá-la calado. Inválida, o erro aparece no campo e nada é salvo.
  const folgaPendente = abrindo && !!de;
  const salvar = () => {
    let dados = d;
    if (folgaPendente) {
      const nova: Folga = { de, ate: ate || de, motivo: motivo.trim() };
      const problema = folgaValida(nova, d.folgas);
      if (problema) {
        setErro(problema);
        return;
      }
      dados = { ...d, folgas: adicionarFolga(d.folgas, nova) };
    }
    salvarDisponibilidade(dados);
    avisar(avisos.disponibilidadeSalva);
    concluir('ajustes');
  };

  return (
    <TelaDeAjuste
      comTeclado
      titulo="Minha disponibilidade"
      subtitulo="É a base do cálculo de reposição."
      rodape={
        <BotaoPrimario
          rotulo="Salvar"
          desabilitado={!mudou && !folgaPendente}
          aoTocar={salvar}
        />
      }
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
                  aoTocar={() => atualizar({ folgas: d.folgas.filter((x) => x !== f) })}
                />
              }
            />
          ))
        )}
      </ListaAgrupada>
      {/* "Marcar folga" mora abaixo da lista, como na referência (Fluxo E), e
          abre o cartão do formulário no lugar dele. No cabeçalho do grupo ele
          era vidro direto sobre o fundo e engrossava a linha do cabeçalho. */}
      {abrindo ? (
        <CartaoVidro estilo={[estilos.cartao, proprios.folga]}>
          <View style={proprios.datas}>
            <CampoDeTexto
              rotulo="De"
              valor={de}
              aoMudar={(v) => {
                setDe(mascaraDdMm(v));
                setErro(null);
              }}
              placeholder="dd/mm"
              teclado="numerico"
              erro={campoDoErro === 'de' ? (erro ?? undefined) : undefined}
              autoFoco
              estilo={proprios.flexivel}
            />
            <CampoDeTexto
              rotulo="Até"
              valor={ate}
              aoMudar={(v) => {
                setAte(mascaraDdMm(v));
                setErro(null);
              }}
              placeholder="dd/mm"
              teclado="numerico"
              erro={campoDoErro === 'ate' ? (erro ?? undefined) : undefined}
              ajuda="Vazio: um dia só"
              estilo={proprios.flexivel}
            />
          </View>
          <CampoDeTexto
            rotulo="Motivo"
            valor={motivo}
            aoMudar={setMotivo}
            placeholder="Feriado, viagem…"
            aoEnviar={adicionar}
          />
          <BotaoSecundario rotulo="Adicionar" aoTocar={adicionar} desabilitado={!de} />
          <BotaoTexto rotulo="Cancelar" aoTocar={fecharFolga} />
        </CartaoVidro>
      ) : (
        <BotaoSecundario
          rotulo="Marcar folga"
          aoTocar={() => setAbrindo(true)}
          estilo={estilos.bloco}
        />
      )}
    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  cartaoGrade: { marginTop: 12, ...PAD_CARTAO_DA_GRADE },
  folga: { gap: 16 },
  datas: { flexDirection: 'row', gap: 12 },
  flexivel: { flex: 1, minWidth: 0 },
});
