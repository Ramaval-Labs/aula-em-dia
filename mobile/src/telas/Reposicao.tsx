/**
 * Tela 5 — Escolher horário (Fluxo C).
 * O motivo de cada janela faz parte do design: é ele que transforma a
 * negociação por mensagem em uma escolha.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Caixa, Radio } from '../componentes/Base';
import { BotaoPequeno, BotaoPrimario } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { JANELA_VALIDADE_ESTENDIDA, JANELAS } from '../dados/semente';
import { janelasDisponiveis, podeRepor } from '../dominio/politica';
import type { Janela } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO, TAMANHO } from '../tema/tokens';

export function Reposicao() {
  const cores = useCores();
  const { alunoId, janela, definirJanela, ir, voltar, concluir } = useNavegacao();

  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const politicas = useDados((s) => s.politicas);
  const marcarReposicao = useDados((s) => s.marcarReposicao);
  const estenderValidade = useDados((s) => s.estenderValidade);
  const avisar = useToast((s) => s.avisar);

  const liberada = !!aluno && podeRepor(aluno, politicas);
  const janelas = janelasDisponiveis(aluno, JANELAS, JANELA_VALIDADE_ESTENDIDA);

  const sub = aluno
    ? `${aluno.name} · validade ${aluno.validade} · ${
        politicas.limiteReposicoes === 0
          ? `${aluno.reposicoes} reposições usadas`
          : `${aluno.reposicoes} de ${politicas.limiteReposicoes} reposições usadas`
      }`
    : '';

  const confirmar = () => {
    if (!aluno || janela === null) return;
    const escolhida = janelas[janela];
    if (!escolhida) return;
    marcarReposicao(aluno.id, { dia: escolhida.dia, hora: escolhida.hora });
    avisar(avisos.reposicao(aluno, escolhida));
    // Fluxo concluído: volta ao aluno com a pilha zerada.
    concluir('aluno', aluno.id);
  };

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Escolher horário</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.suave }]}>{sub}</Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 9, paddingBottom: 12 }}
      rodape={
        liberada ? (
          <BotaoPrimario
            rotulo="Confirmar e avisar o aluno"
            desabilitado={janela === null}
            aoTocar={confirmar}
          />
        ) : undefined
      }
    >
      {!liberada ? (
        <Caixa>
          <Text style={[texto(14, 600, { altura: 1.25 }), { color: cores.textoMedio }]}>
            Limite de reposições atingido
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.suave }]}>
            {aluno
              ? `${aluno.reposicoes} de ${politicas.limiteReposicoes} usadas neste pacote. Sua política não permite mais.`
              : ''}
          </Text>
          <View style={{ marginTop: 11 }}>
            <BotaoPequeno
              rotulo="Rever política"
              aoTocar={() => ir('politica', { rascunho: { ...politicas } })}
            />
          </View>
        </Caixa>
      ) : (
        <>
          <Text
            style={[
              comEspaco(TIPO.eyebrow, { base: 2 }),
              { letterSpacing: 1.6, color: cores.suave },
            ]}
          >
            {`${janelas.length} horários possíveis`}
          </Text>

          {janelas.map((j, i) => (
            <CartaoJanela
              key={`${j.dia}-${j.hora}`}
              janela={j}
              melhor={i === 0}
              selecionada={janela === i}
              aoTocar={() => definirJanela(i)}
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
              <Text style={[texto(13.5, 600, { altura: 1 }), { color: cores.suave }]}>
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
  melhor,
  selecionada,
  aoTocar,
}: {
  janela: Janela;
  melhor: boolean;
  selecionada: boolean;
  aoTocar: () => void;
}) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: selecionada }}
      accessibilityLabel={`${melhor ? 'Melhor opção. ' : ''}${janela.dia}, ${janela.hora}. ${
        janela.motivo
      }`}
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
        {melhor ? (
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
            alignItems: 'center',
            gap: 13,
          }}
        >
          <Radio selecionado={selecionada} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={[TIPO.nome, { color: cores.texto }]}>{janela.dia}</Text>
              <Text style={[texto(15, 700, { altura: 1.25 }), { color: cores.texto }]}>
                {janela.hora}
              </Text>
            </View>
            <Text style={[texto(12, 400, { altura: 1.45 }), { marginTop: 4, color: cores.suave }]}>
              {janela.motivo}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
