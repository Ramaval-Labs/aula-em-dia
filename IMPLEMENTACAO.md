# Plano de implementação

> **HISTÓRICO — não siga este arquivo.**
>
> Este plano descreve a direção visual **aposentada** (*tinta chapada*: cabeçalho escuro com
> curva, amarelo `#FFD032`, chips de filtro, barra amarela no toast) e cita a chave de
> persistência `aulaemdia.app.v3`, que hoje é `v4`. As seis fases abaixo foram concluídas — e
> depois **substituídas** pelo redesign iOS Glass, que reescreveu as 35 telas.
>
> Seguir este arquivo é reconstruir o que foi jogado fora. O teste
> `mobile/src/tema/__tests__/legado.test.ts` barra o amarelo e as curvas de voltar.
>
> A especificação vigente é [`handoff-ios-glass/README.md`](handoff-ios-glass/README.md), as
> regras estão em [`CLAUDE.md`](CLAUDE.md) (em especial a regra 5) e o que vem depois está em
> [`PROXIMOS-PASSOS.md`](PROXIMOS-PASSOS.md). Mantido só como registro do caminho percorrido.

Seis fases. Cada uma entrega algo verificável.

> **Status: as seis fases estão concluídas** em `mobile/` (React Native + Expo, TypeScript).
> Ver `mobile/README.md`. O que vem depois está em `PROXIMOS-PASSOS.md`.

## Fase 1 — Fundação
- [x] Escolher/confirmar stack e criar a estrutura de rotas ou telas
- [x] Instalar a fonte Satoshi (self-host) — instâncias 400/500/600/700/800, que são os
      pesos usados pelo design; fatiadas do arquivo variável da Fontshare
- [x] Importar os tokens de `tokens/` no formato da stack (CSS vars, tema, ou config)
- [x] Implementar os dois temas (claro / noturno) com troca em runtime e persistência
- [x] Configurar `tabular-nums` global para números e formatação de moeda pt-BR

## Fase 2 — Regras de negócio (antes da UI)
- [x] Portar `spec/politica.ts` como módulo puro, sem dependência de UI
- [x] Modelar os tipos de `data/seed.json` (Aluno, Pagamento, Pendencia, Lancamento, Politicas)
- [x] Escrever os testes de `spec/casos-de-teste.md` — todos verdes antes de seguir
- [x] Camada de persistência (chave `aulaemdia.app.v3`) com migração por versão de chave

## Fase 3 — Chassi visual
- [x] Componente de cabeçalho escuro com a curva inferior (`assets/curva-cabecalho.svg`)
- [x] Faixa de curva de 58px acima da navbar (`assets/curva-navbar.svg`) — ocupa espaço, não overlay
- [x] Navbar de 3 abas com pílula de vidro, expansão da aba ativa e transição `.22s ease`
- [x] Container de tela: cabeçalho fixo, conteúdo com scroll, rodapé de ação
- [x] Toast (3600ms, barra amarela à esquerda)

## Fase 4 — Aba Alunos
- [x] Lista com chips de filtro (Urgência / A–Z / Hoje) e ordenação por peso
- [x] Cartão de aluno: saldo, pontos do pacote, faixa de status por precedência, variante sem pacote
- [x] Detalhe do aluno: cabeçalho, contextos condicionais, extrato, ação primária
- [x] Registrar aula: 4 desfechos, slider de antecedência, prévia do efeito ao vivo
- [x] Resultado e escolha de janela de reposição (com a janela extra da validade estendida)

## Fase 5 — Financeiro e Ajustes
- [x] Financeiro: três totais (A receber / Recebido / Em atraso) e lista por situação
- [x] Aluno em atraso: contexto da dívida e as 4 ações (receber, lembrar, pausar, estender)
- [x] Ajustes: perfil, tema, entrada para política, zerar estado
- [x] Política de faltas: rascunho, diff, salvar/descartar — refletindo no cálculo do registro

## Fase 6 — Acabamento
- [x] Estados vazios, desabilitados e de carregamento
- [x] Acessibilidade conforme `spec/acessibilidade.md`
- [~] Barra de rolagem: o React Native não expõe largura nem cor do indicador. Usamos
      `indicatorStyle` claro/escuro conforme o tema — é o que a plataforma permite.
- [x] Revisão lado a lado com o protótipo aberto no navegador
- [~] Data fixa `28/08` centralizada em `mobile/src/dominio/datas.ts`, com contas de dias
      reais e chave `USAR_DATA_REAL` para virar a data do aparelho. **Continua em 28/08 por
      padrão**: toda a semente (validades, dias de atraso, janelas) foi escrita nessa data.
      Virar a chave exige revisar `data/seed.json` — decisão do time.

## Decisões que exigem confirmação do time
- Backend e sincronização (o protótipo é local-only)
- Envio real de mensagem ao aluno (hoje só simula)
- Calendário real para sugerir janelas de reposição (hoje as janelas são fixas)
- Licença da fonte Satoshi para app publicado
