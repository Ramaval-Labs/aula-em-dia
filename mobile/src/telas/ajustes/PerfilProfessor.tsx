/**
 * Meu perfil (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, e o visual segue o cartão de perfil de §8 com os campos em cartão de
 * vidro.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, CartaoVidro } from '../../componentes/Blocos';
import { CampoDeTexto } from '../../componentes/Campos';
import { BotaoPrimario } from '../../componentes/Controles';
import { emailValido, ERRO, iniciaisDe, nomeValido } from '../../dominio/validacao';
import { avisos, useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto } from '../../tema/tipografia';
import { estilos } from './estilos';
import { TelaDeAjuste } from './pecas';

export function PerfilProfessor() {
  const { cores } = useCores();
  const { concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const avisar = useToast((s) => s.avisar);

  const [form, atualizar] = useRascunho('perfil', {
    nome: perfil.nome,
    email: perfil.email,
    disciplinas: perfil.disciplinas,
    faixaDeAlunos: perfil.faixaDeAlunos,
  });

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
            {form.disciplinas.join(' e ') || 'Nenhuma disciplina'}
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
        />
        <CampoDeTexto
          rotulo="Disciplinas"
          valor={form.disciplinas.join(', ')}
          aoMudar={(v) =>
            atualizar({ disciplinas: v.split(',').map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="Inglês, Violão"
          ajuda="Separe por vírgula."
        />
      </CartaoVidro>
    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  perfil: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  campos: { gap: 16 },
});
