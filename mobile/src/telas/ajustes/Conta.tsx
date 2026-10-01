/**
 * E4 — Conta e assinatura (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, em lista agrupada, com "Sair" como botão de texto destrutivo em dois
 * toques.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro, MedidorPacote } from '../../componentes/Blocos';
import { BotaoPrimario, BotaoSecundario, BotaoTexto } from '../../componentes/Controles';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import { useDoisToques } from '../../componentes/useDoisToques';
import { useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { estilos } from './estilos';
import { TelaDeAjuste } from './pecas';

const LIMITE_GRATUITO = 5;
const BENEFICIOS = [
  'Alunos ilimitados',
  'Link público do aluno personalizado',
  'Relatórios mensais',
];

export function Conta() {
  const { cores } = useCores();
  const { concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const alunos = useDados((s) => s.alunos);
  const extratos = useDados((s) => s.extratos);
  const politicas = useDados((s) => s.politicas);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const sair = useSessao((s) => s.sair);
  const avisar = useToast((s) => s.avisar);

  // Sair leva de volta ao login: dois toques.
  const sairDaConta = useDoisToques(() => {
    sair();
    avisar('Você saiu. Até logo!');
  });

  const exportar = () => {
    Clipboard.setStringAsync(JSON.stringify({ alunos, extratos, politicas }, null, 2)).catch(
      () => {},
    );
    avisar('Dados copiados para a área de transferência.');
  };

  const ativos = alunos.filter((a) => !a.arquivado).length;
  const pago = perfil.plano === 'pago';
  const ocupadas = Math.min(ativos, LIMITE_GRATUITO);

  return (
    <TelaDeAjuste
      titulo="Conta e assinatura"
      // "Sair" fecha a tela, depois das ações do plano: destrutivo nunca
      // fica entre o conteúdo e o primário.
      rodape={
        <>
          {pago ? null : (
            <>
              <BotaoPrimario
                rotulo="Assinar por R$ 29,90"
                aoTocar={() => {
                  salvarPerfil({ ...perfil, plano: 'pago' });
                  avisar('Plano ativado. Alunos ilimitados.');
                  concluir('ajustes');
                }}
              />
              <BotaoSecundario
                rotulo="Continuar no gratuito"
                aoTocar={() => concluir('ajustes')}
                estilo={proprios.segundaAcao}
              />
            </>
          )}
          <BotaoTexto
            tom="destrutivo"
            rotulo={sairDaConta.armado ? 'Tocar de novo para sair' : 'Sair da conta'}
            aoTocar={sairDaConta.tocar}
            estilo={pago ? undefined : proprios.segundaAcao}
          />
        </>
      }
    >
      <CartaoVidro estilo={[estilos.cartao, estilos.primeiro]}>
        <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>Plano atual</Text>
        <Text
          style={[
            comEspaco(texto(22, 800, { altura: 1.15, tracking: -0.03 }), { topo: 8 }),
            { color: cores.tinta },
          ]}
        >
          {pago ? 'Pago' : 'Gratuito'}
        </Text>
        {!pago ? (
          <>
            {/* Uma barra por vaga do plano, as ocupadas em cor (âmbar no
                limite). Decorativo: o número vem logo abaixo, em texto. */}
            <MedidorPacote
              variante="progresso"
              total={LIMITE_GRATUITO}
              usadas={ocupadas}
              baixo={ativos >= LIMITE_GRATUITO}
              estilo={proprios.medidor}
            />
            <Text
              style={[
                comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 9 }),
                { color: cores.tinta2 },
              ]}
            >
              {`${ativos} de ${LIMITE_GRATUITO} alunos usados`}
            </Text>
          </>
        ) : null}
      </CartaoVidro>

      {!pago ? (
        <CartaoVidro estilo={estilos.cartao}>
          <Text
            style={[texto(15.5, 700, { altura: 1.3, tracking: -0.012 }), { color: cores.tinta }]}
          >
            Plano pago · R$ 29,90 por mês
          </Text>
          <View style={proprios.beneficios}>
            {BENEFICIOS.map((b) => (
              <Text key={b} style={[texto(13, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
                {`· ${b}`}
              </Text>
            ))}
          </View>
        </CartaoVidro>
      ) : null}

      <View style={estilos.grupo}>
        <CabecalhoGrupo titulo="Conta" />
      </View>
      <ListaAgrupada>
        <LinhaLista titulo="E-mail da conta" subtitulo={perfil.email} />
        {/* Sem chevron: não há para onde ir enquanto o login for mock. */}
        <LinhaLista titulo="Alterar senha" subtitulo="Chega junto com o login de verdade" />
        <LinhaLista
          titulo="Exportar meus dados"
          subtitulo="Copia alunos, extratos e políticas"
          aoTocar={exportar}
        />
      </ListaAgrupada>

      {/* Linha sem ação, e não um bloco com cara de botão: nesta versão
          nada é apagado, e a tela diz isso. */}
      <ListaAgrupada estilo={estilos.bloco}>
        <LinhaLista
          titulo="Apagar minha conta"
          subtitulo="Indisponível no protótipo: nesta versão nada é apagado."
        />
      </ListaAgrupada>

    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  medidor: { marginTop: 14 },
  beneficios: { marginTop: 10, gap: 6 },
  segundaAcao: { marginTop: 10 },
});
