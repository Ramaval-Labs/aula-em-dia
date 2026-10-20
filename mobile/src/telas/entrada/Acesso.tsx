/**
 * A3 — Entrar ou criar conta.
 *
 * "Entrar" vai direto para o app (quem já tem conta); "Criar conta" abre o
 * onboarding de quatro passos. Os dois exigem e-mail e senha válidos, pela
 * mesma `validarAcesso`. Se o login é de verdade (Supabase Auth) ou de
 * mentira, quem sabe é a sessão (`loginReal`): a tela só manda e-mail e senha
 * e mostra a frase de `ERRO` que volta.
 *
 * No iOS Glass as duas intenções viram um segmentado no topo, e a ação
 * primária do rodapé acompanha a aba escolhida.
 */

import React, { useRef, useState } from 'react';
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
import { loginReal, useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { texto } from '../../tema/tipografia';
import { TAMANHO } from '../../tema/tokens';
import { modoDeAcessoInicial, type ModoDeAcesso } from './modoDeAcesso';
import { TelaDeEntrada } from './TelaDeEntrada';

const ACESSO_INICIAL = { email: '', senha: '', mostrarSenha: false, erro: null };

/** Não há recuperação para oferecer em nenhum dos modos, então o toque avisa. */
const AVISO_RECUPERAR_SENHA = 'A recuperação de senha chega junto com o login de verdade.';
const AVISO_RECUPERAR_SENHA_REAL = 'A recuperação de senha ainda não está disponível.';

/** Frases que apontam para o e-mail; as outras de campo ficam sob a senha. */
const ERROS_DO_EMAIL: readonly string[] = [
  ERRO.emailVazio,
  ERRO.emailInvalido,
  ERRO.emailJaCadastrado,
];

/** Frases que não são de campo nenhum: vão num bloco abaixo do formulário. */
const ERROS_GERAIS: readonly string[] = [ERRO.semConexao, ERRO.falhaNoAcesso];

const MODOS: readonly OpcaoSegmentada<ModoDeAcesso>[] = [
  { valor: 'entrar', rotulo: 'Entrar' },
  { valor: 'criar', rotulo: 'Criar conta' },
];

export function Acesso() {
  const { cores } = useCores();
  const entrar = useSessao((s) => s.entrar);
  const criarConta = useSessao((s) => s.criarConta);
  const voltarEntrada = useSessao((s) => s.voltarEntrada);
  const avisar = useToast((s) => s.avisar);
  const [form, atualizar] = useRascunho('acesso', ACESSO_INICIAL);
  // Aba escolhida e pedido em andamento: morrem com a tela, então são locais.
  const [modo, setModo] = useState<ModoDeAcesso>(modoDeAcessoInicial);
  const [enviando, setEnviando] = useState(false);
  // O estado só desabilita o botão no render seguinte; a ref barra o segundo
  // toque que chega antes dele.
  const emAndamento = useRef(false);
  const real = loginReal();

  const criando = modo === 'criar';

  const confirmar = async () => {
    if (emAndamento.current) return;
    if (!emailValido(form.email) || !senhaValida(form.senha)) {
      const erros = validarAcesso(form.email, form.senha);
      atualizar({ erro: erros.email ?? erros.senha ?? null });
      return;
    }
    emAndamento.current = true;
    setEnviando(true);
    const pedir = criando ? criarConta : entrar;
    const erro = await pedir(form.email.trim(), form.senha);
    emAndamento.current = false;
    setEnviando(false);
    // Deu certo: a sessão já trocou de fase, e a senha não fica no rascunho.
    atualizar(erro ? { erro } : { senha: '', mostrarSenha: false, erro: null });
  };

  const trocarModo = (m: ModoDeAcesso) => {
    if (enviando) return;
    setModo(m);
    atualizar({ erro: null });
  };

  const erroDoEmail = form.erro && ERROS_DO_EMAIL.includes(form.erro) ? form.erro : undefined;
  const erroGeral = form.erro && ERROS_GERAIS.includes(form.erro) ? form.erro : null;
  const erroDaSenha = form.erro && !erroDoEmail && !erroGeral ? form.erro : undefined;

  const rotuloDoBotao = criando
    ? enviando
      ? 'Criando conta…'
      : 'Criar conta'
    : enviando
      ? 'Entrando…'
      : 'Entrar';

  return (
    <TelaDeEntrada
      comTeclado
      titulo={criando ? 'Criar conta no Aula em Dia' : 'Entrar no Aula em Dia'}
      voltar={{ rotulo: 'Início', aoTocar: () => voltarEntrada() }}
      rodape={
        <BotaoPrimario rotulo={rotuloDoBotao} aoTocar={confirmar} desabilitado={enviando} />
      }
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
          erro={erroDoEmail}
        />

        <CampoDeTexto
          rotulo="Senha"
          valor={form.senha}
          aoMudar={(senha) => atualizar({ senha, erro: null })}
          placeholder="pelo menos 6 caracteres"
          senha={!form.mostrarSenha}
          aoEnviar={confirmar}
          erro={erroDaSenha}
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
            onPress={() => avisar(real ? AVISO_RECUPERAR_SENHA_REAL : AVISO_RECUPERAR_SENHA)}
            hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
            style={estilos.link}
          >
            <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.tint }]}>
              Esqueci minha senha
            </Text>
          </Pressable>
        )}
      </CartaoVidro>

      {erroGeral ? <BlocoStatus tom="vermelho" titulo={erroGeral} vivo /> : null}

      {criando ? (
        <BlocoStatus
          titulo="Primeira vez aqui?"
          texto="A configuração leva 3 minutos e termina com seu primeiro aluno cadastrado."
        />
      ) : null}

      {/* No login de verdade o Google ainda não existe (SCRUM-62). */}
      {real ? null : (
        <>
          <View style={estilos.ou}>
            <View style={[estilos.fio, { backgroundColor: cores.fio }]} />
            <Text style={[texto(12, 600), { color: cores.tinta3 }]}>ou</Text>
            <View style={[estilos.fio, { backgroundColor: cores.fio }]} />
          </View>

          <BotaoSecundario
            rotulo="Continuar com Google"
            aoTocar={() => void entrar(form.email.trim() || 'professor@gmail.com')}
          />
        </>
      )}
    </TelaDeEntrada>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: 16 },
  link: { alignSelf: 'flex-start', paddingHorizontal: 2 },
  ou: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fio: { flex: 1, height: TAMANHO.bordaVidro },
});
