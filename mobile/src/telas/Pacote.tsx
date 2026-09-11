/** D1 — Novo pacote / renovação. */

import React from 'react';
import { Text, View } from 'react-native';

import { Cartao } from '../componentes/Base';
import { BotaoPrimario, Segmentado } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { CampoDeTexto, Interruptor } from '../componentes/Formulario';
import { Tela } from '../componentes/Tela';
import { hoje } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { AULAS_OFERECIDAS, calcularPacote } from '../dominio/pacote';
import { saldo, temPacote, VALOR_AULA } from '../dominio/politica';
import type { ConfigPacote } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { TAMANHO } from '../tema/tokens';

const OPCOES = AULAS_OFERECIDAS.map((n) => ({ valor: n, rotulo: `${n} aulas` }));
const VALIDADES = [
  { valor: 30, rotulo: '30 dias' },
  { valor: 60, rotulo: '60 dias' },
  { valor: 0, rotulo: 'sem prazo' },
];

export function Pacote() {
  const cores = useCores();
  const { alunoId, concluir, voltar } = useNavegacao();
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

  return (
    <Tela
      comTeclado
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>
              {renovacao ? 'Renovar pacote' : 'Novo pacote'}
            </TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>
            {aluno ? aluno.name : ''}
          </Text>
        </CabecalhoEscuro>
      }
      rodape={
        <BotaoPrimario
          rotulo={renovacao ? 'Renovar' : 'Criar pacote'}
          desabilitado={!aluno}
          aoTocar={confirmar}
        />
      }
    >
      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Quantas aulas
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={OPCOES}
            valor={cfg.aulas}
            aoTrocar={(aulas) => atualizar({ aulas })}
            rotuloAcessivel="Quantidade de aulas"
          />
        </View>
      </Cartao>

      <CampoDeTexto
        rotulo="Valor por aula"
        valor={String(cfg.valorPorAula)}
        aoMudar={(v) => atualizar({ valorPorAula: Number(v.replace(/\D/g, '')) || 0 })}
        teclado="numerico"
        ajuda={`Total do pacote: ${dinheiro(calculado.valorTotal)}`}
      />

      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Validade
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={VALIDADES}
            valor={cfg.validadeDias}
            aoTrocar={(validadeDias) => atualizar({ validadeDias })}
            rotuloAcessivel="Validade do pacote"
          />
        </View>
      </Cartao>

      {renovacao && sobrando > 0 ? (
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
            ligado={cfg.somarSaldo}
            aoTrocar={(somarSaldo) => atualizar({ somarSaldo })}
            rotuloAcessivel={`Somar as ${sobrando} aulas que sobraram`}
          />
          <View style={{ flex: 1 }}>
            <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
              {`Somar as ${sobrando} ${sobrando === 1 ? 'aula' : 'aulas'} que sobraram`}
            </Text>
            <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
              Sem isso, o saldo antigo é descartado
            </Text>
          </View>
        </Cartao>
      ) : null}

      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <Text style={[TIPO.eyebrow, { letterSpacing: 1.6, color: cores.suave }]}>
          Resumo
        </Text>
        <View style={{ marginTop: 11, gap: 7 }}>
          <Linha rotulo="Aulas no pacote" valor={String(calculado.saldoFinal)} />
          <Linha rotulo="Valor total" valor={dinheiro(calculado.valorTotal)} />
          <Linha rotulo="Validade" valor={calculado.validade} />
          <Linha rotulo="Vence em" valor={calculado.vence} />
        </View>
      </Cartao>
    </Tela>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  const cores = useCores();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>{rotulo}</Text>
      <Text style={[texto(12.5, 600, { altura: 1.4 }), { color: cores.texto }]}>
        {valor}
      </Text>
    </View>
  );
}
