/**
 * A6 — Onboarding, passo 3: a política de faltas. A tela-chave.
 *
 * Os mesmos quatro cartões da tela de Política (H§9: segmentado, switch,
 * stepper, segmentado), mais o cartão-espelho "Como o aluno vai ler" — que é
 * a mesma frase que aparece na página pública do aluno, gerada por
 * `comoOAlunoVaiLer`.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { BlocoStatus } from '../../componentes/Blocos';
import { Segmentado, Stepper, Switch } from '../../componentes/Controles';
import { comoOAlunoVaiLer } from '../../dominio/mensagens';
import { POLITICAS_PADRAO } from '../../dominio/politica';
import { useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useSessao } from '../../estado/sessao';
import { PassoDoOnboarding } from './PassoDoOnboarding';
import { CartaoDeAjuste } from './PecasDeEntrada';

const PRAZOS = [4, 12, 24, 48].map((h) => ({ valor: h, rotulo: `${h}h` }));
const VALIDADES = [
  { valor: 30, rotulo: '30 dias' },
  { valor: 60, rotulo: '60 dias' },
  { valor: 0, rotulo: 'sem prazo' },
];
const LIMITE_MAXIMO = 5;

export function PoliticaInicial() {
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
      <CartaoDeAjuste titulo="Prazo mínimo de aviso">
        <Segmentado
          opcoes={PRAZOS}
          valor={p.avisoHoras}
          porte="cartao"
          aoTrocar={(avisoHoras) => atualizar({ avisoHoras })}
          rotuloDoGrupo="Prazo mínimo de aviso"
          estilo={estilos.largo}
        />
      </CartaoDeAjuste>

      <CartaoDeAjuste
        titulo="Falta avisada devolve a aula"
        subtitulo={
          p.avisadaDevolve
            ? 'Dentro do prazo, o saldo não é debitado'
            : 'A aula é debitada mesmo com aviso'
        }
        direita={
          <Switch
            ligado={p.avisadaDevolve}
            aoAlternar={(avisadaDevolve) => atualizar({ avisadaDevolve })}
            rotulo="Falta avisada devolve a aula"
          />
        }
      />

      <CartaoDeAjuste
        titulo="Reposições por pacote"
        subtitulo="Depois do limite, a falta debita"
        direita={
          <Stepper
            valor={p.limiteReposicoes}
            minimo={0}
            maximo={LIMITE_MAXIMO}
            aoTrocar={(limiteReposicoes) => atualizar({ limiteReposicoes })}
            formatar={(v) => (v === 0 ? '—' : String(v))}
            // O valor 0 aparece como "—": o rótulo diz o que ele significa.
            rotulo={
              p.limiteReposicoes === 0
                ? 'reposições por pacote (sem limite)'
                : 'reposições por pacote'
            }
          />
        }
      />

      <CartaoDeAjuste titulo="Validade do pacote">
        <Segmentado
          opcoes={VALIDADES}
          valor={p.validadeDias}
          porte="cartao"
          aoTrocar={(validadeDias) => atualizar({ validadeDias })}
          rotuloDoGrupo="Validade do pacote"
          estilo={estilos.largo}
        />
      </CartaoDeAjuste>

      {/* O espelho: a mesma frase que o aluno lê na página dele. */}
      <BlocoStatus tom="tint" titulo="Como o aluno vai ler" texto={comoOAlunoVaiLer(p)} />
    </PassoDoOnboarding>
  );
}

const estilos = StyleSheet.create({
  largo: { alignSelf: 'stretch' },
});
