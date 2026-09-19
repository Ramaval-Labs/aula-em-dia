/**
 * A7 — Onboarding, passo 4: primeiro aluno e primeiro pacote.
 *
 * A pré-visualização "Como vai ficar na home" não é um desenho à parte: é a
 * `LinhaAluno` do catálogo — a mesma linha da tela Alunos — dentro de uma
 * lista agrupada, alimentada por um `Aluno` sintetizado do rascunho e lida
 * pelas mesmas regras (`saldo`, `saldoBaixo`, `faixaStatus`). Assim a prévia
 * é fiel por construção.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { CampoDeTexto } from '../../componentes/Campos';
import { Segmentado } from '../../componentes/Controles';
import { CabecalhoGrupo, LinhaAluno, ListaAgrupada } from '../../componentes/Listas';
import { hoje } from '../../dominio/datas';
import { dinheiro } from '../../dominio/formato';
import { AULAS_OFERECIDAS, calcularPacote } from '../../dominio/pacote';
import { faixaStatus, saldo, saldoBaixo, VALOR_AULA } from '../../dominio/politica';
import type { Aluno, ConfigPacote } from '../../dominio/tipos';
import { ERRO, nomeValido } from '../../dominio/validacao';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { RAIO_VIDRO } from '../../tema/tokens';
import { PassoDoOnboarding } from './PassoDoOnboarding';

const OPCOES_DE_AULAS = AULAS_OFERECIDAS.map((n) => ({ valor: n, rotulo: `${n} aulas` }));

/** "{disciplina} · {dia}, {hora}" — a linha de horário da lista de alunos. */
function linhaDeHorario(a: Aluno): string {
  if (!a.hora) return `${a.disciplina} · ${a.dia}`;
  return `${a.disciplina} · ${a.hoje ? 'hoje' : a.dia}, ${a.hora}`;
}

