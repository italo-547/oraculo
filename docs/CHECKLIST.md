# Checklist de Melhorias e Ajustes

**Última atualização: 2025-08-16**

Este arquivo deve ser atualizado a cada modificação relevante no projeto. Use como referência para revisões, pendências e histórico de melhorias.

## Para Fazer (Backlog Atual)

### Alta Prioridade

- [x] Comparação automática de baseline e regressões (finalizado em 2025-08-10)
- [x] Sanitização/validação de entradas da CLI (finalizado em 2025-08-10)
- [x] Revisar logs DEBUG e consolidar flag (`--debug`) (finalizado em 2025-08-11)
- [ ] Biblioteca de estruturas padrão
  - [x] Tipos alvo iniciais definidos (finalizado em 2025-08-12)
  - [x] Taxonomia contratual implementada (finalizado em 2025-08-12)
  - [x] Motor heurístico de detecção implementado (finalizado em 2025-08-12)
  - [x] Relatório: seção `estruturaIdentificada` implementada (finalizado em 2025-08-12)
  - [x] Baseline estrutural + cálculo de drift (finalizado em 2025-08-12)
  - [x] Plano de reorganização inicial gerado automaticamente (finalizado em 2025-08-12)
  - [x] Documentação detalhada em `docs/estruturas/README.md` (finalizado em 2025-08-13)
  - [x] Testes de fixtures por arquétipo (finalizado em 2025-08-16)
  - [x] Comando `reestruturar` (dry-run + `--aplicar`) (finalizado em 2025-08-13)
  - [ ] Geração de mapa de reversão para moves aplicados (meta: finalizar até 2025-08-20)
  - [ ] Normalização de nomes de diretórios (case / plurais) opcional (meta: até 2025-08-22)
  - [ ] Regras adicionais (zona amarela) com opt-in (meta: até 2025-08-25)
- [x] Refatoração inicial de comando-diagnosticar.ts (primeira etapa finalizada em 2025-08-15)
- [ ] Refatoração avançada (modularização de options e ações) (em andamento, meta: 2025-08-20)
- [ ] Cobertura de combinações de comandos e options (em andamento, meta: finalizar testes principais até 2025-08-20)

### Média Prioridade

- [ ] Monitor de dependências (documentação e automação)
- [x] Documentar estratégia de mocks de AST (finalizado em 2025-08-14)
- [ ] Guia de padronização de código / convenções
- [ ] Gate de regressão de performance opcional

### Baixa Prioridade / Futuro Próximo

- [ ] Export Markdown consolidado de performance
- [ ] Modo estrito de plugins
- [ ] Métrica de tempo por plugin estrutura
- [ ] Flag `--metricas-export <arquivo>` para salvar métricas isoladas

### Observações

- Sempre registrar data de finalização ao marcar um item como concluído.
- Atualizar este arquivo após cada entrega relevante.

## Concluídos Recentes (Sessão Atual)

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

### Notas de Lint (Mapa para futura implementação)

- Mantidos 3 avisos em `src/analistas/detector-arquetipos.ts` como marcadores de melhoria futura:
  - `ARQUETIPOS` declarado e não usado (linha 1)
  - `scoreArquetipo` declarado e não usado (linha 22)
  - `isHibridoParcial` atribuído e não utilizado (linha 88)
    Esses avisos servirão como guia para evolução do detector (integração total com orquestrador e uso ampliado do scorer/híbridos).

---

Sempre consulte e atualize este checklist após cada mudança relevante.
