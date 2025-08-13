# Checklist de Melhorias e Ajustes

Este arquivo deve ser atualizado a cada modificação relevante no projeto. Use como referência para revisões, pendências e histórico de melhorias.

## Para Fazer (Backlog Atual)

### Alta Prioridade

- [x] Comparação automática de baseline e regressões (gerar diff entre últimos snapshots em `docs/perf/` e destacar variações > X%)
- [x] Sanitização/validação de entradas da CLI (normalizar paths, validar números, rejeitar combinações inválidas cedo)
- [x] Revisar logs DEBUG e consolidar flag (`--dev` vs `ORACULO_DEBUG` => unificar em `--debug` mantendo retrocompatibilidade)
- [ ] Biblioteca de estruturas padrão (detecção + aconselhamento + auto-reorganização opcional)
  - Tipos alvo iniciais: `cli-modular`, `landing-page`, `api-rest-express`, `fullstack` (pages/api/prisma), `bot`, `electron`, `lib-tsc`, `monorepo-packages`
  - Taxonomia: definir contrato (nome, descrição, pastas esperadas, arquivos raiz permitidos, padrões proibidos, tolerâncias)
  - Motor de detecção: heurísticas por presença/ausência de pastas (`src/cli.ts`, `pages/`, `api/`, `prisma/`, `electron.js`, `bin/`, `packages/`, etc) + dependências declaradas (express, electron, commander)
  - Validação estrutural: listar arquivos "fora do lugar" (ex: componentes em raiz, scripts em `src/` indevidos, etc)
  - Ação de correção simulada: sugerir novo caminho e exibir plano (dry-run); flag futura `--reorganizar` para aplicar
  - Guard rails: nunca mover arquivos gerados / config / testes sem confirmação; gerar mapa reverso para evitar quebra de imports
  - Relatório dedicado: seção "estrutura-identificada" com tipo, confiança (%), anomalias e plano sugerido
  - Persistência: snapshot de estrutura detectada para comparar derivações futuras (baseline estrutural)
  - Testes: fixtures mini de cada tipo + casos híbridos (ex: api + landing) garantindo escolha mais específica / ou múltiplas etiquetas
  - Documentar em `docs/estruturas/README.md` (exemplos e critérios)

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
