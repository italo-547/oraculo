# Checklist de Melhorias e Ajustes

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

Última atualização: 2025-09-06

Este arquivo deve ser atualizado a cada modificação relevante no projeto. Use como referência para revisões, pendências e histórico de melhorias.

## Revisão de scripts (2025-08-30)
## Detector de Estrutura — Notas de comportamento (2025-09-06)

- [x] Ordenação estável aplicada para listagem de entrypoints, garantindo mensagens determinísticas.
- [x] Suporte ampliado a Next.js: `temPages` considera `pages/` e `app/`; fullstack reconhece `api/` e `prisma/` como antes.
- [x] Quando houver muitos entrypoints, a mensagem passa a agregar por diretório (ex.: `src/apps (12), packages/pkg-a (8) … (+N dirs, +M entrypoints ocultos)`), reduzindo ruído sem perder sinal.


- [x] Em 2025-08-30 foi realizada uma revisão dos scripts em `scripts/` para reduzir duplicação e melhorar portabilidade.
  - Ação tomada: `scripts/scan-markdown.sh` foi migrado para `scripts/legacy/scan-markdown.sh` e a versão NodeJS cross-platform `scripts/scan-markdown.mjs` foi indicada como a preferida.
  - Recomendação: remover `scripts/legacy/scan-markdown.sh` após 30 dias se não houver uso detectado. Registrar reclamações/uso no histórico deste CHECKLIST antes da remoção.

### Conclusão adicional (2025-09-01)

- [x] Racionalização ampliada de scripts concluída.
  - Movidos para `scripts/legacy/` com wrappers de compatibilidade:
    - `scripts/convert-to-aliases.mjs` → wrapper; real em `scripts/legacy/convert-to-aliases.mjs`
    - `scripts/print-low-coverage.cjs` → wrapper; real em `scripts/legacy/print-low-coverage.cjs`
    - `scripts/test-supressao-parcial.mjs` → wrapper; real em `scripts/legacy/test-supressao-parcial.mjs`
  - Mantidos (referenciados por npm scripts/CI):
    - `run-tests-sequential.mjs`, `test-smart.mjs`, `scan-markdown.mjs`, `generate-notices.mjs`, `auditar-licencas.mjs`, `config-branch-protection.mjs`, `update-test-stats.mjs`, `coverage-priority.js`, `check-coverage-final.js`, `pre-public.mjs`, `add-disclaimer-md.js`, `verificar-disclaimer-md.js`, `add-spdx-headers.mjs`, `fix-test-imports.mjs`.
  - Remoções pendentes: avaliar eliminação dos wrappers legados acima após 30 dias (sem uso em CI/npm scripts) e registrar no CHANGELOG.

#### Utilitários adicionados (2025-09-01)

- [x] `md:fix-fences` para etiquetar cercas de código em Markdown automaticamente.
- [x] `security:secrets-history` para varrer histórico git por padrões de segredos com streaming (sem maxBuffer).

#### Sugestões registradas (2025-09-01)

- [ ] Considerar agendar `security:secrets-history` no CI (cron semanal) para sinalizar regressões no histórico.
- [ ] Avaliar ajuste opcional de `git config diff.renameLimit` local/CI para reduzir avisos durante o scan.
- [ ] Repetir `security:secrets-history` após merges grandes ou reescritas de histórico (ex.: squash/rebase amplos) e anotar o resultado.

#### Sugestões registradas (2025-09-06)

- [ ] Redução de ruído no orquestrador (saída não-JSON): avaliar colapso de ocorrências repetidas com contadores por mensagem/arquivo quando apropriado.
  - Requisitos: manter o shape JSON inalterado; realizar em PR separado; alinhar testes de CLI; documentar comportamento e, se necessário, oferecer flag de opt-in.
  - Status: postergado. Hoje o dedupe é usado para contagens e para a agregação de TODOs no JSON; a saída humana permanece não colapsada.

### Política de execução de testes no Windows (2025-09-01)

