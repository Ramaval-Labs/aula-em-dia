/**
 * Tela 3 — Registrar aula (Fluxo B).
 * O cartão selecionado mostra em tempo real o efeito no saldo calculado
 * pela política ativa. É a tela mais usada do app: dois toques e pronto.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ContadorSaldo, linhaDeHorario } from '../componentes/Aluno';
import { EstadoVazio, RotuloSecao } from '../componentes/Base';
import { BotaoPequeno, BotaoPrimario, Chip } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { Tela } from '../componentes/Tela';
import { efeito, podeRegistrar, saldo } from '../dominio/politica';
import type { Aluno, Desfecho, Politicas } from '../dominio/tipos';
import { useDados } from '../estado/dados';
import { REGISTRO_INICIAL, useFormularios, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { RAIO, TAMANHO } from '../tema/tokens';

const DESFECHOS: { chave: Desfecho; titulo: string; sub: string }[] = [
  { chave: 'realizada', titulo: 'Aula realizada', sub: 'Aconteceu como o combinado' },
  { chave: 'avisada', titulo: 'Falta avisada', sub: 'O aluno avisou antes' },
  { chave: 'sem_aviso', titulo: 'Falta sem aviso', sub: 'Não apareceu e não avisou' },
  { chave: 'cancelada_professor', titulo: 'Cancelei a aula', sub: 'A ausência foi sua' },
];

/** Antecedências oferecidas no slider de aviso. */
const ANTECEDENCIAS = [48, 26, 10];

/** Texto de apoio do slider, dependente da política salva. */
function notaDoAviso(avisoH: number, p: Politicas): string {
  if (!p.avisadaDevolve) {
    return 'Sua política não devolve a aula em falta avisada, então o prazo não muda o resultado.';
  }
  return avisoH >= p.avisoHoras
    ? `Dentro do seu mínimo de ${p.avisoHoras}h. A aula volta para o saldo e uma reposição é gerada.`
    : `Abaixo do seu mínimo de ${p.avisoHoras}h. A aula é debitada e não gera reposição.`;
}

export function Registrar() {
  const cores = useCores();
  const { alunoId, definirAluno, ir, voltar } = useNavegacao();
  const [{ desfecho, avisoH }, atualizarRegistro] = useRascunho(
    'registro',
    REGISTRO_INICIAL,
  );

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
    registrarAula(aluno.id, desfecho, avisoH);
    ir('resultado');
  };

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>Registrar aula</TituloTela>
          </View>
          <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>
            {aluno ? `${aluno.name} · ${aluno.disciplina}` : 'Escolha o aluno da aula'}
          </Text>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 8, paddingBottom: 12 }}
      rodape={
        aluno ? (
          <BotaoPrimario rotulo="Confirmar" desabilitado={!pronto} aoTocar={confirmar} />
        ) : undefined
      }
    >
      {!aluno && selecionaveis.length === 0 ? (
        // Sem ninguém para escolher, o rótulo "Qual aluno" sozinho é beco sem saída.
        temAlunoAtivo ? (
          <EstadoVazio
            titulo="Nenhum aluno com pacote ativo."
            nota="Crie ou renove o pacote na ficha do aluno para registrar a aula."
          />
        ) : (
          <View style={{ alignItems: 'center' }}>
            <EstadoVazio
              titulo="Você ainda não tem alunos ativos."
              nota="Cadastre um aluno para registrar a primeira aula."
            />
            <BotaoPequeno
              rotulo="Cadastrar aluno"
              aoTocar={abrirCadastro}
              estilo={{ alignSelf: 'center' }}
            />
          </View>
        )
      ) : !aluno ? (
        <>
          <RotuloSecao estilo={{ marginBottom: 2 }}>Qual aluno</RotuloSecao>
          {selecionaveis.map((a) => (
            <EscolhaDeAluno
              key={a.id}
              aluno={a}
              aoTocar={() => definirAluno(a.id)}
            />
          ))}
        </>
      ) : (
        <>
          <RotuloSecao estilo={{ marginBottom: 2 }}>O que aconteceu</RotuloSecao>
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
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: cores.linha,
                  }}
                >
                  <Text
                    style={[
                      texto(10, 600, { altura: 1, tracking: 0.14, maiuscula: true }),
                      { color: cores.suave },
                    ]}
                  >
                    Avisou com quanta antecedência
                  </Text>
                  <View style={{ marginTop: 9, flexDirection: 'row', gap: 7 }}>
                    {ANTECEDENCIAS.map((h) => (
                      <Chip
                        key={h}
                        rotulo={`${h}h`}
                        altura={36}
                        ativo={avisoH === h}
                        aoTocar={() => atualizarRegistro({ avisoH: h })}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      texto(12, 400, { altura: 1.45 }),
                      { marginTop: 10, color: cores.textoMedio },
                    ]}
                  >
                    {notaDoAviso(avisoH, politicas)}
                  </Text>
                </View>
              ) : null}
            </CartaoDesfecho>
          ))}
        </>
      )}
    </Tela>
  );
}

