# Checklist de Melhorias e Ajustes

Este arquivo deve ser atualizado a cada modificação relevante no projeto. Use como referência para revisões, pendências e histórico de melhorias.

## Para Fazer (Backlog Atual)

### Alta Prioridade

- [x] Comparação automática de baseline e regressões (gerar diff entre últimos snapshots em `docs/perf/` e destacar variações > X%)
- [x] Sanitização/validação de entradas da CLI (normalizar paths, validar números, rejeitar combinações inválidas cedo)
- [x] Revisar logs DEBUG e consolidar flag (`--dev` vs `ORACULO_DEBUG` => unificar em `--debug` mantendo retrocompatibilidade)
- [ ] Biblioteca de estruturas padrão (detecção + aconselhamento + auto-reorganização opcional)
  - [x] Tipos alvo iniciais definidos (`cli-modular`, `landing-page`, `api-rest-express`, `fullstack`, `bot`, `electron`, `lib-tsc`, `monorepo-packages`)
  - [x] Taxonomia contratual (nome, descrição, pastas, rootFilesAllowed, forbidden, hints) implementada
  - [x] Motor heurístico de detecção (pastas + dependências + padrões de arquivo)
  - [x] Relatório: seção `estruturaIdentificada` com baseline + drift + melhores candidatos
  - [x] Baseline estrutural + cálculo de drift
  - [x] Plano de reorganização inicial (zona verde) gerado automaticamente (`planoSugestao`) – somente sugestões
  - [x] Documentação detalhada em `docs/estruturas/README.md`
  - [ ] Testes de fixtures por arquétipo (casos híbridos & conflito de confiança)
  - [ ] Comando `reestruturar` (dry-run + `--aplicar`)
  - [ ] Geração de mapa de reversão para moves aplicados
  - [ ] Normalização de nomes de diretórios (case / plurais) opcional
  - [ ] Regras adicionais (zona amarela) com opt-in

### Média Prioridade

- [ ] Monitor de dependências: documentar fluxo automatizado + workflow agendado (usar `npm outdated` + `npm audit` não-blocking)
- [ ] Documentar estratégia de mocks de AST (arquivo guia em `docs/tests/AST_MOCKS.md` centralizando padrões)
- [ ] Guia de padronização de código / convenções (estilo, naming, estrutura de analistas, limites de complexidade)
- [ ] Gate de regressão de performance opcional (falhar CI se parsing/análise > +30% vs baseline referência) <!-- próximo passo: integrar comando perf compare no CI -->

### Baixa Prioridade / Futuro Próximo

- [ ] Export Markdown consolidado de performance (comparando N snapshots)
- [ ] Modo estrito de plugins (falha em qualquer plugin com erro)
- [ ] Métrica de tempo por plugin estrutura (detectar outliers)
- [ ] Flag `--metricas-export <arquivo>` para salvar métricas isoladas sem relatório completo

### Observações

- Limites de PARSE_ERRO já expostos; considerar parametrize via flag futura (`--parse-erros-max=<n>`)
- Métricas internas disponíveis em `diagnosticar --json` (`metricas`) e histórico via `oraculo metricas`
- O catálogo `docs/ANALISTAS.md` deve ser gerado via comando: `oraculo analistas --doc docs/ANALISTAS.md`

## Concluídos Recentes (Sessão Atual)

