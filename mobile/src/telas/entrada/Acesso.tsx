/**
 * A3 — Entrar ou criar conta.
 *
 * Autenticação é mock: qualquer e-mail bem formado com senha de 6 caracteres
 * entra. "Entrar" vai direto para o app (quem já tem conta); "Criar conta"
 * abre o onboarding de quatro passos.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { Cartao } from '../../componentes/Base';
import { BotaoContorno, BotaoPrimario } from '../../componentes/Botoes';
import { CabecalhoEscuro, Eyebrow, TituloTela } from '../../componentes/Cabecalho';
import { AcaoDoCampo, CampoDeTexto } from '../../componentes/Formulario';
import { Tela } from '../../componentes/Tela';
import { ERRO, emailValido, senhaValida, validarAcesso } from '../../dominio/validacao';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { texto, TIPO } from '../../tema/tipografia';

const ACESSO_INICIAL = { email: '', senha: '', mostrarSenha: false, erro: null };

export function Acesso() {
  const cores = useCores();
  const entrar = useSessao((s) => s.entrar);
  const criarConta = useSessao((s) => s.criarConta);
  const [form, atualizar] = useRascunho('acesso', ACESSO_INICIAL);

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

  return (
    <Tela
      comTeclado
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={38}>
          <View style={{ marginTop: 18 }}>
            <Eyebrow>Acesso</Eyebrow>
          </View>
          <View style={{ marginTop: 10 }}>
            <TituloTela tamanho={22}>Entrar no Aula em Dia</TituloTela>
          </View>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 10 }}
      rodape={<BotaoPrimario rotulo="Entrar" aoTocar={tentarEntrar} />}
    >
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
        aoEnviar={tentarEntrar}
        erro={
          form.erro && emailValido(form.email) && !senhaValida(form.senha)
            ? form.erro
            : undefined
        }
        sufixo={
          <AcaoDoCampo
            rotulo={form.mostrarSenha ? 'ocultar' : 'mostrar'}
            aoTocar={() => atualizar({ mostrarSenha: !form.mostrarSenha })}
          />
        }
      />

      <Text
        style={[
          texto(12.5, 400, { altura: 1.4 }),
          { paddingHorizontal: 2, color: cores.suave },
        ]}
      >
        Esqueci minha senha
      </Text>

      <View
        style={{
          marginTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: cores.linha }} />
        <Text style={[texto(11, 500, { altura: 1 }), { color: cores.suave }]}>ou</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: cores.linha }} />
      </View>

      <BotaoContorno
        rotulo="Continuar com Google"
        altura={52}
        cor={cores.fraco}
        aoTocar={() => entrar(form.email.trim() || 'professor@gmail.com')}
      />

      <Cartao estilo={{ marginTop: 4, paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Primeira vez aqui?
        </Text>
        <Text style={[TIPO.corpo, { marginTop: 4, color: cores.suave }]}>
          A configuração leva 3 minutos e termina com seu primeiro aluno cadastrado.
        </Text>
        <View style={{ marginTop: 12 }}>
          <BotaoContorno rotulo="Criar conta" altura={44} aoTocar={tentarCriar} />
        </View>
      </Cartao>
    </Tela>
  );
}