- [x] Definido `npm test` como runner "smart" que escolhe o runner sequencial por padrão no Windows.
- [x] `npm run test:sequential` permanece disponível e documentado como preferível para evitar timeouts RPC do Vitest.

## Estado Atual do Projeto (Agosto 2025)

### ✅ **Core Funcionalidades - COMPLETAS**

- [x] CLI funcional com múltiplos comandos (diagnosticar, guardian, podar, metricas, analistas)
- [x] Sistema de Analistas para detecção de padrões
- [x] Guardian para verificação de integridade via hashes
- [x] Sistema de Plugins extensível
- [x] Geração de Relatórios (JSON e Markdown)
- [x] Pipeline CI/CD completo com GitHub Actions
- [x] Cobertura de Testes com gate 100% (lines/statements/branches/functions)

### ✅ **Infraestrutura Técnica - ESTÁVEL**

- [x] Node.js >= 24.x | TypeScript | Vitest para testes
- [x] ESLint + Prettier | Husky para hooks de commit
- [x] Licença MIT aplicada
- [x] 5 workflows CI ativos e funcionais
- [x] Documentação detalhada em `docs/`

## Para Fazer (Backlog Atual)

### Alta Prioridade

### Segurança e Compliance (2025-09-01)

- [x] Scan histórico de segredos (últimos 800 commits) executado com resultado: 0 ocorrências. Comando: `npm run security:secrets-history`. Registrar nova execução após mudanças significativas.

## Observação franca — Próximo alvo: Guardian (Outubro / Novembro 2025)

- [ ] Próximo alvo de trabalho: melhorar o `guardian` (meta de esforço: Outubro–Novembro 2025).
  - Estado atual (franco): o Guardian entrega uma verificação de integridade básica e confiável para casos simples, mas é demasiado superficial para ambientes reais de produção/CI: tende a gerar falsos positivos por diferenças de EOL/BOM, não detecta renames (reporta como remoção+adição), usa um algoritmo de hash com fallback não determinístico em alguns runtimes e persiste apenas hashes sem metadata contextual.
  - Prioridade de melhorias (ordem sugerida):
    1. Normalização de conteúdo antes do hash (EOL, BOM, trims) e detecção de binários — reduz falsos positivos entre plataformas.
    2. Persistir snapshot detalhado (hash, linhas, tamanho, amostra) em baseline/registros para contexto humano e heurísticas de similaridade.
    3. Padronizar algoritmo de hash previsível (ex.: sha256 como fallback documentado; blake3 opcional quando disponível) e logar o algoritmo usado no baseline.
    4. Implementar detecção de renames/moves por similaridade (threshold configurável) para reduzir ruído em reorganizações.
    5. Melhorar saída JSON do Guardian (`--json`) com shape estável e campos ricos (detalhes por arquivo) para automações e CI.
    6. Adicionar testes cross-platform (Windows/Linux) simulando EOL/BOM e renames; adicionar testes de performance para arquivos grandes.
  - Resultado esperado: menos ruído em CI, diagnósticos mais úteis, baseline rastreável e aptidão para fluxos de produção. Planejar 2–3 PRs pequenos (primeiro: normalização + testes) e medir redução de falsos positivos em runs do CI.

