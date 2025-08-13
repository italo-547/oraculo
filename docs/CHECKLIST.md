# Checklist de Melhorias e Ajustes

Este arquivo deve ser atualizado a cada modificação relevante no projeto. Use como referência para revisões, pendências e histórico de melhorias.

## Para Fazer

- [x] Implementar flag `--scan-only`
- [x] Testes ponta-a-ponta executando binário buildado (CLI real) – 5 cenários
- [x] Automação: adicionar lint/format ao CI e gate de cobertura
- [ ] Guia de criação de plugins (exemplos práticos)
- [x] Baseline de performance inicial (script `perf:baseline`)
- [ ] Comparação automática de baseline e regressões
- [x] Flag `--full-scan` para incluir `node_modules` controladamente (stress test) (baseline bloqueado)
- [x] Documentar política de ignores do Guardian (guardian.md)
- [x] Saída JSON estruturada (`diagnosticar --json`, `guardian --json`)
- [x] Registro de contagem original vs agregada de PARSE_ERRO
- [ ] Expor limites de agregação de PARSE_ERRO no README
- [ ] Métricas internas opcionais (tempo por técnica, cache hits) exportáveis
- [ ] Monitor de dependências (dependabot + script npm-check-updates) – documentar execução automática
- [ ] Sanitização/validação de entradas da CLI
- [x] Documentar contrato de saída para guardian (statuses) no README
- [ ] Revisar logs DEBUG e consolidar flag
- [ ] Documentar estratégia de mocks de AST (centralização)
- [x] Licença final: MIT (sem restrições adicionais)
- [ ] Guia de padronização de código / convenções
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

---

Sempre consulte e atualize este checklist após cada mudança relevante.
