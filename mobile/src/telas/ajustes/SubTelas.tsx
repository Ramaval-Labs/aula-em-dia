/**
 * As seis telas que estavam decorativas em Ajustes (Fluxo E), no iOS Glass.
 *
 * O handoff novo não desenha nenhuma delas: o conteúdo e o comportamento são
 * os de antes, e o visual segue as telas desenhadas mais parecidas — cartão
 * de perfil de §8, cartões de controle de §9, listas agrupadas. Ficam juntas
 * porque compartilham o mesmo molde (empilhada sob Ajustes, título no
 * conteúdo, ação no fim) e nenhuma é grande o bastante para arquivo próprio.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  Avatar,
  CartaoDeAjuste,
  CartaoVidro,
  EstadoVazio,
  MedidorPacote,
} from '../../componentes/Blocos';
import { AcaoDoCampo, CampoDeTexto } from '../../componentes/Campos';
import { TelaVidro, TituloDeConteudo } from '../../componentes/Chassi';
import {
  BotaoInline,
  BotaoPrimario,
  BotaoSecundario,
  BotaoTexto,
  Segmentado,
  Switch,
} from '../../componentes/Controles';
import { GradeSemanalVidro, RodapeDaGradeVidro } from '../../componentes/GradeVidro';
import { CabecalhoGrupo, LinhaLista, ListaAgrupada } from '../../componentes/Listas';
import { PreviaDeMensagemVidro } from '../../componentes/PreviaVidro';
import { useDoisToques } from '../../componentes/useDoisToques';
import { alternarBloco, periodoDaFolga, resumo } from '../../dominio/disponibilidade';
import { dinheiro } from '../../dominio/formato';
import { mensagemDeCobranca } from '../../dominio/mensagens';
import { AULAS_OFERECIDAS } from '../../dominio/pacote';
import { temPacote, VALOR_AULA } from '../../dominio/politica';
import { emailValido, ERRO, iniciaisDe, nomeValido } from '../../dominio/validacao';
import { AVISOS_PADRAO, avisos, useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { useVidro } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO_VIDRO } from '../../tema/tipografia';
import { RAIO_VIDRO, TAMANHO_VIDRO } from '../../tema/tokens';

/* ── Peças locais (candidatas a promoção para src/componentes) ─────────── */

/**
 * Molde comum: empilhada sob Ajustes, título de §9 no conteúdo (29/800, com
 * o recuo de 6px do handoff) e uma linha de apoio opcional em `tinta2`.
 */
function TelaDeAjuste({
  titulo,
  subtitulo,
  children,
  rodape,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <TelaVidro tipo="empilhada" titulo={titulo} voltarPara="Ajustes" rodape={rodape}>
      <TituloDeConteudo titulo={titulo} abaixo={subtitulo} />
      {children}
    </TelaVidro>
  );
}

/** Cartão de §9 com título, sub-linha e switch à direita. */
function CartaoComSwitch({
  titulo,
  sub,
  ligado,
  aoAlternar,
  estilo,
}: {
  titulo: string;
  sub: string;
  ligado: boolean;
  aoAlternar: (v: boolean) => void;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <CartaoDeAjuste
      titulo={titulo}
      subtitulo={sub}
      direita={<Switch ligado={ligado} aoAlternar={aoAlternar} rotulo={titulo} />}
      estilo={[estilos.espacoCartao, estilo]}
    />
  );
}

// --- Perfil do professor --------------------------------------------------

