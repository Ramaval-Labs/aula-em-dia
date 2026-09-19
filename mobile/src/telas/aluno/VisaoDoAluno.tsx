/**
 * Fluxo F — a visão do aluno, como pré-visualização dentro do app, no iOS
 * Glass (derivadas: o handoff novo não desenha estas telas).
 *
 * O handoff antigo desenha isto como página web pública. Aqui são telas
 * nativas empilhadas, alcançáveis por "Ver como o aluno vê" na ficha — o
 * professor confere o que o aluno recebe sem precisar publicar nada. Toda
 * tela abre com a faixa "Prévia do que o aluno vê", para não haver dúvida de
 * que é o professor quem está olhando.
 *
 * A frase da regra combinada vem da MESMA função que alimenta o cartão-espelho
 * do onboarding: o que o professor declarou é o que o aluno lê.
 */

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BlocoStatus, CartaoVidro, EstadoVazio } from '../../componentes/Blocos';
import { TelaVidro, TituloDeConteudo } from '../../componentes/Chassi';
import {
  BotaoPrimario,
  BotaoSecundario,
  BotaoTexto,
  CartaoEscolha,
} from '../../componentes/Controles';
import {
  GradeSemanal,
  PAD_CARTAO_DA_GRADE,
  RodapeDaGrade,
} from '../../componentes/GradeSemanal';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import { candidatos, melhores } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import { alternarBloco, DIAS_UTEIS, resumoMarcados } from '../../dominio/disponibilidade';
import { primeiroNome } from '../../dominio/formato';
import { comoOAlunoVaiLer } from '../../dominio/mensagens';
import { saldo, temPacote } from '../../dominio/politica';
import type { Lancamento } from '../../dominio/tipos';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { RAIO, TAMANHO } from '../../tema/tokens';
import { LinhaDoExtrato } from '../comum/Extrato';

/** Referencia estavel para aluno sem lancamentos. */
const SEM_LANCAMENTOS: Lancamento[] = [];

/** Rótulo do voltar nas três páginas: a tela anterior é o menu da prévia. */
const VOLTAR_PARA_PREVIA = 'Prévia';

/* ── Peças locais ─────────────────────────────────────────────────────── */

/**
 * Faixa do topo de toda tela da prévia. Bloco de status no tom tint: é
 * informação do sistema, não alerta. O texto de apoio muda por tela.
 */
function FaixaPrevia({ texto: apoio }: { texto?: string }) {
  return <BlocoStatus tom="tint" titulo="Prévia do que o aluno vê" texto={apoio} />;
}

/** "Ana · Inglês" — o que o cabeçalho da página do aluno mostraria. */
function useAssinatura(): string {
  const perfil = useDados((s) => s.perfil);
  return `Página de ${primeiroNome(perfil.nome)} · ${perfil.disciplinas[0] ?? ''}`;
}

/* ── Menu: qual das três páginas ──────────────────────────────────────── */

export function VerComoAluno() {
  const { alunoId, ir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));

  return (
    <TelaVidro
      tipo="empilhada"
      titulo="Prévia"
      voltarPara={aluno ? primeiroNome(aluno.name) : 'Alunos'}
    >
      <FaixaPrevia texto="O aluno abre estas páginas por um link, sem instalar nada e sem login. Aqui elas aparecem como pré-visualização." />

      <TituloDeConteudo
        titulo={aluno ? `O que ${primeiroNome(aluno.name)} vê` : 'O que o aluno vê'}
        estilo={estilos.titulo}
      />

      <CabecalhoGrupo titulo="Páginas do aluno" estilo={estilos.tituloGrupo} />
      <ListaAgrupada estilo={estilos.lista}>
        <LinhaLista
          titulo="Meu saldo"
          subtitulo="Saldo, próximas aulas, regra combinada e extrato"
          aoTocar={() => ir('alunoSaldo')}
        />
        <LinhaLista
          titulo="Proposta de reposição"
          subtitulo="Aceitar, ver outras opções ou recusar"
          aoTocar={() => ir('alunoProposta')}
        />
        <LinhaLista
          titulo="Informar disponibilidade"
          subtitulo="A grade que ele devolve quando nenhum horário serve"
          aoTocar={() => ir('alunoDisponibilidade')}
        />
      </ListaAgrupada>
    </TelaVidro>
  );
}

// --- F1, meu saldo --------------------------------------------------------

