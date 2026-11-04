/**
 * A página do aluno pelo link `/a/<token>` (Parte 6, SCRUM-70).
 *
 * É a raiz do Expo Web quando o caminho começa com `/a/` (ver `App.tsx`): o
 * aluno abre sem conta e sem instalar nada. Lê e grava pela Edge Function
 * `aluno-publico`, por `dados/repositorioPublico.ts`, e mostra as mesmas três
 * páginas da prévia ("Ver como o aluno vê"), que são os miolos de
 * `VisaoDoAluno.tsx`, sem a faixa de prévia e sem a tab bar.
 *
 * Fora da máquina de navegação do app: não entra na união `Tela`, nem nos
 * mapas, nem no registro. Não usa `useDados` nem `useNavegacao`, que são do
 * professor. No navegador do aluno não existem os outros alunos, então nada
 * aqui calcula regra: o recorte já chega pronto (`dominio/paginaDoAluno`).
 * Qual das três páginas está aberta é um `useState`, que morre com a página.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { CartaoVidro, EstadoVazio } from '../../componentes/Blocos';
import { TelaVidro, TituloDeConteudo } from '../../componentes/Chassi';
import { BotaoPrimario, BotaoSecundario } from '../../componentes/Controles';
import { Toast } from '../../componentes/Toast';
import { AlvoDeDesfoque, FundoRefracao, ProvedorDeDesfoque } from '../../componentes/Vidro';
import {
  carregarPagina,
  ehLinkInvalido,
  enviarDisponibilidade,
  ErroDoLink,
  responder,
} from '../../dados/repositorioPublico';
import type { PaginaDoAluno } from '../../dominio/paginaDoAluno';
import type { BlocoSemanal } from '../../dominio/tipos';
import { avisos } from '../../estado/avisos';
import { useToast } from '../../estado/toast';
import {
  assinaturaDe,
  PaginaDisponibilidade,
  PaginaProposta,
  PaginaSaldo,
} from './VisaoDoAluno';

/** `/a/<token>` → o token; qualquer outro caminho → `null`. */
export function tokenDoCaminho(caminho: string): string | null {
  const m = /^\/a\/([^/?#]+)\/?$/.exec(caminho);
  return m ? decodeURIComponent(m[1]) : null;
}

type Estado =
  | { fase: 'carregando' }
  | { fase: 'invalido' }
  | { fase: 'semRede' }
  | { fase: 'pronta'; pagina: PaginaDoAluno };

type Qual = 'saldo' | 'proposta' | 'disponibilidade';

/** O 404 é o link inválido; o resto (rede, função fora) deixa tentar de novo. */
const estadoDaFalha = (erro: unknown): Estado => ({
  fase: ehLinkInvalido(erro) ? 'invalido' : 'semRede',
});

/** Rótulo do voltar da proposta e da disponibilidade: a primeira página é o saldo. */
const VOLTAR_PARA_SALDO = 'Meu saldo';

/** A página é de uma pessoa só: fora dos buscadores (PLANO-BACKEND, Parte 6, item 4). */
function useForaDosBuscadores() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

export function AppDoAluno({ token }: { token: string | null }) {
  const avisar = useToast((s) => s.avisar);
  // Sem token no caminho, nem pergunta à função: é o mesmo caso do 404.
  const [estado, setEstado] = useState<Estado>(
    token ? { fase: 'carregando' } : { fase: 'invalido' },
  );
  const [qual, setQual] = useState<Qual>('saldo');
  const [ocupado, setOcupado] = useState(false);
  useForaDosBuscadores();

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    carregarPagina(token).then(
      (pagina) => vivo && setEstado({ fase: 'pronta', pagina }),
      (erro: unknown) => vivo && setEstado(estadoDaFalha(erro)),
    );
    return () => {
      vivo = false;
    };
  }, [token]);

  /** Lê de novo: o "Tentar de novo" e a resposta que chegou tarde (409). */
  const ler = useCallback(async (t: string) => {
    try {
      setEstado({ fase: 'pronta', pagina: await carregarPagina(t) });
    } catch (erro) {
      setEstado(estadoDaFalha(erro));
    }
  }, []);

  /** Grava pela função; a resposta já é a página como ficou. */
  const gravar = async (acao: (t: string) => Promise<PaginaDoAluno>, aviso: string, depois: Qual) => {
    if (!token) return;
    setOcupado(true);
    try {
      const pagina = await acao(token);
      setEstado({ fase: 'pronta', pagina });
      setQual(depois);
      avisar(aviso);
    } catch (erro) {
      if (ehLinkInvalido(erro)) {
        setEstado({ fase: 'invalido' });
      } else if (erro instanceof ErroDoLink && erro.status === 409) {
        // A proposta já foi respondida, ou o professor mexeu no aluno no meio:
        // a página volta ao saldo como o banco tem agora.
        await ler(token);
        setQual('saldo');
      } else {
        avisar(avisos.falhaAoSalvar);
      }
    } finally {
      setOcupado(false);
    }
  };

  const conteudo = () => {
    if (estado.fase === 'carregando') return null;

    if (estado.fase === 'invalido') {
      return (
        <TelaVidro tipo="raiz" titulo="Aula em Dia">
          <CartaoVidro semPadding estilo={estilos.aviso}>
            <EstadoVazio titulo={avisos.linkInvalido} />
          </CartaoVidro>
        </TelaVidro>
      );
    }

    if (estado.fase === 'semRede') {
      return (
        <TelaVidro
          tipo="raiz"
          titulo="Aula em Dia"
          rodape={
            <BotaoSecundario rotulo="Tentar de novo" aoTocar={() => token && void ler(token)} />
          }
        >
          <CartaoVidro semPadding estilo={estilos.aviso}>
            <EstadoVazio titulo={avisos.paginaNaoAbriu} />
          </CartaoVidro>
        </TelaVidro>
      );
    }

    const { pagina } = estado;
    const voltar = { rotulo: VOLTAR_PARA_SALDO, aoVoltar: () => setQual('saldo') };

    if (qual === 'proposta') {
      return (
        <PaginaProposta
          pagina={pagina}
          moldura={{ voltar }}
          ocupado={ocupado}
          aoAceitar={(j) =>
            gravar((t) => responder(t, 'aceita', j), avisos.alunoAceitou(j), 'saldo')
          }
          aoRecusar={() =>
            gravar((t) => responder(t, 'recusada'), avisos.alunoRecusou, 'disponibilidade')
          }
        />
      );
    }

    if (qual === 'disponibilidade') {
      return (
        <DisponibilidadeDoLink
          pagina={pagina}
          voltar={voltar}
          ocupado={ocupado}
          aoEnviar={(blocos) =>
            gravar(
              (t) => enviarDisponibilidade(t, blocos),
              avisos.alunoEnviouDisponibilidade(pagina.professor.nome),
              'saldo',
            )
          }
        />
      );
    }

    return (
      <PaginaSaldo
        pagina={pagina}
        moldura={{ topo: <TituloDeConteudo acima={assinaturaDe(pagina)} titulo="Meu saldo" /> }}
        rodape={
          // As duas outras páginas. A prévia tem aqui "Avisar que não posso ir"
          // e "Falar com…", que não têm para onde ir: o link não manda nada.
          <View style={estilos.acoes}>
            {pagina.proposta ? (
              <BotaoPrimario rotulo="Ver a proposta de reposição" aoTocar={() => setQual('proposta')} />
            ) : null}
            <BotaoSecundario rotulo="Informar disponibilidade" aoTocar={() => setQual('disponibilidade')} />
          </View>
        }
      />
    );
  };

  return (
    <View style={estilos.cheio}>
      <ProvedorDeDesfoque>
        <AlvoDeDesfoque>
          <FundoRefracao />
          <View style={estilos.cheio}>{conteudo()}</View>
        </AlvoDeDesfoque>
      </ProvedorDeDesfoque>
      <Toast />
    </View>
  );
}

/** A grade do link: o rascunho morre com a página, então é `useState`. */
function DisponibilidadeDoLink({
  pagina,
  voltar,
  ocupado,
  aoEnviar,
}: {
  pagina: PaginaDoAluno;
  voltar: { rotulo: string; aoVoltar: () => void };
  ocupado: boolean;
  aoEnviar: (blocos: BlocoSemanal[]) => void;
}) {
  const [blocos, setBlocos] = useState<BlocoSemanal[]>(pagina.disponibilidade);
  return (
    <PaginaDisponibilidade
      pagina={pagina}
      moldura={{ voltar }}
      blocos={blocos}
      aoMudar={setBlocos}
      aoEnviar={() => aoEnviar(blocos)}
      ocupado={ocupado}
    />
  );
}

const estilos = StyleSheet.create({
  cheio: { flex: 1 },
  aviso: { marginTop: 18 },
  acoes: { gap: 10 },
});
