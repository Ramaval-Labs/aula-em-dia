/** A4 — Onboarding, passo 1: quem é o professor. */

import React from 'react';

import { CartaoDeAjuste, CartaoVidro } from '../../componentes/Blocos';
import { CampoDeTexto, SeletorDeDisciplinas } from '../../componentes/Campos';
import { Segmentado } from '../../componentes/Controles';
import type { FaixaDeAlunos } from '../../dominio/tipos';
import { ERRO, iniciaisDe, nomeValido } from '../../dominio/validacao';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { PassoDoOnboarding } from './PassoDoOnboarding';

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
        <SeletorDeDisciplinas
          disciplinas={form.disciplinas}
          aoMudar={(disciplinas) => atualizar({ disciplinas })}
          rotuloDoGrupo="O que você ensina"
        />
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