- [x] Comparação automática de baseline e regressões (finalizado em 2025-08-10)
- [x] Sanitização/validação de entradas da CLI (finalizado em 2025-08-10)
- [x] Revisar logs DEBUG e consolidar flag (`--debug`) (finalizado em 2025-08-11)
- [x] Biblioteca de estruturas padrão (CONCLUÍDA em 2025-08-16)
  - [x] Tipos alvo iniciais definidos (finalizado em 2025-08-12)
  - [x] Taxonomia contratual implementada (finalizado em 2025-08-12)
  - [x] Motor heurístico de detecção implementado (finalizado em 2025-08-12)
  - [x] Relatório: seção `estruturaIdentificada` implementada (finalizado em 2025-08-12)
  - [x] Baseline estrutural + cálculo de drift (finalizado em 2025-08-12)
  - [x] Plano de reorganização inicial gerado automaticamente (finalizado em 2025-08-12)
  - [x] Documentação detalhada em `docs/estruturas/README.md` (finalizado em 2025-08-13)
  - [x] Testes de fixtures por arquétipo (finalizado em 2025-08-16)
  - [x] Comando `reestruturar` (dry-run + `--aplicar`) (finalizado em 2025-08-13)
  - [ ] Geração de mapa de reversão para moves aplicados (meta: finalizar até 2025-08-25)
  - [ ] Normalização de nomes de diretórios (case / plurais) opcional (meta: até 2025-08-30)
  - [ ] Regras adicionais (zona amarela) com opt-in (meta: até 2025-09-01)

- [x] Refatoração inicial de comando-diagnosticar.ts (primeira etapa finalizada em 2025-08-15)
- [x] Refatoração avançada (modularização de options e ações) (finalizada em 2025-08-20)
- [x] Cobertura de combinações de comandos e options (finalizado em 2025-08-19)

- [x] Guardian: silenciar logs de progresso quando `--json` (emitir apenas o JSON final e restaurar logger) (finalizado em 2025-08-18)
- [ ] Aplicar proteção da branch `main` (scripts prontos: `branch:protect` e `branch:protect:check` verificados)
  - [x] Documentar política e passos: `docs/branches/protecao-main.md` (finalizado em 2025-08-28)
  - [x] Script gh-cli para verificar/aplicar: `scripts/config-branch-protection.mjs` (finalizado em 2025-08-18)
  - [x] NPM scripts: `branch:protect` e `branch:protect:check` (finalizado em 2025-08-18)
  - [x] **Guia passo a passo criado**: `GUIA_PROTECAO_BRANCH_MAIN.md` (finalizado em 2025-08-28)
  - [ ] **AÇÃO NECESSÁRIA**: Aplicar no repositório (Settings → Branches) ou via script com contexts definidos (meta: 2025-08-25)
  - [ ] Validar com PR de teste (checks obrigatórios e bloqueios ativos) (meta: 2025-08-26)

- [x] Timeout por analista com cancelamento (Item 21) (finalizado em 2025-08-28)
- [x] Versão de schema nos relatórios JSON (Item 23) (meta: 2025-08-27) **CONCLUÍDO em 2025-08-28**
  - [x] Sistema de versionamento completo implementado (`src/nucleo/schema-versao.ts`)
  - [x] Relatórios JSON agora incluem metadados de versão (`_schema`)
  - [x] Validação automática de schema com compatibilidade backward
  - [x] Migração automática de relatórios legados
  - [x] Utilitários para leitura de relatórios versionados (`src/zeladores/util/leitor-relatorio.ts`)
  - [x] Testes completos (27 testes passando)
  - [x] Documentação técnica (`docs/features/schema-versao.md`)
  - [x] Integração com `gerador-relatorio.ts` e `relatorio-arquetipos.ts`
- [x] Pool de workers para paralelizar por arquivo (Item 15) (CONCLUÍDO em 2025-08-28)
  - [x] Classe WorkerPool completa com gerenciamento de workers paralelos
  - [x] Sistema de lotes configurável (batchSize padrão: 10 arquivos por worker)
  - [x] Timeout por analista individual (30s padrão) com cancelamento automático
  - [x] Fallback automático para processamento sequencial quando workers desabilitados
  - [x] Worker executor em JavaScript puro (worker-executor.js) para threads separadas
  - [x] Configuração centralizada (WORKER_POOL_ENABLED, WORKER_POOL_MAX_WORKERS, WORKER_POOL_BATCH_SIZE)
  - [x] Função de conveniência processarComWorkers() para fácil integração
  - [x] Tratamento robusto de erros com agregação de ocorrências por worker
  - [x] Estatísticas detalhadas do pool (workers ativos, erros, duração)
  - [x] Testes completos com 9 cenários cobrindo configuração, processamento sequencial e estatísticas
