/**
 * Cadastro e edição de aluno — sheet de tarefa (88%) no iOS Glass.
 *
 * Derivada: o handoff não desenha formulário. Modelo é o sheet de H§3
 * (título no cabeçalho, corpo rolável, primário no rodapé fixo) com os campos
 * derivados dentro de um cartão de vidro. Arquivar mora no fim do corpo, como
 * botão texto que pede dois toques.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro } from '../componentes/Blocos';
import { CampoDeTexto } from '../componentes/Campos';
import { BotaoPrimario, BotaoTexto, NotaDoBotao } from '../componentes/Controles';
import { Sheet } from '../componentes/Sheet';
import { useDoisToques } from '../componentes/useDoisToques';
import { primeiroNome } from '../dominio/formato';
import { ERRO, formatarTelefone, nomeValido } from '../dominio/validacao';
import { avisos, useDados } from '../estado/dados';
import { rascunhoDeAluno, useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto } from '../tema/tipografia';

export function AlunoForm() {
  const { cores } = useCores();
  const { alunoId, concluir, ir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const emEdicao = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const criarAluno = useDados((s) => s.criarAluno);
  const atualizarAluno = useDados((s) => s.atualizarAluno);
  const arquivarAluno = useDados((s) => s.arquivarAluno);
  const avisar = useToast((s) => s.avisar);

  const [form, atualizar, , fechar] = useRascunho(
    'aluno',
    emEdicao
      ? rascunhoDeAluno(emEdicao)
      : {
          nome: '',
          disciplina: perfil.disciplinas[0] ?? '',
          dia: '',
          hora: '',
          telefone: '',
        },
  );

  const pronto = nomeValido(form.nome) && !!form.disciplina;

  // O erro do nome só aparece depois que a pessoa mexeu no campo: acusar
  // um campo que ela nem tocou é bronca antes da hora. Morre com a tela.
  const [nomeTocado, setNomeTocado] = useState(false);
  const erroDoNome =
    nomeTocado && !nomeValido(form.nome)
      ? form.nome.trim()
        ? ERRO.nomeCurto
        : ERRO.nomeVazio
      : undefined;

  // O botão desabilitado diz o que falta, em vez de só ficar cinza.
  const faltando = [
    nomeValido(form.nome) ? null : 'o nome',
    form.disciplina.trim() ? null : 'a disciplina',
  ].filter(Boolean);
  const notaDoQueFalta = faltando.length
    ? `Para ${emEdicao ? 'salvar' : 'criar'}, falta informar ${faltando.join(' e ')}.`
    : null;

  const arquivar = useDoisToques(() => {
    if (!emEdicao) return;
    arquivarAluno(emEdicao.id);
    avisar(`${primeiroNome(emEdicao.name)} foi arquivado.`);
    concluir('home', null);
  });

  const salvar = () => {
    if (!pronto) return;
    if (emEdicao) {
      atualizarAluno(emEdicao.id, {
        name: form.nome.trim(),
        disciplina: form.disciplina,
        dia: form.dia || 'sem horário fixo',
        hora: form.hora,
        telefone: form.telefone || undefined,
      });
      avisar(`Dados de ${primeiroNome(form.nome)} atualizados.`);
      if (form.retorno) {
        // Aberta de dentro de outra tarefa (o atalho de cadastrar telefone):
        // volta para ela, sem `concluir`, que limparia o rascunho que a
        // alimenta — o horário escolhido na reposição, o tom do lembrete.
        fechar();
        ir(form.retorno);
        return;
      }
      concluir('aluno', emEdicao.id);
      return;
    }
    const id = criarAluno({
      nome: form.nome,
      disciplina: form.disciplina,
      dia: form.dia || 'sem horário fixo',
      hora: form.hora,
      telefone: form.telefone || undefined,
    });
    avisar(avisos.alunoCriado(form.nome));
    concluir('aluno', id);
  };

  return (
    <Sheet
      comTeclado
      titulo={emEdicao ? 'Editar aluno' : 'Novo aluno'}
      rodape={
        <View style={estilos.rodape}>
          {notaDoQueFalta ? <NotaDoBotao texto={notaDoQueFalta} /> : null}
          <BotaoPrimario
            rotulo={emEdicao ? 'Salvar alterações' : 'Criar aluno'}
            desabilitado={!pronto}
            aoTocar={salvar}
          />
        </View>
      }
    >
      <CartaoVidro estilo={estilos.campos}>
        <CampoDeTexto
          rotulo="Nome"
          valor={form.nome}
          aoMudar={(nome) => {
            setNomeTocado(true);
            atualizar({ nome });
          }}
          erro={erroDoNome}
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

        <View style={estilos.linha}>
          <CampoDeTexto
            estilo={estilos.flexivel}
            rotulo="Dia"
            valor={form.dia}
            aoMudar={(dia) => atualizar({ dia })}
            placeholder="terça e quinta"
          />
          <CampoDeTexto
            estilo={estilos.flexivel}
            rotulo="Hora"
            valor={form.hora}
            aoMudar={(hora) => atualizar({ hora })}
            placeholder="18h"
          />
        </View>

        <CampoDeTexto
          rotulo="Telefone"
          valor={form.telefone}
          aoMudar={(telefone) => atualizar({ telefone: formatarTelefone(telefone) })}
          placeholder="(51) 99999-4182"
          teclado="telefone"
          ajuda="Usado para montar a mensagem de reposição e de cobrança."
        />
      </CartaoVidro>

      {emEdicao ? (
        <View style={estilos.arquivar}>
          <Text
            style={[texto(12.5, 500, { altura: 1.45 }), estilos.centro, { color: cores.tinta2 }]}
          >
            Ele sai da lista, mas o extrato e o histórico ficam guardados.
          </Text>
          {/* Dois toques: arquivar tira o aluno da lista e sai da tela. Tom
              neutro, não vermelho — vermelho é só para o que venceu, e
              arquivar não apaga nada. */}
          <BotaoTexto
            rotulo={arquivar.armado ? 'Tocar de novo para arquivar' : 'Arquivar aluno'}
            aoTocar={arquivar.tocar}
          />
        </View>
      ) : null}
    </Sheet>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  centro: { textAlign: 'center' },
  campos: { gap: 16 },
  linha: { flexDirection: 'row', gap: 10 },
  arquivar: { marginTop: 18, alignItems: 'center', gap: 4 },
  rodape: { gap: 10 },
});
