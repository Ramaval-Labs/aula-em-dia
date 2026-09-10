/**
 * A7 — Onboarding, passo 4: primeiro aluno e primeiro pacote.
 *
 * A pré-visualização "Como vai ficar na home" não é um componente novo: é o
 * `CartaoAluno` de verdade, alimentado por um `Aluno` sintetizado do
 * rascunho. Assim a prévia é fiel por construção.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { CartaoAluno } from '../../componentes/Aluno';
import { Cartao } from '../../componentes/Base';
import { Segmentado } from '../../componentes/Botoes';
import { CampoDeTexto } from '../../componentes/Formulario';
import { hoje } from '../../dominio/datas';
import { dinheiro } from '../../dominio/formato';
import { AULAS_OFERECIDAS, calcularPacote } from '../../dominio/pacote';
import { VALOR_AULA } from '../../dominio/politica';
import type { Aluno, ConfigPacote } from '../../dominio/tipos';
import { nomeValido } from '../../dominio/validacao';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { texto, TIPO } from '../../tema/tipografia';
import { RAIO } from '../../tema/tokens';
import { PassoDoOnboarding } from './PassoDoOnboarding';

const OPCOES_DE_AULAS = AULAS_OFERECIDAS.map((n) => ({ valor: n, rotulo: `${n} aulas` }));

export function PrimeiroAluno() {
  const cores = useCores();
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
  const pronto = nomeValido(form.nome) && !!form.disciplina;

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
      aoAvancar={finalizar}
      acaoSecundaria={{ rotulo: 'Cadastrar depois', aoTocar: concluir }}
    >
      <CampoDeTexto
        rotulo="Nome"
        valor={form.nome}
        aoMudar={(nome) => atualizar({ nome })}
        placeholder="Nome do aluno"
        capitalizar="words"
        tamanhoDoValor={16.5}
      />

      <View style={{ flexDirection: 'row', gap: 9 }}>
        <CampoDeTexto
          estilo={{ flex: 1 }}
          rotulo="Disciplina"
          valor={form.disciplina}
          aoMudar={(disciplina) => atualizar({ disciplina })}
          placeholder="Inglês"
          capitalizar="words"
        />
        <CampoDeTexto
          estilo={{ flex: 1 }}
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

      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Primeiro pacote
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={OPCOES_DE_AULAS}
            valor={pacote.aulas}
            aoTrocar={(aulas) => atualizarPacote({ aulas })}
            rotuloAcessivel="Quantidade de aulas do pacote"
          />
        </View>
        <View style={{ marginTop: 9, flexDirection: 'row', gap: 9 }}>
          <CaixaDeValor rotulo="Valor" valor={dinheiro(calculado.valorTotal)} />
          <CaixaDeValor rotulo="Validade" valor={calculado.validade} />
        </View>
      </Cartao>

      <Cartao estilo={{ overflow: 'hidden' }}>
        <View
          style={{
            paddingVertical: 11,
            paddingHorizontal: 15,
            borderBottomWidth: 1,
            borderBottomColor: cores.linha,
          }}
        >
          <Text style={[TIPO.eyebrow, { letterSpacing: 1.6, color: cores.suave }]}>
            Como vai ficar na home
          </Text>
        </View>
        <View style={{ padding: 12 }}>
          <CartaoAluno aluno={previa} aoTocar={() => {}} />
        </View>
      </Cartao>
    </PassoDoOnboarding>
  );
}

function CaixaDeValor({ rotulo, valor }: { rotulo: string; valor: string }) {
  const cores = useCores();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cores.caixa,
        borderRadius: RAIO.contador,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <Text style={[texto(10.5, 400, { altura: 1 }), { color: cores.suave }]}>
        {rotulo}
      </Text>
      <Text
        style={[texto(15, 600, { altura: 1 }), { marginTop: 7, color: cores.texto }]}
      >
        {valor}
      </Text>
    </View>
  );
}
