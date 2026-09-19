/**
 * D1 — Novo pacote / renovação, como sheet de tarefa (88%) no iOS Glass.
 *
 * Derivada (Fluxo D). Modelo: os cartões de escolha de H§3 para a quantidade
 * de aulas e o cartão de saldo de H§2 para o resumo — o número grande é o
 * saldo que o aluno fica depois de confirmar. Primário no rodapé fixo.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../componentes/Blocos';
import { CampoDeTexto } from '../componentes/Campos';
import { BotaoPrimario, CartaoEscolha, Segmentado, Switch } from '../componentes/Controles';
import { CabecalhoGrupo } from '../componentes/Listas';
import { Sheet, SubLinhaSheet } from '../componentes/Sheet';
import { hoje } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { AULAS_OFERECIDAS, calcularPacote } from '../dominio/pacote';
import { saldo, temPacote, VALOR_AULA } from '../dominio/politica';
import type { ConfigPacote } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useVidro } from '../tema/TemaProvider';
import { texto, TIPO_VIDRO } from '../tema/tipografia';
import { TAMANHO_VIDRO } from '../tema/tokens';

const VALIDADES = [
  { valor: 30, rotulo: '30 dias' },
  { valor: 60, rotulo: '60 dias' },
  { valor: 0, rotulo: 'sem prazo' },
];

export function Pacote() {
  const { cores } = useVidro();
  const { alunoId, concluir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const politicas = useDados((s) => s.politicas);
  const padrao = useDados((s) => s.pacotePadrao);
  const criarPacoteCom = useDados((s) => s.criarPacoteCom);
  const avisar = useToast((s) => s.avisar);

  const renovacao = !!aluno && temPacote(aluno);
  const sobrando = aluno ? saldo(aluno) : 0;

  // Parte do padrão salvo em Ajustes; o valor combinado com o aluno vence.
  const [cfg, atualizar] = useRascunho('pacote', {
    aulas: padrao?.aulas ?? 8,
    valorPorAula: aluno?.valorPorAula ?? padrao?.valorPorAula ?? VALOR_AULA,
    validadeDias: politicas.validadeDias,
    somarSaldo: renovacao && sobrando > 0,
  } as ConfigPacote);

  const calculado = calcularPacote(cfg, sobrando, hoje());

  const confirmar = () => {
    if (!aluno) return;
    criarPacoteCom(aluno.id, cfg);
    avisar(
      renovacao
        ? avisos.pacoteRenovado(calculado.saldoFinal, calculado.validade)
        : avisos.pacoteCriado(cfg.aulas, calculado.validade),
    );
    concluir('aluno', aluno.id);
  };

  const rotuloDeSomar = `Somar as ${sobrando} ${sobrando === 1 ? 'aula' : 'aulas'} que sobraram`;

  return (
    <Sheet
      titulo={renovacao ? 'Renovar pacote' : 'Novo pacote'}
      rodape={
        <BotaoPrimario
          rotulo={renovacao ? 'Renovar' : 'Criar pacote'}
          desabilitado={!aluno}
          aoTocar={confirmar}
        />
      }
    >
      <SubLinhaSheet texto={aluno?.name} />

      <CabecalhoGrupo titulo="Quantas aulas" estilo={estilos.tituloGrupo} />
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Quantidade de aulas"
        style={estilos.escolhas}
      >
        {AULAS_OFERECIDAS.map((n) => (
          <CartaoEscolha
            key={n}
            titulo={`${n} aulas`}
            valor={dinheiro(n * cfg.valorPorAula)}
            rotuloAcessivel={`${n} aulas, ${dinheiro(n * cfg.valorPorAula)}`}
            selecionado={cfg.aulas === n}
            aoTocar={() => atualizar({ aulas: n })}
          />
        ))}
      </View>

      <CartaoVidro estilo={estilos.cartao}>
        <CampoDeTexto
          rotulo="Valor por aula, em R$"
          valor={String(cfg.valorPorAula)}
          aoMudar={(v) => atualizar({ valorPorAula: Number(v.replace(/\D/g, '')) || 0 })}
          teclado="numerico"
          ajuda={`Total do pacote: ${dinheiro(calculado.valorTotal)}`}
        />
      </CartaoVidro>

      <CartaoDeAjuste titulo="Validade" estilo={estilos.cartao}>
        <Segmentado
          opcoes={VALIDADES}
          valor={cfg.validadeDias}
          aoTrocar={(validadeDias) => atualizar({ validadeDias })}
          porte="cartao"
          rotuloDoGrupo="Validade do pacote"
          estilo={estilos.segmentado}
        />
      </CartaoDeAjuste>

      {renovacao && sobrando > 0 ? (
        <CartaoDeAjuste
          titulo={rotuloDeSomar}
          subtitulo="Sem isso, o saldo antigo é descartado"
          estilo={estilos.cartao}
          direita={
            <Switch
              ligado={cfg.somarSaldo}
              aoAlternar={(somarSaldo) => atualizar({ somarSaldo })}
              rotulo={rotuloDeSomar}
            />
          }
        />
      ) : null}

      <CartaoVidro estilo={estilos.cartao}>
        <View style={estilos.linhaSaldo}>
          <View>
            <Text style={[TIPO_VIDRO.rotuloCartao, { color: cores.tinta3 }]}>Resumo</Text>
            <View
              accessible
              accessibilityLabel={`${calculado.saldoFinal} aulas no pacote`}
              style={estilos.numeroDoSaldo}
            >
              <Text style={[TIPO_VIDRO.saldoCartao, { color: cores.tint }]}>
                {String(calculado.saldoFinal)}
              </Text>
              <Text style={[texto(14, 600), { color: cores.tinta2 }]}>aulas no pacote</Text>
            </View>
          </View>
        </View>
        <View style={[estilos.linhas, { borderTopColor: cores.fio }]}>
          <Linha rotulo="Valor total" valor={dinheiro(calculado.valorTotal)} />
          <Linha rotulo="Validade" valor={calculado.validade} />
          <Linha rotulo="Vence em" valor={calculado.vence} />
        </View>
      </CartaoVidro>
    </Sheet>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  const { cores } = useVidro();
  return (
    <View style={estilos.linha}>
      <Text style={[texto(13, 500, { altura: 1.4 }), { color: cores.tinta2 }]}>{rotulo}</Text>
      <Text style={[texto(13, 700, { altura: 1.4 }), { color: cores.tinta }]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tituloGrupo: { marginTop: 18 },
  escolhas: { marginTop: 9, gap: 10 },
  cartao: { marginTop: 14 },
  segmentado: { alignSelf: 'stretch' },
  linhaSaldo: { flexDirection: 'row', alignItems: 'flex-end' },
  numeroDoSaldo: { marginTop: 9, flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  linhas: { marginTop: 14, paddingTop: 12, borderTopWidth: TAMANHO_VIDRO.bordaVidro, gap: 8 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
