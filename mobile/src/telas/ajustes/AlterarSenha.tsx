/**
 * Alterar senha (Fluxo E, SCRUM-103), no iOS Glass.
 *
 * Derivada: nem o handoff novo nem o Fluxo E desenham esta tela além da linha
 * em Conta. Modelo é a Nova senha da entrada, no molde das sub-telas de
 * Ajustes: os campos num cartão de vidro e o primário no rodapé, com a nota do
 * que falta logo acima dele. Empilhada sob Conta, como as outras edições de
 * Ajustes.
 *
 * Quem troca a senha é a sessão (`alterarSenha`), que confere a senha atual
 * antes. Deu certo: o toast e de volta para Conta, ainda logado. A senha só
 * existe nesta tela: `useState`, nunca `useRascunho` nem disco.
 */

import React, { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { BlocoStatus, CartaoVidro } from '../../componentes/Blocos';
import { AcaoDoCampo, CampoDeTexto } from '../../componentes/Campos';
import { BotaoPrimario, NotaDoBotao } from '../../componentes/Controles';
import { ERRO, senhaValida } from '../../dominio/validacao';
import { avisos } from '../../estado/avisos';
import { useNavegacao } from '../../estado/navegacao';
import { ERRO_DA_RECUPERACAO, useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { SENHAS_DIFERENTES } from '../entrada/NovaSenha';
import { estilos } from './estilos';
import { TelaDeAjuste } from './pecas';

/** As frases que são da senha atual: aparecem no campo dela. */
const DA_SENHA_ATUAL: readonly string[] = [
  ERRO_DA_RECUPERACAO.senhaAtualVazia,
  ERRO_DA_RECUPERACAO.senhaAtualErrada,
];

/** As que são da senha nova: aparecem no campo dela. O resto vira bloco. */
const DA_SENHA_NOVA: readonly string[] = [
  ERRO.senhaVazia,
  ERRO.senhaCurta,
  ERRO_DA_RECUPERACAO.senhaIgual,
];

export function AlterarSenha() {
  const { voltar } = useNavegacao();
  const alterarSenha = useSessao((s) => s.alterarSenha);
  const avisar = useToast((s) => s.avisar);
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [repetida, setRepetida] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const emAndamento = useRef(false);

  const falta = !atual
    ? ERRO_DA_RECUPERACAO.senhaAtualVazia
    : !senhaValida(nova)
      ? ERRO.senhaCurta
      : nova === atual
        ? ERRO_DA_RECUPERACAO.senhaIgual
        : repetida !== nova
          ? SENHAS_DIFERENTES
          : null;

  const mudou = (definir: (v: string) => void) => (v: string) => {
    definir(v);
    setErro(null);
  };

  const salvar = async () => {
    if (falta || emAndamento.current) return;
    emAndamento.current = true;
    setEnviando(true);
    let resposta: string | null;
    try {
      resposta = await alterarSenha(atual, nova);
    } catch {
      // Só rejeita no modo local, onde a linha de Conta nem leva até aqui.
      resposta = ERRO.falhaNoAcesso;
    }
    emAndamento.current = false;
    setEnviando(false);
    if (resposta) {
      setErro(resposta);
      return;
    }
    avisar(avisos.senhaAlterada);
    voltar();
  };

  const erroDaAtual = erro && DA_SENHA_ATUAL.includes(erro) ? erro : undefined;
  const erroDaNova = erro && DA_SENHA_NOVA.includes(erro) ? erro : undefined;
  const erroGeral = erro && !erroDaAtual && !erroDaNova ? erro : null;

  return (
    <TelaDeAjuste
      comTeclado
      titulo="Alterar senha"
      subtitulo="Você continua conectado neste aparelho."
      voltarPara="Conta"
      rodape={
        <>
          {/* Desde a abertura, como na Nova senha: o botão apagado nunca fica
              mudo. Com a resposta do servidor, quem explica é o campo. */}
          {falta && !erro ? <NotaDoBotao texto={`${falta}.`} /> : null}
          <BotaoPrimario
            rotulo={enviando ? 'Salvando…' : 'Salvar senha nova'}
            aoTocar={salvar}
            desabilitado={!!falta || enviando}
          />
        </>
      }
    >
      <CartaoVidro estilo={[estilos.cartao, estilos.primeiro, proprios.campos]}>
        <CampoDeTexto
          rotulo="Senha atual"
          valor={atual}
          aoMudar={mudou(setAtual)}
          senha={!mostrar}
          autoFoco
          erro={erroDaAtual}
          sufixo={
            <AcaoDoCampo
              rotulo={mostrar ? 'ocultar' : 'mostrar'}
              rotuloAcessivel={mostrar ? 'Ocultar senhas' : 'Mostrar senhas'}
              aoTocar={() => setMostrar((m) => !m)}
            />
          }
        />
        <CampoDeTexto
          rotulo="Senha nova"
          valor={nova}
          aoMudar={mudou(setNova)}
          placeholder="pelo menos 6 caracteres"
          senha={!mostrar}
          erro={erroDaNova}
        />
        <CampoDeTexto
          rotulo="Repita a senha nova"
          valor={repetida}
          aoMudar={mudou(setRepetida)}
          senha={!mostrar}
          aoEnviar={salvar}
        />
      </CartaoVidro>

      {/* Sem rede ou servidor fora: não é culpa de campo nenhum. */}
      {erroGeral ? (
        <BlocoStatus tom="vermelho" titulo={`${erroGeral}.`} vivo estilo={estilos.bloco} />
      ) : null}
    </TelaDeAjuste>
  );
}

const proprios = StyleSheet.create({
  campos: { gap: 16 },
});
