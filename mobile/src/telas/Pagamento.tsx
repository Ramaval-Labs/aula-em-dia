/**
 * D2 — Registrar pagamento recebido (sheet 88%, derivada; modelo: cartão de
 * débito de H§7).
 *
 * Valor e data aparecem como leitura, não como campos: a regra de registro
 * (`dominio/politica.ts`) grava sempre o valor do pacote com a data de hoje.
 * Campos editáveis que o app descartava em silêncio eram promessa falsa.
 * Pagamento parcial e data retroativa estão no backlog — exigem mudar a regra.
 *
 * Aberto a partir da Cobrança, conclui voltando para ela (handoff: "Cobrança →
 * Registrar pagamento → volta, com toast"); de outro lugar, vai para o
 * Financeiro, como antes.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro, EstadoVazio } from '../componentes/Blocos';
import { BotaoInline, BotaoPrimario, Segmentado } from '../componentes/Controles';
import { LinhaLista, ListaAgrupada } from '../componentes/Listas';
import { Sheet } from '../componentes/Sheet';
import { hoje } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { valorPacote } from '../dominio/politica';
import type { MeioDePagamento } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { ehSheet, useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useVidro } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../tema/tipografia';
import { TAMANHO_VIDRO } from '../tema/tokens';

const MEIOS: { valor: MeioDePagamento; rotulo: string }[] = [
  { valor: 'Pix', rotulo: 'Pix' },
  { valor: 'Dinheiro', rotulo: 'Dinheiro' },
  { valor: 'Transferência', rotulo: 'Transferência' },
];

const TITULO = 'Registrar pagamento';

export function Pagamento() {
  const { cores } = useVidro();
  const { alunoId, concluir, ir } = useNavegacao();
  const pilha = useNavegacao((s) => s.pilha);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const perfil = useDados((s) => s.perfil);
  const registrarPagamentoCom = useDados((s) => s.registrarPagamentoCom);
  const avisar = useToast((s) => s.avisar);

  const [form, atualizar] = useRascunho('pagamento', {
    meio: 'Pix' as MeioDePagamento,
    valor: aluno ? valorPacote(aluno) : 0,
    data: hoje(),
  });

  if (!aluno) {
    return (
      <Sheet titulo={TITULO}>
        <EstadoVazio titulo="Aluno não encontrado." />
      </Sheet>
    );
  }

  // De onde o sheet foi aberto: a última tela não-sheet da pilha.
  const origem = [...pilha].reverse().find((q) => !ehSheet(q.tela))?.tela;

  const confirmar = () => {
    registrarPagamentoCom(aluno.id, form.meio);
    avisar(avisos.pagamentoCom(aluno, form.meio));
    if (origem === 'inadimplencia') concluir('inadimplencia', aluno.id);
    else concluir('financeiro');
  };

  const copiarChave = () => {
    if (!perfil.chavePix) return;
    Clipboard.setStringAsync(perfil.chavePix).catch(() => {});
    avisar('Chave Pix copiada.');
  };

  return (
    <Sheet
      titulo={TITULO}
      rodape={<BotaoPrimario rotulo="Confirmar recebimento" aoTocar={confirmar} />}
    >
      <Text style={[texto(13, 500, { altura: 1.4 }), estilos.subLinha, { color: cores.tinta2 }]}>
        {`${aluno.name} · pacote de ${aluno.total} aulas`}
      </Text>

      <CartaoDeAjuste titulo="Como você recebeu" estilo={estilos.espaco16}>
        <Segmentado
          porte="cartao"
          opcoes={MEIOS}
          valor={form.meio}
          aoTrocar={(meio) => atualizar({ meio })}
          rotuloDoGrupo="Meio de pagamento"
          estilo={estilos.largo}
        />
      </CartaoDeAjuste>

      {form.meio === 'Pix' ? (
        perfil.chavePix ? (
          <CartaoVidro estilo={estilos.espaco14}>
            <Text style={[TIPO_VIDRO.cabecalhoGrupo, { color: cores.tinta3 }]}>
              Sua chave Pix
            </Text>
            <View style={estilos.linhaChave}>
              <Text
                style={[texto(15, 600, { altura: 1.3 }), estilos.flexivel, { color: cores.tinta }]}
              >
                {perfil.chavePix}
              </Text>
              <BotaoInline
                rotulo="Copiar"
                variante="vidro"
                rotuloAcessivel="Copiar chave Pix"
                aoTocar={copiarChave}
              />
            </View>
          </CartaoVidro>
        ) : (
          <ListaAgrupada estilo={estilos.espaco14}>
            <LinhaLista
              titulo="Configurar chave Pix"
              subtitulo="Para ela aparecer nas mensagens de cobrança"
              chevron
              aoTocar={() => ir('chavePix')}
            />
          </ListaAgrupada>
        )
      ) : null}

      {/* Modelo: o cartão de débito da Cobrança — valor grande à esquerda,
          a data à direita, a nota depois do fio. */}
      <CartaoVidro estilo={estilos.espaco14}>
        <View style={estilos.linhaTopo}>
          <View style={estilos.flexivel}>
            <Text style={[TIPO_VIDRO.cabecalhoGrupo, { color: cores.tinta3 }]}>Valor</Text>
            <Text
              style={[
                comEspaco(texto(32, 800, { tracking: -0.045 }), { topo: 9 }),
                { color: cores.tinta },
              ]}
            >
              {dinheiro(valorPacote(aluno))}
            </Text>
          </View>
          <View style={estilos.direita}>
            <Text style={[TIPO_VIDRO.cabecalhoGrupo, { color: cores.tinta3 }]}>Data</Text>
            <Text
              style={[
                comEspaco(texto(15, 700, { altura: 1.3 }), { topo: 9 }),
                { color: cores.tinta },
              ]}
            >
              {hoje()}
            </Text>
          </View>
        </View>
        <View style={[estilos.separador, { borderTopColor: cores.fio }]}>
          <Text style={[texto(12.5, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
            Registra o valor do pacote com a data de hoje. Pagamento parcial ou em outra data
            ainda não entra no app.
          </Text>
        </View>
      </CartaoVidro>

      <Text
        style={[
          comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 14 }),
          estilos.nota,
          { color: cores.tinta2 },
        ]}
      >
        O registro é manual. A cobrança automática por Pix entra numa fase futura, com o backend.
      </Text>
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  direita: { alignItems: 'flex-end' },
  subLinha: { paddingTop: 4, paddingHorizontal: 6 },
  nota: { paddingHorizontal: 6 },
  largo: { alignSelf: 'stretch' },
  espaco14: { marginTop: 14 },
  espaco16: { marginTop: 16 },
  linhaChave: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  separador: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: TAMANHO_VIDRO.bordaVidro,
  },
});
