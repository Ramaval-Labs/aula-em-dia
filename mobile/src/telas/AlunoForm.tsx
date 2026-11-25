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
import { CampoDeTexto, SeletorDeDias } from '../componentes/Campos';
import {
  BotaoPrimario,
  BotaoTexto,
  NotaDoBotao,
  Segmentado,
  Switch,
} from '../componentes/Controles';
import { mascaraDeHorario } from '../componentes/GradeLivre';
import { Sheet } from '../componentes/Sheet';
import { useDoisToques } from '../componentes/useDoisToques';
import {
  DIAS,
  DURACAO_PADRAO,
  DURACOES,
  formatarDuracao,
  horarioDigitado,
} from '../dominio/disponibilidade';
import { primeiroNome } from '../dominio/formato';
import { ERRO, formatarTelefone, nomeValido } from '../dominio/validacao';
import { avisos, useDados } from '../estado/dados';
import {
  horaDoDiaNoRascunho,
  horarioDoRascunho,
  rascunhoDeAluno,
  useRascunho,
} from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';

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
          dias: [],
          hora: '',
          telefone: '',
        },
  );

  // "Horário diferente em cada dia" só faz sentido com dois dias ou mais.
  const variosDias = form.dias.length > 1;
  const porDia = variosDias && !!form.porDia;

  // A hora digitada que o motor não lê ("25", "abc", "18:20") era salva calada
  // como "sem hora". A regra é a do domínio (`horarioDigitado`); aqui só se avisa.
  const erroDe = (valor: string): string | undefined => {
    const lido = valor.trim() ? horarioDigitado(valor) : null;
    return lido && 'erro' in lido ? lido.erro : undefined;
  };
  const erroDaHora = form.dias.length > 0 && !porDia ? erroDe(form.hora) : undefined;
  const errosPorDia = porDia
    ? form.dias.map((d) => erroDe(horaDoDiaNoRascunho(form, d)))
    : [];
  const algumErroDeHora = !!erroDaHora || errosPorDia.some(Boolean);

  const ligarPorDia = (ligado: boolean) =>
    ligado
      ? atualizar({
          porDia: true,
          // cada dia começa com a hora que já estava digitada
          horaPorDia: Object.fromEntries(form.dias.map((d) => [d, horaDoDiaNoRascunho(form, d)])),
        })
      : // desligado, vale para todos a hora do primeiro dia
        atualizar({ porDia: false, hora: horaDoDiaNoRascunho(form, form.dias[0]) });

  const pronto = nomeValido(form.nome) && !!form.disciplina && !algumErroDeHora;

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
    algumErroDeHora ? 'uma hora válida' : null,
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
    // Com um dia só o switch some, e vale o campo único que está na tela.
    const horario = horarioDoRascunho({ ...form, porDia });
    if (emEdicao) {
      atualizarAluno(emEdicao.id, {
        name: form.nome.trim(),
        disciplina: form.disciplina,
        ...horario,
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
      ...horario,
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

        <SeletorDeDias
          rotulo="Dias da aula"
          dias={form.dias}
          aoMudar={(dias) => atualizar({ dias })}
          ajuda={form.dias.length === 0 ? 'Sem dia marcado, ele fica sem horário fixo.' : undefined}
        />

        {form.dias.length > 0 ? (
          <>
            {variosDias ? (
              <View style={estilos.linhaDoSwitch}>
                <Text style={[TIPO.tituloBloco, estilos.textoDoSwitch, { color: cores.tinta }]}>
                  Horário diferente em cada dia
                </Text>
                <Switch
                  ligado={porDia}
                  aoAlternar={ligarPorDia}
                  rotulo="Horário diferente em cada dia"
                />
              </View>
            ) : null}
            {porDia ? (
              form.dias.map((d, i) => (
                <CampoDeTexto
                  key={d}
                  rotulo={`Hora · ${DIAS.find((x) => x.chave === d)?.longo ?? d}`}
                  valor={horaDoDiaNoRascunho(form, d)}
                  aoMudar={(hora) =>
                    atualizar({
                      horaPorDia: { ...form.horaPorDia, [d]: mascaraDeHorario(hora) },
                    })
                  }
                  placeholder="18:30"
                  teclado="numerico"
                  erro={errosPorDia[i]}
                  ajuda={
                    i === form.dias.length - 1
                      ? 'O começo de cada aula, de 15 em 15 minutos.'
                      : undefined
                  }
                />
              ))
            ) : (
              <CampoDeTexto
                rotulo="Hora"
                valor={form.hora}
                aoMudar={(hora) => atualizar({ hora: mascaraDeHorario(hora) })}
                placeholder="18:30"
                teclado="numerico"
                erro={erroDaHora}
                ajuda="O começo da aula, de 15 em 15 minutos."
              />
            )}
            <View>
              <Text
                style={[
                  texto(11.5, 600, { tracking: 0.04, maiuscula: true }),
                  { color: cores.tinta3 },
                ]}
              >
                Duração
              </Text>
              <Segmentado
                rotuloDoGrupo="Duração da aula"
                porte="cartao"
                opcoes={DURACOES.map((d) => ({ valor: d, rotulo: formatarDuracao(d) }))}
                valor={form.duracao ?? DURACAO_PADRAO}
                aoTrocar={(duracao) => atualizar({ duracao })}
                estilo={estilos.duracao}
              />
            </View>
          </>
        ) : null}

        <CampoDeTexto
          rotulo="Telefone"
          // O telefone salvo vem só com os dígitos: a máscara vale também ao
          // abrir a edição, e não só depois da primeira tecla.
          valor={formatarTelefone(form.telefone)}
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
  centro: { textAlign: 'center' },
  campos: { gap: 16 },
  arquivar: { marginTop: 18, alignItems: 'center', gap: 4 },
  rodape: { gap: 10 },
  duracao: { marginTop: 8 },
  // a altura do Switch (32) mais folga: o alvo de toque é o do próprio Switch
  linhaDoSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textoDoSwitch: { flex: 1 },
});
