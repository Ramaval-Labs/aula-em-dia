/**
 * Tela 3 — Registrar aula (handoff-ios-glass/README.md §3).
 *
 * Sheet de tarefa (88%), título = nome do aluno. O ponto de design é que o
 * efeito no saldo (`antes → depois`) aparece **antes** de confirmar, e
 * recalcula ao vivo quando a antecedência do aviso muda.
 *
 * Quem decide o efeito é `dominio/politica.ts`. A antecedência do aviso é
 * digitada em horas (SCRUM-101: eram três opções fixas, 48h/26h/10h); o mínimo
 * vem da política salva.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BlocoStatus, EstadoVazio } from '../componentes/Blocos';
import { CampoDeTexto } from '../componentes/Campos';
import { BotaoPrimario, CartaoEscolha } from '../componentes/Controles';
import { CabecalhoGrupo, LinhaAluno, ListaAgrupada } from '../componentes/Listas';
import { Sheet } from '../componentes/Sheet';
import {
  efeito,
  geraReposicao,
  podeRepor,
  reposicaoHoje,
  podeRegistrar,
  saldo,
  saldoBaixo,
  semSaldo,
  temPacote,
} from '../dominio/politica';
import type { Aluno, Desfecho, Politicas } from '../dominio/tipos';
import { horasDeAvisoDigitadas, somenteDigitos } from '../dominio/validacao';
import { useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useFormularios, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { hoje } from '../dominio/datas';
import { plural, primeiroNome, unidade } from '../dominio/formato';
import { comEspaco, texto } from '../tema/tipografia';
import { linhaDeHorario } from './comum/aluno';

const DESFECHOS: { chave: Desfecho; titulo: string; sub: string }[] = [
  { chave: 'realizada', titulo: 'Aula realizada', sub: 'Aconteceu como o combinado' },
  { chave: 'avisada', titulo: 'Falta avisada', sub: 'O aluno avisou antes' },
  { chave: 'sem_aviso', titulo: 'Falta sem aviso', sub: 'Não apareceu e não avisou' },
  { chave: 'cancelada_professor', titulo: 'Cancelei a aula', sub: 'A ausência foi sua' },
];

/** O campo de horas aceita no máximo três dígitos: o limite é 720. */
const DIGITOS_DO_AVISO = 3;

/** Texto de apoio do campo de horas, dependente da política salva. */
function notaDoAviso(avisoH: number, p: Politicas, aluno: Aluno): string {
  if (!p.avisadaDevolve) {
    return 'Sua política não devolve a aula em falta avisada, então o prazo não muda o resultado.';
  }
  // No limite de reposições, o prazo não salva a aula (SCRUM-101).
  if (avisoH >= p.avisoHoras && !podeRepor(aluno, p)) {
    return `Dentro do seu mínimo de ${p.avisoHoras}h, mas o limite de reposições do pacote já foi usado. A aula é debitada.`;
  }
  return avisoH >= p.avisoHoras
    ? `Dentro do seu mínimo de ${p.avisoHoras}h. A aula volta para o saldo e uma reposição é gerada.`
    : `Abaixo do seu mínimo de ${p.avisoHoras}h. A aula é debitada e não gera reposição.`;
}

