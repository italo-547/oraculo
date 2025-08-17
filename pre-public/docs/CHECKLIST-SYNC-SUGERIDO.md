> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Checklist de Sincronização – Oráculo

Use este checklist para comparar com o `docs/CHECKLIST.md` atual e garantir alinhamento.

## Persistência e IO

- [ ] Helpers centralizados: uso exclusivo de `lerEstado`/`salvarEstado` para JSON/relatórios/snapshots.
- [ ] Escrita atômica e permissões restritivas documentadas.
- [ ] Leituras com valor padrão explícito e limite de tamanho.

## Saída JSON e Logs

- [ ] Escapes Unicode (inclui pares substitutos) em `--json`.
- [ ] Logger silenciado durante montagem de JSON e restaurado após impressão.

## Guardian

- [ ] Quando não executado, status `"nao-verificado"` com shape estável.

## Agregação de PARSE_ERRO

- [ ] Limite por arquivo configurável e contagem total preservada em campo interno.
- [ ] Casos de teste cobrindo limites e contagem preservada.

## Testes

- [ ] Limiares: linhas/decl/funções 90%, ramos 88%+.
- [ ] Fixtures por arquétipo em `tests/fixtures/estruturas/` (inclui híbridos/conflito).
- [ ] Combinações de comandos/options cobertas (scan-only, full-scan, json, verbose, compacto).
- [ ] Durante Vitest, `process.env.VITEST` bloqueia `process.exit`.

## CLI/Modularização

- [ ] Options do diagnosticar em `src/cli/options-diagnosticar.ts`.
- [ ] Fases do comando moduladas.

## Documentação

- [ ] Aviso de “Proveniência e Autoria” presente nos .md principais.
- [ ] Política referenciada: `docs/POLICY-PROVENIENCIA.md`.
- [ ] Documentos únicos: CHECKLIST (fonte única de verdade), guardian, camadas de teste, perf.

## Fluxos/Release

- [ ] Branch padrão: develop; main protegida com PR + checks.
- [ ] Pré-visualização com `npm run pre-public`; release draft via workflow.

Última revisão sugerida: 2025-08-17
