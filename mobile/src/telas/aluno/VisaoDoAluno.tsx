/**
 * Fluxo F — a visão do aluno, como pré-visualização dentro do app.
 *
 * O handoff desenha isto como página web pública. Aqui são telas nativas,
 * alcançáveis por "Ver como o aluno vê" na ficha — o professor confere o que
 * o aluno recebe sem precisar publicar nada.
 *
 * A frase da regra combinada vem da MESMA função que alimenta o cartão-espelho
 * do onboarding: o que o professor declarou é o que o aluno lê.
 */

import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { LinhaExtrato } from '../../componentes/Aluno';
import {
  Caixa,
  Cartao,
  CartaoContexto,
  EstadoVazio,
  LinhaLista,
  Lista,
  RotuloSecao,
} from '../../componentes/Base';
import { BotaoContorno, BotaoPrimario, BotaoTexto } from '../../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, Eyebrow, Heroi } from '../../componentes/Cabecalho';
import { GradeSemanal, RodapeDaGrade } from '../../componentes/GradeSemanal';
import { Wordmark } from '../../componentes/Marca';
import { Tela } from '../../componentes/Tela';
import { candidatos, melhores } from '../../dominio/agenda';
import { hoje } from '../../dominio/datas';
import {
  alternarBloco,
  DIAS_UTEIS,
  resumoMarcados,
} from '../../dominio/disponibilidade';
import { primeiroNome } from '../../dominio/formato';
import { comoOAlunoVaiLer } from '../../dominio/mensagens';
import { saldo, temPacote } from '../../dominio/politica';
import type { Lancamento } from '../../dominio/tipos';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { texto, TIPO } from '../../tema/tipografia';
import { MARCA } from '../../tema/tokens';

/** Referencia estavel para aluno sem lancamentos. */
const SEM_LANCAMENTOS: Lancamento[] = [];

/** Menu de entrada: qual das três páginas o professor quer ver. */
export function VerComoAluno() {
  const cores = useCores();
  const { alunoId, ir, voltar } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <Eyebrow>Pré-visualização</Eyebrow>
          </View>
          <Text
            style={[
              texto(22, 600, { altura: 1.2, tracking: -0.02 }),
              { marginTop: 10, color: '#FFFFFF' },
            ]}
          >
            {aluno ? `O que ${primeiroNome(aluno.name)} vê` : 'O que o aluno vê'}
          </Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 12 }}
    >
      <Caixa>
        <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>
          O aluno abre estas páginas por um link, sem instalar nada e sem login. Aqui elas
          aparecem como pré-visualização.
        </Text>
      </Caixa>

      <Lista rotulo="Páginas do aluno">
        <LinhaLista
          titulo="Meu saldo"
          sub="Saldo, próximas aulas, regra combinada e extrato"
          chevron
          aoTocar={() => ir('alunoSaldo')}
        />
        <LinhaLista
          titulo="Proposta de reposição"
          sub="Aceitar, ver outras opções ou recusar"
          chevron
          aoTocar={() => ir('alunoProposta')}
        />
        <LinhaLista
          titulo="Informar disponibilidade"
          sub="A grade que ele devolve quando nenhum horário serve"
          chevron
          ultima
          aoTocar={() => ir('alunoDisponibilidade')}
        />
      </Lista>
    </Tela>
  );
}

