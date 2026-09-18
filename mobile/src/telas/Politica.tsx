/**
 * Tela 9 — Política de faltas (Fluxo E2). Handoff iOS Glass §9.
 * Edita um rascunho e mostra o impacto antes de salvar. O que é salvo aqui
 * muda o cálculo da tela Registrar aula no próximo registro.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BlocoStatus, CartaoVidro } from '../componentes/Blocos';
import { TelaVidro } from '../componentes/Chassi';
import { BotaoPrimario, BotaoTexto, Segmentado, Stepper, Switch } from '../componentes/Controles';
import { temPacote } from '../dominio/politica';
import type { Politicas } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useVidro } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../tema/tipografia';

const PRAZOS = [4, 12, 24, 48].map((h) => ({ valor: h, rotulo: `${h}h` }));
const VALIDADES = [
  { valor: 30, rotulo: '30 dias' },
  { valor: 60, rotulo: '60 dias' },
  { valor: 0, rotulo: 'sem prazo' },
];
const LIMITE_MAXIMO = 5;

/** Resumo textual do que muda ao salvar — um campo por vez, o mais relevante. */
function diff(
  de: Politicas,
  para: Politicas,
  pacotesEmAndamento: number,
): { titulo: string; texto: string } | null {
  if (para.limiteReposicoes !== de.limiteReposicoes) {
    return {
      titulo: `Você mudou o limite de ${de.limiteReposicoes} para ${para.limiteReposicoes}`,
      texto: `Vale só para pacotes novos. Os ${pacotesEmAndamento} pacotes em andamento seguem com a regra antiga até vencer.`,
    };
  }
  if (para.avisoHoras !== de.avisoHoras) {
    return {
      titulo: `Prazo de aviso muda de ${de.avisoHoras}h para ${para.avisoHoras}h`,
      texto: 'Vale a partir do próximo registro de aula. Os lançamentos já feitos não mudam.',
    };
  }
  if (para.avisadaDevolve !== de.avisadaDevolve) {
    return {
      titulo: para.avisadaDevolve
        ? 'Falta avisada volta a devolver a aula'
        : 'Falta avisada passa a debitar sempre',
      texto: 'Vale a partir do próximo registro de aula.',
    };
  }
  if (para.validadeDias !== de.validadeDias) {
    return {
      titulo: `Validade padrão muda para ${
        para.validadeDias === 0 ? 'sem prazo' : `${para.validadeDias} dias`
      }`,
      texto: 'Aplica-se aos pacotes criados a partir de agora.',
    };
  }
  return null;
}

/** Título de cartão do handoff §9: 14.5/700, −.01em. */
function TituloDoCartao({ children }: { children: string }) {
  const { cores } = useVidro();
  return (
    <Text style={[texto(14.5, 700, { altura: 1.3, tracking: -0.01 }), { color: cores.tinta }]}>
      {children}
    </Text>
  );
}

export function Politica() {
  const { cores } = useVidro();
  const { concluir, voltar } = useNavegacao();
  const salvas = useDados((s) => s.politicas);
  const alunos = useDados((s) => s.alunos);
  const salvarPoliticas = useDados((s) => s.salvarPoliticas);
  const avisar = useToast((s) => s.avisar);

  const [atual, atualizar, , descartarRascunho] = useRascunho('politica', salvas);
  const mudou = JSON.stringify(atual) !== JSON.stringify(salvas);
  const mudanca = diff(salvas, atual, alunos.filter(temPacote).length);

  return (
    <TelaVidro
      tipo="empilhada"
      titulo="Política de faltas"
      voltarPara="Ajustes"
      // Voltar sem salvar descarta o rascunho: sem isso, a edição abandonada
      // reaparecia na próxima visita como se fosse a salva.
      aoVoltar={() => {
        descartarRascunho();
        voltar();
      }}
      rodape={
        <>
          <BotaoPrimario
            rotulo="Salvar alterações"
            desabilitado={!mudou}
            aoTocar={() => {
              if (!mudou) return;
              salvarPoliticas(atual);
              concluir('ajustes');
              avisar(avisos.politicaSalva);
            }}
          />
          <BotaoTexto
            rotulo="Descartar"
            aoTocar={() => concluir('ajustes')}
            estilo={estilos.descartar}
          />
        </>
      }
    >
      <View style={estilos.titulo}>
        <Text style={[TIPO_VIDRO.tituloEmpilhada, { color: cores.tinta }]}>
          Política de faltas
        </Text>
      </View>

      <CartaoVidro estilo={[estilos.cartao, estilos.primeiro]}>
        <TituloDoCartao>Prazo mínimo de aviso</TituloDoCartao>
        <Segmentado
          opcoes={PRAZOS}
          valor={atual.avisoHoras}
          aoTrocar={(avisoHoras) => atualizar({ avisoHoras })}
          porte="cartao"
          rotuloDoGrupo="Prazo mínimo de aviso"
          estilo={estilos.controleLargo}
        />
      </CartaoVidro>

      <CartaoVidro estilo={[estilos.cartao, estilos.linha]}>
        <View style={estilos.flexivel}>
          <TituloDoCartao>Falta avisada devolve a aula</TituloDoCartao>
          <Text
            style={[
              comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 3 }),
              { color: cores.tinta2 },
            ]}
          >
            {atual.avisadaDevolve
              ? 'Dentro do prazo, o saldo não é debitado'
              : 'A aula é debitada mesmo com aviso'}
          </Text>
        </View>
        <Switch
          ligado={atual.avisadaDevolve}
          aoAlternar={(avisadaDevolve) => atualizar({ avisadaDevolve })}
          rotulo="Falta avisada devolve a aula"
        />
      </CartaoVidro>

      <CartaoVidro estilo={[estilos.cartao, estilos.linha]}>
        <View style={estilos.flexivel}>
          <TituloDoCartao>Reposições por pacote</TituloDoCartao>
          <Text
            style={[
              comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 3 }),
              { color: cores.tinta2 },
            ]}
          >
            Depois do limite, a falta debita
          </Text>
        </View>
        <Stepper
          valor={atual.limiteReposicoes}
          minimo={0}
          maximo={LIMITE_MAXIMO}
          aoTrocar={(limiteReposicoes) => atualizar({ limiteReposicoes })}
          formatar={(v) => (v === 0 ? '—' : String(v))}
          rotulo={
            atual.limiteReposicoes === 0
              ? 'sem limite de reposições'
              : `${atual.limiteReposicoes} reposições por pacote`
          }
        />
      </CartaoVidro>

      <CartaoVidro estilo={estilos.cartao}>
        <TituloDoCartao>Validade do pacote</TituloDoCartao>
        <Segmentado
          opcoes={VALIDADES}
          valor={atual.validadeDias}
          aoTrocar={(validadeDias) => atualizar({ validadeDias })}
          porte="cartao"
          rotuloDoGrupo="Validade do pacote"
          estilo={estilos.controleLargo}
        />
      </CartaoVidro>

      {mudanca ? (
        <BlocoStatus
          tom="ambar"
          titulo={mudanca.titulo}
          texto={mudanca.texto}
          estilo={estilos.cartao}
        />
      ) : null}
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  titulo: { paddingHorizontal: 6 },
  cartao: { marginTop: 12, paddingVertical: 16, paddingHorizontal: 17 },
  primeiro: { marginTop: 18 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  controleLargo: { marginTop: 12, alignSelf: 'stretch' },
  descartar: { marginTop: 8 },
});
