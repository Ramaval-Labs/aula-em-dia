/**
 * Tela 9 — Política de faltas (Fluxo E2).
 * Edita um rascunho e mostra o diff antes de salvar. O que é salvo aqui
 * muda o cálculo da tela Registrar aula no próximo registro.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { Cartao, CartaoContexto } from '../componentes/Base';
import { BotaoPrimario, BotaoTexto, Segmentado } from '../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../componentes/Cabecalho';
import { Contador, Interruptor } from '../componentes/Formulario';
import { Tela } from '../componentes/Tela';
import { temPacote } from '../dominio/politica';
import type { Politicas } from '../dominio/tipos';
import { avisos, useDados } from '../estado/dados';
import { useRascunho } from '../estado/formularios';
import { useNavegacao } from '../estado/navegacao';
import { useToast } from '../estado/toast';
import { useCores } from '../tema/TemaProvider';
import { texto, TIPO } from '../tema/tipografia';
import { MARCA } from '../tema/tokens';

const PRAZOS = [4, 12, 24, 48].map((h) => ({ valor: h, rotulo: `${h}h` }));
const VALIDADES = [
  { valor: 30, rotulo: '30 dias' },
  { valor: 60, rotulo: '60 dias' },
  { valor: 0, rotulo: 'sem prazo' },
];
const LIMITE_MAXIMO = 5;

/** Resumo textual do que muda ao salvar — um campo por vez, o mais relevante. */
function diff(
  de: Politicas,
  para: Politicas,
  pacotesEmAndamento: number,
): { titulo: string; texto: string } | null {
  if (para.limiteReposicoes !== de.limiteReposicoes) {
    return {
      titulo: `Você mudou o limite de ${de.limiteReposicoes} para ${para.limiteReposicoes}`,
      texto: `Vale só para pacotes novos. Os ${pacotesEmAndamento} pacotes em andamento seguem com a regra antiga até vencer.`,
    };
  }
  if (para.avisoHoras !== de.avisoHoras) {
    return {
      titulo: `Prazo de aviso muda de ${de.avisoHoras}h para ${para.avisoHoras}h`,
      texto: 'Vale a partir do próximo registro de aula. Os lançamentos já feitos não mudam.',
    };
  }
  if (para.avisadaDevolve !== de.avisadaDevolve) {
    return {
      titulo: para.avisadaDevolve
        ? 'Falta avisada volta a devolver a aula'
        : 'Falta avisada passa a debitar sempre',
      texto: 'Vale a partir do próximo registro de aula.',
    };
  }
  if (para.validadeDias !== de.validadeDias) {
    return {
      titulo: `Validade padrão muda para ${
        para.validadeDias === 0 ? 'sem prazo' : `${para.validadeDias} dias`
      }`,
      texto: 'Aplica-se aos pacotes criados a partir de agora.',
    };
  }
  return null;
}

export function Politica() {
  const cores = useCores();
  const { concluir, voltar } = useNavegacao();
  const salvas = useDados((s) => s.politicas);
  const alunos = useDados((s) => s.alunos);
  const salvarPoliticas = useDados((s) => s.salvarPoliticas);
  const avisar = useToast((s) => s.avisar);

  const [atual, atualizar, , descartarRascunho] = useRascunho('politica', salvas);
  const mudou = JSON.stringify(atual) !== JSON.stringify(salvas);
  const mudanca = diff(salvas, atual, alunos.filter(temPacote).length);

  return (
    <Tela
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela}>
          {/* Voltar sem salvar descarta o rascunho: sem isso, a edição
              abandonada reaparecia na próxima visita como se fosse a salva. */}
          <BotaoVoltar
            rotulo="Ajustes"
            aoTocar={() => {
              descartarRascunho();
              voltar();
            }}
          />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={21}>Política de faltas</TituloTela>
          </View>
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ paddingTop: 14, gap: 9, paddingBottom: 12 }}
      rodape={
        <>
          <BotaoPrimario
            rotulo="Salvar alterações"
            desabilitado={!mudou}
            aoTocar={() => {
              if (!mudou) return;
              salvarPoliticas(atual);
              concluir('ajustes');
              avisar(avisos.politicaSalva);
            }}
          />
          <BotaoTexto rotulo="Descartar" aoTocar={() => concluir('ajustes')} />
        </>
      }
    >
      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Prazo mínimo de aviso
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={PRAZOS}
            valor={atual.avisoHoras}
            aoTrocar={(avisoHoras) => atualizar({ avisoHoras })}
            rotuloAcessivel="Prazo mínimo de aviso"
          />
        </View>
      </Cartao>

      <Cartao
        estilo={{
          paddingVertical: 13,
          paddingHorizontal: 15,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
        }}
      >
        <Interruptor
          ligado={atual.avisadaDevolve}
          aoTrocar={(avisadaDevolve) => atualizar({ avisadaDevolve })}
          rotuloAcessivel="Falta avisada devolve a aula"
        />
        <View style={{ flex: 1 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Falta avisada devolve a aula
          </Text>
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
            {atual.avisadaDevolve
              ? 'Dentro do prazo, o saldo não é debitado'
              : 'A aula é debitada mesmo com aviso'}
          </Text>
        </View>
      </Cartao>

      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
              Reposições por pacote
            </Text>
            <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
              Depois do limite, a falta debita
            </Text>
          </View>
          <Contador
            valor={atual.limiteReposicoes}
            minimo={0}
            maximo={LIMITE_MAXIMO}
            aoMudar={(limiteReposicoes) => atualizar({ limiteReposicoes })}
            formatar={(v) => (v === 0 ? '—' : String(v))}
            rotuloAcessivel={
              atual.limiteReposicoes === 0
                ? 'sem limite de reposições'
                : `${atual.limiteReposicoes} reposições por pacote`
            }
          />
        </View>
      </Cartao>

      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Validade do pacote
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={VALIDADES}
            valor={atual.validadeDias}
            aoTrocar={(validadeDias) => atualizar({ validadeDias })}
            rotuloAcessivel="Validade do pacote"
          />
        </View>
      </Cartao>

      {mudanca ? (
        <CartaoContexto
          cor={MARCA.amarelo}
          titulo={mudanca.titulo}
          detalhe={mudanca.texto}
        />
      ) : null}
    </Tela>
  );
}
