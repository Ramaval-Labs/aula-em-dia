/**
 * Tela 3 — Registrar aula (handoff-ios-glass/README.md §3).
 *
 * Sheet de tarefa (88%), título = nome do aluno. O ponto de design é que o
 * efeito no saldo (`antes → depois`) aparece **antes** de confirmar, e
 * recalcula ao vivo quando a antecedência do aviso muda.
 *
 * Quem decide o efeito é `dominio/politica.ts` — as três antecedências
 * (48h/26h/10h) são só o que a tela oferece; o mínimo vem da política salva.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EstadoVazio } from '../componentes/Blocos';
import { BotaoPrimario, CartaoEscolha, Segmentado } from '../componentes/Controles';
import { CabecalhoGrupo, LinhaAluno, ListaAgrupada } from '../componentes/Listas';
import { Sheet } from '../componentes/Sheet';
import {
  efeito,
  geraReposicao,
  podeRegistrar,
  saldo,
  saldoBaixo,
  temPacote,
} from '../dominio/politica';
import type { Aluno, Desfecho, Politicas } from '../dominio/tipos';
import { useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useFormularios, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { plural, unidade } from '../dominio/formato';
import { comEspaco, texto } from '../tema/tipografia';
import { linhaDeHorario } from './comum/aluno';

const DESFECHOS: { chave: Desfecho; titulo: string; sub: string }[] = [
  { chave: 'realizada', titulo: 'Aula realizada', sub: 'Aconteceu como o combinado' },
  { chave: 'avisada', titulo: 'Falta avisada', sub: 'O aluno avisou antes' },
  { chave: 'sem_aviso', titulo: 'Falta sem aviso', sub: 'Não apareceu e não avisou' },
  { chave: 'cancelada_professor', titulo: 'Cancelei a aula', sub: 'A ausência foi sua' },
];

/** Antecedências oferecidas no segmentado do cartão "Falta avisada". */
const ANTECEDENCIAS: number[] = [48, 26, 10];

const OPCOES_DE_AVISO = ANTECEDENCIAS.map((h) => ({ valor: h, rotulo: `${h}h` }));

/** Texto de apoio do segmentado, dependente da política salva. */
function notaDoAviso(avisoH: number, p: Politicas): string {
  if (!p.avisadaDevolve) {
    return 'Sua política não devolve a aula em falta avisada, então o prazo não muda o resultado.';
  }
  return avisoH >= p.avisoHoras
    ? `Dentro do seu mínimo de ${p.avisoHoras}h. A aula volta para o saldo e uma reposição é gerada.`
    : `Abaixo do seu mínimo de ${p.avisoHoras}h. A aula é debitada e não gera reposição.`;
}

export function Registrar() {
  const { cores } = useCores();
  const { alunoId, definirAluno, ir } = useNavegacao();
  const [{ desfecho, avisoH }, atualizarRegistro] = useRascunho('registro', REGISTRO_INICIAL);

  const alunos = useDados((s) => s.alunos);
  const politicas = useDados((s) => s.politicas);
  const registrarAula = useDados((s) => s.registrarAula);

  const reiniciarRascunho = useFormularios((s) => s.substituir);

  const aluno = alunos.find((a) => a.id === alunoId);
  const selecionaveis = alunos.filter(podeRegistrar);
  const temAlunoAtivo = alunos.some((a) => !a.arquivado);
  const pronto = !!aluno && !!desfecho;

  // Mesmo destino do "+ Novo aluno" da lista.
  const abrirCadastro = () => {
    reiniciarRascunho('aluno', {
      nome: '',
      disciplina: '',
      dia: '',
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
    <Sheet titulo={aluno ? aluno.name : 'Registrar aula'} rodape={rodape}>
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
          <CabecalhoGrupo titulo="O que aconteceu" />
          <View style={estilos.cartoes}>
            {DESFECHOS.map((o) => (
              <CartaoDesfecho
                key={o.chave}
                titulo={o.titulo}
                sub={o.sub}
                chave={o.chave}
                aluno={aluno}
                politicas={politicas}
                avisoH={avisoH}
                selecionado={desfecho === o.chave}
                aoTocar={() => atualizarRegistro({ desfecho: o.chave })}
              >
                {desfecho === 'avisada' && o.chave === 'avisada' ? (
                  <>
                    <Text style={[estilos.rotuloSub, { color: cores.tinta3 }]}>
                      Antecedência do aviso
                    </Text>
                    <Segmentado
                      opcoes={OPCOES_DE_AVISO}
                      valor={avisoH}
                      porte="cartao"
                      rotuloDoGrupo="Antecedência do aviso"
                      aoTrocar={(h) => atualizarRegistro({ avisoH: h })}
                      estilo={estilos.segmentado}
                    />
                    <Text
                      style={[
                        comEspaco(texto(12.5, 500, { altura: 1.45 }), { topo: 11 }),
                        { color: cores.tinta2 },
                      ]}
                    >
                      {notaDoAviso(avisoH, politicas)}
                    </Text>
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
  const ef = efeito(chave, avisoH, politicas);
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
  rotuloSub: texto(11.5, 600, { altura: 1.2, tracking: 0.04, maiuscula: true }),
  segmentado: { marginTop: 9 },
});