export function AlunoSaldo() {
  const { cores } = useCores();
  const alunoId = useNavegacao((s) => s.alunoId);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  // O `?? []` NAO pode ficar dentro do seletor: devolveria um array novo a cada
  // chamada e o zustand entraria em loop de render. A constante e estavel.
  const extrato =
    useDados((s) => (alunoId ? s.extratos[alunoId] : undefined)) ?? SEM_LANCAMENTOS;
  const politicas = useDados((s) => s.politicas);
  const nomeDoProfessor = useDados((s) => s.perfil.nome);
  const avisar = useToast((s) => s.avisar);
  const assinatura = useAssinatura();

  if (!aluno) {
    return (
      <TelaVidro tipo="empilhada" titulo="Meu saldo" voltarPara={VOLTAR_PARA_PREVIA}>
        <FaixaPrevia texto={assinatura} />
        <CartaoVidro semPadding estilo={estilos.cartao}>
          <EstadoVazio titulo="Aluno não encontrado." />
        </CartaoVidro>
      </TelaVidro>
    );
  }

  const restam = saldo(aluno);
  const com = temPacote(aluno);

  return (
    <TelaVidro
      tipo="empilhada"
      titulo="Meu saldo"
      voltarPara={VOLTAR_PARA_PREVIA}
      rodape={
        <View style={estilos.acoes}>
          <BotaoPrimario
            rotulo="Avisar que não posso ir"
            aoTocar={() => avisar('O professor recebeu o aviso da falta.')}
          />
          <BotaoSecundario
            rotulo={`Falar com ${primeiroNome(nomeDoProfessor)}`}
            aoTocar={() => avisar('Conversa aberta com o professor.')}
          />
        </View>
      }
    >
      <FaixaPrevia texto={assinatura} />

      <CartaoVidro estilo={estilos.cartaoGrande}>
        <Text style={[TIPO.rotuloCartao, { color: cores.tinta3 }]}>Seu saldo</Text>
        <View
          accessible
          // Por inteiro, como pede spec/acessibilidade.md ("4 aulas restantes de 6").
          accessibilityLabel={com ? `${restam} aulas restantes de ${aluno.total}` : 'sem pacote'}
          style={estilos.numeroDoSaldo}
        >
          <Text
            style={[
              TIPO.saldoCartao,
              { color: !com ? cores.tinta3 : restam <= 2 ? cores.ambarTexto : cores.tint },
            ]}
          >
            {com ? String(restam) : '—'}
          </Text>
          <Text style={[texto(14, 600), { color: cores.tinta2 }]}>aulas</Text>
        </View>
        <Text
          style={[comEspaco(texto(13, 500, { altura: 1.45 }), { topo: 10 }), { color: cores.tinta2 }]}
        >
          {com
            ? `Pacote de ${aluno.total} aulas, ${aluno.usadas} já usadas. Válido até ${aluno.validade}.`
            : 'Sem pacote ativo no momento.'}
        </Text>
      </CartaoVidro>

      <CabecalhoGrupo titulo="Próximas aulas" estilo={estilos.tituloGrupo} />
      <ListaAgrupada estilo={estilos.lista}>
        <LinhaLista
          titulo={aluno.hora ? `${aluno.dia}, ${aluno.hora}` : 'Sem horário fixo'}
          subtitulo="Aula fixa"
        />
        {aluno.agendada ? (
          <LinhaLista
            titulo={`${aluno.agendada.dia} · ${aluno.agendada.hora}`}
            subtitulo="Reposição marcada"
          />
        ) : null}
      </ListaAgrupada>

      <CartaoVidro estilo={estilos.cartao}>
        <Text style={[TIPO.rotuloCartao, { color: cores.tinta3 }]}>A regra combinada</Text>
        <Text
          style={[
            comEspaco(texto(14, 500, { altura: 1.55 }), { topo: 10 }),
            { color: cores.tinta2 },
          ]}
        >
          {comoOAlunoVaiLer(politicas, false)}
        </Text>
      </CartaoVidro>

      <CabecalhoGrupo titulo="Extrato do pacote" estilo={estilos.tituloGrupo} />
      <ListaAgrupada estilo={estilos.lista}>
        {extrato.length === 0 ? (
          <EstadoVazio titulo="Nenhum lançamento ainda." />
        ) : (
          extrato.map((l, i) => <LinhaDoExtrato key={`${l.d}-${l.t}-${i}`} lancamento={l} />)
        )}
      </ListaAgrupada>

      <Text
        style={[
          comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 16 }),
          estilos.centro,
          { color: cores.tinta2 },
        ]}
      >
        Esta página é atualizada pelo professor. Não precisa instalar nada.
      </Text>
    </TelaVidro>
  );
}

