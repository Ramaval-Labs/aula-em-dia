/**
 * As seis telas que estavam decorativas em Ajustes.
 *
 * Ficam juntas porque compartilham o mesmo molde — cabeçalho com voltar,
 * conteúdo em cartões, rodapé de salvar — e nenhuma delas é grande o
 * bastante para justificar arquivo próprio.
 */

import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Text, View } from 'react-native';

import { Avatar, Caixa, Cartao, LinhaLista, Lista, RotuloSecao } from '../../componentes/Base';
import {
  BotaoContorno,
  BotaoPequeno,
  BotaoPrimario,
  Segmentado,
  useDoisToques,
} from '../../componentes/Botoes';
import { BotaoVoltar, CabecalhoEscuro, TituloTela } from '../../componentes/Cabecalho';
import { AcaoDoCampo, CampoDeTexto, Interruptor } from '../../componentes/Formulario';
import { GradeSemanal, RodapeDaGrade } from '../../componentes/GradeSemanal';
import { Tela } from '../../componentes/Tela';
import { alternarBloco, periodoDaFolga, resumo } from '../../dominio/disponibilidade';
import { dinheiro } from '../../dominio/formato';
import { AULAS_OFERECIDAS } from '../../dominio/pacote';
import { temPacote, VALOR_AULA } from '../../dominio/politica';
import { emailValido, ERRO, iniciaisDe, nomeValido } from '../../dominio/validacao';
import { AVISOS_PADRAO, avisos, useDados } from '../../estado/dados';
import { useRascunho } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useSessao } from '../../estado/sessao';
import { useToast } from '../../estado/toast';
import { useCores } from '../../tema/TemaProvider';
import { texto, TIPO } from '../../tema/tipografia';
import { MARCA } from '../../tema/tokens';

/** Molde comum: cabeçalho escuro com voltar e título. */
function TelaDeAjuste({
  titulo,
  subtitulo,
  children,
  rodape,
  comTeclado,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  comTeclado?: boolean;
}) {
  const cores = useCores();
  const voltar = useNavegacao((s) => s.voltar);
  return (
    <Tela
      comTeclado={comTeclado}
      cabecalho={
        <CabecalhoEscuro corDaCurva={cores.tela} padBaixo={40}>
          <BotaoVoltar rotulo="Ajustes" aoTocar={voltar} />
          <View style={{ marginTop: 14 }}>
            <TituloTela tamanho={22}>{titulo}</TituloTela>
          </View>
          {subtitulo ? (
            <Text style={[TIPO.corpo, { marginTop: 6, color: cores.topoFraco }]}>
              {subtitulo}
            </Text>
          ) : null}
        </CabecalhoEscuro>
      }
      conteudoEstilo={{ gap: 10 }}
      rodape={rodape}
    >
      {children}
    </Tela>
  );
}

// --- Perfil do professor --------------------------------------------------

export function PerfilProfessor() {
  const cores = useCores();
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
      comTeclado
      titulo="Meu perfil"
      rodape={<BotaoPrimario rotulo="Salvar" desabilitado={!podeSalvar} aoTocar={salvar} />}
    >
      <Cartao
        estilo={{
          paddingVertical: 15,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
        }}
      >
        <Avatar iniciais={iniciaisDe(form.nome) || perfil.iniciais} tamanho={48} />
        <View style={{ flex: 1 }}>
          <Text style={[texto(15, 600, { altura: 1.2 }), { color: cores.texto }]}>
            {form.nome || 'Sem nome'}
          </Text>
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
            {form.disciplinas.join(' e ') || 'Nenhuma disciplina'}
          </Text>
        </View>
      </Cartao>

      <CampoDeTexto
        rotulo="Nome"
        valor={form.nome}
        aoMudar={(nome) => atualizar({ nome })}
        erro={erroNome}
        capitalizar="words"
        tamanhoDoValor={16.5}
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
    </TelaDeAjuste>
  );
}

// --- E3, minha disponibilidade -------------------------------------------

