/** D2 — Registrar pagamento recebido. */

import React from 'react';
import { Text, View } from 'react-native';

import { Caixa, Cartao, EstadoVazio } from '../componentes/Base';
import { BotaoPrimario, Segmentado } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { AcaoDoCampo, CampoDeTexto } from '../componentes/Formulario';
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
import { texto, TIPO } from '../tema/tipografia';

const MEIOS: { valor: MeioDePagamento; rotulo: string }[] = [
  { valor: 'Pix', rotulo: 'Pix' },
  { valor: 'Dinheiro', rotulo: 'Dinheiro' },
  { valor: 'Transferência', rotulo: 'Transf.' },
];

export function Pagamento() {
  const cores = useCores();
  const { alunoId, concluir, voltar } = useNavegacao();
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

  return (
    <Tela
      comTeclado
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Registrar pagamento</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.suave }]}>
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
        <CampoDeTexto
          rotulo="Sua chave Pix"
          valor={perfil.chavePix ?? ''}
          aoMudar={() => {}}
          placeholder="não configurada"
          sufixo={
            perfil.chavePix ? (
              <AcaoDoCampo
                rotulo="copiar"
                aoTocar={() => avisar('Chave Pix copiada.')}
              />
            ) : undefined
          }
          ajuda={
            perfil.chavePix
              ? undefined
              : 'Configure em Ajustes › Chave Pix para aparecer nas mensagens de cobrança.'
          }
        />
      ) : null}

      <CampoDeTexto
        rotulo="Valor recebido"
        valor={String(form.valor)}
        aoMudar={(v) => atualizar({ valor: Number(v.replace(/\D/g, '')) || 0 })}
        teclado="numerico"
        ajuda={`Valor do pacote: ${dinheiro(valorPacote(aluno))}`}
      />

      <CampoDeTexto
        rotulo="Data"
        valor={form.data}
        aoMudar={(data) => atualizar({ data })}
        placeholder="dd/mm"
      />

      <Caixa>
        <Text style={[TIPO.corpo, { color: cores.suave }]}>
          O registro é manual. A cobrança automática por Pix entra numa fase futura, com o
          backend.
        </Text>
      </Caixa>
    </Tela>
  );
}