export function PerfilProfessor() {
  const { cores } = useVidro();
  const { concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const avisar = useToast((s) => s.avisar);

  const [form, atualizar] = useRascunho('perfil', {
    nome: perfil.nome,
    email: perfil.email,
    disciplinas: perfil.disciplinas,
    faixaDeAlunos: perfil.faixaDeAlunos,
  });

  // O erro aparece só no campo que a pessoa mexeu: um e-mail vazio que já
  // veio assim não bloqueia salvar o nome.
  const erroNome =
    form.nome !== perfil.nome && !nomeValido(form.nome)
      ? form.nome.trim()
        ? ERRO.nomeCurto
        : ERRO.nomeVazio
      : undefined;
  const erroEmail =
    form.email !== perfil.email && !emailValido(form.email)
      ? form.email.trim()
        ? ERRO.emailInvalido
        : ERRO.emailVazio
      : undefined;
  const mudou =
    form.nome !== perfil.nome ||
    form.email !== perfil.email ||
    form.disciplinas.join('|') !== perfil.disciplinas.join('|') ||
    form.faixaDeAlunos !== perfil.faixaDeAlunos;
  const podeSalvar = mudou && !erroNome && !erroEmail;

  const salvar = () => {
    if (!podeSalvar) return;
    salvarPerfil({
      ...perfil,
      nome: form.nome.trim(),
      iniciais: iniciaisDe(form.nome),
      email: form.email.trim(),
      disciplinas: form.disciplinas,
      faixaDeAlunos: form.faixaDeAlunos,
    });
    avisar(avisos.perfilSalvo);
    concluir('ajustes');
  };

  return (
    <TelaDeAjuste
      titulo="Meu perfil"
      rodape={<BotaoPrimario rotulo="Salvar" desabilitado={!podeSalvar} aoTocar={salvar} />}
    >
      <CartaoVidro estilo={[estilos.perfil, estilos.primeiro]}>
        <Avatar texto={iniciaisDe(form.nome) || perfil.iniciais} estado="perfil" tamanho={48} />
        <View style={estilos.flexivel}>
          <Text
            numberOfLines={1}
            style={[texto(16.5, 700, { altura: 1.2, tracking: -0.015 }), { color: cores.tinta }]}
          >
            {form.nome || 'Sem nome'}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              comEspaco(texto(12.5, 500, { altura: 1.35 }), { topo: 4 }),
              { color: cores.tinta2 },
            ]}
          >
            {form.disciplinas.join(' e ') || 'Nenhuma disciplina'}
          </Text>
        </View>
      </CartaoVidro>

      <CartaoVidro estilo={[estilos.cartao, estilos.campos]}>
        <CampoDeTexto
          rotulo="Nome"
          valor={form.nome}
          aoMudar={(nome) => atualizar({ nome })}
          erro={erroNome}
          capitalizar="words"
        />
        <CampoDeTexto
          rotulo="E-mail"
          valor={form.email}
          aoMudar={(email) => atualizar({ email })}
          erro={erroEmail}
          teclado="email"
        />
        <CampoDeTexto
          rotulo="Disciplinas"
          valor={form.disciplinas.join(', ')}
          aoMudar={(v) =>
            atualizar({ disciplinas: v.split(',').map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="Inglês, Violão"
          ajuda="Separe por vírgula."
        />
      </CartaoVidro>
    </TelaDeAjuste>
  );
}

// --- E3, minha disponibilidade -------------------------------------------

export function MinhaDisponibilidade() {
  const { concluir } = useNavegacao();
  const salva = useDados((s) => s.disponibilidade);
  const salvarDisponibilidade = useDados((s) => s.salvarDisponibilidade);
  const avisar = useToast((s) => s.avisar);

  const [d, atualizar] = useRascunho('disponibilidadeProfessor', salva);
  const mudou = JSON.stringify(d) !== JSON.stringify(salva);

  const salvar = () => {
    salvarDisponibilidade(d);
    avisar(avisos.disponibilidadeSalva);
    concluir('ajustes');
  };

  return (
    <TelaDeAjuste
      titulo="Minha disponibilidade"
      subtitulo="É a base do cálculo de reposição."
      rodape={<BotaoPrimario rotulo="Salvar" desabilitado={!mudou} aoTocar={salvar} />}
    >
      <CartaoVidro estilo={[estilos.cartaoGrade, estilos.primeiro]}>
        <GradeSemanalVidro
          marcados={d.blocos}
          aoAlternar={(b) => atualizar({ blocos: alternarBloco(d.blocos, b) })}
        />
        <RodapeDaGradeVidro esquerda={resumo(d.blocos)} direita="Domingo fechado" />
      </CartaoVidro>

      <CartaoComSwitch
        titulo="Aceitar reposição fora dos blocos"
        sub="Só quando não houver outra saída"
        ligado={d.aceitaForaDosBlocos}
        aoAlternar={(aceitaForaDosBlocos) => atualizar({ aceitaForaDosBlocos })}
      />
      <CartaoComSwitch
        titulo="Sugerir sábados"
        sub="Entra na lista de horários possíveis"
        ligado={d.sugereSabado}
        aoAlternar={(sugereSabado) => atualizar({ sugereSabado })}
      />

      <View style={estilos.grupo}>
        <CabecalhoGrupo titulo="Folgas e feriados" />
      </View>
      <ListaAgrupada>
        {d.folgas.length === 0 ? (
          <EstadoVazio titulo="Nenhuma folga marcada" />
        ) : (
          d.folgas.map((f) => (
            <LinhaLista
              key={`${f.de}-${f.motivo}`}
              titulo={periodoDaFolga(f)}
              subtitulo={f.motivo}
              direita={
                <BotaoInline
                  rotulo="Remover"
                  variante="vidro"
                  rotuloAcessivel={`Remover folga: ${periodoDaFolga(f)}`}
                  aoTocar={() =>
                    atualizar({ folgas: d.folgas.filter((x) => x.de !== f.de) })
                  }
                />
              }
            />
          ))
        )}
      </ListaAgrupada>
    </TelaDeAjuste>
  );
}

// --- Pacotes e valores padrão --------------------------------------------

export function PacotesPadrao() {
  const { cores } = useVidro();
  const { concluir } = useNavegacao();
  const politicas = useDados((s) => s.politicas);
  const alunos = useDados((s) => s.alunos);
  const salvo = useDados((s) => s.pacotePadrao);
  const salvarPacotePadrao = useDados((s) => s.salvarPacotePadrao);
  const avisar = useToast((s) => s.avisar);

  const [cfg, atualizar] = useRascunho(
    'pacote',
    salvo ?? {
      aulas: 8,
      valorPorAula: VALOR_AULA,
      validadeDias: politicas.validadeDias,
      somarSaldo: false,
    },
  );

  const opcoes = AULAS_OFERECIDAS.map((n) => ({ valor: n, rotulo: `${n} aulas` }));

  return (
    <TelaDeAjuste
      titulo="Pacotes e valores padrão"
      subtitulo="O que já vem preenchido ao criar um pacote novo."
      rodape={
        <BotaoPrimario
          rotulo="Salvar padrão"
          aoTocar={() => {
            salvarPacotePadrao(cfg);
            avisar('Padrão de pacote salvo.');
            concluir('ajustes');
          }}
        />
      }
    >
      <CartaoDeAjuste titulo="Quantidade padrão" estilo={estilos.primeiro}>
        <Segmentado
          opcoes={opcoes}
          valor={cfg.aulas}
          aoTrocar={(aulas) => atualizar({ aulas })}
          porte="cartao"
          rotuloDoGrupo="Quantidade padrão de aulas"
          estilo={estilos.controleLargo}
        />
      </CartaoDeAjuste>

      <CartaoVidro estilo={estilos.cartao}>
        <CampoDeTexto
          rotulo="Valor por aula, em R$"
          valor={String(cfg.valorPorAula)}
          aoMudar={(v) => atualizar({ valorPorAula: Number(v.replace(/\D/g, '')) || 0 })}
          teclado="numerico"
          ajuda={`Pacote de ${cfg.aulas} aulas sai por ${dinheiro(
            cfg.aulas * cfg.valorPorAula,
          )}.`}
        />
      </CartaoVidro>

      <View
        style={[estilos.nota, { backgroundColor: cores.preenchimento, borderColor: cores.borda }]}
      >
        <Text style={[texto(13, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
          {`A validade vem da política de faltas: ${
            politicas.validadeDias === 0 ? 'sem prazo' : `${politicas.validadeDias} dias`
          }. Hoje ${alunos.filter(temPacote).length} alunos têm pacote ativo.`}
        </Text>
      </View>
    </TelaDeAjuste>
  );
}

// --- Avisos e lembretes ---------------------------------------------------

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

// --- Chave Pix ------------------------------------------------------------

export function ChavePix() {
  const { concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const alunos = useDados((s) => s.alunos);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const avisar = useToast((s) => s.avisar);
  const [chave, setChave] = React.useState(perfil.chavePix ?? '');
  const mudou = chave.trim() !== (perfil.chavePix ?? '');

  // Prévia com um aluno de verdade, para mostrar onde a chave entra na
  // cobrança. Sem aluno com pacote, não há cobrança para mostrar.
  const exemplo = alunos.find((a) => !a.arquivado && temPacote(a));
  const previa = exemplo
    ? mensagemDeCobranca(exemplo, 'cordial', chave.trim() || undefined)
    : null;

  return (
    <TelaDeAjuste
      titulo="Chave Pix e cobrança"
      subtitulo="Entra automaticamente na mensagem de cobrança."
      rodape={
        <BotaoPrimario
          rotulo="Salvar"
          desabilitado={!mudou}
          aoTocar={() => {
            salvarPerfil({ ...perfil, chavePix: chave.trim() || undefined });
            avisar('Chave Pix salva.');
            concluir('ajustes');
          }}
        />
      }
    >
      <CartaoVidro estilo={[estilos.cartao, estilos.primeiro]}>
        <CampoDeTexto
          rotulo="Chave Pix"
          valor={chave}
          aoMudar={setChave}
          placeholder="e-mail, telefone ou aleatória"
          capitalizar="none"
          sufixo={
            chave ? (
              <AcaoDoCampo
                rotulo="copiar"
                rotuloAcessivel="Copiar chave Pix"
                aoTocar={() => {
                  Clipboard.setStringAsync(chave.trim()).catch(() => {});
                  avisar('Chave Pix copiada.');
                }}
              />
            ) : undefined
          }
        />
      </CartaoVidro>

      {previa ? (
        <View style={estilos.bloco}>
          <PreviaDeMensagemVidro
            texto={previa}
            aoCopiar={() => avisar(avisos.mensagemCopiada)}
          />
        </View>
      ) : null}
    </TelaDeAjuste>
  );
}

// --- E4, conta e assinatura ----------------------------------------------

const LIMITE_GRATUITO = 5;
const BENEFICIOS = [
  'Alunos ilimitados',
  'Link público do aluno personalizado',
  'Relatórios mensais',
];

export function Conta() {
  const { cores } = useVidro();
  const { concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const alunos = useDados((s) => s.alunos);
  const extratos = useDados((s) => s.extratos);
  const politicas = useDados((s) => s.politicas);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const sair = useSessao((s) => s.sair);
  const avisar = useToast((s) => s.avisar);

  // Sair leva de volta ao login: dois toques.
  const sairDaConta = useDoisToques(() => {
    sair();
    avisar('Você saiu. Até logo!');
  });

  const exportar = () => {
    Clipboard.setStringAsync(JSON.stringify({ alunos, extratos, politicas }, null, 2)).catch(
      () => {},
    );
    avisar('Dados copiados para a área de transferência.');
  };

  const ativos = alunos.filter((a) => !a.arquivado).length;
  const pago = perfil.plano === 'pago';
  const ocupadas = Math.min(ativos, LIMITE_GRATUITO);

  return (
    <TelaDeAjuste
      titulo="Conta e assinatura"
      // "Sair" fecha a tela, depois das ações do plano: destrutivo nunca
      // fica entre o conteúdo e o primário.
      rodape={
        <>
          {pago ? null : (
            <>
              <BotaoPrimario
                rotulo="Assinar por R$ 29,90"
                aoTocar={() => {
                  salvarPerfil({ ...perfil, plano: 'pago' });
                  avisar('Plano ativado. Alunos ilimitados.');
                  concluir('ajustes');
                }}
              />
              <BotaoSecundario
                rotulo="Continuar no gratuito"
                aoTocar={() => concluir('ajustes')}
                estilo={estilos.segundaAcao}
              />
            </>
          )}
          <BotaoTexto
            tom="destrutivo"
            rotulo={sairDaConta.armado ? 'Tocar de novo para sair' : 'Sair da conta'}
            aoTocar={sairDaConta.tocar}
            estilo={pago ? undefined : estilos.segundaAcao}
          />
        </>
      }
    >
      <CartaoVidro estilo={[estilos.cartao, estilos.primeiro]}>
        <Text style={[TIPO_VIDRO.cabecalhoGrupo, { color: cores.tinta3 }]}>Plano atual</Text>
        <Text
          style={[
            comEspaco(texto(22, 800, { altura: 1.15, tracking: -0.03 }), { topo: 8 }),
            { color: cores.tinta },
          ]}
        >
          {pago ? 'Pago' : 'Gratuito'}
        </Text>
        {!pago ? (
          <>
            {/* Uma barra por vaga do plano, as ocupadas em cor (âmbar no
                limite). O medidor do pacote pinta as "restantes" e as põe
                no fim; por isso as vagas ocupadas entram como restantes e
                a linha é espelhada, para a cor começar da esquerda.
                Decorativo: o número vem logo abaixo, em texto. */}
            <MedidorPacote
              total={LIMITE_GRATUITO}
              usadas={LIMITE_GRATUITO - ocupadas}
              baixo={ativos >= LIMITE_GRATUITO}
              estilo={estilos.medidor}
            />
            <Text
              style={[
                comEspaco(texto(12.5, 500, { altura: 1.4 }), { topo: 9 }),
                { color: cores.tinta2 },
              ]}
            >
              {`${ativos} de ${LIMITE_GRATUITO} alunos usados`}
            </Text>
          </>
        ) : null}
      </CartaoVidro>

      {!pago ? (
        <CartaoVidro estilo={estilos.cartao}>
          <Text
            style={[texto(15.5, 700, { altura: 1.3, tracking: -0.012 }), { color: cores.tinta }]}
          >
            Plano pago · R$ 29,90 por mês
          </Text>
          <View style={estilos.beneficios}>
            {BENEFICIOS.map((b) => (
              <Text key={b} style={[texto(13, 500, { altura: 1.45 }), { color: cores.tinta2 }]}>
                {`· ${b}`}
              </Text>
            ))}
          </View>
        </CartaoVidro>
      ) : null}

      <View style={estilos.grupo}>
        <CabecalhoGrupo titulo="Conta" />
      </View>
      <ListaAgrupada>
        <LinhaLista titulo="E-mail da conta" subtitulo={perfil.email} />
        {/* Sem chevron: não há para onde ir enquanto o login for mock. */}
        <LinhaLista titulo="Alterar senha" subtitulo="Chega junto com o login de verdade" />
        <LinhaLista
          titulo="Exportar meus dados"
          subtitulo="Copia alunos, extratos e políticas"
          aoTocar={exportar}
        />
      </ListaAgrupada>

      {/* Linha sem ação, e não um bloco com cara de botão: nesta versão
          nada é apagado, e a tela diz isso. */}
      <ListaAgrupada estilo={estilos.bloco}>
        <LinhaLista
          titulo="Apagar minha conta"
          subtitulo="Indisponível no protótipo: nesta versão nada é apagado."
        />
      </ListaAgrupada>

    </TelaDeAjuste>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  primeiro: { marginTop: 18 },
  cartao: { marginTop: 12, paddingVertical: 16, paddingHorizontal: 17 },
  cartaoGrade: { marginTop: 12, paddingVertical: 15, paddingHorizontal: 13 },
  perfil: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  campos: { gap: 16 },
  controleLargo: { alignSelf: 'stretch' },
  espacoCartao: { marginTop: 12 },
  grupo: { marginTop: 24, marginBottom: 9 },
  bloco: { marginTop: 12 },
  nota: {
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 17,
    borderRadius: RAIO_VIDRO.cartao,
    borderWidth: TAMANHO_VIDRO.bordaVidro,
  },
  medidor: { marginTop: 14, transform: [{ scaleX: -1 }] },
  beneficios: { marginTop: 10, gap: 6 },
  segundaAcao: { marginTop: 10 },
});
