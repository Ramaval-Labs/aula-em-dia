/**
 * Nova senha — a tela que o link do e-mail de recuperação abre (SCRUM-96).
 *
 * Derivada: o handoff não desenha recuperação. Modelo é a Acesso (A3), no
 * mesmo chassi `TelaDeEntrada`: os campos num cartão de vidro e a ação
 * primária no rodapé, com a nota do que falta logo acima dela.
 *
 * Quem troca a senha é a sessão (`redefinirSenha`, SCRUM-62), com o
 * `token_hash` que o `App.tsx` leu do link. Deu certo, a sessão já muda de
 * fase e a pessoa entra. O link vale uma vez: vencido ou usado, a tela diz e
 * oferece pedir outro.
 */

import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';

import { BlocoStatus, CartaoVidro } from '../../componentes/Blocos';
import { AcaoDoCampo, CampoDeTexto } from '../../componentes/Campos';
import { BotaoPrimario, NotaDoBotao } from '../../componentes/Controles';
import { ERRO, senhaValida } from '../../dominio/validacao';
import { ERRO_DA_RECUPERACAO, useSessao } from '../../estado/sessao';
import { tokenDaNovaSenha } from './linkDaNovaSenha';
import { TelaDeEntrada } from './TelaDeEntrada';

/** As duas senhas não batem: conferência do formulário, não regra de senha. */
export const SENHAS_DIFERENTES = 'As duas senhas não são iguais';

export function NovaSenha() {
  const redefinirSenha = useSessao((s) => s.redefinirSenha);
  const irPara = useSessao((s) => s.irPara);
  // Tudo aqui morre com a tela: senha não atravessa telas nem vai para disco.
  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const emAndamento = useRef(false);

  const irParaEntrar = () => irPara('acesso');

  // O voltar do Android leva para "Entrar", em vez de fechar o app: esta tela
  // não tem nada empilhado atrás dela, porque abriu pelo link.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      irPara('acesso');
      return true;
    });
    return () => sub.remove();
  }, [irPara]);

  const falta = !senhaValida(senha)
    ? ERRO.senhaCurta
    : repetida !== senha
      ? SENHAS_DIFERENTES
      : null;

  const salvar = async () => {
    if (falta || emAndamento.current) return;
    emAndamento.current = true;
    setEnviando(true);
    const resposta = await redefinirSenha(tokenDaNovaSenha() ?? '', senha);
    emAndamento.current = false;
    setEnviando(false);
    // Deu certo (`null`): a sessão já entrou no app e esta tela some.
    setErro(resposta);
  };

  const linkVencido = erro === ERRO_DA_RECUPERACAO.linkVencido;
  const erroDoCampo = erro && !linkVencido ? erro : undefined;

  return (
    <TelaDeEntrada
      comTeclado
      titulo="Criar uma senha nova"
      subtitulo="Depois de salvar, você já entra com ela."
      voltar={{ rotulo: 'Entrar', aoTocar: irParaEntrar }}
      rodape={
        <>
          {/* Logo acima do primário e desde a abertura, como no onboarding: o
              botão apagado nunca fica mudo. Com o link vencido, quem explica é
              o bloco vermelho. */}
          {falta && !linkVencido ? <NotaDoBotao texto={`${falta}.`} /> : null}
          <BotaoPrimario
            rotulo={enviando ? 'Salvando…' : 'Salvar e entrar'}
            aoTocar={salvar}
            desabilitado={!!falta || enviando || linkVencido}
          />
        </>
      }
    >
      <CartaoVidro estilo={estilos.campos}>
        <CampoDeTexto
          rotulo="Senha nova"
          valor={senha}
          aoMudar={(v) => {
            setSenha(v);
            if (!linkVencido) setErro(null);
          }}
          placeholder="pelo menos 6 caracteres"
          senha={!mostrar}
          autoFoco
          erro={erroDoCampo}
          sufixo={
            <AcaoDoCampo
              rotulo={mostrar ? 'ocultar' : 'mostrar'}
              rotuloAcessivel={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
              aoTocar={() => setMostrar((m) => !m)}
            />
          }
        />

        <CampoDeTexto
          rotulo="Repita a senha nova"
          valor={repetida}
          aoMudar={(v) => {
            setRepetida(v);
            if (!linkVencido) setErro(null);
          }}
          senha={!mostrar}
          aoEnviar={salvar}
        />
      </CartaoVidro>

      {linkVencido ? (
        <BlocoStatus
          tom="vermelho"
          titulo={`${ERRO_DA_RECUPERACAO.linkVencido}.`}
          texto="Na tela de entrar, toque em “Esqueci minha senha” de novo."
          acao={{ rotulo: 'Pedir outro link', aoTocar: irParaEntrar }}
          vivo
        />
      ) : null}
    </TelaDeEntrada>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: 16 },
});
