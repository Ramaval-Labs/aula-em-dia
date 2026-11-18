/**
 * Meu perfil (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, e o visual segue o cartão de perfil de §8 com os campos em cartão de
 * vidro.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, CartaoVidro } from '../../componentes/Blocos';
import { CampoDeTexto, SeletorDeDisciplinas } from '../../componentes/Campos';
import { BotaoPrimario } from '../../componentes/Controles';
import { emailValido, ERRO, iniciaisDe, nomeValido } from '../../dominio/validacao';
import { avisos, useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { loginReal } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { PAD } from '../../tema/tokens';
import { estilos } from './estilos';
import { TelaDeAjuste } from './pecas';

/**
 * "Matemática, Violão e Inglês": vírgula entre os itens e "e" só antes do
 * último. Sem `Intl.ListFormat`, que o Hermes nem sempre traz.
 */
const emLista = (itens: string[]): string =>
  itens.length < 2 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;

export function PerfilProfessor() {
  const { cores } = useCores();
  const { concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const avisar = useToast((s) => s.avisar);

  // Com o login de verdade, o e-mail é o de acesso: trocar aqui mudaria só o
  // perfil, e não o login. Até haver a troca no Auth, ele fica só leitura.
  const real = loginReal();

  const [form, atualizar, , descartar] = useRascunho('perfil', {
    nome: perfil.nome,
    email: perfil.email,
    disciplinas: perfil.disciplinas,
    faixaDeAlunos: perfil.faixaDeAlunos,
  });
  // Sair pelo voltar não passa por `concluir` nem `trocarTab`, que limpam os
  // rascunhos: sem isto, a edição abandonada reaparecia como se fosse a salva.
  useEffect(() => descartar, [descartar]);

  // O erro aparece só no campo que a pessoa mexeu: um e-mail vazio que já
  // veio assim não bloqueia salvar o nome.
  const erroNome =
    form.nome !== perfil.nome && !nomeValido(form.nome)
      ? form.nome.trim()
        ? ERRO.nomeCurto
        : ERRO.nomeVazio
      : undefined;
  const erroEmail =
    form.email !== perfil.email && !emailValido(form.email)
      ? form.email.trim()
        ? ERRO.emailInvalido
        : ERRO.emailVazio
      : undefined;
  const mudou =
    form.nome !== perfil.nome ||
    form.email !== perfil.email ||
    form.disciplinas.join('|') !== perfil.disciplinas.join('|') ||
    form.faixaDeAlunos !== perfil.faixaDeAlunos;
  const podeSalvar = mudou && !erroNome && !erroEmail;

  const salvar = () => {
    if (!podeSalvar) return;
    salvarPerfil({
      ...perfil,
      nome: form.nome.trim(),
      iniciais: iniciaisDe(form.nome),
      email: form.email.trim(),
      disciplinas: form.disciplinas,
      faixaDeAlunos: form.faixaDeAlunos,
    });
    avisar(avisos.perfilSalvo);
    concluir('ajustes');
  };

  return (
    <TelaDeAjuste
      comTeclado
      titulo="Meu perfil"
      rodape={<BotaoPrimario rotulo="Salvar" desabilitado={!podeSalvar} aoTocar={salvar} />}
    >
      <CartaoVidro estilo={[proprios.perfil, estilos.primeiro]}>
        <Avatar texto={iniciaisDe(form.nome) || perfil.iniciais} estado="perfil" tamanho={48} />
        <View style={proprios.flexivel}>
          <Text
            numberOfLines={1}
            style={[texto(16.5, 700, { altura: 1.2, tracking: -0.015 }), { color: cores.tinta }]}
          >
            {form.nome || 'Sem nome'}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              comEspaco(texto(12.5, 500, { altura: 1.35 }), { topo: 4 }),
              { color: cores.tinta2 },
            ]}
          >
            {emLista(form.disciplinas) || 'Nenhuma disciplina'}
          </Text>
        </View>
      </CartaoVidro>

      <CartaoVidro estilo={[estilos.cartao, proprios.campos]}>
        <CampoDeTexto
          rotulo="Nome"
          valor={form.nome}
          aoMudar={(nome) => atualizar({ nome })}
          erro={erroNome}
          capitalizar="words"
        />
        <CampoDeTexto
          rotulo="E-mail"
          valor={form.email}
          aoMudar={(email) => atualizar({ email })}
          erro={erroEmail}
          teclado="email"
          editavel={!real}
          ajuda={real ? 'É o e-mail de acesso. Trocar ainda não está disponível.' : undefined}
        />
        <SeletorDeDisciplinas
          rotulo="Disciplinas"
          disciplinas={form.disciplinas}
          aoMudar={(disciplinas) => atualizar({ disciplinas })}
        />
      </CartaoVidro>
    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  perfil: {
    ...PAD.cartaoComIcone,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  campos: { gap: 16 },
});
