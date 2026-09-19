/**
 * Tela 4 — Resultado (handoff-ios-glass/README.md §4).
 *
 * Sheet de resultado (74%), sem "Cancelar", título "Registrado". Confirma o
 * que foi lançado e oferece o próximo passo, quando houver.
 *
 * "Escolher horário" só aparece quando **este** registro criou a reposição —
 * `Registrar` guarda isso no rascunho (`reposicaoCriada`), porque a pendência
 * do aluno pode ser de antes e a ficha já cuida dela.
 *
 * O saldo mostrado é o **já gravado** pelo registro — o protótipo aplica o
 * delta uma segunda vez aqui, e essa divergência é conhecida (MAPA-DE-TELAS,
 * "Divergências handoff × domínio").
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BlocoStatus, EstadoVazio } from '../componentes/Blocos';
import { BotaoPrimario, BotaoSecundario } from '../componentes/Controles';
import { Icone } from '../componentes/Icone';
import { ListaAgrupada } from '../componentes/Listas';
import { Sheet } from '../componentes/Sheet';
import { plural, primeiroNome } from '../dominio/formato';
import { efeito, saldo, saldoBaixo } from '../dominio/politica';
import { useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { RAIO, TAMANHO } from '../tema/tokens';

export function Resultado() {
  const { cores, material } = useCores();
  const { alunoId, ir, fecharSheet } = useNavegacao();
  const [{ desfecho, avisoH, reposicaoCriada }] = useRascunho('registro', REGISTRO_INICIAL);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const politicas = useDados((s) => s.politicas);

  if (!aluno || !desfecho) {
    return (
      <Sheet
        titulo="Registrado"
        altura="resultado"
        semCancelar
        rodape={<BotaoSecundario rotulo="Fechar" aoTocar={fecharSheet} />}
      >
        <ListaAgrupada estilo={estilos.vazio}>
          <EstadoVazio titulo="Nada para mostrar aqui." />
        </ListaAgrupada>
      </Sheet>
    );
  }

  const ef = efeito(desfecho, avisoH, politicas);
  // O saldo já foi aplicado pelo registro: aqui só mostramos o valor atual.
  const restam = saldo(aluno);
  const geradaReposicao = reposicaoCriada === true;
  // Pendência que já existia antes deste registro: a ficha do aluno continua
  // sendo o lugar dela, e o primário daqui não é sobre ela.
  const pendenciaAntiga = !!aluno.pendencia && !geradaReposicao;
  // A regra pedia reposição e o pacote não tinha mais direito (H§4: dizer).
  const bateuNoLimite = ef.reposicao && !geradaReposicao;
  const debitou = ef.delta < 0;
  const corDaMedalha = debitou ? cores.tint : cores.verde;

  return (
    <Sheet
      titulo="Registrado"
      altura="resultado"
      semCancelar
      rodape={
        <>
          {geradaReposicao ? (
            <BotaoPrimario rotulo="Escolher horário" aoTocar={() => ir('reposicao')} />
          ) : null}
          <BotaoSecundario
            rotulo="Fechar"
            aoTocar={fecharSheet}
            estilo={geradaReposicao ? estilos.fecharAbaixo : undefined}
          />
        </>
      }
    >
      <View style={estilos.centro}>
        <View
          aria-hidden
          style={[
            estilos.medalha,
            {
              backgroundColor: corDaMedalha,
              boxShadow: `${material.gin}, 0px 10px 28px ${cores.sombra}`,
            },
          ]}
        >
          <Icone
            nome="checkBloco"
            tamanho={TAMANHO.glifoMedalha}
            cor={debitou ? cores.sobreTint : cores.sobreCor}
          />
        </View>

        <Text
          accessibilityRole="header"
          style={[
            comEspaco(texto(25, 800, { altura: 1.15, tracking: -0.03 }), { topo: 18 }),
            estilos.texto,
            { color: cores.tinta },
          ]}
        >
          {ef.rotulo}
        </Text>

        <View
          accessible
          accessibilityLabel={`${plural(restam, 'aula resta', 'aulas restam')} de ${aluno.total}`}
          style={estilos.linhaDoSaldo}
        >
          <Text
            style={[
              TIPO.saldoResultado,
              { color: saldoBaixo(aluno) ? cores.ambarTexto : cores.tint },
            ]}
          >
            {restam}
          </Text>
          <Text style={[texto(15, 600), { color: cores.tinta2 }]}>
            {restam === 1 ? 'aula resta' : 'aulas restam'}
          </Text>
        </View>

        <Text
          style={[
            comEspaco(texto(13, 600), { topo: 8 }),
            estilos.texto,
            { color: cores.tinta3 },
          ]}
        >
          {ef.delta === 0
            ? 'sem debitar'
            : `${String(ef.delta).replace('-', '−')} ${Math.abs(ef.delta) === 1 ? 'aula' : 'aulas'}`}
        </Text>

        <Text
          style={[
            comEspaco(texto(14.5, 500, { altura: 1.55 }), { topo: 22 }),
            estilos.texto,
            estilos.explicacao,
            { color: cores.tinta2 },
          ]}
        >
          {`${ef.nota}. O lançamento já está no extrato de ${primeiroNome(aluno.name)}.${
            pendenciaAntiga
              ? ` ${primeiroNome(aluno.name)} ainda tem uma reposição pendente de ${
                  aluno.pendencia?.origem
                }, na ficha.`
              : ''
          }`}
        </Text>
      </View>

      {bateuNoLimite ? (
        <BlocoStatus
          titulo="Sem reposição"
          texto={`${aluno.reposicoes} de ${plural(
            politicas.limiteReposicoes,
            'reposição',
            'reposições',
          )} já usadas neste pacote. Sua política não permite outra.`}
          estilo={estilos.blocoLimite}
        />
      ) : null}
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  vazio: { marginTop: 10 },
  centro: { alignItems: 'center', paddingTop: 10, paddingHorizontal: 4 },
  texto: { textAlign: 'center' },
  // A explicação não estica até a borda: o handoff a segura em 300px.
  explicacao: { maxWidth: TAMANHO.larguraExplicacao },
  medalha: {
    width: TAMANHO.medalhaResultado,
    height: TAMANHO.medalhaResultado,
    borderRadius: RAIO.iconeResultado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaDoSaldo: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
  },
  blocoLimite: { marginTop: 20 },
  fecharAbaixo: { marginTop: 10 },
});
