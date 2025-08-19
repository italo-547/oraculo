> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Tooling & Transparência

Este documento centraliza as ferramentas, políticas de qualidade e práticas de transparência do projeto.

## Stack Principal

| Área           | Ferramenta / Política                                  | Notas                                                                                                |
| -------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Build          | TypeScript (ESM puro)                                  | `tsconfig.json` com aliases `@nucleo/*`, etc.                                                        |
| Testes         | Vitest + V8 Coverage                                   | Gate mínimo: Statements/Lines 95%, Branches 90%, Functions 96%                                       |
| Lint / Estilo  | ESLint + Prettier                                      | Executados em pre-commit via `lint-staged`; `npm run lint` cobre `src/`, `tests/` e `temp-fantasma/` |
| Formatação     | Prettier (sem remoção de comentários)                  | Intocado para preservar contexto em relatórios                                                       |
| Integração CI  | GitHub Actions (`ci.yml`, `build.yml`, `monitor-deps`) | Badge de testes e monitoramento de deps no README                                                    |
| Dependências   | Dependabot + (manual) `npm-check-updates`              | Guia: `docs/MONITOR_DEPENDENCIAS.md`                                                                 |
| Segurança leve | Ignore patterns Guardian + sanitização de paths        | Ver `docs/guardian.md`                                                                               |
| Performance    | Scripts `perf:baseline` (snapshot sintético)           | Evolução futura para gate regressão                                                                  |
| Persistência   | Helpers `lerEstado` / `salvarEstado` centralizados     | Proibido usar `fs.readFile` direto fora deles                                                        |

## Política de Cobertura

Gate aplicado via `npm run coverage:enforce` (CI define `CI=true`). Altere limiares apenas quando a cobertura efetiva estabilizar consistentemente ≥ (limiar + 0.5%). Novas exclusões só são aceitas se o arquivo não carregar lógica de produção (ex.: fixtures ou scripts auxiliares). Para rodar local com gate: `COVERAGE_ENFORCE=true npm run coverage`.

## Logs e JSON Contracts

Saídas `--json` (ex: `diagnosticar`, `guardian`) são projetadas para consumo por CI/pipelines: sem timestamps ruidosos, caracteres fora de ASCII são escapados (`\uXXXX`) para evitar problemas em consoles Windows legados.

## Guardian

Contrato de saída documentado em `docs/guardian.md`. Mensagens redundantes suprimidas quando comandos compostos invocam o Guardian internamente (ex: `diagnosticar --json`).

## Estruturas / Arquétipos

Heurísticas, baseline estrutural e `planoSugestao` descritos em `docs/estruturas/README.md`.

## Performance

Snapshots gerados em `docs/perf/` (um por execução manual). Próximos passos: comparação automática + gate de regressão.

## Transparência sobre Uso de IA

O desenvolvimento contou com assistência pontual de ferramentas como GitHub Copilot para acelerar geração de testes, refactors de logs e esqueleto de documentação. Cada alteração assistida foi revisada manualmente para garantir precisão, legibilidade e aderência às políticas de qualidade. Contribuidores futuros devem igualmente revisar sugestões de IA antes do commit.

## Fluxo de Contribuição Resumido

1. Criar/alterar código seguindo aliases e helpers de persistência.
2. Adicionar/atualizar testes (unidade + integração quando aplicável).
3. Rodar checagens locais:
   - Lint: `npm run lint` (cobre src/tests/temp-fantasma)
   - Typecheck: `npm run typecheck`
   - Prettier (check): `npm run format`
   - Prettier (fix): `npm run format:fix`
4. Se afetar contratos JSON, atualizar docs relevantes.
5. Commit: hooks garantem formatação e lint. Se necessário (evite), `HUSKY=0 git commit ...` para bypass emergencial.
6. Abrir PR descrevendo motivação, impacto e se há alteração de contrato.

## Estrutura de Testes (Resumo)

| Camada     | Objetivo              | Exemplos                     |
| ---------- | --------------------- | ---------------------------- |
| Unidade    | Funções puras/helpers | analistas individuais        |
| Integração | Fluxos multi-módulo   | inquisidor + executor        |
| Guardian   | Baseline/diff/hash    | `guardian/*`                 |
| CLI        | Comandos sem build    | `comando-*.test.ts`          |
| E2E        | Binário buildado real | Execução pós `npm run build` |

Detalhes completos: `docs/relatorios/camadas-testes.md`.

## Segurança Básica

- Path traversal mitigado (normalização / validação de caminhos de plugin).
- Lista de ignores evita snapshot de artefatos voláteis.
- Fallback determinístico de hash garante operação em ambientes restritos.

## Futuras Melhorias Planejadas (Selecionadas)

- Gate de performance automático.
- Modo estrito de plugins (fail-fast em qualquer erro de plugin).
- Persistência incremental de métricas e comparação histórica.

---

Atualize este documento sempre que políticas ou ferramentas mudarem.
