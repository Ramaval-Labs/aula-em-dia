/**
 * Tela 1 — Alunos (raiz da aba 1), no iOS Glass (handoff-ios-glass §1).
 *
 * Cabeçalho com a data e o título grande à esquerda e a contagem de aulas de
 * hoje à direita; segmentado de ordenação; lista agrupada de alunos; primário
 * "Registrar aula" no fim do conteúdo.
 *
 * "Novo aluno" continua existindo (é como se cadastra), mas como **secundário**
 * abaixo do primário: um primário por tela.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro, EstadoVazio } from '../componentes/Blocos';
import { TelaVidro, TituloDeConteudo } from '../componentes/Chassi';
import { BotaoPrimario, BotaoSecundario, Segmentado } from '../componentes/Controles';
import { LinhaAluno, ListaAgrupada } from '../componentes/Listas';
import { dataPorExtenso } from '../dominio/datas';
import { ordenar, saldo, saldoBaixo, temPacote } from '../dominio/politica';
import type { Filtro } from '../dominio/tipos';
import { useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useFormularios } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto } from '../tema/tipografia';
import { faixaDaLinha, linhaDeHorario } from './comum/aluno';

const FILTROS: { valor: Filtro; rotulo: Filtro }[] = [
  { valor: 'Urgência', rotulo: 'Urgência' },
  { valor: 'A–Z', rotulo: 'A–Z' },
  { valor: 'Hoje', rotulo: 'Hoje' },
];

export function Home() {
  const { cores } = useCores();
  const alunos = useDados((s) => s.alunos);
  const { filtro, definirFiltro, ir } = useNavegacao();
  const reiniciarRascunho = useFormularios((s) => s.substituir);

  const ativos = useMemo(() => alunos.filter((a) => !a.arquivado), [alunos]);
  const lista = useMemo(() => ordenar(ativos, filtro), [ativos, filtro]);

  const aulasHoje = alunos.filter((a) => a.hoje && temPacote(a) && !a.pausado).length;

  // Mesmo destino do "Novo aluno" e da ação do estado vazio.
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

  return (
    <TelaVidro
      tipo="raiz"
      titulo="Alunos"
      rodape={
        <View style={estilos.acoes}>
          <BotaoPrimario
            rotulo="Registrar aula"
            icone="mais"
            aoTocar={() => {
              // Entrar pela lista começa um registro em branco, sem aluno.
              reiniciarRascunho('registro', REGISTRO_INICIAL);
              ir('registrar', { alunoId: null });
            }}
          />
          <BotaoSecundario
            rotulo="Novo aluno"
            rotuloAcessivel="Cadastrar novo aluno"
            aoTocar={abrirCadastro}
          />
        </View>
      }
    >
      <TituloDeConteudo
        porte="grande"
        acima={dataPorExtenso()}
        titulo="Alunos"
        direita={
          <View accessible accessibilityLabel={`${aulasHoje} aulas hoje`} style={estilos.contagem}>
            <Text style={[texto(26, 800, { tracking: -0.04 }), { color: cores.tint }]}>
              {String(aulasHoje)}
            </Text>
            <Text style={[comEspaco(texto(11, 600), { topo: 4 }), { color: cores.tinta2 }]}>
              hoje
            </Text>
          </View>
        }
      />

      <Segmentado
        opcoes={FILTROS}
        valor={filtro}
        aoTrocar={definirFiltro}
        rotuloDoGrupo="Ordenar alunos"
        estilo={estilos.filtros}
      />

      <View style={estilos.lista}>
        {ativos.length === 0 ? (
          // Sem aluno ativo nenhum filtro ajuda: a saída é cadastrar, e ela
          // está logo abaixo, no secundário do rodapé.
          <CartaoVidro semPadding>
            <EstadoVazio
              titulo="Você ainda não tem alunos ativos."
              nota="Cadastre um aluno para registrar aulas e acompanhar o saldo."
            />
          </CartaoVidro>
        ) : lista.length === 0 ? (
          <CartaoVidro semPadding>
            <EstadoVazio
              titulo="Nenhuma aula marcada para hoje."
              nota="Troque o filtro para ver todos os alunos."
            />
          </CartaoVidro>
        ) : (
          <ListaAgrupada>
            {lista.map((a) => {
              const com = temPacote(a);
              const baixo = saldoBaixo(a);
              const restam = saldo(a);
              const faixa = faixaDaLinha(a);
              return (
                <LinhaAluno
                  key={a.id}
                  nome={a.name}
                  apoio={linhaDeHorario(a)}
                  estadoDoAvatar={!com ? 'sem' : baixo ? 'baixo' : 'normal'}
                  faixa={faixa}
                  valor={com ? String(restam) : '—'}
                  unidade={com ? 'aulas' : 'sem pacote'}
                  corDoValor={!com ? cores.tinta3 : baixo ? cores.ambarTexto : cores.tinta}
                  rotuloAcessivel={[
                    a.name,
                    faixa?.texto,
                    com ? `${restam} aulas restantes de ${a.total}` : 'sem pacote',
                    linhaDeHorario(a),
                  ]
                    .filter(Boolean)
                    .join('. ')}
                  aoTocar={() => ir('aluno', { alunoId: a.id })}
                />
              );
            })}
          </ListaAgrupada>
        )}
      </View>
    </TelaVidro>
  );
}

const estilos = StyleSheet.create({
  contagem: { alignItems: 'flex-end', paddingBottom: 4 },
  filtros: { marginTop: 18 },
  lista: { marginTop: 16 },
  acoes: { gap: 10 },
});
