<!-- SPDX-License-Identifier: MIT -->

# Vitest: RPC timeout intermitente ("Timeout calling 'onTaskUpdate'")

## Resumo curto

Durante execuções completas da suíte de testes (Vitest v3) houve um erro intermitente do tipo:

Error: [vitest-worker]: Timeout calling "onTaskUpdate"

Isso aparece mesmo quando todos os testes relatam status "passed" — o runner emite um erro não tratado e retorna exit code 1.

## Observações coletadas

- O erro tende a ocorrer em execuções com muitos arquivos e concorrência de workers.
- Rodar com menos workers (--maxWorkers=1) e reporter mais silencioso (`--reporter=dot`) reduz a frequência, mas não elimina completamente.
- Aumentar o timeout do Vitest (via env VITEST_TEST_TIMEOUT_MS) ajuda em alguns casos.
- Executar por subpastas sequencialmente (script `scripts/run-tests-sequential.mjs`) permite contornar o problema em CI/local quando necessário.

## Mitigação adotada (temporária)

- Mantivemos o ajuste de timeout via variável de ambiente `VITEST_TEST_TIMEOUT_MS` (ex: 300000ms).
- Adicionamos `scripts/run-tests-sequential.mjs` e o script de npm `test:sequential` que executa os diretórios de `tests/` um a um com `--maxWorkers=1 --reporter=dot`.
- Refatoramos mocks problemáticos para serem hoisted-safe (vitest hoist) e corrigimos _module id_ em alguns testes.

## Próximos passos recomendados

1. Reproduzir em ambiente limpo com Node 24 e usar flags `--no-file-parallelism --no-isolate` para investigar se o bug é de IPC ou do runner.
2. Gerar um _trace_ do worker (node flags ou variáveis de debug do Vitest) e abrir issue com repositório minimal reproducer upstream em Vitest.
3. Considerar rodar a suíte em CI com `--maxWorkers=1` até a causa raiz ser resolvida upstream.

## Referências locais

- `package.json` → script `test:sequential`
- `scripts/run-tests-sequential.mjs` → runner sequencial por diretório
- `vitest.config.ts` → leitura de `VITEST_TEST_TIMEOUT_MS`

Data da observação: 2025-08-30
