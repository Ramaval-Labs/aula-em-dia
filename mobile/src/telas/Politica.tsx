/**
 * Tela 9 — Política de faltas (Fluxo E2).
 * Edita um rascunho e mostra o diff antes de salvar. O que é salvo aqui
 * muda o cálculo da tela Registrar aula no próximo registro.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Cartao } from '../componentes/Base';
import { BotaoPrimario, BotaoTexto, Chip } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { temPacote } from '../dominio/politica';
import type { Politicas } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA, RAIO } from '../tema/tokens';

const PRAZOS = [4, 12, 24, 48];
const VALIDADES = [
  { dias: 30, rotulo: '30 dias' },
  { dias: 60, rotulo: '60 dias' },
  { dias: 0, rotulo: 'sem prazo' },
];
const LIMITE_MAXIMO = 5;

/** Resumo textual do que muda ao salvar — um campo por vez, o mais relevante. */
function diff(
  de: Politicas,
  para: Politicas,
  pacotesEmAndamento: number,
): { titulo: string; texto: string } | null {
  if (para.limiteReposicoes !== de.limiteReposicoes) {
    return {
      titulo: `Você mudou o limite de ${de.limiteReposicoes} para ${para.limiteReposicoes}`,
      texto: `Vale só para pacotes novos. Os ${pacotesEmAndamento} pacotes em andamento seguem com a regra antiga até vencer.`,
    };
  }
  if (para.avisoHoras !== de.avisoHoras) {
    return {
      titulo: `Prazo de aviso muda de ${de.avisoHoras}h para ${para.avisoHoras}h`,
      texto: 'Vale a partir do próximo registro de aula. Os lançamentos já feitos não mudam.',
    };
  }
  if (para.avisadaDevolve !== de.avisadaDevolve) {
    return {
      titulo: para.avisadaDevolve
        ? 'Falta avisada volta a devolver a aula'
        : 'Falta avisada passa a debitar sempre',
      texto: 'Vale a partir do próximo registro de aula.',
    };
  }
  if (para.validadeDias !== de.validadeDias) {
    return {
      titulo: `Validade padrão muda para ${
        para.validadeDias === 0 ? 'sem prazo' : `${para.validadeDias} dias`
      }`,
      texto: 'Aplica-se aos pacotes criados a partir de agora.',
    };
  }
  return null;
}