export function MinhaDisponibilidade() {
  const cores = useCores();
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
      <Cartao estilo={{ paddingVertical: 14, paddingHorizontal: 12 }}>
        <GradeSemanal
          marcados={d.blocos}
          aoAlternar={(b) => atualizar({ blocos: alternarBloco(d.blocos, b) })}
        />
        <RodapeDaGrade esquerda={resumo(d.blocos)} direita="Domingo fechado" />
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
          ligado={d.aceitaForaDosBlocos}
          aoTrocar={(aceitaForaDosBlocos) => atualizar({ aceitaForaDosBlocos })}
          rotuloAcessivel="Aceitar reposição fora dos blocos"
        />
        <View style={{ flex: 1 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Aceitar reposição fora dos blocos
          </Text>
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
            Só quando não houver outra saída
          </Text>
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
          ligado={d.sugereSabado}
          aoTrocar={(sugereSabado) => atualizar({ sugereSabado })}
          rotuloAcessivel="Sugerir sábados"
        />
        <View style={{ flex: 1 }}>
          <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Sugerir sábados
          </Text>
          <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>
            Entra na lista de horários possíveis
          </Text>
        </View>
      </Cartao>

      <Lista rotulo="Folgas e feriados">
        {d.folgas.length === 0 ? (
          <LinhaLista titulo="Nenhuma folga marcada" ultima />
        ) : (
          d.folgas.map((f, i) => (
            <LinhaLista
              key={`${f.de}-${f.motivo}`}
              titulo={periodoDaFolga(f)}
              sub={f.motivo}
              ultima={i === d.folgas.length - 1}
              direita={
                <BotaoPequeno
                  rotulo="Remover"
                  aoTocar={() =>
                    atualizar({ folgas: d.folgas.filter((x) => x.de !== f.de) })
                  }
                />
              }
            />
          ))
        )}
      </Lista>
    </TelaDeAjuste>
  );
}

// --- Pacotes e valores padrão --------------------------------------------

export function PacotesPadrao() {
  const cores = useCores();
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
      comTeclado
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
      <Cartao estilo={{ paddingVertical: 13, paddingHorizontal: 15 }}>
        <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
          Quantidade padrão
        </Text>
        <View style={{ marginTop: 10 }}>
          <Segmentado
            opcoes={opcoes}
            valor={cfg.aulas}
            aoTrocar={(aulas) => atualizar({ aulas })}
            rotuloAcessivel="Quantidade padrão de aulas"
          />
        </View>
      </Cartao>

      <CampoDeTexto
        rotulo="Valor por aula"
        valor={String(cfg.valorPorAula)}
        aoMudar={(v) => atualizar({ valorPorAula: Number(v.replace(/\D/g, '')) || 0 })}
        teclado="numerico"
        ajuda={`Pacote de ${cfg.aulas} aulas sai por ${dinheiro(
          cfg.aulas * cfg.valorPorAula,
        )}.`}
      />

      <Caixa>
        <Text style={[TIPO.corpo, { color: cores.textoMedio }]}>
          {`A validade vem da política de faltas: ${
            politicas.validadeDias === 0 ? 'sem prazo' : `${politicas.validadeDias} dias`
          }. Hoje ${alunos.filter(temPacote).length} alunos têm pacote ativo.`}
        </Text>
      </Caixa>
    </TelaDeAjuste>
  );
}

// --- Avisos e lembretes ---------------------------------------------------

export function Avisos() {
  const cores = useCores();
  const { concluir } = useNavegacao();
  const avisar = useToast((s) => s.avisar);
  // O `?? AVISOS_PADRAO` fica fora do seletor: dentro, criaria objeto novo a
  // cada leitura e o zustand entraria em loop de render.
  const salvas = useDados((s) => s.preferenciasDeAviso) ?? AVISOS_PADRAO;
  const salvarPreferencias = useDados((s) => s.salvarPreferenciasDeAviso);
  const [ligados, setLigados] = React.useState(salvas);

  const itens = [
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
      {itens.map((i) => (
        <Cartao
          key={i.chave}
          estilo={{
            paddingVertical: 13,
            paddingHorizontal: 15,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 13,
          }}
        >
          <Interruptor
            ligado={ligados[i.chave]}
            aoTrocar={(v) => setLigados((s) => ({ ...s, [i.chave]: v }))}
            rotuloAcessivel={i.titulo}
          />
          <View style={{ flex: 1 }}>
            <Text style={[texto(13.5, 600, { altura: 1.3 }), { color: cores.texto }]}>
              {i.titulo}
            </Text>
            <Text style={[TIPO.nota, { marginTop: 3, color: cores.textoMedio }]}>{i.sub}</Text>
          </View>
        </Cartao>
      ))}
    </TelaDeAjuste>
  );
}

