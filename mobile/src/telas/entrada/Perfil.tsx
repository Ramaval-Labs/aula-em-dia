/** A4 — Onboarding, passo 1: quem é o professor. */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { CampoDeTexto } from '../../componentes/Campos';
import { FichaDeEscolha, Segmentado } from '../../componentes/Controles';
import type { FaixaDeAlunos } from '../../dominio/tipos';
import { ERRO, iniciaisDe, nomeValido } from '../../dominio/validacao';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { PassoDoOnboarding } from './PassoDoOnboarding';

/** Catálogo sugerido; "+ outra" acrescenta o que o professor escrever. */
const DISCIPLINAS = ['Inglês', 'Violão', 'Matemática', 'Música', 'Reforço escolar'];

const FAIXAS: { valor: FaixaDeAlunos; rotulo: string }[] = [
  { valor: '1–5', rotulo: '1–5' },
  { valor: '6–15', rotulo: '6–15' },
  { valor: '16+', rotulo: '16+' },
];

export function Perfil() {
  const email = useSessao((s) => s.email);
  const avancar = useSessao((s) => s.avancar);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const perfilSalvo = useDados((s) => s.perfil);

  const [form, atualizar] = useRascunho('perfil', {
    nome: '',
    email: email ?? '',
    disciplinas: [] as string[],
    faixaDeAlunos: '1–5' as FaixaDeAlunos,
  });

  const temNome = nomeValido(form.nome);
  const temDisciplina = form.disciplinas.length > 0;
  const pronto = temNome && temDisciplina;

  /** O que falta, dito acima do botão apagado. */
  const motivo = !temNome
    ? !temDisciplina
      ? 'Falta o seu nome e pelo menos uma disciplina.'
      : form.nome.trim()
        ? `${ERRO.nomeCurto}.`
        : 'Falta o seu nome.'
    : !temDisciplina
      ? `${ERRO.disciplinaVazia}.`
      : undefined;

  const alternarDisciplina = (d: string) =>
    atualizar({
      disciplinas: form.disciplinas.includes(d)
        ? form.disciplinas.filter((x) => x !== d)
        : [...form.disciplinas, d],
    });

  const continuar = () => {
    salvarPerfil({
      ...perfilSalvo,
      nome: form.nome.trim(),
      iniciais: iniciaisDe(form.nome),
      email: form.email || perfilSalvo.email,
      disciplinas: form.disciplinas,
      faixaDeAlunos: form.faixaDeAlunos,
    });
    avancar();
  };

  return (
    <PassoDoOnboarding
      comTeclado
      passo={1}
      titulo="Quem é você"
      podeAvancar={pronto}
      motivoDesabilitado={motivo}
      aoAvancar={continuar}
    >
      <CartaoVidro>
        <CampoDeTexto
          rotulo="Como seus alunos te chamam"
          valor={form.nome}
          aoMudar={(nome) => atualizar({ nome })}
          placeholder="Seu nome"
          capitalizar="words"
        />
      </CartaoVidro>

      <CartaoDeAjuste titulo="O que você ensina">
        <View accessibilityRole="list" accessibilityLabel="O que você ensina" style={estilos.fichas}>
          {DISCIPLINAS.map((d) => (
            <FichaDeEscolha
              key={d}
              rotulo={d}
              marcada={form.disciplinas.includes(d)}
              aoTocar={() => alternarDisciplina(d)}
            />
          ))}
        </View>
      </CartaoDeAjuste>

      <CartaoDeAjuste titulo="Quantos alunos hoje">
        <Segmentado
          opcoes={FAIXAS}
          valor={form.faixaDeAlunos}
          porte="cartao"
          aoTrocar={(faixaDeAlunos) => atualizar({ faixaDeAlunos })}
          rotuloDoGrupo="Quantos alunos hoje"
          estilo={estilos.largo}
        />
      </CartaoDeAjuste>
    </PassoDoOnboarding>
  );
}

const estilos = StyleSheet.create({
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  largo: { alignSelf: 'stretch' },
});