export function PrimeiroAluno() {
  const concluir = useSessao((s) => s.concluirOnboarding);
  const politicas = useDados((s) => s.politicas);
  const perfil = useDados((s) => s.perfil);
  const criarAluno = useDados((s) => s.criarAluno);
  const criarPacoteCom = useDados((s) => s.criarPacoteCom);

  const [form, atualizar] = useRascunho('aluno', {
    nome: '',
    disciplina: perfil.disciplinas[0] ?? '',
    dia: '',
    hora: '',
    telefone: '',
  });

  const [pacote, atualizarPacote] = useRascunho('pacote', {
    aulas: 8,
    valorPorAula: VALOR_AULA,
    validadeDias: politicas.validadeDias,
    somarSaldo: false,
  } as ConfigPacote);

  const calculado = calcularPacote(pacote, 0, hoje());
  const temNome = nomeValido(form.nome);
  const temDisciplina = !!form.disciplina;
  const pronto = temNome && temDisciplina;

  /** O que falta, dito acima do botão apagado. */
  const motivo = !temNome
    ? !temDisciplina
      ? 'Falta o nome do aluno e a disciplina.'
      : form.nome.trim()
        ? `${ERRO.nomeCurto}.`
        : 'Falta o nome do aluno.'
    : !temDisciplina
      ? 'Falta a disciplina.'
      : undefined;

  /** Aluno sintético só para a prévia — não vai para o estado. */
  const previa: Aluno = {
    id: 'previa',
    name: form.nome.trim() || 'Seu aluno',
    disciplina: form.disciplina || 'Disciplina',
    dia: form.dia || 'sem horário fixo',
    hora: form.hora,
    hoje: false,
    total: pacote.aulas,
    usadas: 0,
    validade: calculado.validade,
    reposicoes: 0,
    pagamento: { status: 'aberto', vence: calculado.vence },
  };
  const faixa = faixaStatus(previa);

  const finalizar = () => {
    const id = criarAluno({
      nome: form.nome,
      disciplina: form.disciplina,
      dia: form.dia || 'sem horário fixo',
      hora: form.hora,
      telefone: form.telefone || undefined,
    });
    criarPacoteCom(id, pacote);
    concluir();
  };

  return (
    <PassoDoOnboarding
      comTeclado
      passo={4}
      titulo="Seu primeiro aluno"
      rotuloDoBotao="Criar e ir para a home"
      podeAvancar={pronto}
      motivoDesabilitado={motivo}
      aoAvancar={finalizar}
      acaoSecundaria={{ rotulo: 'Cadastrar depois', aoTocar: concluir }}
    >
      <CartaoVidro estilo={estilos.campos}>
        <CampoDeTexto
          rotulo="Nome"
          valor={form.nome}
          aoMudar={(nome) => atualizar({ nome })}
          placeholder="Nome do aluno"
          capitalizar="words"
        />

        <View style={estilos.dupla}>
          <CampoDeTexto
            estilo={estilos.flexivel}
            rotulo="Disciplina"
            valor={form.disciplina}
            aoMudar={(disciplina) => atualizar({ disciplina })}
            placeholder="Inglês"
            capitalizar="words"
          />
          <CampoDeTexto
            estilo={estilos.flexivel}
            rotulo="Horário fixo"
            valor={form.dia}
            aoMudar={(dia) => atualizar({ dia })}
            placeholder="Ter e qui, 18h"
          />
        </View>

        <CampoDeTexto
          rotulo="Telefone"
          valor={form.telefone}
          aoMudar={(telefone) => atualizar({ telefone })}
          placeholder="(51) 99999-4182"
          teclado="telefone"
          ajuda="Serve para montar a mensagem de reposição e de cobrança."
        />
      </CartaoVidro>

      <CartaoDeAjuste titulo="Primeiro pacote">
        <Segmentado
          opcoes={OPCOES_DE_AULAS}
          valor={pacote.aulas}
          porte="cartao"
          aoTrocar={(aulas) => atualizarPacote({ aulas })}
          rotuloDoGrupo="Quantidade de aulas do pacote"
          estilo={estilos.largo}
        />
        <View style={estilos.caixas}>
          <CaixaDeValor rotulo="Valor" valor={dinheiro(calculado.valorTotal)} />
          <CaixaDeValor rotulo="Validade" valor={calculado.validade} />
        </View>
      </CartaoDeAjuste>

      <View>
        <CabecalhoGrupo titulo="Como vai ficar na home" />
        <ListaAgrupada estilo={estilos.previa}>
          <LinhaAluno
            nome={previa.name}
            apoio={linhaDeHorario(previa)}
            estadoDoAvatar={saldoBaixo(previa) ? 'baixo' : 'normal'}
            faixa={faixa ? { tipo: faixa.tipo, texto: faixa.texto } : undefined}
            valor={String(saldo(previa))}
            unidade="aulas"
            rotuloAcessivel={`Prévia: ${previa.name}. ${saldo(previa)} aulas restantes de ${previa.total}. ${linhaDeHorario(previa)}`}
          />
        </ListaAgrupada>
      </View>
    </PassoDoOnboarding>
  );
}

/**
 * Valor lido, não editável, dentro do cartão do pacote: rótulo pequeno e o
 * número em 800 tabular sobre o trilho `preenchimento`.
 */
function CaixaDeValor({ rotulo, valor }: { rotulo: string; valor: string }) {
  const { cores } = useVidro();
  return (
    <View style={[estilos.caixa, { backgroundColor: cores.preenchimento }]}>
      <Text style={[texto(11.5, 600, { altura: 1.2 }), { color: cores.tinta2 }]}>{rotulo}</Text>
      <Text
        style={[comEspaco(texto(16, 800, { tracking: -0.02 }), { topo: 6 }), { color: cores.tinta }]}
      >
        {valor}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: 16 },
  dupla: { flexDirection: 'row', gap: 10 },
  flexivel: { flex: 1, minWidth: 0 },
  largo: { alignSelf: 'stretch' },
  caixas: { marginTop: 10, flexDirection: 'row', gap: 10 },
  caixa: {
    flex: 1,
    borderRadius: RAIO_VIDRO.botaoInline,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  previa: { marginTop: 9 },
});