function EscolhaDeAluno({ aluno, aoTocar }: { aluno: Aluno; aoTocar: () => void }) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${aluno.name}. ${linhaDeHorario(aluno)}. ${saldo(aluno)} aulas restantes.`}
      onPress={aoTocar}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 13,
            minHeight: 64,
            paddingVertical: 12,
            paddingHorizontal: 15,
            backgroundColor: cores.cartao,
            borderWidth: 1,
            borderColor: pressed ? cores.suave : cores.linha,
            borderRadius: RAIO.cartao,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[TIPO.nome, { color: cores.texto }]}>{aluno.name}</Text>
            <Text style={[TIPO.legenda, { marginTop: 3, color: cores.textoMedio }]}>
              {linhaDeHorario(aluno)}
            </Text>
          </View>
          <ContadorSaldo numero={String(saldo(aluno))} />
        </View>
      )}
    </Pressable>
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
  const cores = useCores();
  const ef = efeito(chave, avisoH, politicas);
  const antes = saldo(aluno);
  const depois = Math.max(0, antes + ef.delta);

  // "Falta avisada" só mostra o efeito depois de escolhida: ele depende do aviso.
  const mostraEfeito = chave !== 'avisada' || selecionado;
  const previa = `${antes} → ${depois}`;

  return (
    <Pressable
      accessibilityRole="radio"
      // `checked` é o que o leitor de tela anuncia num radio; `selected` não.
      accessibilityState={{ checked: selecionado }}
      accessibilityLabel={`${titulo}. ${selecionado ? ef.nota : sub}.${
        mostraEfeito ? ` Saldo de ${antes} para ${depois}.` : ''
      }`}
      onPress={aoTocar}
    >
      <View
        style={{
          paddingVertical: 12,
          paddingHorizontal: 15,
          backgroundColor: cores.cartao,
          borderRadius: RAIO.cartao,
          borderWidth: selecionado ? 1.5 : 1,
          borderColor: selecionado ? cores.texto : cores.linha,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 40 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: cores.cartao,
              borderWidth: selecionado ? 6 : 1.5,
              borderColor: selecionado ? cores.texto : cores.fraco,
            }}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[TIPO.nome, { color: cores.texto }]}>{titulo}</Text>
            <Text style={[TIPO.legenda, { marginTop: 3, color: cores.textoMedio }]}>
              {selecionado ? ef.nota : sub}
            </Text>
          </View>
          {mostraEfeito ? (
            <Text
              style={[
                texto(14, 700, { altura: 1 }),
                { color: ef.delta < 0 ? cores.vermelho : cores.verde },
              ]}
            >
              {previa}
            </Text>
          ) : null}
        </View>
        {children}
      </View>
    </Pressable>
  );
}