- [ ] Sandbox opcional para plugins externos (Item 9) (meta: 2025-09-05)

### Média Prioridade

- [ ] Monitor de dependências (documentação e automação)
- [x] Documentar estratégia de mocks de AST (finalizado em 2025-08-14)
- [ ] Guia de padronização de código / convenções
- [ ] Gate de regressão de performance opcional

- [ ] Reforço de tipagem discriminada de ocorrências (Item 10) (meta: 2025-09-03)
- [ ] Linter interno de analistas (verificação de testes mínimos) (Item 19) (meta: 2025-09-04)
- [ ] Priorização por git diff (Item 16) (meta: 2025-09-06)
- [ ] Snapshot/diff ampliado de relatórios (JSON/MD) (Item 18) (meta: 2025-09-07)

- [x] Compliance: automatizar auditoria de licenças no CI e validar headers SPDX (CONCLUÍDO em 2025-08-21)

### Baixa Prioridade / Futuro Próximo

- [ ] Export Markdown consolidado de performance
- [ ] Modo estrito de plugins
- [ ] Métrica de tempo por plugin estrutura
- [ ] Flag `--metricas-export <arquivo>` para salvar métricas isoladas
- [ ] Integração com ferramentas de análise externa (SonarQube, CodeClimate)
- [ ] Sistema de cache distribuído para análises em CI
- [ ] Suporte para monorepos complexos (workspaces)

- [ ] Flag para suprimir TODOs/limiar por arquivo (reduzir ruído em escopos amplos)

### Limitações conhecidas (registradas)

- [x] `--scan-only` + `--include` ignorava `node_modules` em alguns cenários. Harmonização implementada (finalizado em 2025-08-22)
  - Mitigação aplicada: detecção de inclusão explícita de `node_modules` via `--include` (padrões e grupos) e normalização de caminhos no Windows
- [x] Flakiness no Vitest quando existe `.oraculo/historico-metricas` no workspace de teste. Mitigação implementada (finalizado em 2025-08-18)

### Issue aberta: Revisões adicionais necessárias (Ação requerida)

Última verificação: 2025-08-29

Observações trazidas pelo time:

- Exclude padrão em conflito com `oraculo.config.json` (especialmente `INCLUDE_EXCLUDE_RULES.defaultExcludes`): há casos onde padrões default podem esconder arquivos de configuração ou causar falsos positivos/negativos em varreduras. Requer validação: garantir que `defaultExcludes` nunca remova arquivos de configuração críticos (ex.: `oraculo.config.json`) e que padrões sejam explicitamente documentados.

- Flags `--debug` e `--verbose` aparentam estar sendo ignoradas em alguns comandos (possível silenciamento por camadas de logger ou por modo `--json`). Requer investigação: traçar fluxo de resolução de flags até o logger central (`src/nucleo/constelacao/log`) e garantir que `--debug`/`--verbose` ajustem o nível de saída conforme esperado. Incluir testes que assertem alterações de nível e presença de mensagens esperadas.

- Cobertura de testes: suites localmente verdes, porém cobertura atual pode ser insuficiente para novos workflows CI (`.github/workflows/ci.yml`). Requer auditoria de thresholds usados no CI vs `COVERAGE_GATE_PERCENT` em `oraculo.config.json` e inclusão de micro-tests faltantes para ramos de `diagnosticar` e `scanner` que mudaram com a refatoração.

- Refatoração de `diagnosticar`: foi modularizada mas impacto prático parece pequeno; revisar as mudanças para garantir ganhos reais (testabilidade, redução de complexidade, perf). Se for apenas custo, considerar simplificar/reverter partes que não trouxeram benefício.

- Documentação: `README.md`, `docs/README.md` e `docs/CHECKLIST.md` requerem revisão para refletir o estado atual do projeto (muitos tópicos marcados como concluídos podem ser parcialmente implementados ou ter consequências operacionais não documentadas). Proposta: criar PR separado com "Documentação: alinhar docs ao estado atual" com checklist e responsáveis.

