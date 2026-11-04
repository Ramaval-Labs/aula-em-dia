/**
 * Fluxo F — a visão do aluno, no iOS Glass (derivadas: o handoff novo não
 * desenha estas telas).
 *
 * Cada página existe uma vez só, como miolo: `PaginaSaldo`, `PaginaProposta` e
 * `PaginaDisponibilidade` recebem o recorte do aluno (`PaginaDoAluno`, do
 * `dominio/paginaDoAluno`) e as ações por prop, e não leem store nem
 * navegação. Duas fontes as alimentam:
 *
 * - a **prévia**, "Ver como o aluno vê" na ficha: telas empilhadas que montam
 *   o recorte com `paginaDoAluno()` a partir da store e abrem com a faixa
 *   "Prévia do que o aluno vê", para não haver dúvida de que é o professor
 *   quem está olhando;
 * - o **link** `/a/<token>` (`AppDoAluno.tsx`), que recebe o mesmo recorte da
 *   Edge Function, sem faixa e sem tab bar.
 *
 * As duas leem a mesma função: o que o professor confere na prévia é o que o
 * aluno recebe (SCRUM-70). A frase da regra combinada também é a mesma do
 * cartão-espelho do onboarding: o que o professor declarou é o que o aluno lê.
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
import { plural, primeiroNome, unidade } from '../../dominio/formato';
import {
  paginaDoAluno,
  type JanelaDaPagina,
  type PaginaDoAluno,
} from '../../dominio/paginaDoAluno';
import type { BlocoSemanal, Lancamento } from '../../dominio/tipos';
import { avisos } from '../../estado/avisos';
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

/** "Página de Ana · Inglês" — o que o cabeçalho da página do aluno mostra. */
export function assinaturaDe(pagina: PaginaDoAluno): string {
  return `Página de ${pagina.professor.nome} · ${pagina.professor.disciplina ?? ''}`;
}

/** A mesma assinatura, na prévia, antes de haver recorte (aluno não encontrado). */
function useAssinatura(): string {
  const perfil = useDados((s) => s.perfil);
  return `Página de ${primeiroNome(perfil.nome)} · ${perfil.disciplinas[0] ?? ''}`;
}

/* ── A moldura: o que muda entre a prévia e o link ─────────────────────── */

export interface Moldura {
  /** o topo da página: a faixa da prévia, ou o cabeçalho do link */
  topo?: React.ReactNode;
  /** o voltar; sem ele, a página é a primeira do link e não tem para onde voltar */
  voltar?: { rotulo: string; aoVoltar?: () => void };
}

function Chassi({
  titulo,
  moldura,
  rodape,
  children,
}: {
  titulo: string;
  moldura: Moldura;
  rodape?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <TelaVidro
      tipo={moldura.voltar ? 'empilhada' : 'raiz'}
      titulo={titulo}
      voltarPara={moldura.voltar?.rotulo}
      aoVoltar={moldura.voltar?.aoVoltar}
      rodape={rodape}
    >
      {moldura.topo}
      {children}
    </TelaVidro>
  );
}

/** "Aluno não encontrado", na prévia: o aluno da navegação sumiu da store. */
function SemAluno({ titulo }: { titulo: string }) {
  const assinatura = useAssinatura();
  return (
    <TelaVidro tipo="empilhada" titulo={titulo} voltarPara={VOLTAR_PARA_PREVIA}>
      <FaixaPrevia texto={assinatura} />
      <CartaoVidro semPadding estilo={estilos.cartao}>
        <EstadoVazio titulo="Aluno não encontrado." />
      </CartaoVidro>
    </TelaVidro>
  );
}

/**
 * O recorte do aluno da prévia, com o mesmo `paginaDoAluno` que a Edge
 * Function chama no servidor. `null` sem aluno.
 */
