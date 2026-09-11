/** Tela 1 — Alunos (raiz da aba 1). Quem precisa de atenção hoje vem primeiro. */

import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CartaoAluno } from '../componentes/Aluno';
import { EstadoVazio } from '../componentes/Base';
import { BotaoPequeno, BotaoPrimario, Chip } from '../componentes/Botoes';
import { CabecalhoEscuro, Eyebrow, Heroi, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { dataPorExtenso } from '../dominio/datas';
import { ordenar, temPacote } from '../dominio/politica';
import type { Filtro } from '../dominio/tipos';
import { useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useFormularios } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { TIPO } from '../tema/tipografia';
import { MARCA } from '../tema/tokens';

const FILTROS: Filtro[] = ['Urgência', 'A–Z', 'Hoje'];

export function Home() {
  const cores = useCores();
  const alunos = useDados((s) => s.alunos);
  const { filtro, definirFiltro, ir } = useNavegacao();
  const reiniciarRascunho = useFormularios((s) => s.substituir);

  const ativos = useMemo(() => alunos.filter((a) => !a.arquivado), [alunos]);
  const lista = useMemo(() => ordenar(ativos, filtro), [ativos, filtro]);

  const aulasHoje = alunos.filter((a) => a.hoje && temPacote(a) && !a.pausado).length;

  // Mesmo destino do "+ Novo aluno" e da ação do estado vazio.
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
    <Tela
      comNavbar
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow>{dataPorExtenso()}</Eyebrow>
              <View style={{ marginTop: 9 }}>
                <TituloTela>Meus alunos</TituloTela>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 12 }}>
              <Heroi
                numero={String(aulasHoje)}
                rotulo="aulas hoje"
                cor={MARCA.amarelo}
                rotuloAcessivel={`${aulasHoje} aulas hoje`}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cadastrar novo aluno"
                onPress={abrirCadastro}
                // O rótulo tem ~16pt de altura; o hitSlop leva o alvo a ~48pt
                // sem mexer no visual do cabeçalho.
                hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
              >
                <Text style={[TIPO.aba, { color: MARCA.amarelo }]}>+ Novo aluno</Text>
              </Pressable>
            </View>
          </View>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ paddingBottom: 10 }}
      rodape={
        <BotaoPrimario
          rotulo="Registrar aula"
          aoTocar={() => {
            // Entrar pela lista começa um registro em branco, sem aluno.
            reiniciarRascunho('registro', REGISTRO_INICIAL);
            ir('registrar', { alunoId: null });
          }}
        />
      }
    >
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Ordenar alunos"
        style={{ flexDirection: 'row', gap: 7 }}
      >
        {FILTROS.map((f) => (
          <Chip key={f} rotulo={f} ativo={filtro === f} aoTocar={() => definirFiltro(f)} />
        ))}
      </View>

      {ativos.length === 0 ? (
        // Sem aluno ativo nenhum filtro ajuda: a saída é cadastrar.
        <View style={{ alignItems: 'center' }}>
          <EstadoVazio
            titulo="Você ainda não tem alunos ativos."
            nota="Cadastre um aluno para registrar aulas e acompanhar o saldo."
          />
          <BotaoPequeno
            rotulo="Cadastrar aluno"
            aoTocar={abrirCadastro}
            estilo={{ alignSelf: 'center' }}
          />
        </View>
      ) : lista.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma aula marcada para hoje."
          nota="Troque o filtro para ver todos os alunos."
        />
      ) : (
        lista.map((a) => (
          <CartaoAluno key={a.id} aluno={a} aoTocar={() => ir('aluno', { alunoId: a.id })} />
        ))
      )}
    </Tela>
  );
}
