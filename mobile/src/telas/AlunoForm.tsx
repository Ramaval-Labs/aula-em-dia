/** Cadastro e edição de aluno. Arquivar mora aqui, no fim da tela. */

import React from 'react';
import { Text, View } from 'react-native';

import { Caixa } from '../componentes/Base';
import { BotaoPequeno, BotaoPrimario } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { CampoDeTexto } from '../componentes/Formulario';
import { Tela } from '../componentes/Tela';
import { primeiroNome } from '../dominio/formato';
import { formatarTelefone, nomeValido } from '../dominio/validacao';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';

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
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Voltar" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>
              {emEdicao ? 'Editar aluno' : 'Novo aluno'}
            </TituloTela>
          </View>
        </CabecalhoEscuro>
      }
      rodape={
        <BotaoPrimario
          rotulo={emEdicao ? 'Salvar alterações' : 'Criar aluno'}
          desabilitado={!pronto}
          aoTocar={salvar}
        />
      }
    >
      <CampoDeTexto
        rotulo="Nome"
        valor={form.nome}
        aoMudar={(nome) => atualizar({ nome })}
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
        <Caixa estilo={{ marginTop: 6 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Arquivar aluno
          </Text>
          <Text style={[TIPO.corpo, { marginTop: 5, color: cores.suave }]}>
            Ele sai da lista, mas o extrato e o histórico ficam guardados.
          </Text>
          <View style={{ marginTop: 11 }}>
            <BotaoPequeno
              variante="perigo"
              rotulo="Arquivar"
              aoTocar={() => {
                arquivarAluno(emEdicao.id);
                avisar(`${primeiroNome(emEdicao.name)} foi arquivado.`);
                concluir('home', null);
              }}
            />
          </View>
        </Caixa>
      ) : null}
    </Tela>
  );
}
