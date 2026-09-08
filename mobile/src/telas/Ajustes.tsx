/** Tela 8 — Ajustes (raiz da aba 3, Fluxo E1). */

import React from 'react';
import { Text, View } from 'react-native';

import { Caixa, LinhaLista, Lista } from '../componentes/Base';
import { BotaoPequeno, Chip } from '../componentes/Botoes';
import { CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { PROFESSOR } from '../dados/semente';
import { dinheiro } from '../dominio/formato';
import { temPacote, VALOR_AULA } from '../dominio/politica';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useTema } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

export function Ajustes() {
  const { cores, tema, trocarTema } = useTema();
  const alunos = useDados((s) => s.alunos);
  const politicas = useDados((s) => s.politicas);
  const zerar = useDados((s) => s.zerar);
  const { ir, trocarTab } = useNavegacao();
  const avisar = useToast((s) => s.avisar);

  const comPacote = alunos.filter(temPacote).length;

  const resumoPolitica = [
    `Aviso de ${politicas.avisoHoras}h`,
    politicas.avisadaDevolve ? 'devolve a aula' : 'debita sempre',
    politicas.limiteReposicoes === 0
      ? 'sem limite'
      : `${politicas.limiteReposicoes} reposições`,
  ].join(' · ');

  const pacotePadrao = `8 aulas · ${dinheiro(VALOR_AULA)} por aula · ${
    politicas.validadeDias === 0 ? 'sem prazo' : `${politicas.validadeDias} dias`
  }`;

  return (
    <Tela
      comNavbar
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela}>
          <View style={{ marginTop: 8 }}>
            <TituloTela tamanho={22}>Ajustes</TituloTela>
          </View>
          <View
            accessible
            accessibilityLabel={`${PROFESSOR.nome}. ${comPacote} alunos com pacote, ${alunos.length} cadastrados.`}
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: cores.topoCartao,
              borderRadius: RAIO.cartao,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: RAIO.cartao,
                backgroundColor: MARCA.amarelo,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[texto(15, 800, { altura: 1 }), { color: MARCA.tintaSobreAmarelo }]}
              >
                {PROFESSOR.iniciais}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[texto(14.5, 600, { altura: 1.2 }), { color: '#FFFFFF' }]}>
                {PROFESSOR.nome}
              </Text>
              <Text style={[TIPO.nota, { marginTop: 3, color: cores.elevadoSuave }]}>
                {`${comPacote} alunos com pacote · ${alunos.length} cadastrados`}
              </Text>
            </View>
            <Text style={[texto(16, 600, { altura: 1 }), { color: cores.topoFraco }]}>›</Text>
          </View>
        </CabecalhoEscuro>
      }
    >
      <Lista rotulo="Regras do seu trabalho">
        <LinhaLista
          titulo="Política de faltas"
          sub={resumoPolitica}
          alturaMinima={62}
          chevron
          aoTocar={() => ir('politica', { rascunho: { ...politicas } })}
        />
        <LinhaLista
          titulo="Minha disponibilidade"
          sub="13 blocos · 26h por semana"
          alturaMinima={62}
          chevron
          chevronApagado
        />
        <LinhaLista
          titulo="Pacotes e valores padrão"
          sub={pacotePadrao}
          alturaMinima={62}
          chevron
          chevronApagado
          ultima
        />
      </Lista>

      <Lista rotulo="App">
        <LinhaLista
          titulo="Aparência"
          direita={
            <View
              accessibilityRole="radiogroup"
              style={{ flexDirection: 'row', gap: 5 }}
            >
              <Chip
                rotulo="Claro"
                altura={34}
                ativo={tema === 'claro'}
                aoTocar={() => trocarTema('claro')}
              />
              <Chip
                rotulo="Noturno"
                altura={34}
                ativo={tema === 'escuro'}
                aoTocar={() => trocarTema('escuro')}
              />
            </View>
          }
        />
        <LinhaLista titulo="Avisos e lembretes" chevron chevronApagado />
        <LinhaLista titulo="Chave Pix e dados de cobrança" chevron chevronApagado />
        <LinhaLista
          titulo="Conta e assinatura"
          sub="Plano gratuito"
          chevron
          chevronApagado
          ultima
        />
      </Lista>

      <Caixa>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Estado do protótipo
        </Text>
        <Text style={[TIPO.corpo, { marginTop: 5, color: cores.suave }]}>
          Tudo o que você registra fica salvo neste aparelho. Zerar volta aos quatro alunos
          originais.
        </Text>
        <View style={{ marginTop: 11 }}>
          <BotaoPequeno
            variante="perigo"
            rotulo="Zerar dados de demonstração"
            aoTocar={() => {
              zerar();
              trocarTab('home');
              avisar(avisos.estadoZerado);
            }}
          />
        </View>
      </Caixa>

      <Text style={[TIPO.nota, { color: cores.suave, textAlign: 'center' }]}>
        Versão 0.4 · protótipo acadêmico
      </Text>
    </Tela>
  );
}