Ações recomendadas imediatas:

1. Confirmar e travar `INCLUDE_EXCLUDE_RULES.defaultExcludes` para proteger arquivos de configuração essenciais.
2. Adicionar testes que validem comportamento de `--debug`/`--verbose` em comandos críticos (diagnosticar, guardian, reestruturar).
3. Auditar thresholds de cobertura entre `oraculo.config.json` e workflows CI; alinhar e adicionar micro-tests faltantes.
4. Fazer PR de documentação contendo os pontos acima e atualizações de exemplos de uso (PowerShell/Windows).

### Observações

- Sempre registrar data de finalização ao marcar um item como concluído.
- Atualizar este arquivo após cada entrega relevante.
- Projeto atingiu maturidade funcional com infraestrutura sólida de desenvolvimento.

## Estado Atual do Projeto (2025-08-21)

### ✅ Componentes Principais Funcionais

- **CLI Completa**: 5 comandos principais (`diagnosticar`, `guardian`, `podar`, `metricas`, `analistas`)
- **Sistema de Análise**: Motor de analistas extensível com detecção de padrões
- **Guardian**: Verificação de integridade via hashes com baseline
- **Reestruturação**: Comando completo com dry-run e aplicação
- **Relatórios**: Saída JSON e Markdown estruturadas
- **CI/CD**: Pipeline completo com 5 workflows ativos
- **Testes**: Cobertura rigorosa (95% lines, 90% branches, 96% functions)

### 📊 Métricas de Qualidade (Última Medição)

- **Cobertura de Código (gate)**: 100% exigido globalmente; suites estão verdes, com lacunas mapeadas para novos micro-testes.
- **Suíte de Testes**: 245 arquivos de teste / 661 testes
- **Linting**: ESLint + Prettier configurados com hooks pre-commit
- **Compatibilidade**: Node.js ≥24.x, Windows/Linux/macOS validados

## Concluídos Recentes (Sessão 2025-08-18 a 2025-08-21)

- [x] Implementar flag `--scan-only` (finalizado em 2025-08-12)
- [x] Testes ponta-a-ponta CLI real – 5 cenários (finalizado em 2025-08-13)
- [x] Automação: lint/format no CI e gate de cobertura (finalizado em 2025-08-13)
- [x] Guia de criação de plugins (finalizado em 2025-08-14)
- [x] Baseline de performance inicial (finalizado em 2025-08-10)
- [x] Comando `perf compare` para regressões sintéticas (finalizado em 2025-08-10)
- [x] Flag `--full-scan` para incluir `node_modules` (finalizado em 2025-08-13)
- [x] Documentar política de ignores do Guardian (finalizado em 2025-08-14)
- [x] Saída JSON estruturada (finalizado em 2025-08-14)
- [x] Registro de contagem original vs agregada de PARSE_ERRO (finalizado em 2025-08-13)
- [x] Expor limites de agregação de PARSE_ERRO no README (finalizado em 2025-08-14)
- [x] Métricas internas opcionais exportáveis (finalizado em 2025-08-15)
- [x] Documentar contrato de saída para guardian (finalizado em 2025-08-15)
- [x] Licença final: MIT (finalizado em 2025-08-13)
- [x] Atualizar .gitignore para ignorar artefatos temporários (finalizado em 2025-08-14)

- [x] Documentação do detector de arquétipos e estratégia de testes (`docs/tests/detector-arquetipos.md`) (finalizado em 2025-08-16)
- [x] Ajuste: cobertura habilitada por env (`COVERAGE=true`) com thresholds preservados para CI/gate (finalizado em 2025-08-16)
- [x] Alinhamento de testes para Vitest (mocks/fixtures; remoção de mistura Jest/Vitest) (finalizado em 2025-08-16)

