/**
 * Tela 9 — Política de faltas (Fluxo E2). Handoff iOS Glass §9.
 * Edita um rascunho e mostra o impacto antes de salvar. O que é salvo aqui
 * muda o cálculo da tela Registrar aula no próximo registro.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { BlocoStatus, CartaoDeAjuste } from '../componentes/Blocos';
import { TelaVidro, TituloDeConteudo } from '../componentes/Chassi';
import { BotaoPrimario, BotaoTexto, Segmentado, Stepper, Switch } from '../componentes/Controles';
import { temPacote } from '../dominio/politica';
import type { Politicas } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';

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

export function Politica() {
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
      <TituloDeConteudo titulo="Política de faltas" />

      <CartaoDeAjuste titulo="Prazo mínimo de aviso" estilo={estilos.primeiro}>
        <Segmentado
          opcoes={PRAZOS}
          valor={atual.avisoHoras}
          aoTrocar={(avisoHoras) => atualizar({ avisoHoras })}
          porte="cartao"
          rotuloDoGrupo="Prazo mínimo de aviso"
        />
      </CartaoDeAjuste>

      <CartaoDeAjuste
        titulo="Falta avisada devolve a aula"
        subtitulo={
          atual.avisadaDevolve
            ? 'Dentro do prazo, o saldo não é debitado'
            : 'A aula é debitada mesmo com aviso'
        }
        direita={
          <Switch
            ligado={atual.avisadaDevolve}
            aoAlternar={(avisadaDevolve) => atualizar({ avisadaDevolve })}
            rotulo="Falta avisada devolve a aula"
          />
        }
        estilo={estilos.cartao}
      />

      <CartaoDeAjuste
        titulo="Reposições por pacote"
        subtitulo="Depois do limite, a falta debita"
        estilo={estilos.cartao}
        direita={
          <Stepper
            valor={atual.limiteReposicoes}
            minimo={0}
            maximo={LIMITE_MAXIMO}
            aoTrocar={(limiteReposicoes) => atualizar({ limiteReposicoes })}
            formatar={(v) => (v === 0 ? '—' : String(v))}
            rotuloDoValor={(v) => (v === 0 ? 'sem limite' : String(v))}
            rotulo="reposições por pacote"
          />
        }
      />

      <CartaoDeAjuste titulo="Validade do pacote" estilo={estilos.cartao}>
        <Segmentado
          opcoes={VALIDADES}
          valor={atual.validadeDias}
          aoTrocar={(validadeDias) => atualizar({ validadeDias })}
          porte="cartao"
          rotuloDoGrupo="Validade do pacote"
        />
      </CartaoDeAjuste>

      {mudanca ? (
        <BlocoStatus
          tom="ambar"
          titulo={mudanca.titulo}
          texto={mudanca.texto}
          estilo={estilos.aviso}
        />
      ) : null}
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  cartao: { marginTop: 12 },
  aviso: { marginTop: 12 },
  primeiro: { marginTop: 18 },
  descartar: { marginTop: 8 },
});