export function Politica() {
  const cores = useCores();
  const { rascunho, definirRascunho, concluir, voltar } = useNavegacao();
  const salvas = useDados((s) => s.politicas);
  const alunos = useDados((s) => s.alunos);
  const salvarPoliticas = useDados((s) => s.salvarPoliticas);
  const avisar = useToast((s) => s.avisar);

  const atual = rascunho ?? salvas;
  const mudou = JSON.stringify(atual) !== JSON.stringify(salvas);
  const mudanca = diff(salvas, atual, alunos.filter(temPacote).length);

  const atualizar = (patch: Partial<Politicas>) => definirRascunho({ ...atual, ...patch });

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela}>
          <BotaoVoltar rotulo="Ajustes" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={21}>Política de faltas</TituloTela>
          </View>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ paddingTop: 14, gap: 9, paddingBottom: 12 }}
      rodape={
        <>
          <BotaoPrimario
            rotulo="Salvar alterações"
            desabilitado={!mudou}
            aoTocar={() => {
              if (!mudou) return;
              salvarPoliticas(atual);
              concluir('ajustes');
              avisar(avisos.politicaSalva);
            }}
          />
          <BotaoTexto rotulo="Descartar" aoTocar={() => concluir('ajustes')} />
        </>
      }
    >
      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Prazo mínimo de aviso
        </Text>
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}
        >
          {PRAZOS.map((h) => (
            <Chip
              key={h}
              cresce
              variante="caixa"
              altura={42}
              rotulo={`${h}h`}
              ativo={atual.avisoHoras === h}
              aoTocar={() => atualizar({ avisoHoras: h })}
            />
          ))}
        </View>
      </Cartao>

      <Cartao
        estilo={{
          paddingVertical: 13,
          paddingHorizontal: 15,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
        }}
      >
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Falta avisada devolve a aula"
          accessibilityState={{ checked: atual.avisadaDevolve }}
          onPress={() => atualizar({ avisadaDevolve: !atual.avisadaDevolve })}
          style={{
            width: 44,
            height: 26,
            borderRadius: RAIO.pastilha,
            padding: 3,
            flexDirection: 'row',
            justifyContent: atual.avisadaDevolve ? 'flex-end' : 'flex-start',
            backgroundColor: atual.avisadaDevolve ? cores.texto : cores.linha,
          }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: cores.cartao }} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Falta avisada devolve a aula
          </Text>
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.suave }]}>
            {atual.avisadaDevolve
              ? 'Dentro do prazo, o saldo não é debitado'
              : 'A aula é debitada mesmo com aviso'}
          </Text>
        </View>
      </Cartao>

      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
              Reposições por pacote
            </Text>
            <Text style={[TIPO.nota, { marginTop: 3, color: cores.suave }]}>
              Depois do limite, a falta debita
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <PassoDoLimite
              rotulo="−"
              acessivel="Diminuir o limite de reposições"
              ativo={atual.limiteReposicoes > 0}
              variante="menos"
              aoTocar={() =>
                atualizar({ limiteReposicoes: Math.max(0, atual.limiteReposicoes - 1) })
              }
            />
            <Text
              accessibilityLabel={
                atual.limiteReposicoes === 0
                  ? 'sem limite de reposições'
                  : `${atual.limiteReposicoes} reposições por pacote`
              }
              style={[
                texto(20, 800, { altura: 1 }),
                { minWidth: 18, textAlign: 'center', color: cores.texto },
              ]}
            >
              {atual.limiteReposicoes === 0 ? '—' : String(atual.limiteReposicoes)}
            </Text>
            <PassoDoLimite
              rotulo="+"
              acessivel="Aumentar o limite de reposições"
              ativo={atual.limiteReposicoes < LIMITE_MAXIMO}
              variante="mais"
              aoTocar={() =>
                atualizar({
                  limiteReposicoes: Math.min(LIMITE_MAXIMO, atual.limiteReposicoes + 1),
                })
              }
            />
          </View>
        </View>
      </Cartao>

      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Validade do pacote
        </Text>
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}
        >
          {VALIDADES.map((v) => (
            <Chip
              key={v.dias}
              cresce
              variante="caixa"
              altura={42}
              rotulo={v.rotulo}
              ativo={atual.validadeDias === v.dias}
              aoTocar={() => atualizar({ validadeDias: v.dias })}
            />
          ))}
        </View>
      </Cartao>

      {mudanca ? (
        <Cartao
          estilo={{
            borderLeftWidth: 4,
            borderLeftColor: MARCA.amarelo,
            paddingVertical: 13,
            paddingHorizontal: 15,
          }}
        >
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            {mudanca.titulo}
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 4, color: cores.suave }]}>
            {mudanca.texto}
          </Text>
        </Cartao>
      ) : null}
    </Tela>
  );
}

function PassoDoLimite({
  rotulo,
  acessivel,
  ativo,
  variante,
  aoTocar,
}: {
  rotulo: string;
  acessivel: string;
  ativo: boolean;
  variante: 'menos' | 'mais';
  aoTocar: () => void;
}) {
  const cores = useCores();

  const fundo = ativo
    ? variante === 'mais'
      ? cores.texto
      : cores.caixa
    : variante === 'mais'
      ? cores.caixa
      : cores.hover;
  const tinta = ativo
    ? variante === 'mais'
      ? cores.botaoTexto
      : cores.suave
    : variante === 'mais'
      ? cores.fraco
      : cores.inativo;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ disabled: !ativo }}
      disabled={!ativo}
      onPress={aoTocar}
      hitSlop={5}
      style={{
        width: 38,
        height: 38,
        borderRadius: RAIO.contador,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: fundo,
      }}
    >
      <Text style={[texto(17, 600, { altura: 1 }), { color: tinta }]}>{rotulo}</Text>
    </Pressable>
  );
}
