# Checklist de Melhorias e Ajustes

Este arquivo deve ser atualizado a cada modificação relevante no projeto. Use como referência para revisões, pendências e histórico de melhorias.

## Para Fazer

- [ ] Implementar flag `--scan-only`
- [ ] Testes ponta-a-ponta executando binário buildado (CLI real)
- [ ] Guia de criação de plugins (exemplos práticos)
- [ ] Baseline de performance (scan + AST parse) e relatório comparativo
- [ ] Métricas internas opcionais (tempo por técnica, cache hits)
- [ ] Automação: adicionar lint/format ao CI e gate de cobertura
- [ ] Monitor de dependências (dependabot + script npm-check-updates)
- [ ] Sanitização/validação de entradas da CLI
- [ ] Documentar contrato de saída para guardian (statuses)
- [ ] Revisar logs DEBUG e consolidar flag
- [ ] Documentar estratégia de mocks de AST (centralização)

## Feito

- [x] Estruturação da pasta `docs/` para centralizar documentação e relatórios
- [x] Refatoração do analista de funções longas para robustez em produção
- [x] Centralização de helpers de persistência em `src/zeladores/util/`
- [x] Atualização do `.github/copilot-instructions.md` para refletir padrões atuais
- [x] Gating de `process.exit` via `process.env.VITEST` nos testes
- [x] README atualizado com arquitetura modular e fluxo de desenvolvimento
- [x] RELATORIO.md atualizado (data 2025-08-12, 304 testes verdes)

---

Sempre consulte e atualize este checklist após cada mudança relevante.