function usePaginaDaPrevia() {
  const alunoId = useNavegacao((s) => s.alunoId);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  // O `?? []` NAO pode ficar dentro do seletor: devolveria um array novo a cada
  // chamada e o zustand entraria em loop de render. A constante e estavel.
  const extrato =
    useDados((s) => (alunoId ? s.extratos[alunoId] : undefined)) ?? SEM_LANCAMENTOS;
  const perfil = useDados((s) => s.perfil);
  const politicas = useDados((s) => s.politicas);
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);

  const pagina = useMemo(
    () =>
      aluno ? paginaDoAluno(aluno, extrato, perfil, politicas, alunos, disponibilidade, hoje()) : null,
    [aluno, extrato, perfil, politicas, alunos, disponibilidade],
  );
  return { aluno, pagina };
}

/* ── Menu da prévia: qual das três páginas ────────────────────────────── */

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

export function PaginaSaldo({
  pagina,
  moldura,
  rodape,
}: {
  pagina: PaginaDoAluno;
  moldura: Moldura;
  rodape?: React.ReactNode;
}) {
  const { cores } = useCores();
  const { saldo: restam, temPacote: com, total } = pagina;
  // O recorte não traz `usadas`. Com o `check (usadas <= total)` do banco, o
  // saldo é exatamente o total menos as usadas, e a conta inversa é exata.
  const usadas = total - restam;

  return (
    <Chassi titulo="Meu saldo" moldura={moldura} rodape={rodape}>
      <CartaoVidro estilo={estilos.cartaoGrande}>
        <Text style={[TIPO.rotuloCartao, { color: cores.tinta3 }]}>Seu saldo</Text>
        <View
          accessible
          // Por inteiro, como pede spec/acessibilidade.md ("4 aulas restantes de 6").
          accessibilityLabel={
            com ? `${plural(restam, 'aula restante', 'aulas restantes')} de ${total}` : 'sem pacote'
          }
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
          <Text style={[texto(14, 600), { color: cores.tinta2 }]}>
            {unidade(restam, 'aula', 'aulas')}
          </Text>
        </View>
        <Text
          style={[comEspaco(texto(13, 500, { altura: 1.45 }), { topo: 10 }), { color: cores.tinta2 }]}
        >
          {com
            ? `Pacote de ${plural(total, 'aula', 'aulas')}, ${usadas} já ${unidade(
                usadas,
                'usada',
                'usadas',
              )}. ${
                // Pacote sem prazo chega como 'sem prazo' (dominio/pacote.ts) ou
                // vazio: "Válido até sem prazo" não é frase.
                !pagina.validade || pagina.validade === 'sem prazo'
                  ? 'Sem prazo de validade.'
                  : `Válido até ${pagina.validade}.`
              }`
            : 'Sem pacote ativo no momento.'}
        </Text>
      </CartaoVidro>

      <CabecalhoGrupo titulo="Próximas aulas" estilo={estilos.tituloGrupo} />
      <ListaAgrupada estilo={estilos.lista}>
        <LinhaLista
          titulo={pagina.hora ? `${pagina.dia}, ${pagina.hora}` : 'Sem horário fixo'}
          subtitulo="Aula fixa"
        />
        {pagina.agendada ? (
          <LinhaLista
            titulo={`${pagina.agendada.dia} · ${pagina.agendada.hora}`}
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
          {pagina.regra}
        </Text>
      </CartaoVidro>

      <CabecalhoGrupo titulo="Extrato do pacote" estilo={estilos.tituloGrupo} />
      <ListaAgrupada estilo={estilos.lista}>
        {pagina.extrato.length === 0 ? (
          <EstadoVazio titulo="Nenhum lançamento ainda." />
        ) : (
          pagina.extrato.map((l, i) => (
            <LinhaDoExtrato key={`${l.d}-${l.t}-${i}`} lancamento={l} />
          ))
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
    </Chassi>
  );
}

export function AlunoSaldo() {
  const { pagina } = usePaginaDaPrevia();
  const avisar = useToast((s) => s.avisar);
  const assinatura = useAssinatura();

  if (!pagina) return <SemAluno titulo="Meu saldo" />;

  return (
    <PaginaSaldo
      pagina={pagina}
      moldura={{ topo: <FaixaPrevia texto={assinatura} />, voltar: { rotulo: VOLTAR_PARA_PREVIA } }}
      rodape={
        <View style={estilos.acoes}>
          <BotaoPrimario
            rotulo="Avisar que não posso ir"
            aoTocar={() => avisar('O professor recebeu o aviso da falta.')}
          />
          <BotaoSecundario
            rotulo={`Falar com ${pagina.professor.nome}`}
            aoTocar={() => avisar('Conversa aberta com o professor.')}
          />
        </View>
      }
    />
  );
}

// --- F2, proposta de reposição -------------------------------------------

/**
 * Uma janela como a página mostra. `motivo` só existe na pré-visualização sem
 * proposta, que sai do motor; o recorte não leva o texto gravado, que pode
 * citar outro aluno (SCRUM-69).
 */
type JanelaDaTela = JanelaDaPagina & { motivo?: string };

export interface PropostaDaTela {
  principal: JanelaDaTela;
  alternativas: JanelaDaTela[];
}

export function PaginaProposta({
  pagina,
  moldura,
  propostaDePrevia,
  ocupado = false,
  aoAceitar,
  aoRecusar,
}: {
  pagina: PaginaDoAluno;
  moldura: Moldura;
  /**
   * Só a prévia: sem proposta enviada, as sugestões do motor aparecem com os
   * botões apagados, para o professor ver a página sem confirmar nada de mentira.
   */
  propostaDePrevia?: PropostaDaTela | null;
  /** a resposta está a caminho: os botões esperam */
  ocupado?: boolean;
  aoAceitar: (janela: { dia: string; hora: string }) => void;
  aoRecusar: () => void;
}) {
  const { cores } = useCores();
  // Qual janela o aluno marcou: morre com a tela, então é useState.
  const [escolhida, setEscolhida] = useState(0);

  const proposta: PropostaDaTela | null = pagina.proposta ?? propostaDePrevia ?? null;
  const emPrevia = !pagina.proposta;

  if (!proposta) {
    return (
      <Chassi titulo="Proposta" moldura={moldura}>
        <CartaoVidro semPadding estilo={estilos.cartao}>
          <EstadoVazio
            titulo="Nenhuma proposta em aberto."
            nota="Quando o professor sugerir um horário, ele aparece aqui."
          />
        </CartaoVidro>
      </Chassi>
    );
  }

  const { principal, alternativas } = proposta;
  const razoes = principal.razoes;

  // A proposta e as alternativas viram cartões de escolha (modelo H§5); o
  // primário aceita a que estiver marcada.
  const janelas: JanelaDaTela[] = [principal, ...alternativas];
  const marcada = janelas[Math.min(escolhida, janelas.length - 1)];

  return (
    <Chassi
      titulo="Proposta"
      moldura={moldura}
      rodape={
        <View style={estilos.acoes}>
          <BotaoPrimario
            rotulo={`Aceitar ${marcada.dia}, ${marcada.hora}`}
            desabilitado={emPrevia || ocupado}
            aoTocar={() => aoAceitar({ dia: marcada.dia, hora: marcada.hora })}
          />
          <BotaoTexto rotulo="Recusar" desabilitado={emPrevia || ocupado} aoTocar={aoRecusar} />
        </View>
      }
    >
      <TituloDeConteudo
        acima={`${pagina.professor.nome} propôs uma reposição`}
        titulo={`${principal.dia}\nàs ${principal.hora}`}
        estilo={estilos.titulo}
      />

      {emPrevia ? (
        <BlocoStatus
          estilo={estilos.cartao}
          titulo="Pré-visualização"
          texto={`Ainda não há proposta enviada para ${pagina.nome}. Os botões funcionam quando você enviar um horário.`}
        />
      ) : null}

      {razoes.length ? (
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
          <Text style={[TIPO.saldoCartao, { color: cores.tinta }]}>{String(pagina.saldo)}</Text>
          <Text style={[texto(14, 600), { color: cores.tinta2 }]}>
            {unidade(pagina.saldo, 'aula', 'aulas')}
          </Text>
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
        texto={`Você pode recusar e marcar de novo quando puder. ${pagina.professor.nome} recebe o aviso.`}
      />
    </Chassi>
  );
}

export function AlunoProposta() {
  const { ir } = useNavegacao();
  const { aluno, pagina } = usePaginaDaPrevia();
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const responderProposta = useDados((s) => s.responderProposta);
  const avisar = useToast((s) => s.avisar);
  const assinatura = useAssinatura();

  // Sem proposta enviada, a prévia mostra o que o motor sugeriria. É só aqui:
  // no link, sem proposta, a página diz que não há nenhuma.
  const propostaDePrevia = useMemo((): PropostaDaTela | null => {
    if (!aluno || aluno.proposta) return null;
    const [primeira, ...resto] = melhores(candidatos(aluno, alunos, disponibilidade, hoje()), 3);
    if (!primeira) return null;
    const janela = ({ dia, hora, razoes, motivo }: JanelaDaTela) => ({ dia, hora, razoes, motivo });
    return { principal: janela(primeira), alternativas: resto.map(janela) };
  }, [aluno, alunos, disponibilidade]);

  if (!aluno || !pagina) return <SemAluno titulo="Proposta" />;

  return (
    <PaginaProposta
      pagina={pagina}
      moldura={{ topo: <FaixaPrevia texto={assinatura} />, voltar: { rotulo: VOLTAR_PARA_PREVIA } }}
      propostaDePrevia={propostaDePrevia}
      aoAceitar={(j) => {
        responderProposta(aluno.id, 'aceita', j);
        avisar(avisos.alunoAceitou(j));
        ir('aluno', { alunoId: aluno.id });
      }}
      aoRecusar={() => {
        responderProposta(aluno.id, 'recusada');
        avisar(avisos.alunoRecusou);
        ir('alunoDisponibilidade');
      }}
    />
  );
}

// --- F3, informar disponibilidade ----------------------------------------

export function PaginaDisponibilidade({
  pagina,
  moldura,
  blocos,
  aoMudar,
  aoEnviar,
  ocupado = false,
}: {
  pagina: PaginaDoAluno;
  moldura: Moldura;
  /** o que está marcado na grade; quem guarda é quem monta a página */
  blocos: BlocoSemanal[];
  aoMudar: (blocos: BlocoSemanal[]) => void;
  aoEnviar: () => void;
  ocupado?: boolean;
}) {
  const { cores } = useCores();

  return (
    <Chassi
      titulo="Disponibilidade"
      moldura={moldura}
      rodape={
        <BotaoPrimario
          rotulo="Enviar disponibilidade"
          desabilitado={blocos.length === 0 || ocupado}
          aoTocar={aoEnviar}
        />
      }
    >
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
          aoAlternar={(b) => aoMudar(alternarBloco(blocos, b))}
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
        {`${pagina.professor.nome} recebe o aviso e propõe até três horários.`}
      </Text>
    </Chassi>
  );
}

export function AlunoDisponibilidade() {
  const concluir = useNavegacao((s) => s.concluir);
  const { aluno, pagina } = usePaginaDaPrevia();
  const salvar = useDados((s) => s.salvarDisponibilidadeDoAluno);
  const avisar = useToast((s) => s.avisar);
  const assinatura = useAssinatura();

  // Rascunho de assistente: sobrevive ao chassi desmontar a tela ao navegar.
  const [blocos, , substituir] = useRascunho(
    'disponibilidadeAluno',
    aluno?.disponibilidade ?? [],
  );

  if (!aluno || !pagina) return <SemAluno titulo="Disponibilidade" />;

  return (
    <PaginaDisponibilidade
      pagina={pagina}
      moldura={{ topo: <FaixaPrevia texto={assinatura} />, voltar: { rotulo: VOLTAR_PARA_PREVIA } }}
      blocos={blocos}
      aoMudar={substituir}
      aoEnviar={() => {
        salvar(aluno.id, blocos);
        avisar(avisos.alunoEnviouDisponibilidade(pagina.professor.nome));
        concluir('aluno', aluno.id);
      }}
    />
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
