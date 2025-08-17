> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Camadas de Testes do Oráculo

Este documento descreve as camadas atuais de testes após a inclusão dos testes E2E (binário buildado) em agosto/2025.

## 1. Unidade / Módulos Isolados

- Escopo: Funções puras, helpers, analisadores individuais.
- Exemplos: `detector-dependencias`, `analista-funcoes-longas`.
- Objetivo: Rapidez e feedback imediato.

## 2. Integração

- Escopo: Fluxos que compõem múltiplos módulos (ex: `inquisidor` + `executor` + técnicas).
- Uso frequente de mocks mínimos apenas onde há IO.

## 3. Integrado com Persistência / Guardian

- Escopo: Exercita baseline, diffs, hash, registros.
- Garante que alterações no formato não quebrem regressões.

## 4. CLI (Comando) Tests

- Exercitam comandos via funções internas sem necessidade de build.
- Validam flags (`--scan-only`, `--export`, `--silence`, etc.).

## 5. E2E Binário (Expandido)

- Arquivo: `src/cli/e2e-bin.test.ts`.
- Executa `node dist/cli.js diagnosticar ...` sobre um projeto temporário real.
- Cenários atuais:
  - `--scan-only` simples (exit 0, log presente)
  - `--scan-only --export` gera arquivo `oraculo-scan-*.json`
  - Diagnóstico completo benigno (exit 0)
  - Criação de baseline `guardian` (exit 0)
  - Cenário com erro técnico forçado (exit 1) garantindo path de falha
- Valor: Detecta divergências pós-build (paths, env, ESM, exit codes) e garante semântica de retorno.

## 6. Próximos Cenários E2E Sugeridos

- Flag experimental de métricas (quando implementada) validando presença em JSON export.
- Reexecução de guardian comparando baseline para assegurar exit 0 sem mudanças.
- Caso de alteração deliberada em arquivo simulando diff => saída com alerta (sem quebrar exit se não for erro).
- Tag opcional adicional para cenários de performance (`@e2e-perf`).

## Estratégia de Manutenção

- Mantê-los mínimos para tempo total < 15s.
- Evitar replicar lógica de análise nos projetos temporários: apenas 1-2 arquivos.
- Adicionar novas flags sempre primeiro em testes de comando (rápidos) e depois 1 cenário E2E.

## Métricas Atuais (12/08/2025)

- Total testes: 309.
- Tempo total: ~12.5s (local, Node 24.x, Windows).
- Falhas recentes corrigidas: Ajuste de `--silence` em scan-only; estabilidade de exit code 1 via cenário técnico.

---

Atualize este documento sempre que:

1. Uma nova camada for introduzida.
2. Novas flags críticas impactarem E2E.
3. Houver mudança relevante de tempo total (> +30%).