- [x] Sistema de pontuação adaptativa baseado no tamanho do projeto (finalizado em 2025-08-28)
- [x] Configuração centralizada de parâmetros de pontuação (finalizado em 2025-08-28)
- [x] Pesos de arquétipo mais realistas e resilientes (finalizado em 2025-08-28)
- [x] Sistema de confiança inteligente com ajustes contextuais (finalizado em 2025-08-28)

- [x] Documentar comandos e flags atuais no README (diagnosticar, guardian, podar, analistas, reestruturar, perf) (finalizado em 2025-08-18)
- [x] Atualizar notas de `--include`/`--exclude` e comportamento em `--json` no README (finalizado em 2025-08-18)
- [x] Compatibilidade Windows validada (exemplos PowerShell; scripts cross-env) (finalizado em 2025-08-18)

## Concluídos Recentes (Sessão 2025-08-22)

- [x] Harmonização completa de filtros: `--include`/`--exclude` controlam o escopo; analistas deixaram de impor limitação rígida a `src/` (2025-08-22)
- [x] `node_modules` passa a ser analisado quando incluído explicitamente, inclusive em `--scan-only` (2025-08-22)
- [x] Atualização de documentação (README principal, docs/README, docs/DECISOES-ABORDAGEM-SCAN-FILTROS.md, src/analistas/README.md) refletindo o novo comportamento (2025-08-22)

- [x] Estabilizar pre-commit no Windows (lint-staged + `.gitignore` ancorado; Prettier `--ignore-unknown`; evitar bloqueios por caminhos ignorados) (finalizado em 2025-08-18)

- [x] Gate de cobertura elevado para 100% global (finalizado em 2025-08-24)
  - Suites verdes; próximos passos incluem micro-testes para ramos residuais mapeados (scanner, inquisidor, guardian CLI) para manter 100% de forma sustentável.
- [x] Novos testes focados do scanner (include groups: AND/OR; guarda de `node_modules`; silêncio de logs; tratamento de root como arquivo) com normalização de paths no Windows (finalizado em 2025-08-18)
- [x] Ajustes no `scanner.ts` para derivação de raízes a partir de padrões e grupos e detecção explícita de `node_modules` (finalizado em 2025-08-18)
- [x] Testes de `relatorio-reestruturar` com persistência via helpers centralizados (`salvarEstado`) cobrindo Markdown/JSON (finalizado em 2025-08-18)
- [x] Guardian em modo `--json`: logs silenciados durante montagem e restauração do logger após emissão (validado em testes) (finalizado em 2025-08-18)

- [x] Elevação de limiares do gate de cobertura (aplicado em 2025-08-18)
  - Thresholds (aplicados quando `CI=true` ou `COVERAGE[_ENFORCE]=true`): lines 95, statements 95, functions 96, branches 90
  - Micro-teste adicional do scanner cobrindo fallback de prefixo para padrões com sufixo `/**` (`src/nucleo/scanner.fallback-suffix.test.ts`).

## Melhorias no Sistema de Pontuação do Detector de Arquétipos (2025-08-28)

- [x] **Sistema de Pontuação Adaptativa**: Implementação completa de constantes adaptativas baseadas no tamanho do projeto (finalizado em 2025-08-28)
  - Sistema de fatores escaláveis (1x a 5x) baseado em número de arquivos e diretórios
  - Configuração centralizada em `configuracao-pontuacao.ts` com 3 modos (padrão, conservador, permissivo)
  - Pesos de arquétipo recalibrados para maior realismo (fullstack: 1.4, api-rest-express: 1.3, monorepo: 1.5)
  - Sistema de confiança inteligente com ajustes contextuais (+5% frameworks, +3% TypeScript, +4% estrutura organizada)

- [x] **Documentação Técnica**: Criação de documentação faltante conforme CHECKLIST (finalizado em 2025-08-28)
  - `docs/tests/detector-arquetipos.md`: Estratégia completa de testes e configuração
  - `docs/branches/protecao-main.md`: Política detalhada de proteção da branch main
  - Scripts NPM verificados: `branch:protect` e `branch:protect:check` funcionais

