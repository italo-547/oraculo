## Ambiente de testes — Oráculo CLI

# Ambiente de testes — Oráculo CLI

Este documento descreve como configurar um ambiente local para rodar os testes do Oráculo CLI de forma reprodutível e sem surpresas.

Requisitos básicos

- Node.js >= 24.0.4

- Dependências do projeto instaladas (execute `npm install`)

Comandos úteis

- Formatar o repositório (Prettier):

  ```powershell
  npm run format:fix
  ```

- Rodar o linter (ESLint):

  ```powershell
  npm run lint
  ```

- Executar a suíte completa (Vitest):

  ```powershell
  npm test
  ```

- Rodar um arquivo de teste isolado (recomendado para debugar flakiness):

  ```powershell
  npx vitest run tests/cli/comando-reestruturar.branches2.test.ts
  ```

Variáveis de ambiente importantes

- `VITEST_TEST_TIMEOUT_MS` — Timeout global (ms) configurado no `vitest.config.ts`. Pode ser aumentado para acomodar E2E longos. Exemplo:

  ```powershell
  $env:VITEST_TEST_TIMEOUT_MS = '180000'
  npm test
  ```

- `VITEST` — usado internamente pelos comandos para ajustar comportamento (por exemplo, suprimir `process.exit` durante testes). Não remova ao executar a suíte via Vitest.

- `REPORT_EXPORT_ENABLED` — habilita exportação de relatórios (MD/JSON) durante execução de comandos; útil para testar fluxos de export.

- `REPORT_OUTPUT_DIR` — diretório onde relatórios de teste são gravados quando a exportação está habilitada.

- `ORACULO_REESTRUTURAR_ANSWER` — permite simular resposta do prompt em testes e em runs isolados (`s` ou `n`).

E2E do CLI (binário)

- Os testes E2E que executam o binário compilado (`dist/cli.js`) usam um loader customizado em alguns cenários para resolver o alias `@`. Ao executar manualmente o binário com Node no Windows, passe o loader como `file://` URL:

  ```powershell
  node --loader "file://C:/caminho/para/seu/repo/node.loader.mjs" dist/cli.js diagnosticar --scan-only
  ```

Dicas para investigar o erro `Timeout calling "onTaskUpdate"`

- Esse erro pode aparecer em runs grandes (muitos testes/E2E). Ações recomendadas:
  - Reproduza o teste problemático isoladamente com `npx vitest run <arquivo>` para capturar logs mais detalhados.
  - Aumente `VITEST_TEST_TIMEOUT_MS` (ex.: `120000` ou `180000`) para E2E longos.
  - Rode em modo sequencial se suspeitar de problemas com workers (executar testes por arquivo ou reduzir paralelismo). Exemplo: rodar arquivos individuais ou usar `--run` (vitest UI) para execuções interativas.
  - Coletar stack trace do worker: execute o arquivo individual e copie a saída `Unhandled Error` para investigação.

Boas práticas

- Sempre rodar `npm run format:fix` e `npm run lint` antes de abrir PRs para evitar erros de estilo e garantir consistência.

- Ao adicionar testes E2E pesados, prefira rodar isoladamente enquanto desenvolve.

Se precisar, eu posso adicionar um script `scripts/debug-test.ps1` com um wrapper para reproduzir timeouts e coletar logs automaticamente.

Este documento descreve como configurar um ambiente local para rodar os testes do Oráculo CLI de forma reprodutível e sem surpresas.

Requisitos básicos

- Node.js >= 24.0.4
- Dependências do projeto instaladas (execute `npm install`)

Comandos úteis

- Formatar o repositório (Prettier):

  ```powershell
  npm run format:fix
  ```

- Rodar o linter (ESLint):

  ```powershell
  npm run lint
  ```

- Executar a suíte completa (Vitest):

  ```powershell
  npm test
  ```

- Rodar um arquivo de teste isolado (recomendado para debugar flakiness):

  ```powershell
  npx vitest run tests/cli/comando-reestruturar.branches2.test.ts
  ```

Variáveis de ambiente importantes

- `VITEST_TEST_TIMEOUT_MS` — Timeout global (ms) configurado no `vitest.config.ts`. Pode ser aumentado para acomodar E2E longos. Exemplo:

  ```powershell
  $env:VITEST_TEST_TIMEOUT_MS = '180000'
  npm test
  ```

- `VITEST` — usado internamente pelos comandos para ajustar comportamento (por exemplo, suprimir `process.exit` durante testes). Não remova ao executar a suíte via Vitest.

- `REPORT_EXPORT_ENABLED` — habilita exportação de relatórios (MD/JSON) durante execução de comandos; útil para testar fluxos de export.

- `REPORT_OUTPUT_DIR` — diretório onde relatórios de teste são gravados quando a exportação está habilitada.

- `ORACULO_REESTRUTURAR_ANSWER` — permite simular resposta do prompt em testes e em runs isolados (`s` ou `n`).

E2E do CLI (binário)

- Os testes E2E que executam o binário compilado (`dist/cli.js`) usam um loader customizado em alguns cenários para resolver o alias `@`. Ao executar manualmente o binário com Node no Windows, passe o loader como `file://` URL:

  ```powershell
  node --loader "file://C:/caminho/para/seu/repo/node.loader.mjs" dist/cli.js diagnosticar --scan-only
  ```

Dicas para investigar o erro `Timeout calling "onTaskUpdate"`

- Esse erro pode aparecer em runs grandes (muitos testes/E2E). Ações recomendadas:
  - Reproduza o teste problemático isoladamente com `npx vitest run <arquivo>` para capturar logs mais detalhados.
  - Aumente `VITEST_TEST_TIMEOUT_MS` (ex.: `120000` ou `180000`) para E2E longos.
  - Rode em modo sequencial se suspeitar de problemas com workers (executar testes por arquivo ou reduzir paralelismo). Exemplo: rodar arquivos individuais ou usar `--run` (vitest UI) para execuções interativas.
  - Coletar stack trace do worker: execute o arquivo individual e copie a saída `Unhandled Error` para investigação.

Boas práticas

- Sempre rodar `npm run format:fix` e `npm run lint` antes de abrir PRs para evitar erros de estilo e garantir consistência.
- Ao adicionar testes E2E pesados, prefira rodar isoladamente enquanto desenvolve.

Se precisar, eu posso adicionar um script `scripts/debug-test.ps1` com um wrapper para reproduzir timeouts e coletar logs automaticamente.
