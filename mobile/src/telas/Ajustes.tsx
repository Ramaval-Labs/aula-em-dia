/** Tela 8 — Ajustes (raiz da aba 3, Fluxo E1). */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Caixa, LinhaLista, Lista } from '../componentes/Base';
import { BotaoPequeno, Chip, useDoisToques } from '../componentes/Botoes';
import { CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { dinheiro } from '../dominio/formato';
import { resumo as resumoDaDisponibilidade } from '../dominio/disponibilidade';
import { temPacote, VALOR_AULA } from '../dominio/politica';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useTema } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { RAIO } from '../tema/tokens';

export function Ajustes() {
  const { cores, tema, trocarTema } = useTema();
  const alunos = useDados((s) => s.alunos);
  const perfil = useDados((s) => s.perfil);
  const politicas = useDados((s) => s.politicas);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const padraoSalvo = useDados((s) => s.pacotePadrao);
  const zerar = useDados((s) => s.zerar);
  const { ir, trocarTab } = useNavegacao();
  const avisar = useToast((s) => s.avisar);

  // Zerar apaga tudo o que o professor registrou: dois toques.
  const zerarDados = useDoisToques(() => {
    zerar();
    trocarTab('home');
    avisar(avisos.estadoZerado);
  });

  const comPacote = alunos.filter(temPacote).length;

  const resumoPolitica = [
    `Aviso de ${politicas.avisoHoras}h`,
    politicas.avisadaDevolve ? 'devolve a aula' : 'debita sempre',
    politicas.limiteReposicoes === 0
      ? 'sem limite'
      : `${politicas.limiteReposicoes} reposições`,
  ].join(' · ');

  const pacotePadrao = `${padraoSalvo?.aulas ?? 8} aulas · ${dinheiro(
    padraoSalvo?.valorPorAula ?? VALOR_AULA,
  )} por aula · ${
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${perfil.nome}. ${comPacote} alunos com pacote, ${alunos.length} cadastrados. Editar perfil.`}
            onPress={() => ir('perfil')}
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
            <Avatar iniciais={perfil.iniciais} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[texto(14.5, 600, { altura: 1.2 }), { color: '#FFFFFF' }]}>
                {perfil.nome}
              </Text>
              <Text style={[TIPO.nota, { marginTop: 3, color: cores.elevadoSuave }]}>
                {`${comPacote} alunos com pacote · ${alunos.length} cadastrados`}
              </Text>
            </View>
            <Text style={[texto(16, 600, { altura: 1 }), { color: cores.topoFraco }]}>›</Text>
          </Pressable>
        </CabecalhoEscuro>
      }
    >
      <Lista rotulo="Regras do seu trabalho">
        <LinhaLista
          titulo="Política de faltas"
          sub={resumoPolitica}
          alturaMinima={62}
          chevron
          aoTocar={() => ir('politica')}
        />
        <LinhaLista
          titulo="Minha disponibilidade"
          sub={resumoDaDisponibilidade(disponibilidade.blocos)}
          alturaMinima={62}
          chevron
          aoTocar={() => ir('minhaDisponibilidade')}
        />
        <LinhaLista
          titulo="Pacotes e valores padrão"
          sub={pacotePadrao}
          alturaMinima={62}
          chevron
          ultima
          aoTocar={() => ir('pacotesPadrao')}
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
        <LinhaLista titulo="Avisos e lembretes" chevron aoTocar={() => ir('avisos')} />
        <LinhaLista
          titulo="Chave Pix e dados de cobrança"
          sub={perfil.chavePix ?? 'não configurada'}
          chevron
          aoTocar={() => ir('chavePix')}
        />
        <LinhaLista
          titulo="Conta e assinatura"
          sub={perfil.plano === 'pago' ? 'Plano pago' : 'Plano gratuito'}
          chevron
          ultima
          aoTocar={() => ir('conta')}
        />
      </Lista>

      <Caixa>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Estado do protótipo
        </Text>
        <Text style={[TIPO.corpo, { marginTop: 5, color: cores.textoMedio }]}>
          Tudo o que você registra fica salvo neste aparelho. Zerar volta aos quatro alunos
          originais.
        </Text>
        <View style={{ marginTop: 11 }}>
          <BotaoPequeno
            rotulo={
              zerarDados.armado ? 'Tocar de novo para zerar' : 'Zerar dados de demonstração'
            }
            aoTocar={zerarDados.tocar}
          />
        </View>
      </Caixa>

      <Text style={[TIPO.nota, { color: cores.suave, textAlign: 'center' }]}>
        Versão 0.4 · protótipo acadêmico
      </Text>
    </Tela>
  );
}