## Correção Crítica: Exclusão Padrão de node_modules (2025-08-28)

- [x] **Problema identificado**: Comando `diagnosticar` sem filtros explícitos estava escaneando `node_modules` apesar das proteções padrão (2025-08-28)
- [x] **Causa raiz**: Quando não havia `--include` nem `--exclude` especificados, `config.CLI_EXCLUDE_PATTERNS` ficava vazio, fazendo com que apenas a proteção específica de diretórios `node_modules` funcionasse, mas não para arquivos individuais dentro do diretório (2025-08-28)
- [x] **Solução implementada**: Modificar `comando-diagnosticar.ts` para aplicar padrões de exclusão padrão quando nenhum filtro explícito é fornecido, incluindo `node_modules/**`, `dist/**`, `coverage/**`, etc. (2025-08-28)
- [x] **Resultado**: Redução de ~70% nos arquivos escaneados (2111 → 633 arquivos), mantendo compatibilidade com filtros explícitos (2025-08-28)
- [x] **Validação**: Testes confirmaram que filtros explícitos continuam funcionando corretamente (78 arquivos com `--include "src/**" --exclude "node_modules/**"`) (2025-08-28)

## Roadmap Próximos 30 Dias (2025-08-21 a 2025-09-20)

### Semana 1 (21-27 Ago)

- [x] Aplicar proteção da branch `main` (documentação completa criada - aguardando aplicação)
- [x] Geração de mapa de reversão para moves aplicados (implementado e documentado)
- [ ] Monitor de dependências (documentação inicial)

### Semana 2 (28 Ago - 3 Set)

- [ ] Normalização de nomes de diretórios
- [ ] Guia de padronização de código
- [ ] Export Markdown consolidado de performance

### Semana 3-4 (4-20 Set)

- [ ] Regras adicionais (zona amarela) com opt-in
- [ ] Gate de regressão de performance opcional
- [ ] Modo estrito de plugins

---

Sempre consulte e atualize este checklist após cada mudança relevante.

## Nota: Gate de Cobertura (protegendo contra regressões silenciosas)

O Oráculo possui um gate de cobertura que impede regressões de teste em CI. Para evitar alterações silenciosas nos thresholds, o limiar do gate agora pode ser persistido no arquivo `oraculo.config.json` do projeto.

Como o threshold é resolvido (ordem de precedência):

1. Variável de ambiente `COVERAGE_GATE_PERCENT` (maior prioridade)
2. Campo `COVERAGE_GATE_PERCENT` no `oraculo.config.json`, ou `TESTING.COVERAGE_GATE_PERCENT` (namespace opcional)
3. Fallback para 85% definido no plugin/script

Recomendações:

- Mantenha o limiar do gate no repositório (via `oraculo.config.json`) para garantir reprodutibilidade entre runs do CI.
- Use a variável de ambiente para flutuações temporárias (por exemplo, experimentos locais no pipeline), mas evite commitar alterações reduzindo o threshold sem revisão.
- Atualize este CHECKLIST quando houver alterações deliberadas no threshold.

## Notas rápidas: preview-oraculo & configuração de projeto

- O script `npm run pre-public` gera `preview-oraculo/` com o build (`dist/`), documentação (`docs/`) e arquivos de configuração de exemplo.
- `preview-oraculo/` inclui `oraculo.config.json` e `oraculo.config.exemplo.json` por padrão para facilitar revisão. Se você tiver alterações locais no `oraculo.config.json`, regenere o preview após salvar.
- Ordem de prioridade para o threshold de cobertura (resumido):
  1. Variável de ambiente `COVERAGE_GATE_PERCENT`
  2. `COVERAGE_GATE_PERCENT` em `oraculo.config.json` ou `TESTING.COVERAGE_GATE_PERCENT`
  3. Fallback 85% definido no script

Anote mudanças significativas no `oraculo.config.json` no histórico deste CHECKLIST para rastreabilidade.
