/**
 * A3 — Entrar ou criar conta.
 *
 * Autenticação é mock: qualquer e-mail bem formado com senha de 6 caracteres
 * entra. "Entrar" vai direto para o app (quem já tem conta); "Criar conta"
 * abre o onboarding de quatro passos.
 *
 * No iOS Glass as duas intenções viram um segmentado no topo, e a ação
 * primária do rodapé acompanha a aba escolhida. A validação é a mesma de
 * antes: entrar exige e-mail e senha válidos; criar conta, só o e-mail.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BlocoStatus, CartaoVidro } from '../../componentes/Blocos';
import { AcaoDoCampo, CampoDeTexto } from '../../componentes/Campos';
import {
  BotaoPrimario,
  BotaoSecundario,
  Segmentado,
  type OpcaoSegmentada,
} from '../../componentes/Controles';
import { ERRO, emailValido, senhaValida, validarAcesso } from '../../dominio/validacao';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { useVidro } from '../../tema/TemaProvider';
import { texto } from '../../tema/tipografia';
import { TAMANHO_VIDRO } from '../../tema/tokens';
import { modoDeAcessoInicial, type ModoDeAcesso } from './modoDeAcesso';
import { TelaDeEntrada } from './TelaDeEntrada';

const ACESSO_INICIAL = { email: '', senha: '', mostrarSenha: false, erro: null };

/** O login é mock: não há recuperação para oferecer, então o toque avisa. */
const AVISO_RECUPERAR_SENHA = 'A recuperação de senha chega junto com o login de verdade.';

const MODOS: readonly OpcaoSegmentada<ModoDeAcesso>[] = [
  { valor: 'entrar', rotulo: 'Entrar' },
  { valor: 'criar', rotulo: 'Criar conta' },
];

export function Acesso() {
  const { cores } = useVidro();
  const entrar = useSessao((s) => s.entrar);
  const criarConta = useSessao((s) => s.criarConta);
  const voltarEntrada = useSessao((s) => s.voltarEntrada);
  const avisar = useToast((s) => s.avisar);
  const [form, atualizar] = useRascunho('acesso', ACESSO_INICIAL);
  // Aba escolhida: morre com a tela, então é estado local.
  const [modo, setModo] = useState<ModoDeAcesso>(modoDeAcessoInicial);

  const erros = validarAcesso(form.email, form.senha);
  const podeEntrar = emailValido(form.email) && senhaValida(form.senha);

  const tentarEntrar = () => {
    if (!podeEntrar) {
      atualizar({ erro: erros.email ?? erros.senha ?? null });
      return;
    }
    entrar(form.email.trim());
  };

  const tentarCriar = () => {
    if (!emailValido(form.email)) {
      atualizar({ erro: form.email ? ERRO.emailInvalido : ERRO.emailVazio });
      return;
    }
    criarConta(form.email.trim());
  };

  const criando = modo === 'criar';
  const confirmar = criando ? tentarCriar : tentarEntrar;

  const trocarModo = (m: ModoDeAcesso) => {
    setModo(m);
    atualizar({ erro: null });
  };

  return (
    <TelaDeEntrada
      comTeclado
      titulo={criando ? 'Criar conta no Aula em Dia' : 'Entrar no Aula em Dia'}
      voltar={{ rotulo: 'Início', aoTocar: () => voltarEntrada() }}
      rodape={<BotaoPrimario rotulo={criando ? 'Criar conta' : 'Entrar'} aoTocar={confirmar} />}
    >
      <Segmentado
        opcoes={MODOS}
        valor={modo}
        aoTrocar={trocarModo}
        rotuloDoGrupo="Entrar ou criar conta"
      />

      <CartaoVidro estilo={estilos.campos}>
        <CampoDeTexto
          rotulo="E-mail"
          valor={form.email}
          aoMudar={(email) => atualizar({ email, erro: null })}
          placeholder="voce@email.com"
          teclado="email"
          erro={form.erro && !emailValido(form.email) ? form.erro : undefined}
        />

        <CampoDeTexto
          rotulo="Senha"
          valor={form.senha}
          aoMudar={(senha) => atualizar({ senha, erro: null })}
          placeholder="pelo menos 6 caracteres"
          senha={!form.mostrarSenha}
          aoEnviar={confirmar}
          erro={
            !criando && form.erro && emailValido(form.email) && !senhaValida(form.senha)
              ? form.erro
              : undefined
          }
          sufixo={
            <AcaoDoCampo
              rotulo={form.mostrarSenha ? 'ocultar' : 'mostrar'}
              rotuloAcessivel={form.mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aoTocar={() => atualizar({ mostrarSenha: !form.mostrarSenha })}
            />
          }
        />

        {criando ? null : (
          // O texto tem ~17px; o hitSlop vertical leva o alvo a ~45px.
          <Pressable
            accessibilityRole="link"
            onPress={() => avisar(AVISO_RECUPERAR_SENHA)}
            hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
            style={estilos.link}
          >
            <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.tint }]}>
              Esqueci minha senha
            </Text>
          </Pressable>
        )}
      </CartaoVidro>

      {criando ? (
        <BlocoStatus
          titulo="Primeira vez aqui?"
          texto="A configuração leva 3 minutos e termina com seu primeiro aluno cadastrado."
        />
      ) : null}

      <View style={estilos.ou}>
        <View style={[estilos.fio, { backgroundColor: cores.fio }]} />
        <Text style={[texto(12, 600), { color: cores.tinta3 }]}>ou</Text>
        <View style={[estilos.fio, { backgroundColor: cores.fio }]} />
      </View>

      <BotaoSecundario
        rotulo="Continuar com Google"
        aoTocar={() => entrar(form.email.trim() || 'professor@gmail.com')}
      />
    </TelaDeEntrada>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: 16 },
  link: { alignSelf: 'flex-start', paddingHorizontal: 2 },
  ou: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fio: { flex: 1, height: TAMANHO_VIDRO.bordaVidro },
});
