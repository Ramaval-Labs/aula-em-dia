/**
 * Catálogo de componentes do iOS Glass — uma seção por família, cada peça em
 * todos os estados que as telas usam (normal, desabilitado, selecionado,
 * vazio, texto longo, número grande).
 *
 * Tela só de desenvolvimento: nada aqui entra no app. É a prova visual do
 * catálogo, e o que se lê antes de escolher uma peça para uma tela nova.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { BlocoSemanal } from '../../dominio/tipos';
import { useCores } from '../../tema/TemaProvider';
import { comEspaco, texto, TIPO } from '../../tema/tipografia';
import { TAMANHO } from '../../tema/tokens';
import {
  Avatar,
  BarraProporcional,
  BlocoStatus,
  CartaoResumo,
  CartaoVidro,
  EstadoVazio,
  FaixaStatus,
  MedidorPacote,
  type EstadoDoAvatar,
  type TamanhoDeAvatar,
} from '../Blocos';
import { CampoDeTexto } from '../Campos';
import {
  BotaoCompacto,
  BotaoInline,
  BotaoPrimario,
  BotaoSecundario,
  BotaoTexto,
  CartaoEscolha,
  Segmentado,
  Stepper,
  Switch,
} from '../Controles';
import { GradeSemanal, RodapeDaGrade } from '../GradeSemanal';
import { Icone, ICONES, type NomeDeIcone } from '../Icone';
import {
  CabecalhoGrupo,
  LinhaAluno,
  LinhaExtrato,
  LinhaLista,
  ListaAgrupada,
} from '../Listas';
import { PreviaDeMensagem } from '../PreviaDeMensagem';

const LONGO =
  'Nome muito comprido de aluno para testar a elipse na linha da lista agrupada';
const MENSAGEM =
  'Oi, Rafael! Sua aula de quinta (28/08) foi remarcada para sexta, 29/08 às 17h. ' +
  'Confirma pra mim? Qualquer coisa a gente combina outro horário.';

/* ── Casca ────────────────────────────────────────────────────────────── */

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { cores } = useCores();
  return (
    <View style={estilos.secao}>
      <Text style={[TIPO.tituloEmpilhada, { color: cores.tinta }]}>{titulo}</Text>
      {children}
    </View>
  );
}