// --- F2, proposta de reposição -------------------------------------------

export function AlunoProposta() {
  const { cores } = useCores();
  const { alunoId, ir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const perfil = useDados((s) => s.perfil);
  const responderProposta = useDados((s) => s.responderProposta);
  const avisar = useToast((s) => s.avisar);
  const assinatura = useAssinatura();

  // Qual janela o aluno marcou: morre com a tela, então é useState.
  const [escolhida, setEscolhida] = useState(0);

  const todas = useMemo(
    () => (aluno ? candidatos(aluno, alunos, disponibilidade, hoje()) : []),
    [aluno, alunos, disponibilidade],
  );
  const sugeridas = melhores(todas, 3);

  const proposta = aluno?.proposta;
  const principal = proposta?.janela ?? sugeridas[0];
  // Sem proposta em aberto, a página é só a prévia do que o aluno veria:
  // aceitar e recusar ficam apagados, para não confirmar nada de mentira.
  const emPrevia = !proposta;

  if (!aluno || !principal) {
    return (
      <TelaVidro tipo="empilhada" titulo="Proposta" voltarPara={VOLTAR_PARA_PREVIA}>
        <FaixaPrevia texto={assinatura} />
        <CartaoVidro semPadding estilo={estilos.cartao}>
          <EstadoVazio
            titulo="Nenhuma proposta em aberto."
            nota="Quando o professor sugerir um horário, ele aparece aqui."
          />
        </CartaoVidro>
      </TelaVidro>
    );
  }

  const alternativas = proposta?.alternativas ?? sugeridas.slice(1);

  // Os motivos são os da janela proposta, não os da primeira sugestão do
  // motor — a proposta pode ter saído da lista completa (C4).
  const razoes = (
    proposta
      ? todas.find((c) => c.dia === principal.dia && c.hora === principal.hora)
      : sugeridas[0]
  )?.razoes;

  // A proposta e as alternativas viram cartões de escolha (modelo H§5); o
  // primário aceita a que estiver marcada.
  const janelas: { dia: string; hora: string; motivo?: string }[] = [
    { dia: principal.dia, hora: principal.hora },
    ...alternativas,
  ];
  const marcada = janelas[Math.min(escolhida, janelas.length - 1)];

  const aceitar = (j: { dia: string; hora: string }) => {
    responderProposta(aluno.id, 'aceita', { dia: j.dia, hora: j.hora });
    avisar(`Reposição confirmada em ${j.dia}, ${j.hora}. O professor foi avisado.`);
    ir('aluno', { alunoId: aluno.id });
  };

  return (
    <TelaVidro
      tipo="empilhada"
      titulo="Proposta"
      voltarPara={VOLTAR_PARA_PREVIA}
      rodape={
        <View style={estilos.acoes}>
          <BotaoPrimario
            rotulo={`Aceitar ${marcada.dia}, ${marcada.hora}`}
            desabilitado={emPrevia}
            aoTocar={() => aceitar(marcada)}
          />
          <BotaoTexto
            rotulo="Recusar"
            desabilitado={emPrevia}
            aoTocar={() => {
              responderProposta(aluno.id, 'recusada');
              avisar('Recusado. Informe sua disponibilidade para novas sugestões.');
              ir('alunoDisponibilidade');
            }}
          />
        </View>
      }
    >
      <FaixaPrevia texto={assinatura} />

      <TituloDeConteudo
        acima={`${primeiroNome(perfil.nome)} propôs uma reposição`}
        titulo={`${principal.dia}\nàs ${principal.hora}`}
        estilo={estilos.titulo}
      />

      {emPrevia ? (
        <BlocoStatus
          estilo={estilos.cartao}
          titulo="Pré-visualização"
          texto={`Ainda não há proposta enviada para ${primeiroNome(
            aluno.name,
          )}. Os botões funcionam quando você enviar um horário.`}
        />
      ) : null}

      {razoes?.length ? (
        <CartaoVidro estilo={estilos.cartao}>
          <Text style={[TIPO.rotuloCartao, { color: cores.tinta3 }]}>Por que esse horário</Text>
          <View style={estilos.razoes}>
            {razoes.map((r) => (
              <View key={r} style={estilos.razao}>
                <View style={[estilos.ponto, { backgroundColor: cores.verde }]} />
                <Text
                  style={[texto(14, 500, { altura: 1.5 }), estilos.flexivel, { color: cores.tinta2 }]}
                >
                  {r}
                </Text>
              </View>
            ))}
          </View>
        </CartaoVidro>
      ) : null}

      <CabecalhoGrupo titulo="Horários" estilo={estilos.tituloGrupo} />
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Horários sugeridos"
        style={estilos.escolhas}
      >
        {janelas.map((j, i) => (
          <CartaoEscolha
            key={`${j.dia}-${j.hora}`}
            titulo={j.dia}
            aoLado={j.hora}
            subtitulo={i === 0 ? 'Horário proposto' : j.motivo}
            selecionado={marcada === j}
            desabilitado={emPrevia}
            rotuloAcessivel={[`${j.dia}, ${j.hora}`, i === 0 ? 'Horário proposto' : j.motivo]
              .filter(Boolean)
              .join('. ')}
            aoTocar={() => setEscolhida(i)}
          />
        ))}
      </View>

      <CartaoVidro estilo={estilos.cartao}>
        <Text style={[TIPO.rotuloCartao, { color: cores.tinta3 }]}>Seu saldo hoje</Text>
        <View style={estilos.numeroDoSaldo}>
          <Text style={[TIPO.saldoCartao, { color: cores.tinta }]}>
            {String(saldo(aluno))}
          </Text>
          <Text style={[texto(14, 600), { color: cores.tinta2 }]}>aulas</Text>
        </View>
        <Text
          style={[comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 9 }), { color: cores.tinta2 }]}
        >
          Aceitar não muda o saldo.
        </Text>
      </CartaoVidro>

      <BlocoStatus
        estilo={estilos.cartao}
        tom="ambar"
        titulo="Se nenhum horário servir"
        texto={`Você pode recusar e marcar de novo quando puder. ${primeiroNome(
          perfil.nome,
        )} recebe o aviso.`}
      />
    </TelaVidro>
  );
}

