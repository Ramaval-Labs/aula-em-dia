/**
 * Tela 5 — Sugestões de reposição (C3, passo 2 de 3).
 *
 * As janelas saem do motor de `dominio/agenda.ts`, calculadas contra a
 * disponibilidade do professor, a do aluno, as folgas e as aulas fixas dos
 * outros alunos. Lista vazia leva à tela C5.
 */

import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BarraDePassos, Caixa, Radio } from '../componentes/Base';
import { BotaoContorno, BotaoPequeno, BotaoPrimario } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { candidatos, melhores, type Candidata } from '../dominio/agenda';
import { hoje } from '../dominio/datas';
import { podeRepor } from '../dominio/politica';
import { avisos, useDados } from '../estado/dados';
import { mesmaJanela, REPOSICAO_INICIAL, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

export function Reposicao() {
  const cores = useCores();
  const { alunoId, ir, voltar } = useNavegacao();

  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const politicas = useDados((s) => s.politicas);
  const estenderValidade = useDados((s) => s.estenderValidade);
  const avisar = useToast((s) => s.avisar);

  const [form, atualizar] = useRascunho('reposicao', REPOSICAO_INICIAL);

  const liberada = !!aluno && podeRepor(aluno, politicas);

  const todas = useMemo(
    () => (aluno ? candidatos(aluno, alunos, disponibilidade, hoje()) : []),
    [aluno, alunos, disponibilidade],
  );
  const janelas = melhores(todas);

  const sub = aluno
    ? `${aluno.name} · validade ${aluno.validade} · ${
        politicas.limiteReposicoes === 0
          ? `${aluno.reposicoes} reposições usadas`
          : `${aluno.reposicoes} de ${politicas.limiteReposicoes} reposições usadas`
      }`
    : '';

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 12 }}>
            <BarraDePassos total={3} atual={2} rotulo="Passo 2 de 3" />
          </View>
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Escolher horário</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>{sub}</Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 9, paddingBottom: 12 }}
      rodape={
        liberada && janelas.length > 0 ? (
          <>
            <BotaoPrimario
              rotulo="Continuar"
              desabilitado={form.janela === null}
              aoTocar={() => ir('confirmarReposicao')}
            />
            <BotaoContorno
              rotulo="Nenhum serve · escolher outro"
              altura={44}
              aoTocar={() => ir('outroHorario')}
            />
          </>
        ) : undefined
      }
    >
      {!liberada ? (
        <Caixa>
          <Text style={[texto(14, 600, { altura: 1.25 }), { color: cores.textoMedio }]}>
            Limite de reposições atingido
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.textoMedio }]}>
            {aluno
              ? `${aluno.reposicoes} de ${politicas.limiteReposicoes} usadas neste pacote. Sua política não permite mais.`
              : ''}
          </Text>
          <View style={{ marginTop: 11 }}>
            <BotaoPequeno rotulo="Rever política" aoTocar={() => ir('politica')} />
          </View>
        </Caixa>
      ) : janelas.length === 0 ? (
        <Caixa>
          <Text style={[texto(14, 600, { altura: 1.25 }), { color: cores.textoMedio }]}>
            Nenhum horário cabe
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.textoMedio }]}>
            A agenda até a validade do pacote está cheia. Veja as saídas possíveis.
          </Text>
          <View style={{ marginTop: 11 }}>
            <BotaoPequeno rotulo="Ver saídas" aoTocar={() => ir('semHorario')} />
          </View>
        </Caixa>
      ) : (
        <>
          <Text
            style={[
              TIPO.eyebrow,
              { letterSpacing: 1.6, color: cores.textoMedio, marginBottom: 2 },
            ]}
          >
            {`${todas.length} horários possíveis · as ${janelas.length} melhores`}
          </Text>

          {janelas.map((j) => (
            <CartaoJanela
              key={`${j.data}-${j.hora}`}
              janela={j}
              selecionada={mesmaJanela(form.janela, j)}
              aoTocar={() => atualizar({ janela: { data: j.data, hora: j.hora } })}
            />
          ))}

          {aluno && !aluno.validadeEstendida ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const nova = estenderValidade(aluno.id);
                if (nova) avisar(avisos.validade(nova));
              }}
              style={{
                marginTop: 3,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: cores.linha,
                borderRadius: RAIO.cartao,
                backgroundColor: cores.cartao,
              }}
            >
              <Text style={[texto(13.5, 600, { altura: 1 }), { color: cores.textoMedio }]}>
                Estender validade em 15 dias
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </Tela>
  );
}

function CartaoJanela({
  janela,
  selecionada,
  aoTocar,
}: {
  janela: Candidata;
  selecionada: boolean;
  aoTocar: () => void;
}) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionada }}
      accessibilityLabel={`${janela.melhor ? 'Melhor opção. ' : ''}${janela.dia}, ${
        janela.hora
      }. ${janela.razoes.join(' ')}`}
      onPress={aoTocar}
    >
      <View
        style={{
          backgroundColor: cores.cartao,
          borderRadius: RAIO.cartao,
          overflow: 'hidden',
          borderWidth: selecionada ? 1.5 : 1,
          borderColor: selecionada ? cores.texto : cores.linha,
        }}
      >
        {janela.melhor ? (
          <View
            style={{
              backgroundColor: MARCA.amarelo,
              paddingVertical: 6,
              paddingHorizontal: 15,
            }}
          >
            <Text
              style={[
                texto(10, 600, { altura: 1.2, tracking: 0.14, maiuscula: true }),
                { color: MARCA.tintaSobreAmarelo },
              ]}
            >
              Melhor opção
            </Text>
          </View>
        ) : null}
        <View
          style={{
            paddingVertical: 13,
            paddingHorizontal: 15,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 13,
          }}
        >
          <View style={{ marginTop: 2 }}>
            <Radio selecionado={selecionada} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={[TIPO.nome, { color: cores.texto }]}>{janela.dia}</Text>
              <Text style={[texto(15, 700, { altura: 1.25 }), { color: cores.texto }]}>
                {janela.hora}
              </Text>
            </View>
            <View style={{ marginTop: 6, gap: 4 }}>
              {janela.razoes.map((r) => (
                <Text
                  key={r}
                  style={[texto(12, 400, { altura: 1.45 }), { color: cores.textoMedio }]}
                >
                  {`· ${r}`}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
