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
import { plural } from '../dominio/formato';
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

/** Limite 0 é "sem limite" — o stepper mostra "—", que não se lê. */
const rotuloDoLimite = (n: number) => (n === 0 ? 'sem limite' : String(n));

export type MudancaDePolitica = { campo: string; titulo: string; texto: string };

/**
 * O que muda ao salvar, **um item por campo alterado** (H§9: o texto depende
 * de qual campo mudou, e mais de um pode mudar antes de salvar).
 */
export function mudancas(
  de: Politicas,
  para: Politicas,
  pacotesEmAndamento: number,
): MudancaDePolitica[] {
  const lista: MudancaDePolitica[] = [];

  if (para.limiteReposicoes !== de.limiteReposicoes) {
    lista.push({
      campo: 'limiteReposicoes',
      titulo: `Você mudou o limite de ${rotuloDoLimite(de.limiteReposicoes)} para ${rotuloDoLimite(
        para.limiteReposicoes,
      )}`,
      texto: `Vale só para pacotes novos. ${
        pacotesEmAndamento === 1
          ? 'O pacote em andamento segue'
          : `Os ${pacotesEmAndamento} pacotes em andamento seguem`
      } com a regra antiga até vencer.`,
    });
  }
  if (para.avisoHoras !== de.avisoHoras) {
    lista.push({
      campo: 'avisoHoras',
      titulo: `Prazo de aviso muda de ${de.avisoHoras}h para ${para.avisoHoras}h`,
      texto: 'Vale a partir do próximo registro de aula. Os lançamentos já feitos não mudam.',
    });
  }
  if (para.avisadaDevolve !== de.avisadaDevolve) {
    lista.push({
      campo: 'avisadaDevolve',
      titulo: para.avisadaDevolve
        ? 'Falta avisada volta a devolver a aula'
        : 'Falta avisada passa a debitar sempre',
      texto: 'Vale a partir do próximo registro de aula.',
    });
  }
  if (para.validadeDias !== de.validadeDias) {
    lista.push({
      campo: 'validadeDias',
      titulo: `Validade padrão muda para ${
        para.validadeDias === 0 ? 'sem prazo' : plural(para.validadeDias, 'dia', 'dias')
      }`,
      texto: 'Aplica-se aos pacotes criados a partir de agora.',
    });
  }
  return lista;
}

export function Politica() {
  const { concluir, voltar } = useNavegacao();
  const salvas = useDados((s) => s.politicas);
  const alunos = useDados((s) => s.alunos);
  const salvarPoliticas = useDados((s) => s.salvarPoliticas);
  const avisar = useToast((s) => s.avisar);

  const [atual, atualizar, , descartarRascunho] = useRascunho('politica', salvas);
  const mudou = JSON.stringify(atual) !== JSON.stringify(salvas);
  const impacto = mudancas(salvas, atual, alunos.filter(temPacote).length);

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

      {impacto.map((m, i) => (
        <BlocoStatus
          key={m.campo}
          tom="ambar"
          // Só o primeiro se anuncia: os outros entram na mesma leitura.
          vivo={i === 0}
          titulo={m.titulo}
          texto={m.texto}
          estilo={estilos.aviso}
        />
      ))}
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  cartao: { marginTop: 12 },
  aviso: { marginTop: 12 },
  primeiro: { marginTop: 18 },
  descartar: { marginTop: 8 },
});