// --- Chave Pix ------------------------------------------------------------

export function ChavePix() {
  const { concluir } = useNavegacao();
  const perfil = useDados((s) => s.perfil);
  const salvarPerfil = useDados((s) => s.salvarPerfil);
  const avisar = useToast((s) => s.avisar);
  const [chave, setChave] = React.useState(perfil.chavePix ?? '');
  const mudou = chave.trim() !== (perfil.chavePix ?? '');

  return (
    <TelaDeAjuste
      comTeclado
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
      <CampoDeTexto
        rotulo="Chave Pix"
        valor={chave}
        aoMudar={setChave}
        placeholder="e-mail, telefone ou aleatória"
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
    </TelaDeAjuste>
  );
}

// --- E4, conta e assinatura ----------------------------------------------

const LIMITE_GRATUITO = 5;

export function Conta() {
  const cores = useCores();
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
  const proporcao = Math.min(1, ativos / LIMITE_GRATUITO);

  return (
    <TelaDeAjuste
      titulo="Conta e assinatura"
      rodape={
        pago ? undefined : (
          <>
            <BotaoPrimario
              rotulo="Assinar por R$ 29,90"
              aoTocar={() => {
                salvarPerfil({ ...perfil, plano: 'pago' });
                avisar('Plano ativado. Alunos ilimitados.');
                concluir('ajustes');
              }}
            />
            <BotaoContorno
              rotulo="Continuar no gratuito"
              altura={44}
              aoTocar={() => concluir('ajustes')}
            />
          </>
        )
      }
    >
      <Cartao estilo={{ paddingVertical: 15, paddingHorizontal: 16 }}>
        <RotuloSecao>Plano atual</RotuloSecao>
        <Text
          style={[texto(20, 700, { altura: 1.2 }), { marginTop: 9, color: cores.texto }]}
        >
          {pago ? 'Pago' : 'Gratuito'}
        </Text>
        {!pago ? (
          <>
            <View
              style={{
                marginTop: 13,
                height: 6,
                borderRadius: 3,
                backgroundColor: cores.linha,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${proporcao * 100}%`,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: proporcao >= 1 ? cores.vermelho : cores.texto,
                }}
              />
            </View>
            <Text style={[TIPO.nota, { marginTop: 9, color: cores.textoMedio }]}>
              {`${ativos} de ${LIMITE_GRATUITO} alunos usados`}
            </Text>
          </>
        ) : null}
      </Cartao>

      {!pago ? (
        <Cartao
          estilo={{
            paddingVertical: 15,
            paddingHorizontal: 16,
            borderLeftWidth: 4,
            borderLeftColor: MARCA.amarelo,
          }}
        >
          <Text style={[texto(15, 600, { altura: 1.3 }), { color: cores.texto }]}>
            Plano pago · R$ 29,90 por mês
          </Text>
          <View style={{ marginTop: 11, gap: 7 }}>
            {[
              'Alunos ilimitados',
              'Link público do aluno personalizado',
              'Relatórios mensais',
            ].map((b) => (
              <Text key={b} style={[TIPO.corpo, { color: cores.textoMedio }]}>
                {`· ${b}`}
              </Text>
            ))}
          </View>
        </Cartao>
      ) : null}

      <Lista rotulo="Conta">
        <LinhaLista titulo="E-mail da conta" sub={perfil.email} />
        {/* Sem chevron: não há para onde ir enquanto o login for mock. */}
        <LinhaLista titulo="Alterar senha" sub="Chega junto com o login de verdade" />
        <LinhaLista
          titulo="Exportar meus dados"
          sub="Copia alunos, extratos e políticas"
          chevron
          aoTocar={exportar}
        />
        <LinhaLista
          titulo={sairDaConta.armado ? 'Tocar de novo para sair' : 'Sair da conta'}
          chevron
          ultima
          aoTocar={sairDaConta.tocar}
        />
      </Lista>

      {/* Linha sem ação, e não um bloco com cara de botão: nesta versão
          nada é apagado, e a tela diz isso. */}
      <Cartao estilo={{ overflow: 'hidden' }}>
        <LinhaLista
          titulo="Apagar minha conta"
          sub="Indisponível no protótipo: nesta versão nada é apagado."
          ultima
        />
      </Cartao>
    </TelaDeAjuste>
  );
}