- [x] Implementar flag `--scan-only`
- [x] Testes ponta-a-ponta executando binário buildado (CLI real) – 5 cenários
- [x] Automação: adicionar lint/format ao CI e gate de cobertura
- [x] Guia de criação de plugins (exemplos práticos) (`docs/plugins/GUIA.md` com exemplo analista + plugin estrutura)
- [x] Baseline de performance inicial (script `perf:baseline`)
- [x] Comando `perf compare` para regressões sintéticas
- [x] Flag `--full-scan` para incluir `node_modules` controladamente (baseline bloqueado)
- [x] Documentar política de ignores do Guardian (guardian.md)
- [x] Saída JSON estruturada (`diagnosticar --json`, `guardian --json`)
- [x] Registro de contagem original vs agregada de PARSE_ERRO
- [x] Expor limites de agregação de PARSE_ERRO no README
- [x] Métricas internas opcionais exportáveis (campo `metricas` + comando `metricas`)
- [x] Documentar contrato de saída para guardian (statuses) no README
- [x] Licença final: MIT (sem restrições adicionais)
- [x] Atualizar .gitignore para ignorar artefatos temporários (.oraculo, hist-\*.json, reports)
- [x] Detecção de arquétipos inicial (heurística + baseline + drift JSON)
- [x] Ampliação whitelist de arquivos raiz para reduzir falso-positivo de anomalias
- [x] Limite de exibição de anomalias (máx 8 detalhadas em verbose)
- [x] Suporte parsing leve multi-linguagem (kotlin, java, xml, html, css, gradle) com AST compat mínimo
- [x] Inclusão de campo `drift` na saída JSON de `diagnosticar`
- [x] Inclusão de campo `linguagens` (resumo extensões) na saída JSON de `diagnosticar`
- [x] Escape unicode em saída `--json` para evitar artefatos em consoles Windows
- [x] Documentação de arquétipos + regras reorganização (docs/estruturas/README.md)
- [x] Plano de reorganização (zona verde) em `detector-arquetipos` + inclusão no JSON
- [x] Refatoração para remover números mágicos (constantes de pesos & regex centralizadas)
- [x] Skip de geração de plano em modo `--scan-only`
- [x] UX de logs: molduras com formatador ANSI-aware e impressão direta (sem prefixos); fallback ASCII via `ORACULO_ASCII_FRAMES=1` documentado
- [x] Resumo em tabela com moldura no final do diagnóstico (tipos de problemas x quantidade)
- [x] Normalização de filtros `--include/--exclude` com precedência (include sobrepõe ignores, inclusive `node_modules` quando explicitado)
- [x] Comando `analistas` adicionado (listar, `--json`, `--output`, `--doc`) e catálogo gerado em `docs/ANALISTAS.md`
- [x] Flag `diagnosticar --listar-analistas` (uso opcional) para depuração rápida do registro
- [x] Documentação sincronizada: correções de nomes em `docs/relatorios/RELATORIO.md` e atualização do README raiz com o comando `analistas`
- [x] Agregação de `TODO_PENDENTE` por arquivo no resumo para reduzir ruído (mensagem consolidada)

## Refinamentos de Qualidade (Novos)

- [x] Extrair lógica de geração de plano para módulo dedicado (`src/analistas/plano-reorganizacao.ts`)
- [x] Adicionar limite configurável para tamanho de arquivo nos moves (default 256KB) via config (`ESTRUTURA_PLANO_MAX_FILE_SIZE`)
- [x] Exibir resumo de plano em modo não-JSON (top 3 moves + contagem)
- [x] Integrar comando `reestruturar` ao `planoSugestao` (flags `--somente-plano`, `--auto`/`--aplicar`)
- [ ] Validar colisões de extensão (ex: mover `.test.ts` mantendo subpastas futuras)
- [ ] Testar cenário sem candidatos (plano vazio) garantindo ausência de campos supérfluos
- [ ] Flag experimental para mostrar diff simulado de imports quebrados
- [ ] Geração de mapa de rollback para moves aplicados (persistir JSON)

## Feito

- [x] Estruturação da pasta `docs/` para centralizar documentação e relatórios
- [x] Refatoração do analista de funções longas para robustez em produção
- [x] Centralização de helpers de persistência em `src/zeladores/util/`
- [x] Atualização do `.github/copilot-instructions.md` para refletir padrões atuais
- [x] Gating de `process.exit` via `process.env.VITEST` nos testes
- [x] README atualizado com arquitetura modular e fluxo de desenvolvimento
- [x] RELATORIO.md atualizado (data 2025-08-12, 309 testes verdes + E2E ampliado)
- [x] guardian.md criado e referenciado no README
- [x] Remoção de docs redundantes (ROADMAP_ITERACOES.md, SUGESTOES-PRIORITARIAS.md, JSDOC.md raiz)
- [x] Flags `--json` e `--full-scan` implementadas e testadas
- [x] Agregação de PARSE_ERRO (contagem original rastreada)
- [x] Exposição de métricas em `diagnosticar --json` (campo `metricas`)

---

Sempre consulte e atualize este checklist após cada mudança relevante.
