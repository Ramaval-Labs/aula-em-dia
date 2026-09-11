/**
 * Tela 4 — Resultado do registro.
 * O fundo do conteúdo é --cartao, e a curva do cabeçalho usa a mesma cor.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { Caixa, EstadoVazio } from '../componentes/Base';
import { BotaoAmarelo, BotaoContorno } from '../componentes/Botoes';
import { CabecalhoEscuro, Eyebrow, Heroi, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { primeiroNome } from '../dominio/formato';
import { efeito, saldo, saldoBaixo } from '../dominio/politica';
import { useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { MARCA, TAMANHO } from '../tema/tokens';

export function Resultado() {
  const cores = useCores();
  const { alunoId, ir, trocarTab } = useNavegacao();
  const [{ desfecho, avisoH }] = useRascunho('registro', REGISTRO_INICIAL);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const politicas = useDados((s) => s.politicas);

  if (!aluno || !desfecho) {
    return (
      <Tela
        fundo={cores.cartao}
        cabecalho={<CabecalhoEscuro corDaCurva={cores.cartao}><Eyebrow>Registrado</Eyebrow></CabecalhoEscuro>}
      >
        <EstadoVazio titulo="Nada para mostrar aqui." />
      </Tela>
    );
  }

  const ef = efeito(desfecho, avisoH, politicas);
  // O saldo já foi aplicado pelo registro: aqui só mostramos o valor atual.
  const restam = saldo(aluno);
  const geradaReposicao = !!aluno.pendencia;
  const bateuNoLimite = ef.reposicao && !geradaReposicao;

  return (
    <Tela
      fundo={cores.cartao}
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.cartao} padBaixo={TAMANHO.padCabecalhoResultado}>
          <View style={{ marginTop: 34 }}>
            <Eyebrow>Registrado</Eyebrow>
          </View>
          <View style={{ marginTop: 12 }}>
            <TituloTela>{ef.rotulo}</TituloTela>
          </View>
          <View
            style={{ marginTop: 22, flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}
          >
            <Heroi
              numero={String(restam)}
              rotulo="aulas restam"
              tamanho={40}
              alinhar="esquerda"
              cor={saldoBaixo(aluno) ? MARCA.amarelo : cores.topoTexto}
              rotuloAcessivel={`${restam} aulas restam de ${aluno.total}`}
            />
            <Text
              style={[
                texto(13, 500, { altura: 1.4 }),
                { color: cores.topoFraco, paddingBottom: 4 },
              ]}
            >
              {ef.delta === 0 ? 'sem debitar' : `${ef.delta} aula`}
            </Text>
          </View>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ paddingTop: 22, paddingBottom: 22, gap: 12 }}
      rodape={
        <>
          {geradaReposicao ? (
            <BotaoAmarelo
              rotulo="Escolher horário"
              aoTocar={() => ir('reposicao')}
            />
          ) : null}
          <BotaoContorno rotulo="Voltar aos alunos" aoTocar={() => trocarTab('home')} />
        </>
      }
      semMascara
    >
      <Text style={[texto(15, 400, { altura: 1.6 }), { color: cores.textoMedio }]}>
        {`${ef.nota}. O lançamento já está no extrato de ${primeiroNome(aluno.name)}.`}
      </Text>

      {geradaReposicao ? (
        <Caixa>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Próximo passo
          </Text>
          <Text style={[comEspaco(TIPO.corpo, { topo: 5 }), { color: cores.textoMedio }]}>
            Escolha o horário da reposição agora ou deixe pendente na lista de alunos.
          </Text>
        </Caixa>
      ) : null}

      {bateuNoLimite ? (
        <Caixa>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Sem reposição
          </Text>
          <Text style={[comEspaco(TIPO.corpo, { topo: 5 }), { color: cores.textoMedio }]}>
            {`${aluno.reposicoes} de ${politicas.limiteReposicoes} reposições já usadas neste pacote. Sua política não permite outra.`}
          </Text>
        </Caixa>
      ) : null}
    </Tela>
  );
}
