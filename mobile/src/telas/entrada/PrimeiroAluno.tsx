/**
 * A7 — Onboarding, passo 4: primeiro aluno e primeiro pacote.
 *
 * A pré-visualização "Como vai ficar na home" não é um desenho à parte: é a
 * `LinhaAluno` do catálogo — a mesma linha da tela Alunos — dentro de uma
 * lista agrupada, alimentada por um `Aluno` sintetizado do rascunho e lida
 * pelas mesmas regras e frases (`saldo`, `saldoBaixo`, `faixaDaLinha`). Assim a prévia
 * é fiel por construção.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { CampoDeTexto, SeletorDeDias } from '../../componentes/Campos';
import { Segmentado } from '../../componentes/Controles';
import { CabecalhoGrupo, LinhaAluno, ListaAgrupada } from '../../componentes/Listas';
import { hoje } from '../../dominio/datas';
import { dinheiro } from '../../dominio/formato';
import { AULAS_OFERECIDAS, calcularPacote } from '../../dominio/pacote';
import { saldo, saldoBaixo, VALOR_AULA } from '../../dominio/politica';
import type { Aluno, ConfigPacote } from '../../dominio/tipos';
import { ERRO, nomeValido } from '../../dominio/validacao';
import { useDados } from '../../estado/dados';
import { horarioDoRascunho, useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { PAD, RAIO } from '../../tema/tokens';
import { PassoDoOnboarding } from './PassoDoOnboarding';
import { faixaDaLinha, linhaDeHorario } from '../comum/aluno';

const OPCOES_DE_AULAS = AULAS_OFERECIDAS.map((n) => ({ valor: n, rotulo: `${n} aulas` }));

export function PrimeiroAluno() {
  const concluir = useSessao((s) => s.concluirOnboarding);
  const politicas = useDados((s) => s.politicas);
  const perfil = useDados((s) => s.perfil);
  const criarAluno = useDados((s) => s.criarAluno);
  const criarPacoteCom = useDados((s) => s.criarPacoteCom);

  const [form, atualizar] = useRascunho('aluno', {
    nome: '',
    disciplina: perfil.disciplinas[0] ?? '',
    dias: [],
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

  const horario = horarioDoRascunho(form);

  /** Aluno sintético só para a prévia — não vai para o estado. */
  const previa: Aluno = {
    id: 'previa',
    name: form.nome.trim() || 'Seu aluno',
    disciplina: form.disciplina || 'Disciplina',
    ...horario,
    hoje: false,
    total: pacote.aulas,
    usadas: 0,
    validade: calculado.validade,
    reposicoes: 0,
    pagamento: { status: 'aberto', vence: calculado.vence },
  };
  const faixa = faixaDaLinha(previa);

  const finalizar = () => {
    const id = criarAluno({
      nome: form.nome,
      disciplina: form.disciplina,
      ...horario,
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

        <CampoDeTexto
          rotulo="Disciplina"
          valor={form.disciplina}
          aoMudar={(disciplina) => atualizar({ disciplina })}
          placeholder="Inglês"
          capitalizar="words"
        />

        <SeletorDeDias
          rotulo="Dias da aula"
          dias={form.dias}
          aoMudar={(dias) => atualizar({ dias })}
          ajuda={form.dias.length === 0 ? 'Sem dia marcado, ele fica sem horário fixo.' : undefined}
        />

        {form.dias.length > 0 ? (
          <CampoDeTexto
            rotulo="Hora"
            valor={form.hora}
            aoMudar={(hora) => atualizar({ hora })}
            placeholder="18"
            teclado="numerico"
            ajuda="A hora cheia do começo da aula."
          />
        ) : null}

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
            faixa={faixa}
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
  const { cores } = useCores();
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
  caixas: { marginTop: 10, flexDirection: 'row', gap: 10 },
  caixa: {
    flex: 1,
    borderRadius: RAIO.caixaValor,
    ...PAD.caixaDePacote,
  },
  previa: { marginTop: 9 },
});
