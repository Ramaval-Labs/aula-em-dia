/** Tela 8 — Ajustes (raiz da aba 3, Fluxo E1). Handoff iOS Glass §8. */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, CartaoVidro } from '../componentes/Blocos';
import { TelaVidro } from '../componentes/Chassi';
import { Segmentado } from '../componentes/Controles';
import { Icone } from '../componentes/Icone';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../componentes/Listas';
import { resumo as resumoDaDisponibilidade } from '../dominio/disponibilidade';
import { dinheiro } from '../dominio/formato';
import { temPacote, VALOR_AULA } from '../dominio/politica';
import { useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useTema, useVidro } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../tema/tipografia';
import { TAMANHO_VIDRO } from '../tema/tokens';

/** Rodapé do handoff §8, sem o "protótipo acadêmico" (mapa de telas). */
const VERSAO = 'Versão 0.5';

const APARENCIAS = [
  { valor: 'claro' as const, rotulo: 'Claro' },
  { valor: 'escuro' as const, rotulo: 'Escuro' },
];

export function Ajustes() {
  const { cores } = useVidro();
  // `useTema` é o provider, não o token: é ele que troca claro/escuro.
  const { tema, trocarTema } = useTema();
  const alunos = useDados((s) => s.alunos);
  const perfil = useDados((s) => s.perfil);
  const politicas = useDados((s) => s.politicas);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const padraoSalvo = useDados((s) => s.pacotePadrao);
  const { ir } = useNavegacao();

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
    <TelaVidro tipo="raiz" titulo="Ajustes">
      <View style={estilos.tituloRaiz}>
        <Text style={[TIPO_VIDRO.tituloGrande, { color: cores.tinta }]}>Ajustes</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${perfil.nome}. ${comPacote} alunos com pacote, ${alunos.length} cadastrados. Editar perfil.`}
        onPress={() => ir('perfil')}
        style={({ pressed }) => [estilos.perfil, pressed ? estilos.pressionado : null]}
      >
        <CartaoVidro estilo={estilos.cartaoPerfil}>
          <Avatar texto={perfil.iniciais} estado="perfil" tamanho={48} />
          <View style={estilos.flexivel}>
            <Text
              numberOfLines={1}
              style={[
                texto(16.5, 700, { altura: 1.2, tracking: -0.015 }),
                { color: cores.tinta },
              ]}
            >
              {perfil.nome}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                comEspaco(texto(12.5, 500, { altura: 1.35 }), { topo: 4 }),
                { color: cores.tinta2 },
              ]}
            >
              {`${comPacote} alunos com pacote · ${alunos.length} cadastrados`}
            </Text>
          </View>
          <Icone nome="chevron" tamanho={TAMANHO_VIDRO.chevron} cor={cores.tinta3} />
        </CartaoVidro>
      </Pressable>

      <View style={estilos.grupo}>
        <CabecalhoGrupo titulo="Regras do seu trabalho" />
      </View>
      <ListaAgrupada>
        <LinhaLista
          porte="grande"
          titulo="Política de faltas"
          subtitulo={resumoPolitica}
          aoTocar={() => ir('politica')}
        />
        <LinhaLista
          porte="grande"
          titulo="Minha disponibilidade"
          subtitulo={resumoDaDisponibilidade(disponibilidade.blocos)}
          aoTocar={() => ir('minhaDisponibilidade')}
        />
        <LinhaLista
          porte="grande"
          titulo="Pacotes e valores padrão"
          subtitulo={pacotePadrao}
          aoTocar={() => ir('pacotesPadrao')}
        />
      </ListaAgrupada>

      <View style={estilos.grupo}>
        <CabecalhoGrupo titulo="App" />
      </View>
      <ListaAgrupada>
        <LinhaLista
          titulo="Aparência"
          direita={
            <Segmentado
              opcoes={APARENCIAS}
              valor={tema}
              aoTrocar={trocarTema}
              porte="linha"
              rotuloDoGrupo="Aparência"
            />
          }
        />
        <LinhaLista titulo="Avisos e lembretes" aoTocar={() => ir('avisos')} />
        <LinhaLista
          titulo="Chave Pix e dados de cobrança"
          subtitulo={perfil.chavePix ?? 'não configurada'}
          aoTocar={() => ir('chavePix')}
        />
        <LinhaLista
          titulo="Conta e assinatura"
          subtitulo={perfil.plano === 'pago' ? 'Plano pago' : 'Plano gratuito'}
          aoTocar={() => ir('conta')}
        />
      </ListaAgrupada>

      <Text
        style={[
          comEspaco(texto(11.5, 500, { altura: 1.5 }), { topo: 20 }),
          estilos.centro,
          { color: cores.tinta3 },
        ]}
      >
        {VERSAO}
      </Text>
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  centro: { textAlign: 'center' },
  pressionado: { opacity: 0.86 },
  tituloRaiz: { paddingHorizontal: 6, paddingTop: 8, paddingBottom: 2 },
  perfil: { marginTop: 18 },
  cartaoPerfil: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  grupo: { marginTop: 24, marginBottom: 9 },
});
