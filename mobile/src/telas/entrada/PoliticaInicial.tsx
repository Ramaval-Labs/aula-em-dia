/**
 * A6 — Onboarding, passo 3: a política de faltas. A tela-chave.
 *
 * Os mesmos quatro campos da tela de Ajustes, mais o cartão-espelho "Como o
 * aluno vai ler" — que é a mesma frase que aparece na página pública do
 * aluno, gerada por `comoOAlunoVaiLer`.
 */

import React from 'react';
import { Text, View } from 'react-native';

import { Cartao } from '../../componentes/Base';
import { Segmentado } from '../../componentes/Botoes';
import { Contador, Interruptor } from '../../componentes/Formulario';
import { comoOAlunoVaiLer } from '../../dominio/mensagens';
import { POLITICAS_PADRAO } from '../../dominio/politica';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { useCores } from '../../tema/TemaProvider';
import { texto, TIPO } from '../../tema/tipografia';
import { RAIO } from '../../tema/tokens';
import { PassoDoOnboarding } from './PassoDoOnboarding';

const PRAZOS = [4, 12, 24, 48].map((h) => ({ valor: h, rotulo: `${h}h` }));
const VALIDADES = [
  { valor: 30, rotulo: '30 dias' },
  { valor: 60, rotulo: '60 dias' },
  { valor: 0, rotulo: 'sem prazo' },
];
const LIMITE_MAXIMO = 5;

export function PoliticaInicial() {
  const cores = useCores();
  const avancar = useSessao((s) => s.avancar);
  const salvarPoliticas = useDados((s) => s.salvarPoliticas);

  const [p, atualizar] = useRascunho('politica', POLITICAS_PADRAO);

  const continuar = () => {
    salvarPoliticas(p);
    avancar();
  };

  return (
    <PassoDoOnboarding
      passo={3}
      titulo="Sua política de faltas"
      subtitulo="O app passa a aplicar isso sozinho, do mesmo jeito para todos."
      rotuloDoBotao="Salvar política"
      aoAvancar={continuar}
    >
      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Prazo mínimo de aviso
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={PRAZOS}
            valor={p.avisoHoras}
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
          ligado={p.avisadaDevolve}
          aoTrocar={(avisadaDevolve) => atualizar({ avisadaDevolve })}
          rotuloAcessivel="Falta avisada devolve a aula"
        />
        <View style={{ flex: 1 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Falta avisada devolve a aula
          </Text>
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
            {p.avisadaDevolve
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
            valor={p.limiteReposicoes}
            minimo={0}
            maximo={LIMITE_MAXIMO}
            aoMudar={(limiteReposicoes) => atualizar({ limiteReposicoes })}
            formatar={(v) => (v === 0 ? '—' : String(v))}
            rotuloAcessivel={
              p.limiteReposicoes === 0
                ? 'sem limite de reposições'
                : `${p.limiteReposicoes} reposições por pacote`
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
            valor={p.validadeDias}
            aoTrocar={(validadeDias) => atualizar({ validadeDias })}
            rotuloAcessivel="Validade do pacote"
          />
        </View>
      </Cartao>

      {/* O espelho: a mesma frase que o aluno lê na página dele. */}
      <View
        style={{
          backgroundColor: cores.elevado,
          borderRadius: RAIO.cartao,
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={[
            texto(10, 600, { altura: 1, tracking: 0.16, maiuscula: true }),
            { color: cores.topoFraco },
          ]}
        >
          Como o aluno vai ler
        </Text>
        <Text
          style={[
            texto(13.5, 400, { altura: 1.5 }),
            { marginTop: 9, color: '#FFFFFF' },
          ]}
        >
          {comoOAlunoVaiLer(p)}
        </Text>
      </View>
    </PassoDoOnboarding>
  );
}
