/**
 * Avisos e lembretes (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha esta tela: o conteúdo e o comportamento são os de
 * antes, e o visual segue os cartões com switch de §9.
 */

import React from 'react';

import { BotaoPrimario } from '../../componentes/Controles';
import { AVISOS_PADRAO, useDados } from '../../estado/dados';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { estilos } from './estilos';
import { CartaoComSwitch, TelaDeAjuste } from './pecas';

const ITENS_DE_AVISO = [
  { chave: 'aulaDoDia' as const, titulo: 'Aula do dia', sub: 'Aviso na manhã de cada aula' },
  { chave: 'saldoBaixo' as const, titulo: 'Saldo baixo', sub: 'Quando restarem 2 aulas ou menos' },
  {
    chave: 'reposicaoPendente' as const,
    titulo: 'Reposição pendente',
    sub: 'Se ficar 3 dias sem horário escolhido',
  },
  {
    chave: 'pagamentoVencendo' as const,
    titulo: 'Pagamento vencendo',
    sub: 'Três dias antes do vencimento',
  },
];

export function Avisos() {
  const { concluir } = useNavegacao();
  const avisar = useToast((s) => s.avisar);
  // O `?? AVISOS_PADRAO` fica fora do seletor: dentro, criaria objeto novo a
  // cada leitura e o zustand entraria em loop de render.
  const salvas = useDados((s) => s.preferenciasDeAviso) ?? AVISOS_PADRAO;
  const salvarPreferencias = useDados((s) => s.salvarPreferenciasDeAviso);
  const [ligados, setLigados] = React.useState(salvas);

  return (
    <TelaDeAjuste
      titulo="Avisos e lembretes"
      subtitulo="Nada é enviado nesta versão — só a preferência fica salva."
      rodape={
        <BotaoPrimario
          rotulo="Salvar"
          aoTocar={() => {
            salvarPreferencias(ligados);
            avisar('Preferências de aviso salvas.');
            concluir('ajustes');
          }}
        />
      }
    >
      {ITENS_DE_AVISO.map((i, n) => (
        <CartaoComSwitch
          key={i.chave}
          titulo={i.titulo}
          sub={i.sub}
          ligado={ligados[i.chave]}
          aoAlternar={(v) => setLigados((s) => ({ ...s, [i.chave]: v }))}
          estilo={n === 0 ? estilos.primeiro : undefined}
        />
      ))}
    </TelaDeAjuste>
  );
}