export function Registrar() {
  const { cores } = useCores();
  const { alunoId, definirAluno, ir } = useNavegacao();
  const [{ desfecho, avisoH, avisoTexto }, atualizarRegistro] = useRascunho(
    'registro',
    REGISTRO_INICIAL,
  );

  // A antecedência é digitada (SCRUM-101): a regra de leitura é do domínio.
  const textoDoAviso = avisoTexto ?? String(avisoH);
  const avisoLido = horasDeAvisoDigitadas(textoDoAviso);
  const erroDoAviso = 'erro' in avisoLido ? avisoLido.erro : undefined;
  const mudarAviso = (digitado: string) => {
    const t = somenteDigitos(digitado).slice(0, DIGITOS_DO_AVISO);
    const lido = horasDeAvisoDigitadas(t);
    atualizarRegistro({ avisoTexto: t, ...('horas' in lido ? { avisoH: lido.horas } : {}) });
  };

  const alunos = useDados((s) => s.alunos);
  const politicas = useDados((s) => s.politicas);
  const registrarAula = useDados((s) => s.registrarAula);

  const reiniciarRascunho = useFormularios((s) => s.substituir);

  const aluno = alunos.find((a) => a.id === alunoId);
  const selecionaveis = alunos.filter(podeRegistrar);
  const temAlunoAtivo = alunos.some((a) => !a.arquivado);
  const pronto = !!aluno && !!desfecho && !(desfecho === 'avisada' && erroDoAviso);

  // Mesmo destino do "+ Novo aluno" da lista.
  const abrirCadastro = () => {
    reiniciarRascunho('aluno', {
      nome: '',
      disciplina: '',
      dias: [],
      hora: '',
      telefone: '',
    });
    ir('alunoForm', { alunoId: null });
  };

  const confirmar = () => {
    if (!aluno || !desfecho) return;
    const ef = registrarAula(aluno.id, desfecho, avisoH);
    // O Resultado precisa saber se a reposição nasceu **agora**: a pendência
    // do aluno pode ser de um registro anterior.
    atualizarRegistro({
      reposicaoCriada: ef ? geraReposicao(aluno, ef, politicas) : false,
    });
    ir('resultado');
  };

  const semNinguem = !aluno && selecionaveis.length === 0;

  // H§3: o rodapé está sempre lá, desabilitado até haver aluno e desfecho —
  // o painel nunca abre sem mostrar qual é a ação que o fecha.
  const rodape =
    semNinguem && !temAlunoAtivo ? (
      // Sem esta porta o sheet abriria só com um aviso e nenhuma saída.
      <BotaoPrimario rotulo="Cadastrar aluno" aoTocar={abrirCadastro} />
    ) : (
      <BotaoPrimario rotulo="Confirmar" desabilitado={!pronto} aoTocar={confirmar} />
    );

  return (
    <Sheet comTeclado titulo={aluno ? aluno.name : 'Registrar aula'} rodape={rodape}>
      {semNinguem ? (
        <ListaAgrupada estilo={estilos.blocoTopo}>
          {temAlunoAtivo ? (
            <EstadoVazio
              titulo="Nenhum aluno com pacote ativo."
              nota="Crie ou renove o pacote na ficha do aluno para registrar a aula."
            />
          ) : (
            <EstadoVazio
              titulo="Você ainda não tem alunos ativos."
              nota="Cadastre um aluno para registrar a primeira aula."
            />
          )}
        </ListaAgrupada>
      ) : !aluno ? (
        <>
          <CabecalhoGrupo titulo="Qual aluno" />
          <ListaAgrupada estilo={estilos.listaDoGrupo}>
            {selecionaveis.map((a) => (
              <LinhaAluno
                key={a.id}
                nome={a.name}
                apoio={linhaDeHorario(a)}
                estadoDoAvatar={!temPacote(a) ? 'sem' : saldoBaixo(a) ? 'baixo' : 'normal'}
                porte="sheet"
                valor={String(saldo(a))}
                unidade={unidade(saldo(a), 'aula', 'aulas')}
                caixaNoValor
                chevron={false}
                rotuloAcessivel={`${a.name}. ${linhaDeHorario(a)}. ${plural(
                  saldo(a),
                  'aula restante',
                  'aulas restantes',
                )}.`}
                aoTocar={() => definirAluno(a.id)}
              />
            ))}
          </ListaAgrupada>
        </>
      ) : (
        <>
          {aluno && semSaldo(aluno) ? (
            // Registrar com o saldo zerado é possível (a aula aconteceu), mas o
            // professor fica sabendo antes, com o atalho para renovar (SCRUM-101).
            <BlocoStatus
              tom="ambar"
              titulo="Sem aulas no pacote"
              texto={`${primeiroNome(aluno.name)} já usou todas as aulas. Se registrar agora, ` +
                'a aula entra no extrato como sem saldo.'}
              acao={{ rotulo: 'Renovar pacote', aoTocar: () => ir('pacote'), variante: 'vidro' }}
              estilo={estilos.blocoTopo}
            />
          ) : null}
          <CabecalhoGrupo titulo="O que aconteceu" />
          <View style={estilos.cartoes}>
            {DESFECHOS.map((o) => (
              <CartaoDesfecho
                key={o.chave}
                titulo={o.titulo}
                sub={
                  o.chave === 'realizada' && aluno && reposicaoHoje(aluno, hoje())
                    ? 'É a reposição marcada para hoje'
                    : o.sub
                }
                chave={o.chave}
                aluno={aluno}
                politicas={politicas}
                avisoH={avisoH}
                selecionado={desfecho === o.chave}
                aoTocar={() => atualizarRegistro({ desfecho: o.chave })}
              >
                {desfecho === 'avisada' && o.chave === 'avisada' ? (
                  <>
                    <CampoDeTexto
                      rotulo="Antecedência do aviso, em horas"
                      valor={textoDoAviso}
                      aoMudar={mudarAviso}
                      placeholder="24"
                      teclado="numerico"
                      erro={erroDoAviso}
                    />
                    {erroDoAviso ? null : (
                      <Text
                        style={[
                          comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 11 }),
                          { color: cores.tinta2 },
                        ]}
                      >
                        {notaDoAviso(avisoH, politicas, aluno)}
                      </Text>
                    )}
                  </>
                ) : null}
              </CartaoDesfecho>
            ))}
          </View>
        </>
      )}
    </Sheet>
  );
}

/** Cartão de desfecho com a prévia "saldo antes → saldo depois". */
function CartaoDesfecho({
  titulo,
  sub,
  chave,
  aluno,
  politicas,
  avisoH,
  selecionado,
  aoTocar,
  children,
}: {
  titulo: string;
  sub: string;
  chave: Desfecho;
  aluno: Aluno;
  politicas: Politicas;
  avisoH: number;
  selecionado: boolean;
  aoTocar: () => void;
  children?: React.ReactNode;
}) {
  const { cores } = useCores();
  const ef = efeito(chave, avisoH, politicas, aluno);
  const antes = saldo(aluno);
  const depois = Math.max(0, antes + ef.delta);

  // "Falta avisada" só mostra o efeito depois de escolhida: ele depende do aviso.
  const mostraEfeito = chave !== 'avisada' || selecionado;

  return (
    <CartaoEscolha
      titulo={titulo}
      subtitulo={selecionado ? ef.nota : sub}
      valor={mostraEfeito ? `${antes} → ${depois}` : undefined}
      corDoValor={ef.delta < 0 ? cores.vermelhoTexto : cores.verdeTexto}
      selecionado={selecionado}
      aoTocar={aoTocar}
      rotuloAcessivel={`${titulo}. ${selecionado ? ef.nota : sub}.${
        mostraEfeito ? ` Saldo de ${antes} para ${depois}.` : ''
      }`}
    >
      {children}
    </CartaoEscolha>
  );
}

const estilos = StyleSheet.create({
  blocoTopo: { marginTop: 10 },
  listaDoGrupo: { marginTop: 9 },
  cartoes: { marginTop: 9, gap: 9 },
});
