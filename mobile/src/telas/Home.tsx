/** Tela 1 — Alunos (raiz da aba 1). Quem precisa de atenção hoje vem primeiro. */

import React, { useMemo } from 'react';
import { View } from 'react-native';

import { CartaoAluno } from '../componentes/Aluno';
import { EstadoVazio } from '../componentes/Base';
import { BotaoPrimario, Chip } from '../componentes/Botoes';
import { CabecalhoEscuro, Eyebrow, Heroi, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { dataPorExtenso } from '../dominio/datas';
import { ordenar, temPacote } from '../dominio/politica';
import type { Filtro } from '../dominio/tipos';
import { useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { MARCA } from '../tema/tokens';

const FILTROS: Filtro[] = ['Urgência', 'A–Z', 'Hoje'];

export function Home() {
  const cores = useCores();
  const alunos = useDados((s) => s.alunos);
  const { filtro, definirFiltro, ir } = useNavegacao();

  const lista = useMemo(() => ordenar(alunos, filtro), [alunos, filtro]);

  const aulasHoje = alunos.filter((a) => a.hoje && temPacote(a) && !a.pausado).length;

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
            <Heroi
              numero={String(aulasHoje)}
              rotulo="aulas hoje"
              cor={MARCA.amarelo}
              rotuloAcessivel={`${aulasHoje} aulas hoje`}
            />
          </View>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ paddingBottom: 10 }}
      rodape={
        <BotaoPrimario
          rotulo="Registrar aula"
          aoTocar={() => ir('registrar', { alunoId: null, desfecho: null })}
        />
      }
    >
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', gap: 7 }}
      >
        {FILTROS.map((f) => (
          <Chip key={f} rotulo={f} ativo={filtro === f} aoTocar={() => definirFiltro(f)} />
        ))}
      </View>

      {lista.length === 0 ? (
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