// --- F3, informar disponibilidade ----------------------------------------

export function AlunoDisponibilidade() {
  const { cores } = useCores();
  const { alunoId, concluir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const perfil = useDados((s) => s.perfil);
  const salvar = useDados((s) => s.salvarDisponibilidadeDoAluno);
  const avisar = useToast((s) => s.avisar);
  const assinatura = useAssinatura();

  const [blocos, , substituir] = useRascunho(
    'disponibilidadeAluno',
    aluno?.disponibilidade ?? [],
  );

  return (
    <TelaVidro
      tipo="empilhada"
      titulo="Disponibilidade"
      voltarPara={VOLTAR_PARA_PREVIA}
      rodape={
        <BotaoPrimario
          rotulo="Enviar disponibilidade"
          desabilitado={blocos.length === 0}
          aoTocar={() => {
            if (!aluno) return;
            salvar(aluno.id, blocos);
            avisar(
              `${primeiroNome(perfil.nome)} recebeu sua disponibilidade e vai propor até três horários.`,
            );
            concluir('aluno', aluno.id);
          }}
        />
      }
    >
      <FaixaPrevia texto={assinatura} />

      <TituloDeConteudo
        titulo="Quando você pode repor?"
        abaixo="Marque os blocos possíveis. Nada é agendado agora."
        estilo={estilos.titulo}
      />

      <CartaoVidro estilo={[estilos.cartaoGrande, PAD_CARTAO_DA_GRADE]}>
        <GradeSemanal
          marcados={blocos}
          dias={DIAS_UTEIS}
          rotuloDaFaixa="nome"
          alturaDaCelula={52}
          aoAlternar={(b) => substituir(alternarBloco(blocos, b))}
        />
        <RodapeDaGrade esquerda={resumoMarcados(blocos)} direita="Toque para marcar" />
      </CartaoVidro>

      <Text
        style={[
          comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 16 }),
          estilos.centro,
          { color: cores.tinta2 },
        ]}
      >
        {`${primeiroNome(perfil.nome)} recebe o aviso e propõe até três horários.`}
      </Text>
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  centro: { textAlign: 'center' },
  titulo: { marginTop: 22 },
  tituloGrupo: { marginTop: 26 },
  lista: { marginTop: 9 },
  cartao: { marginTop: 14 },
  cartaoGrande: { marginTop: 18 },
  numeroDoSaldo: { marginTop: 9, flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  acoes: { gap: 10 },
  razoes: { marginTop: 12, gap: 11 },
  razao: { flexDirection: 'row', gap: 12 },
  // Marcador decorativo da lista de motivos; o texto ao lado carrega tudo.
  ponto: {
    width: TAMANHO.pontoLista,
    height: TAMANHO.pontoLista,
    borderRadius: RAIO.circulo,
    marginTop: 8,
  },
  escolhas: { marginTop: 9, gap: 10 },
});