/** Cabeçalho comum das três páginas: a marca e o nome do professor. */
function TopoDoAluno({ children }: { children: React.ReactNode }) {
  const cores = useCores();
  const perfil = useDados((s) => s.perfil);
  const voltar = useNavegacao((s) => s.voltar);

  return (
    <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
      <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
      <View
        style={{
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Wordmark cor="#FFFFFF" tamanho={14} alturaDasBarras={15} />
        <Text style={[texto(11.5, 400, { altura: 1 }), { color: cores.topoFraco }]}>
          {`${primeiroNome(perfil.nome)} · ${perfil.disciplinas[0] ?? ''}`}
        </Text>
      </View>
      {children}
    </CabecalhoEscuro>
  );
}

// --- F1, meu saldo --------------------------------------------------------

export function AlunoSaldo() {
  const cores = useCores();
  const alunoId = useNavegacao((s) => s.alunoId);
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  // O `?? []` NAO pode ficar dentro do seletor: devolveria um array novo a cada
  // chamada e o zustand entraria em loop de render. A constante e estavel.
  const extrato =
    useDados((s) => (alunoId ? s.extratos[alunoId] : undefined)) ?? SEM_LANCAMENTOS;
  const politicas = useDados((s) => s.politicas);
  const nomeDoProfessor = useDados((s) => s.perfil.nome);
  const avisar = useToast((s) => s.avisar);

  if (!aluno) {
    return (
      <Tela cabecalho={<TopoDoAluno>{null}</TopoDoAluno>}>
        <EstadoVazio titulo="Aluno não encontrado." />
      </Tela>
    );
  }

  const restam = saldo(aluno);
  const com = temPacote(aluno);

  return (
    <Tela
      cabecalho={
        <TopoDoAluno>
          <View style={{ marginTop: 22 }}>
            <Eyebrow>Seu saldo</Eyebrow>
          </View>
          <View style={{ marginTop: 12 }}>
            <Heroi
              numero={com ? String(restam) : '—'}
              rotulo="aulas"
              tamanho={52}
              alinhar="esquerda"
              cor={restam <= 2 ? MARCA.amarelo : '#FFFFFF'}
              rotuloAcessivel={`${restam} aulas restantes`}
            />
          </View>
          <Text style={[TIPO.corpo, { marginTop: 12, color: cores.topoFraco }]}>
            {com
              ? `Pacote de ${aluno.total} aulas, ${aluno.usadas} já usadas. Válido até ${aluno.validade}.`
              : 'Sem pacote ativo no momento.'}
          </Text>
        </TopoDoAluno>
      }
      conteudoEstilo={{ gap: 12 }}
      rodape={
        <>
          <BotaoPrimario
            rotulo="Avisar que não posso ir"
            aoTocar={() => avisar('O professor recebeu o aviso da falta.')}
          />
          <BotaoContorno
            rotulo={`Falar com ${primeiroNome(nomeDoProfessor)}`}
            altura={44}
            aoTocar={() => avisar('Conversa aberta com o professor.')}
          />
        </>
      }
    >
      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <RotuloSecao>Próximas aulas</RotuloSecao>
        <View style={{ marginTop: 11, gap: 10 }}>
          <Text style={[texto(16, 600, { altura: 1.3 }), { color: cores.texto }]}>
            {aluno.hora ? `${aluno.dia}, ${aluno.hora}` : 'Sem horário fixo'}
          </Text>
          <Text style={[TIPO.legenda, { color: cores.textoMedio }]}>Aula fixa</Text>
          {aluno.agendada ? (
            <>
              <View style={{ height: 1, backgroundColor: cores.linha }} />
              <Text style={[texto(16, 600, { altura: 1.3 }), { color: cores.texto }]}>
                {`${aluno.agendada.dia} · ${aluno.agendada.hora}`}
              </Text>
              <Text style={[TIPO.legenda, { color: cores.textoMedio }]}>Reposição marcada</Text>
            </>
          ) : null}
        </View>
      </Cartao>

      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <RotuloSecao>A regra combinada</RotuloSecao>
        <Text
          style={[
            texto(14.5, 400, { altura: 1.6 }),
            { marginTop: 11, color: cores.textoMedio },
          ]}
        >
          {comoOAlunoVaiLer(politicas, false)}
        </Text>
      </Cartao>

      <View>
        <RotuloSecao estilo={{ marginBottom: 9 }}>Extrato do pacote</RotuloSecao>
        <Cartao estilo={{ overflow: 'hidden' }}>
          {extrato.length === 0 ? (
            <EstadoVazio titulo="Nenhum lançamento ainda." />
          ) : (
            extrato.map((l, i) => (
              <LinhaExtrato
                key={`${l.d}-${l.t}-${i}`}
                lancamento={l}
                ultima={i === extrato.length - 1}
              />
            ))
          )}
        </Cartao>
      </View>

      <Text style={[TIPO.nota, { color: cores.textoMedio, textAlign: 'center' }]}>
        Esta página é atualizada pelo professor. Não precisa instalar nada.
      </Text>
    </Tela>
  );
}

// --- F2, proposta de reposição -------------------------------------------

export function AlunoProposta() {
  const cores = useCores();
  const { alunoId, ir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const alunos = useDados((s) => s.alunos);
  const disponibilidade = useDados((s) => s.disponibilidade);
  const perfil = useDados((s) => s.perfil);
  const responderProposta = useDados((s) => s.responderProposta);
  const avisar = useToast((s) => s.avisar);

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
      <Tela cabecalho={<TopoDoAluno>{null}</TopoDoAluno>}>
        <EstadoVazio
          titulo="Nenhuma proposta em aberto."
          nota="Quando o professor sugerir um horário, ele aparece aqui."
        />
      </Tela>
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

  const aceitar = (j: { dia: string; hora: string }) => {
    responderProposta(aluno.id, 'aceita', { dia: j.dia, hora: j.hora });
    avisar(`Reposição confirmada em ${j.dia}, ${j.hora}. O professor foi avisado.`);
    ir('aluno', { alunoId: aluno.id });
  };

  return (
    <Tela
      cabecalho={
        <TopoDoAluno>
          <View style={{ marginTop: 22 }}>
            <Eyebrow>{`${primeiroNome(perfil.nome)} propôs uma reposição`}</Eyebrow>
          </View>
          <Text
            style={[
              texto(26, 600, { altura: 1.2, tracking: -0.03 }),
              { marginTop: 12, color: '#FFFFFF' },
            ]}
          >
            {`${principal.dia}\nàs ${principal.hora}`}
          </Text>
        </TopoDoAluno>
      }
      conteudoEstilo={{ gap: 12 }}
      rodape={
        <>
          <BotaoPrimario
            rotulo={`Aceitar ${principal.dia}, ${principal.hora}`}
            desabilitado={emPrevia}
            aoTocar={() => aceitar(principal)}
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
        </>
      }
    >
      {emPrevia ? (
        <Caixa>
          <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>
            {`Pré-visualização: ainda não há proposta enviada para ${primeiroNome(
              aluno.name,
            )}. Os botões funcionam quando você enviar um horário.`}
          </Text>
        </Caixa>
      ) : null}

      {razoes?.length ? (
      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <RotuloSecao>Por que esse horário</RotuloSecao>
        <View style={{ marginTop: 12, gap: 11 }}>
          {razoes.map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 7,
                  backgroundColor: cores.verde,
                }}
              />
              <Text
                style={[texto(14, 400, { altura: 1.5 }), { flex: 1, color: cores.textoMedio }]}
              >
                {r}
              </Text>
            </View>
          ))}
        </View>
      </Cartao>
      ) : null}

      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <RotuloSecao>Seu saldo hoje</RotuloSecao>
        <View
          style={{ marginTop: 9, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
        >
          <Text
            style={[texto(36, 800, { altura: 1, tracking: -0.04 }), { color: cores.texto }]}
          >
            {saldo(aluno)}
          </Text>
          <Text style={[texto(15, 600, { altura: 1 }), { color: cores.textoMedio }]}>aulas</Text>
        </View>
        <Text style={[TIPO.nota, { marginTop: 9, color: cores.textoMedio }]}>
          Aceitar não muda o saldo.
        </Text>
      </Cartao>

      <CartaoContexto
        cor={MARCA.amarelo}
        titulo="Se nenhum horário servir"
        detalhe={`Você pode recusar e marcar de novo quando puder. ${primeiroNome(
          perfil.nome,
        )} recebe o aviso.`}
      />

      {alternativas.length > 0 ? (
        <Lista rotulo="Outras opções sugeridas">
          {alternativas.map((j, i) => (
            <LinhaLista
              key={`${j.dia}-${j.hora}`}
              titulo={`${j.dia} · ${j.hora}`}
              sub={j.motivo}
              ultima={i === alternativas.length - 1}
              aoTocar={emPrevia ? undefined : () => aceitar(j)}
            />
          ))}
        </Lista>
      ) : null}
    </Tela>
  );
}

// --- F3, informar disponibilidade ----------------------------------------

export function AlunoDisponibilidade() {
  const cores = useCores();
  const { alunoId, concluir } = useNavegacao();
  const aluno = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const perfil = useDados((s) => s.perfil);
  const salvar = useDados((s) => s.salvarDisponibilidadeDoAluno);
  const avisar = useToast((s) => s.avisar);

  const [blocos, , substituir] = useRascunho(
    'disponibilidadeAluno',
    aluno?.disponibilidade ?? [],
  );

  return (
    <Tela
      cabecalho={
        <TopoDoAluno>
          <Text
            style={[
              texto(22, 600, { altura: 1.25, tracking: -0.02 }),
              { marginTop: 20, color: '#FFFFFF' },
            ]}
          >
            Quando você pode repor?
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 9, color: cores.topoFraco }]}>
            Marque os blocos possíveis. Nada é agendado agora.
          </Text>
        </TopoDoAluno>
      }
      conteudoEstilo={{ gap: 12 }}
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
      <Cartao estilo={{ paddingVertical: 16, paddingHorizontal: 14 }}>
        <GradeSemanal
          marcados={blocos}
          dias={DIAS_UTEIS}
          rotuloDaFaixa="nome"
          alturaDaCelula={52}
          aoAlternar={(b) => substituir(alternarBloco(blocos, b))}
        />
        <RodapeDaGrade
          esquerda={resumoMarcados(blocos)}
          direita="Toque para marcar"
        />
      </Cartao>

      <Text style={[TIPO.nota, { color: cores.textoMedio, textAlign: 'center' }]}>
        {`${primeiroNome(perfil.nome)} recebe o aviso e propõe até três horários.`}
      </Text>
    </Tela>
  );
}