function Amostra({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  const { cores } = useCores();
  return (
    <View style={estilos.amostra}>
      <Text style={[comEspaco(TIPO.cabecalhoGrupo, { base: 9 }), { color: cores.tinta3 }]}>
        {rotulo}
      </Text>
      {children}
    </View>
  );
}

/* ── Seções ───────────────────────────────────────────────────────────── */

export function SecoesDoCatalogo() {
  return (
    <>
      <SecaoIcones />
      <SecaoBotoes />
      <SecaoControles />
      <SecaoListas />
      <SecaoBlocos />
      <SecaoDerivados />
    </>
  );
}

function SecaoIcones() {
  const { cores } = useCores();
  const nomes = Object.keys(ICONES) as NomeDeIcone[];
  return (
    <Secao titulo="Ícones">
      <Amostra rotulo="viewBox 24 · sem fill · traço do handoff">
        <CartaoVidro>
          <View style={estilos.grelha}>
            {nomes.map((n) => (
              <View key={n} style={estilos.celulaIcone}>
                <Icone nome={n} tamanho={24} cor={cores.tinta} />
                <Text
                  style={[comEspaco(texto(10, 600), { topo: 6 }), { color: cores.tinta3 }]}
                  numberOfLines={1}
                >
                  {n}
                </Text>
              </View>
            ))}
          </View>
          <View style={estilos.linhaIcones}>
            <Icone nome="chevron" tamanho={19} cor={cores.tint} girar={180} />
            <Icone nome="chevron" tamanho={19} cor={cores.tint} girar={90} />
            <Icone nome="mais" tamanho={19} cor={cores.tint} />
            <Icone nome="check" tamanho={19} cor={cores.verde} />
            <Icone nome="alerta" tamanho={19} cor={cores.vermelho} />
          </View>
        </CartaoVidro>
      </Amostra>
    </Secao>
  );
}

function SecaoBotoes() {
  const [contagem, setContagem] = useState(0);
  return (
    <Secao titulo="Botões">
      <Amostra rotulo="primário 54 · um por tela">
        <View style={estilos.coluna}>
          <BotaoPrimario rotulo="Registrar aula" icone="mais" aoTocar={() => setContagem((c) => c + 1)} />
          <BotaoPrimario rotulo={`Cobrar os 2 em atraso · R$ 10.000,00 (${contagem})`} aoTocar={() => {}} />
          <BotaoPrimario rotulo="Confirmar" aoTocar={() => {}} desabilitado />
        </View>
      </Amostra>
      <Amostra rotulo="secundário 52 · compacto 50 · texto 46">
        <View style={estilos.coluna}>
          <BotaoSecundario rotulo="Renovar pacote" aoTocar={() => {}} />
          <BotaoSecundario rotulo="Fechar" aoTocar={() => {}} desabilitado />
          <BotaoCompacto rotulo="Estender validade em 15 dias" aoTocar={() => {}} />
          <BotaoTexto rotulo="Descartar" aoTocar={() => {}} />
          <BotaoTexto rotulo="Arquivar aluno" tom="destrutivo" aoTocar={() => {}} />
        </View>
      </Amostra>
      <Amostra rotulo="inline 40 · largura do conteúdo">
        <View style={estilos.linhaBotoes}>
          <BotaoInline rotulo="Ver horários" aoTocar={() => {}} />
          <BotaoInline rotulo="Retomar as aulas" variante="vidro" aoTocar={() => {}} />
          <BotaoInline rotulo="Indisponível" aoTocar={() => {}} desabilitado />
        </View>
      </Amostra>
    </Secao>
  );
}

const FILTROS = [
  { valor: 'urgencia', rotulo: 'Urgência' },
  { valor: 'az', rotulo: 'A–Z' },
  { valor: 'hoje', rotulo: 'Hoje' },
] as const;

const PRAZOS = [
  { valor: 4, rotulo: '4h' },
  { valor: 12, rotulo: '12h' },
  { valor: 24, rotulo: '24h' },
  { valor: 48, rotulo: '48h' },
] as const;

function SecaoControles() {
  const { cores } = useCores();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['valor']>('urgencia');
  const [prazo, setPrazo] = useState<(typeof PRAZOS)[number]['valor']>(24);
  const [ligado, setLigado] = useState(true);
  const [limite, setLimite] = useState(2);
  const [escolha, setEscolha] = useState('avisada');
  const [aviso, setAviso] = useState(26);

  return (
    <Secao titulo="Controles">
      <Amostra rotulo="segmentado · 34 filtro, 36 cartão, 30 em linha">
        <View style={estilos.coluna}>
          <Segmentado
            opcoes={FILTROS}
            valor={filtro}
            aoTrocar={setFiltro}
            rotuloDoGrupo="Ordenar alunos"
          />
          <Segmentado
            opcoes={PRAZOS}
            valor={prazo}
            aoTrocar={setPrazo}
            porte="cartao"
            rotuloDoGrupo="Prazo mínimo de aviso"
          />
          <Segmentado
            opcoes={[
              { valor: 'claro', rotulo: 'Claro' },
              { valor: 'escuro', rotulo: 'Escuro' },
            ]}
            valor="claro"
            aoTrocar={() => {}}
            porte="linha"
            rotuloDoGrupo="Aparência"
          />
          <Segmentado
            opcoes={FILTROS}
            valor={filtro}
            aoTrocar={setFiltro}
            desabilitado
            rotuloDoGrupo="Desabilitado"
          />
        </View>
      </Amostra>

      <Amostra rotulo="switch 52 × 32 · stepper 38 × 34">
        <CartaoVidro>
          <View style={estilos.linhaControle}>
            <View style={estilos.flexivel}>
              <Text style={[TIPO.tituloBloco, { color: cores.tinta }]}>
                Falta avisada devolve a aula
              </Text>
              <Text
                style={[comEspaco(TIPO.textoBloco, { topo: 3 }), { color: cores.tinta2 }]}
              >
                {ligado
                  ? 'Dentro do prazo, o saldo não é debitado'
                  : 'A aula é debitada mesmo com aviso'}
              </Text>
            </View>
            <Switch ligado={ligado} aoAlternar={setLigado} rotulo="Falta avisada devolve a aula" />
          </View>
          <View style={[estilos.linhaControle, estilos.separada, { borderTopColor: cores.fio }]}>
            <View style={estilos.flexivel}>
              <Text style={[TIPO.tituloBloco, { color: cores.tinta }]}>
                Reposições por pacote
              </Text>
              <Text
                style={[comEspaco(TIPO.textoBloco, { topo: 3 }), { color: cores.tinta2 }]}
              >
                Depois do limite, a falta debita
              </Text>
            </View>
            <Stepper
              valor={limite}
              minimo={0}
              maximo={5}
              aoTrocar={setLimite}
              rotulo="Reposições por pacote"
              formatar={(v) => (v === 0 ? '—' : String(v))}
            />
          </View>
          <View style={[estilos.linhaControle, estilos.separada, { borderTopColor: cores.fio }]}>
            <Text style={[TIPO.tituloBloco, estilos.flexivel, { color: cores.tinta }]}>
              Switch desligado e desabilitado
            </Text>
            <Switch ligado={false} aoAlternar={() => {}} rotulo="Exemplo desabilitado" desabilitado />
          </View>
        </CartaoVidro>
      </Amostra>

      <Amostra rotulo="cartão de escolha · selecionado abre o sub-controle">
        <View style={estilos.colunaCurta}>
          <CartaoEscolha
            titulo="Aula realizada"
            subtitulo="Aconteceu como o combinado"
            valor="4 → 3"
            corDoValor={cores.vermelho}
            selecionado={escolha === 'realizada'}
            aoTocar={() => setEscolha('realizada')}
          />
          <CartaoEscolha
            titulo="Falta avisada"
            subtitulo={escolha === 'avisada' ? 'Avisou com 26h: dentro do prazo de 24h' : 'O aluno avisou antes'}
            valor="4 → 4"
            corDoValor={cores.verde}
            selecionado={escolha === 'avisada'}
            aoTocar={() => setEscolha('avisada')}
          >
            <Text
              style={[
                comEspaco(texto(11.5, 600, { tracking: 0.04, maiuscula: true }), { base: 10 }),
                { color: cores.tinta3 },
              ]}
            >
              Antecedência do aviso
            </Text>
            <Segmentado
              opcoes={[
                { valor: 48, rotulo: '48h' },
                { valor: 26, rotulo: '26h' },
                { valor: 10, rotulo: '10h' },
              ]}
              valor={aviso}
              aoTrocar={setAviso}
              porte="cartao"
              rotuloDoGrupo="Antecedência do aviso"
            />
            <Text
              style={[comEspaco(TIPO.textoBloco, { topo: 11 }), { color: cores.tinta2 }]}
            >
              {aviso >= 24
                ? 'Dentro do prazo: a aula volta para o saldo.'
                : 'Fora do prazo: a aula é debitada e gera reposição.'}
            </Text>
          </CartaoEscolha>
          <CartaoEscolha
            titulo="Sexta, 29/08"
            aoLado="17h"
            selo="melhor"
            subtitulo="Livre na sua agenda e o aluno já teve aula nesse horário"
            selecionado={escolha === 'janela'}
            aoTocar={() => setEscolha('janela')}
          />
          <CartaoEscolha
            titulo="Cancelei a aula"
            subtitulo="A ausência foi sua — reposição obrigatória, sem debitar o saldo do pacote"
            selecionado={false}
            aoTocar={() => {}}
            desabilitado
          />
        </View>
      </Amostra>
    </Secao>
  );
}

function SecaoListas() {
  const { cores } = useCores();
  return (
    <Secao titulo="Listas">
      <Amostra rotulo="linha de aluno · 76px, faixa e saldo">
        <ListaAgrupada>
          <LinhaAluno
            nome="Valentina Rocha"
            apoio="Violão · hoje, 17h"
            faixa={{ tipo: 'atraso', texto: 'Atraso de 12 dias' }}
            valor="2"
            unidade="aulas"
            corDoValor={cores.ambar}
            estadoDoAvatar="baixo"
            aoTocar={() => {}}
          />
          <LinhaAluno
            nome="Rafael Dornelas"
            apoio="Matemática · segunda, 19h"
            faixa={{ tipo: 'pendente', texto: 'Reposição pendente há 3 dias' }}
            valor="4"
            unidade="aulas"
            corDoValor={cores.tint}
            aoTocar={() => {}}
          />
          <LinhaAluno
            nome="Marina Alves"
            apoio="Inglês · quarta, 10h"
            faixa={{ tipo: 'marcada', texto: 'Reposição 30/08 · 10h' }}
            valor="8"
            unidade="aulas"
            corDoValor={cores.tint}
            aoTocar={() => {}}
          />
          <LinhaAluno
            nome={LONGO}
            apoio="Pacote encerrado em 12/07 · sem pacote ativo no momento"
            faixa={{ tipo: 'pausado', texto: 'Pausado até regularizar' }}
            valor="—"
            unidade="sem pacote"
            estadoDoAvatar="sem"
            corDoValor={cores.tinta3}
            aoTocar={() => {}}
          />
        </ListaAgrupada>
      </Amostra>

      <Amostra rotulo="linha de aluno · 68px no sheet, 66px na cobrança">
        <ListaAgrupada>
          <LinhaAluno
            porte="sheet"
            nome="Rafael Dornelas"
            apoio="Matemática · segunda, 19h"
            valor="4"
            unidade="aulas"
            caixaNoValor
            aoTocar={() => {}}
            chevron={false}
          />
          <LinhaAluno
            porte="cobranca"
            nome="Valentina Rocha"
            apoio="Venceu 16/08 · 12 dias"
            valor="R$ 10.000,00"
            corDoValor={cores.vermelho}
            estadoDoAvatar="atraso"
            aoTocar={() => {}}
          />
          <LinhaAluno
            porte="cobranca"
            nome="Marina Alves"
            apoio="Pago em 05/08 · Pix"
            valor="R$ 640"
            corDoValor={cores.verde}
            estadoDoAvatar="pago"
          />
        </ListaAgrupada>
      </Amostra>

      <Amostra rotulo="linha de ação e de ajuste · cabeçalho com contagem">
        <CabecalhoGrupo titulo="Em atraso" contagem="2 alunos" tom="atraso" />
        <View style={estilos.espaco9} />
        <ListaAgrupada>
          <LinhaLista
            titulo="Enviar lembrete de cobrança"
            subtitulo="Mensagem pronta com a chave Pix"
            aoTocar={() => {}}
          />
          <LinhaLista
            titulo="Registrar pagamento recebido"
            subtitulo="Se ele já pagou por fora"
            aoTocar={() => {}}
          />
          <LinhaLista
            porte="grande"
            titulo="Política de faltas"
            subtitulo="Aviso de 24h · devolve a aula · 2 reposições · 30 dias"
            aoTocar={() => {}}
          />
          <LinhaLista
            titulo="Aparência"
            direita={
              <Segmentado
                opcoes={[
                  { valor: 'claro', rotulo: 'Claro' },
                  { valor: 'escuro', rotulo: 'Escuro' },
                ]}
                valor="escuro"
                aoTrocar={() => {}}
                porte="linha"
                rotuloDoGrupo="Aparência"
              />
            }
          />
        </ListaAgrupada>
      </Amostra>

      <Amostra rotulo="extrato · delta com texto alternativo">
        <ListaAgrupada>
          <LinhaExtrato
            data="28/08"
            titulo="Aula realizada"
            subtitulo="Matemática · 19h"
            delta="−1"
            deltaEmPalavras="1 aula debitada"
            rodape="saldo 3"
            tom="debito"
          />
          <LinhaExtrato
            data="26/08"
            titulo="Falta avisada dentro do prazo"
            subtitulo="Avisou com 26h de antecedência, acima do mínimo de 24h"
            delta="0"
            deltaEmPalavras="sem efeito no saldo"
            rodape="saldo 4"
            tom="neutro"
          />
          <LinhaExtrato
            data="12/08"
            titulo="Pacote criado"
            subtitulo="8 aulas · validade 12/09"
            delta="+8"
            deltaEmPalavras="8 aulas adicionadas"
            rodape="saldo 8"
            tom="credito"
          />
          <LinhaExtrato
            data="05/08"
            titulo="Pagamento recebido"
            subtitulo="R$ 10.000,00 · Pix"
            delta="✓"
            deltaEmPalavras="pagamento recebido"
            rodape="recebido"
            tom="pagamento"
          />
        </ListaAgrupada>
      </Amostra>

      <Amostra rotulo="lista vazia">
        <ListaAgrupada>
          <EstadoVazio titulo="Nenhum lançamento ainda." nota="O extrato começa no primeiro registro." />
        </ListaAgrupada>
      </Amostra>
    </Secao>
  );
}

const AVATARES: { tamanho: TamanhoDeAvatar; estado: EstadoDoAvatar }[] = [
  { tamanho: 62, estado: 'normal' },
  { tamanho: 48, estado: 'perfil' },
  { tamanho: 44, estado: 'baixo' },
  { tamanho: 40, estado: 'sem' },
  { tamanho: 38, estado: 'atraso' },
  { tamanho: 38, estado: 'pago' },
];

function SecaoBlocos() {
  const { cores } = useCores();
  return (
    <Secao titulo="Blocos">
      <Amostra rotulo="cartão de saldo · medidor de pacote">
        <CartaoVidro>
          <View style={estilos.topoSaldo}>
            <View>
              <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>
                Saldo do pacote
              </Text>
              <View style={estilos.linhaSaldo}>
                <Text style={[TIPO.saldoCartao, { color: cores.ambar }]}>2</Text>
                <Text style={[texto(14, 600), { color: cores.tinta2 }]}>aulas</Text>
              </View>
            </View>
            <Text style={[texto(12, 500, { altura: 1.5 }), estilos.direita, { color: cores.tinta2 }]}>
              validade 12/09 · estendida{'\n'}1 de 2 reposições
            </Text>
          </View>
          <MedidorPacote total={8} usadas={6} baixo estilo={estilos.espacoMedidor} />
          <Text style={[comEspaco(texto(12.5, 500), { topo: 10 }), { color: cores.tinta2 }]}>
            6 de 8 usadas
          </Text>
        </CartaoVidro>
      </Amostra>

      <Amostra rotulo="blocos de status · fundo suave, texto na cor cheia">
        <View style={estilos.colunaCurta}>
          <BlocoStatus
            tom="vermelho"
            icone="alerta"
            titulo="Pagamento em atraso"
            texto="Venceu 16/08 · 12 dias. Toque para ver as saídas."
            chevron
            aoTocar={() => {}}
          />
          <BlocoStatus
            tom="verde"
            icone="checkBloco"
            titulo="Reposição confirmada"
            texto="Sexta, 29/08 às 17h"
          />
          <BlocoStatus
            tom="ambar"
            titulo="Reposição pendente"
            texto="Falta de 21/08 esperando horário há 3 dias."
            acao={{ rotulo: 'Ver horários', aoTocar: () => {} }}
          />
          <BlocoStatus
            titulo="Aulas pausadas"
            texto="Fora da lista de registro até o pagamento ser regularizado."
            acao={{ rotulo: 'Retomar as aulas', aoTocar: () => {} }}
          />
        </View>
      </Amostra>

      <Amostra rotulo="faixas de status · prioridade de cima para baixo">
        <View style={estilos.linhaBotoes}>
          <FaixaStatus tipo="pausado" texto="Pausado até regularizar" />
          <FaixaStatus tipo="atraso" texto="Atraso de 12 dias" />
          <FaixaStatus tipo="pendente" texto="Reposição pendente" />
          <FaixaStatus tipo="marcada" texto="Reposição 30/08 · 10h" />
        </View>
      </Amostra>

      <Amostra rotulo="avatares · 62 48 44 40 38">
        <CartaoVidro>
          <View style={estilos.linhaAvatares}>
            {AVATARES.map((a, i) => (
              <Avatar key={i} nome="Valentina Rocha" tamanho={a.tamanho} estado={a.estado} />
            ))}
          </View>
        </CartaoVidro>
      </Amostra>

      <Amostra rotulo="cartões de resumo · barra proporcional">
        <View style={estilos.linhaResumo}>
          <CartaoResumo rotulo="A receber" valor="R$ 1.280" tom="ambar" />
          <CartaoResumo rotulo="Recebido" valor="R$ 10.000" tom="verde" />
          <CartaoResumo rotulo="Em atraso" valor="R$ 0" zerado />
        </View>
        <View style={estilos.espaco9} />
        <CartaoVidro>
          <Text style={[TIPO.cabecalhoGrupo, { color: cores.tinta3 }]}>
            Aulas dadas em agosto
          </Text>
          <View style={estilos.topoSaldo}>
            <Text style={[comEspaco(texto(34, 800, { tracking: -0.045 }), { topo: 12 }), { color: cores.tinta }]}>
              38
            </Text>
            <Text style={[texto(12, 500, { altura: 1.5 }), estilos.direita, { color: cores.tinta2 }]}>
              4 reposições{'\n'}2 faltas debitadas
            </Text>
          </View>
          <BarraProporcional
            estilo={estilos.espacoBarra}
            segmentos={[
              { peso: 32, tom: 'tint', rotulo: '32 aulas' },
              { peso: 4, tom: 'ambar', rotulo: '4 reposições' },
              { peso: 2, tom: 'vermelho', rotulo: '2 faltas debitadas' },
            ]}
          />
        </CartaoVidro>
      </Amostra>
    </Secao>
  );
}

const BLOCOS: BlocoSemanal[] = [
  { dia: 'seg', faixa: 'noite' },
  { dia: 'ter', faixa: 'tarde' },
  { dia: 'qua', faixa: 'manha' },
  { dia: 'qua', faixa: 'noite' },
  { dia: 'sex', faixa: 'fimTarde' },
];

function SecaoDerivados() {
  const [nome, setNome] = useState('Valentina Rocha');
  const [email, setEmail] = useState('valentina');
  const [marcados, setMarcados] = useState<BlocoSemanal[]>(BLOCOS);

  const alternar = (b: BlocoSemanal) =>
    setMarcados((atual) =>
      atual.some((m) => m.dia === b.dia && m.faixa === b.faixa)
        ? atual.filter((m) => !(m.dia === b.dia && m.faixa === b.faixa))
        : [...atual, b],
    );

  return (
    <Secao titulo="Derivados">
      <Amostra rotulo="campo de texto · sem handoff">
        <CartaoVidro>
          <View style={estilos.colunaCampos}>
            <CampoDeTexto rotulo="Nome do aluno" valor={nome} aoMudar={setNome} />
            <CampoDeTexto
              rotulo="E-mail"
              valor={email}
              aoMudar={setEmail}
              teclado="email"
              placeholder="voce@exemplo.com"
              erro="Digite um e-mail válido."
            />
            <CampoDeTexto
              rotulo="Chave Pix"
              valor=""
              aoMudar={() => {}}
              placeholder="CPF, telefone ou chave aleatória"
              ajuda="Entra na mensagem de cobrança."
            />
            <CampoDeTexto
              rotulo="Observações"
              valor={MENSAGEM}
              aoMudar={() => {}}
              multilinha
            />
          </View>
        </CartaoVidro>
      </Amostra>

      <Amostra rotulo="grade semanal · sem handoff">
        <CartaoVidro>
          <GradeSemanal marcados={marcados} aoAlternar={alternar} />
          <RodapeDaGrade
            esquerda={`${marcados.length} blocos marcados`}
            direita="Toque para alternar"
          />
        </CartaoVidro>
      </Amostra>

      <Amostra rotulo="prévia de mensagem · sem handoff">
        <PreviaDeMensagem texto={MENSAGEM} destino="+55 51 9•••• 4182" />
      </Amostra>
    </Secao>
  );
}

const estilos = StyleSheet.create({
  flexivel: { flex: 1, minWidth: 0 },
  direita: { textAlign: 'right' },
  secao: { marginTop: 30 },
  amostra: { marginTop: 18 },
  coluna: { gap: 10 },
  colunaCampos: { gap: 16 },
  colunaCurta: { gap: 9 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, alignItems: 'center' },
  linhaIcones: { flexDirection: 'row', gap: 16, marginTop: 14, alignItems: 'center' },
  grelha: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  celulaIcone: { width: '25%', alignItems: 'center' },
  linhaControle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  separada: { marginTop: 14, paddingTop: 14, borderTopWidth: TAMANHO.bordaVidro },
  topoSaldo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  linhaSaldo: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 9 },
  espacoMedidor: { marginTop: 16 },
  espacoBarra: { marginTop: 15 },
  espaco9: { height: 9 },
  linhaAvatares: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  linhaResumo: { flexDirection: 'row', gap: 9 },
});
