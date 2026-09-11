/** Cadastro e edição de aluno. Arquivar mora aqui, no fim da tela. */

import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { Cartao } from '../componentes/Base';
import { BotaoPequeno, BotaoPrimario, useDoisToques } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { CampoDeTexto } from '../componentes/Formulario';
import { Tela } from '../componentes/Tela';
import { primeiroNome } from '../dominio/formato';
import { ERRO, formatarTelefone, nomeValido } from '../dominio/validacao';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../tema/tipografia';
import { TAMANHO } from '../tema/tokens';

export function AlunoForm() {
  const cores = useCores();
  const { alunoId, concluir, voltar } = useNavegacao();
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
    <Tela
      comTeclado
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={TAMANHO.padCabecalhoCompacto}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>
              {emEdicao ? 'Editar aluno' : 'Novo aluno'}
            </TituloTela>
          </View>
        </CabecalhoEscuro>
      }
      rodape={
        <View>
          {notaDoQueFalta ? (
            <Text
              style={[
                comEspaco(TIPO.nota, { base: 8 }),
                { color: cores.textoMedio, textAlign: 'center' },
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
        tamanhoDoValor={16.5}
      />

      <CampoDeTexto
        rotulo="Disciplina"
        valor={form.disciplina}
        aoMudar={(disciplina) => atualizar({ disciplina })}
        placeholder="Inglês"
        capitalizar="words"
      />

      <View style={{ flexDirection: 'row', gap: 9 }}>
        <CampoDeTexto
          estilo={{ flex: 1 }}
          rotulo="Dia"
          valor={form.dia}
          aoMudar={(dia) => atualizar({ dia })}
          placeholder="terça e quinta"
        />
        <CampoDeTexto
          estilo={{ flex: 1 }}
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

      {emEdicao ? (
        <Cartao estilo={{ marginTop: 6, paddingVertical: 14, paddingHorizontal: 16 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Arquivar aluno
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 5, color: cores.textoMedio }]}>
            Ele sai da lista, mas o extrato e o histórico ficam guardados.
          </Text>
          <View style={{ marginTop: 11 }}>
            {/* Dois toques: arquivar tira o aluno da lista e sai da tela. Contorno,
                não vermelho — vermelho é só para o que venceu. */}
            <BotaoPequeno
              variante="contorno"
              rotulo={arquivar.armado ? 'Tocar de novo para arquivar' : 'Arquivar aluno'}
              aoTocar={arquivar.tocar}
            />
          </View>
        </Cartao>
      ) : null}
    </Tela>
  );
}
