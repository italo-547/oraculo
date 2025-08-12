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
- [ ] Documentar política de ignores do Guardian (guardian.md)
- [ ] Métricas internas opcionais (tempo por técnica, cache hits)
- [ ] Monitor de dependências (dependabot + script npm-check-updates) – workflow existe, falta documentar resultado automático
- [ ] Sanitização/validação de entradas da CLI
- [ ] Documentar contrato de saída para guardian (statuses)
- [ ] Agregação configurável de PARSE_ERRO na saída (limite por arquivo)
- [ ] Revisar logs DEBUG e consolidar flag
- [ ] Documentar estratégia de mocks de AST (centralização)
- [x] Licença final: MIT (sem restrições adicionais)
- [ ] Guia de padronização de código / convenções

## Feito

- [x] Estruturação da pasta `docs/` para centralizar documentação e relatórios
- [x] Refatoração do analista de funções longas para robustez em produção
- [x] Centralização de helpers de persistência em `src/zeladores/util/`
- [x] Atualização do `.github/copilot-instructions.md` para refletir padrões atuais
- [x] Gating de `process.exit` via `process.env.VITEST` nos testes
- [x] README atualizado com arquitetura modular e fluxo de desenvolvimento
- [x] RELATORIO.md atualizado (data 2025-08-12, 309 testes verdes + E2E ampliado)

---

Sempre consulte e atualize este checklist após cada mudança relevante.
