/** A4 — Onboarding, passo 1: quem é o professor. */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { AcaoDoCampo, CampoDeTexto } from '../../componentes/Campos';
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

  // A disciplina fora do catálogo: o campo abre dentro do cartão, e o que for
  // digitado vira uma ficha marcada. O texto em digitação morre com a tela; o
  // que vale é a lista no rascunho.
  const [outraAberta, setOutraAberta] = useState(false);
  const [outra, setOutra] = useState('');
  const fichas = [...DISCIPLINAS, ...form.disciplinas.filter((d) => !DISCIPLINAS.includes(d))];

  const acrescentarOutra = () => {
    const nova = outra.trim();
    const jaTem = fichas.find((d) => d.toLowerCase() === nova.toLowerCase());
    if (nova && !jaTem) atualizar({ disciplinas: [...form.disciplinas, nova] });
    else if (jaTem && !form.disciplinas.includes(jaTem))
      atualizar({ disciplinas: [...form.disciplinas, jaTem] });
    setOutra('');
    setOutraAberta(false);
  };

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
        <View style={estilos.disciplinas}>
          <View accessibilityRole="list" accessibilityLabel="O que você ensina" style={estilos.fichas}>
            {fichas.map((d) => (
              <FichaDeEscolha
                key={d}
                rotulo={d}
                marcada={form.disciplinas.includes(d)}
                aoTocar={() => alternarDisciplina(d)}
              />
            ))}
            {outraAberta ? null : (
              <FichaDeEscolha
                rotulo="+ outra"
                rotuloAcessivel="Acrescentar outra disciplina"
                marcada={false}
                aoTocar={() => setOutraAberta(true)}
              />
            )}
          </View>
          {outraAberta ? (
            <CampoDeTexto
              rotulo="Outra disciplina"
              valor={outra}
              aoMudar={setOutra}
              placeholder="Piano, Espanhol…"
              capitalizar="words"
              autoFoco
              aoEnviar={acrescentarOutra}
              sufixo={<AcaoDoCampo rotulo="incluir" aoTocar={acrescentarOutra} />}
            />
          ) : null}
        </View>
      </CartaoDeAjuste>

      <CartaoDeAjuste titulo="Quantos alunos hoje">
        <Segmentado
          opcoes={FAIXAS}
          valor={form.faixaDeAlunos}
          porte="cartao"
          aoTrocar={(faixaDeAlunos) => atualizar({ faixaDeAlunos })}
          rotuloDoGrupo="Quantos alunos hoje"
        />
      </CartaoDeAjuste>
    </PassoDoOnboarding>
  );
}

const estilos = StyleSheet.create({
  // 12: o vão dos formulários da entrada, entre as fichas e o campo de "+ outra"
  disciplinas: { gap: 12 },
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
