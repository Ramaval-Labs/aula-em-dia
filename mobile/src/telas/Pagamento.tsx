/**
 * D2 — Registrar pagamento recebido.
 *
 * Valor e data aparecem como leitura, não como campos: a regra de registro
 * (`dominio/politica.ts`) grava sempre o valor do pacote com a data de hoje.
 * Campos editáveis que o app descartava em silêncio eram promessa falsa.
 * Pagamento parcial e data retroativa estão no backlog — exigem mudar a regra.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Text, View } from 'react-native';

import { Caixa, Cartao, EstadoVazio, LinhaLista } from '../componentes/Base';
import { BotaoPrimario, Segmentado } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { AcaoDoCampo } from '../componentes/Formulario';
import { Tela } from '../componentes/Tela';
import { hoje } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { valorPacote } from '../dominio/politica';
import type { MeioDePagamento } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';

const MEIOS: { valor: MeioDePagamento; rotulo: string }[] = [
  { valor: 'Pix', rotulo: 'Pix' },
  { valor: 'Dinheiro', rotulo: 'Dinheiro' },
  { valor: 'Transferência', rotulo: 'Transferência' },
];

/** Rótulo de campo do Fluxo A — o mesmo do `CampoDeTexto`. */
const ROTULO = texto(10, 600, { altura: 1, tracking: 0.16, maiuscula: true });
/** Valor em destaque dentro de cartão, como os totais do Financeiro. */
const VALOR = comEspaco(texto(19, 800, { altura: 1, tracking: -0.03 }), { topo: 9 });

export function Pagamento() {
  const cores = useCores();
  const { alunoId, concluir, ir, voltar } = useNavegacao();
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
      <Tela
        cabecalho={
          <CabecalhoEscuro corDaCurva={cores.tela}>
            <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          </CabecalhoEscuro>
        }
      >
        <EstadoVazio titulo="Aluno não encontrado." />
      </Tela>
    );
  }

  const confirmar = () => {
    registrarPagamentoCom(aluno.id, form.meio);
    avisar(avisos.pagamentoCom(aluno, form.meio));
    concluir('financeiro');
  };

  const copiarChave = () => {
    if (!perfil.chavePix) return;
    Clipboard.setStringAsync(perfil.chavePix).catch(() => {});
    avisar('Chave Pix copiada.');
  };

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Registrar pagamento</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>
            {`${aluno.name} · pacote de ${aluno.total} aulas`}
          </Text>
        </CabecalhoEscuro>
      }
      rodape={<BotaoPrimario rotulo="Confirmar recebimento" aoTocar={confirmar} />}
    >
      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Como você recebeu
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={MEIOS}
            valor={form.meio}
            aoTrocar={(meio) => atualizar({ meio })}
            rotuloAcessivel="Meio de pagamento"
          />
        </View>
      </Cartao>

      {form.meio === 'Pix' ? (
        perfil.chavePix ? (
          <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
            <Text style={[ROTULO, { color: cores.suave }]}>Sua chave Pix</Text>
            <View
              style={{ marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <Text style={[texto(15, 500, { altura: 1.25 }), { flex: 1, color: cores.texto }]}>
                {perfil.chavePix}
              </Text>
              <AcaoDoCampo
                rotulo="copiar"
                rotuloAcessivel="Copiar chave Pix"
                aoTocar={copiarChave}
              />
            </View>
          </Cartao>
        ) : (
          <Cartao estilo={{ overflow: 'hidden' }}>
            <LinhaLista
              titulo="Configurar chave Pix"
              sub="Para ela aparecer nas mensagens de cobrança"
              chevron
              ultima
              aoTocar={() => ir('chavePix')}
            />
          </Cartao>
        )
      ) : null}

      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={[ROTULO, { color: cores.suave }]}>Valor</Text>
            <Text style={[VALOR, { color: cores.texto }]}>{dinheiro(valorPacote(aluno))}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ROTULO, { color: cores.suave }]}>Data</Text>
            <Text style={[VALOR, { color: cores.texto }]}>{hoje()}</Text>
          </View>
        </View>
        <Text style={[comEspaco(TIPO.nota, { topo: 11 }), { color: cores.textoMedio }]}>
          Registra o valor do pacote com a data de hoje. Pagamento parcial ou em outra data
          ainda não entra no app.
        </Text>
      </Cartao>

      <Caixa>
        <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>
          O registro é manual. A cobrança automática por Pix entra numa fase futura, com o
          backend.
        </Text>
      </Caixa>
    </Tela>
  );
}
