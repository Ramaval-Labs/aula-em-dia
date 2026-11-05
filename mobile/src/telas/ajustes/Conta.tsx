/**
 * E4 — Conta e assinatura (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, em lista agrupada, com "Sair" como botão de texto destrutivo em dois
 * toques.
 */

import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro, MedidorPacote } from '../../componentes/Blocos';
import { BotaoPrimario, BotaoSecundario, BotaoTexto } from '../../componentes/Controles';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import { useDoisToques } from '../../componentes/useDoisToques';
import { alunosAtivos, atingiuOLimite, LIMITE_GRATUITO } from '../../dominio/plano';
import { avisos } from '../../estado/avisos';
import { useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { loginReal, podeApagarConta, useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { estilos } from './estilos';
import { TelaDeAjuste } from './pecas';

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
  const apagarConta = useSessao((s) => s.apagarConta);
  const avisar = useToast((s) => s.avisar);
  const real = loginReal();
  const podeApagar = podeApagarConta();
  // Enquanto o servidor não responde, a linha não arma de novo: um terceiro e
  // um quarto toque mandariam um segundo pedido.
  const [apagando, setApagando] = useState(false);

  // Sair leva de volta ao login: dois toques.
  const sairDaConta = useDoisToques(() => {
    void sair();
    avisar('Você saiu. Até logo!');
  });

  // Apagar também em dois toques. Quem sai é a sessão, só depois de o servidor
  // confirmar; se ele falhar, a pessoa continua aqui com a conta inteira.
  const apagarTudo = useDoisToques(() => {
    setApagando(true);
    apagarConta().catch(() => {
      setApagando(false);
      avisar(avisos.apagarContaFalhou);
    });
  });

  const exportar = () => {
    Clipboard.setStringAsync(JSON.stringify({ alunos, extratos, politicas }, null, 2)).catch(
      () => {},
    );
    avisar('Dados copiados para a área de transferência.');
  };

  const ativos = alunosAtivos(alunos).length;
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
              baixo={atingiuOLimite(alunos, perfil.plano)}
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
        {/* Sem chevron: não há para onde ir em nenhum dos modos. Com o login
            de verdade a promessa já chegou, então o texto só diz que falta. */}
        <LinhaLista
          titulo="Alterar senha"
          subtitulo={real ? 'Ainda não disponível' : 'Chega junto com o login de verdade'}
        />
        <LinhaLista
          titulo="Exportar meus dados"
          subtitulo="Copia alunos, extratos e políticas"
          aoTocar={exportar}
        />
      </ListaAgrupada>

      {/* Com login de verdade, a linha apaga em dois toques, em vermelho e sem
          chevron: executa, não leva a outra tela. No local não há conta, e a
          linha segue sem ação, dizendo isso. Nunca primário: a tela já tem o
          dela. */}
      <ListaAgrupada estilo={estilos.bloco}>
        {podeApagar ? (
          <LinhaLista
            tom="destrutivo"
            titulo={apagarTudo.armado ? avisos.apagarContaConfirmar : 'Apagar minha conta'}
            subtitulo={avisos.apagarContaSubtitulo}
            aoTocar={apagando ? undefined : apagarTudo.tocar}
          />
        ) : (
          <LinhaLista
            titulo="Apagar minha conta"
            subtitulo="Indisponível no protótipo: nesta versão nada é apagado."
          />
        )}
      </ListaAgrupada>

    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  medidor: { marginTop: 14 },
  beneficios: { marginTop: 10, gap: 6 },
  segundaAcao: { marginTop: 10 },
});
