/**
 * Cadastro e edição de aluno — sheet de tarefa (88%) no iOS Glass.
 *
 * Derivada: o handoff não desenha formulário. Modelo é o sheet de H§3
 * (título no cabeçalho, corpo rolável, primário no rodapé fixo) com os campos
 * derivados dentro de um cartão de vidro. Arquivar mora no fim do corpo, como
 * botão texto que pede dois toques.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CartaoVidro } from '../componentes/Blocos';
import { CampoDeTexto } from '../componentes/Campos';
import { BotaoPrimario, BotaoTexto } from '../componentes/Controles';
import { Sheet } from '../componentes/Sheet';
import { primeiroNome } from '../dominio/formato';
import { ERRO, formatarTelefone, nomeValido } from '../dominio/validacao';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useVidro } from '../tema/TemaProvider';
import { comEspaco, texto } from '../tema/tipografia';
import { MOVIMENTO_VIDRO } from '../tema/tokens';

/**
 * Ação destrutiva em dois toques: o primeiro arma, o segundo executa. Desarma
 * sozinho no tempo de um toast. Cópia local do `useDoisToques` antigo
 * (`componentes/Botoes.tsx`), que a tela migrada não pode mais importar.
 */
function useDoisToques(acao: () => void) {
  const [armado, setArmado] = useState(false);

  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), MOVIMENTO_VIDRO.toastDuracaoMs);
    return () => clearTimeout(t);
  }, [armado]);

  const tocar = useCallback(() => {
    if (!armado) {
      setArmado(true);
      return;
    }
    setArmado(false);
    acao();
  }, [armado, acao]);

  return { armado, tocar };
}

export function AlunoForm() {
  const { cores } = useVidro();
  const { alunoId, concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const emEdicao = useDados((s) => s.alunos.find((a) => a.id === alunoId));
  const criarAluno = useDados((s) => s.criarAluno);
  const atualizarAluno = useDados((s) => s.atualizarAluno);
  const arquivarAluno = useDados((s) => s.arquivarAluno);
  const avisar = useToast((s) => s.avisar);

  const [form, atualizar] = useRascunho('aluno', {
    id: emEdicao?.id,
    nome: emEdicao?.name ?? '',
    disciplina: emEdicao?.disciplina ?? perfil.disciplinas[0] ?? '',
    dia: emEdicao?.dia ?? '',
    hora: emEdicao?.hora ?? '',
    telefone: emEdicao?.telefone ?? '',
  });

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
      titulo={emEdicao ? 'Editar aluno' : 'Novo aluno'}
      rodape={
        <View>
          {notaDoQueFalta ? (
            <Text
              style={[
                comEspaco(texto(12.5, 500, { altura: 1.4 }), { base: 10 }),
                estilos.centro,
                { color: cores.tinta2 },
              ]}
            >
              {notaDoQueFalta}
            </Text>
          ) : null}
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
});
