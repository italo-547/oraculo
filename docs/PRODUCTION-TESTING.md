> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Testes em modo produção — Oráculo CLI

Este documento explica como reproduzir e validar a execução do Oráculo em um cenário próximo ao de produção, com cap de timeout aplicado aos analistas/workers e recomendações para evitar timeouts do runner (Vitest) em ambientes com recursos limitados.

Conteúdo:

- Pré-requisitos
- Variáveis de ambiente relevantes
- Como rodar os testes localmente (PowerShell)
- Comandos úteis e smoke tests
- Como interpretar falhas comuns
- Recomendações para CI

---

## 1. Pré-requisitos

- Node.js compatível (projeto requer Node.js >= 24.0.4).
- Build do TypeScript: o pipeline de testes roda `npm run build` implicitamente via `pretest`.
- Vitest (já declarado nas devDependencies).

## 2. Variáveis de ambiente importantes

---

## 9. Observação — abordagem pontual e refinamentos futuros

Importante: as mudanças aplicadas nos módulos de `src/nucleo` foram feitas para mitigar timeouts e tornar o processamento por workers mais resiliente de forma pontual. Elas já reduzem riscos imediatos (timers limpos, heartbeats e kill timers, yields no worker), mas exigem refinamentos para serem consideradas uma solução definitiva.

Refinamentos recomendados (curto/médio prazo):

- Testes herméticos para técnicas lentas: adicionar testes que executem técnicas reais em workers isolados (não apenas mocks) para validar comportamento sob carga.
- Melhorar backpressure: implementar fila de prioridade com métricas de enfileiramento, latência e taxas de retry.
- Tunar parâmetros por ambiente: externalizar heartbeat/kills/timeout por profile (dev/staging/ci/prod) e validar default sensível ao número de CPUs.
- Observabilidade: encaminhar logs estruturados (JSON) para um sink em CI (arquivo ou serviço) e coletar métricas (workersAtivos, kills, latência média por lote).
- Robustez do test runner: ajustar pipeline CI para shard/isolamento de E2E, adicionar job sequencial para suites pesadas e validar runner (Vitest) upgrades que melhorem RPC timeouts.
- Revisão de segurança: confirmar que nenhuma variação reintroduz chamadas inseguras (evitar shell=true em child_process) e que variáveis de ambiente sensíveis não vazem para logs.

Resumo da execução de testes realizada localmente:

- Comando executado (exemplo):

````powershell
$env:ORACULO_MAX_ANALYST_TIMEOUT_MS='10000';
$env:NODE_ENV='production';
npm test
```powershell

- Resultado observado na minha execução local:
  - Test Files: 262 passed
  - Tests: 745 passed
  - Errors: 1 unhandled error (Vitest interno: "Timeout calling \"onTaskUpdate\"")
  - Observação: a maior parte dos testes passou; o erro restante parece relacionado ao runner (RPC timeout) quando E2E pesados rodam em paralelo — as recomendações acima visam mitigar isso.

Se desejar, posso:

- abrir um PR com estas mudanças e o MD atualizado;
- adicionar a sugestão de job CI (YAML) no repositório;
- implementar encaminhamento de logs estruturados para arquivo quando `LOG_ESTRUTURADO=true`.
- `NODE_ENV=production`
  - Muda comportamentos sensíveis a ambiente (ex.: cap de timeout padrão de produção).

- `ORACULO_MAX_ANALYST_TIMEOUT_MS`
  - Cap máximo (em ms) aplicado ao timeout de execução por analista/technique.
  - Valor recomendado em produção: `10000` (10s). Pode ser reduzido para cenários "fail-fast".

- `WORKER_POOL_MAX_WORKERS`
  - Número máximo de worker threads. `0` = detecta CPUs automaticamente.

- `WORKER_POOL_BATCH_SIZE`
  - Tamanho do lote de arquivos enviado por worker em cada job.

- `ORACULO_WORKER_HEARTBEAT_MS` (opcional)
  - Intervalo de heartbeat que o worker envia para o processo pai. Se não estiver presente, use o valor padrão codificado.

- `LOG_ESTRUTURADO` ou `REPORT_SILENCE_LOGS`
  - Flags para controlar formato/ruído de logs em CI.

Observação: estas variáveis podem ser definidas no ambiente (CI) ou via prefixo de comando local.

## 3. Como rodar os testes localmente (PowerShell)

Recomendações gerais:

- Em máquinas locais/CI com pouca CPU/memória, prefira executar os testes sequencialmente para evitar timeouts RPC do runner.
- Use o script `test:sequential` que já existe no projeto para executar grupos de testes em sequência.

### Resultado do último teste local (executado)

Resumo com o runner sequencial atualizado (split de E2E por `-t`) e `ORACULO_MAX_ANALYST_TIMEOUT_MS=10000`:

- Test Files: 262 passed
- Tests: 745 passed
- Errors: 0 unhandled errors (sem "Timeout calling \"onTaskUpdate\"")

Observação: ao dividir `tests/cli/e2e-bin.test.ts` por casos com `-t`, o relatório mostra “1 passed | 4 skipped” por execução — isso é esperado, pois somente um caso é rodado por vez.

Exemplo PowerShell (executa em modo produção com cap de 10s e sequência de testes):

```powershell
$env:ORACULO_MAX_ANALYST_TIMEOUT_MS='10000';
$env:NODE_ENV='production';
npm run test:sequential
````

Para executar apenas um teste ou um conjunto específico (smoke/E2E), rode:

````powershell
$env:ORACULO_MAX_ANALYST_TIMEOUT_MS='10000';
$env:NODE_ENV='production';
npx vitest run tests/cli/e2e-bin.test.ts --reporter dot
```powershell

Ou executar testes unitários de `nucleo` (rápido):

```powershell
$env:ORACULO_MAX_ANALYST_TIMEOUT_MS='10000';
$env:NODE_ENV='production';
npx vitest run tests/nucleo/worker-pool.test.ts --reporter dot
````

## 4. Smoke test CLI (modo produção)

Um exemplo prático para validar que o CLI roda e respeita os timeouts:

````powershell
$env:ORACULO_MAX_ANALYST_TIMEOUT_MS='10000';
$env:NODE_ENV='production';
npx vitest run tests/cli/comando-diagnosticar.include-exclude.test.ts --reporter dot
```bash

Esse teste valida fluxos de varredura/diagnóstico com logs e exportações e é útil como smoke test antes de rodar a suíte completa.

## 5. Interpretação de falhas comuns

- "Unhandled Error: Error: [vitest-worker]: Timeout calling \"onTaskUpdate\""
  - Indica que o runner (Vitest) não recebeu atualizações de tarefas dentro do prazo interno. Pode ser causado por:
    - muitas threads/concorrência em máquina com poucos recursos;
    - workers bloqueando o event loop por longos períodos (técnicas demoradas);
    - saturação de IO/CPU.
  - Mitigações imediatas:
    - use `npm run test:sequential` (roda em séries e reduz pressão RPC; trata `tests/cli` por arquivo e divide E2E por `-t`);
    - reduzir `WORKER_POOL_MAX_WORKERS` para 1 ou 2 em CI restrito;
    - reduzir `ORACULO_MAX_ANALYST_TIMEOUT_MS` para forçar falha rápida e evitar bloqueios prolongados;
    - isolar os testes E2E e executá-los em um job separado no CI.

- "Process exit com código 1" após maioria dos testes passarem
  - Verifique o bloco `Unhandled Errors` na saída do Vitest (única falha pode quebrar o run inteiro). Corrija a origem do erro (geralmente runner/worker communication ou um handler global não tratado).

## 6. Recomendações para CI

- Separe E2E e testes pesados em pipelines ou jobs diferentes.
- Use `npm run test:sequential` para reduzir flakiness quando a runner apresenta RPC timeouts.
- Em runners muito limitados, definir `WORKER_POOL_MAX_WORKERS=1` pode aumentar confiabilidade.
- Colete logs estruturados (defina `LOG_ESTRUTURADO=true` se disponível) e envie saídas para armazenamento persistente ao ocorrer um timeout.

Exemplo de job (pseudo YAML) para reduzir falhas RPC:

```yaml
steps:
  - name: Install
    run: npm ci
  - name: Build
    run: npm run build
  - name: Unit tests (sequential)
    env:
      NODE_ENV: production
      ORACULO_MAX_ANALYST_TIMEOUT_MS: '10000'
      WORKER_POOL_MAX_WORKERS: '2'
    run: npm run test:sequential
  - name: E2E tests (separate job)
    env:
      NODE_ENV: production
      ORACULO_MAX_ANALYST_TIMEOUT_MS: '8000'
    run: npx vitest run tests/cli/e2e-*.test.ts
````

## 7. Debug e coleta de evidências

- Ative logs mais verbosos localmente (ex.: `VERBOSE=true`) para capturar ação dos workers.
- Ao reproduzir um timeout, salve o stdout/stderr do runner e capture `ps`/`top`/`tasklist` para correlacionar uso CPU/memória.
- Se possível, capture trace do Node (`node --trace-warnings`) para entender timers pendentes.

## 8. Notas e próximos passos

- A equipe já aplicou melhorias no `src/nucleo` para:
  - limpar timers de timeouts corretamente;
  - enviar heartbeats dos workers e rearmar timers no pai;
  - inserir yields (setImmediate) nos workers para evitar bloqueio do event loop;
  - aplicar um cap de produção (`ORACULO_MAX_ANALYST_TIMEOUT_MS`) padrão em 10000 ms.

## Nota técnica: possível erro interno do Vitest

Durante execuções locais e CI simulando produção foi observado um erro não tratado do runner:

Error: [vitest-worker]: Timeout calling "onTaskUpdate"

Contexto e comportamento:

- O erro tende a aparecer quando a suíte executa E2E/CLI pesados ou quando há alta concorrência de workers.
- A mensagem é interna ao Vitest (RPC entre processo pai e workers) e não aponta diretamente para código do domínio.

Interpretação pragmática:

- É provável que seja um problema operacional do runner sob carga (flakiness), não uma regressão funcional nas técnicas/worker logic que já receberam hardening (timers limpos, heartbeats, yields).

Mitigações recomendadas:

- Isolar/rodar E2E pesados em job separado ou em modo sequencial.
- Reduzir `WORKER_POOL_MAX_WORKERS` em runners limitados (ex.: 1-2).
- Usar `npm run test:sequential` quando o runner apresentar timeouts.
- Considerar upgrade do Vitest e abrir issue com logs se o problema persistir em runners com recursos suficientes.

Se quiser, posso: abrir PR com estas notas; adicionar um job YAML de exemplo ao repo; ou implementar um sink local para logs estruturados quando `LOG_ESTRUTURADO=true`.

Arquivo gerado automaticamente em: docs/PRODUCTION-TESTING.md

## Como ativar / configurar o modo "produção" (prático)

Resumo rápido: existem duas formas práticas de executar o Oráculo em um perfil próximo ao de produção:

Preferível (CI): definir as variáveis de ambiente no job do runner. Exemplo PowerShell:

````powershell
$env:ORACULO_MAX_ANALYST_TIMEOUT_MS='10000';
$env:NODE_ENV='production';
$env:WORKER_POOL_MAX_WORKERS='2';
$env:WORKER_POOL_BATCH_SIZE='10';
npm run build; node ./dist/cli.js diagnosticar --scan-only
```text

Alternativa (arquivo de configuração): adicionar o bloco `productionDefaults` em `oraculo.config.safe.json` (já existe suporte de convenção no repositório). Exemplo mínimo:

```json
{
  "productionDefaults": {
    "NODE_ENV": "production",
    "ORACULO_MAX_ANALYST_TIMEOUT_MS": 10000,
    "WORKER_POOL_MAX_WORKERS": 2,
    "WORKER_POOL_BATCH_SIZE": 10,
    "ORACULO_WORKER_HEARTBEAT_MS": 5000,
    "LOG_ESTRUTURADO": false
  }
}
````

Observação: editar `oraculo.config.safe.json` facilita a padronização em ambientes locais/servidores, mas o método portátil e imediato é sempre exportar variáveis de ambiente no job do CI.

Aviso: esta configuração é um ajuste pragmático para reduzir timeouts e flakiness durante testes em produção — está sujeita a refinamentos futuros (ver seção "Refinamentos recomendados").

- Se ainda ocorrerem RPC timeouts do Vitest em sua infraestrutura, as ações práticas recomendadas são:
  1. executar testes sequencialmente; 2) reduzir número de workers; 3) shard/isolamento de E2E; 4) aumentar recursos do runner.

---

## Checklist de verificação rápida

- [x] Rodar testes em modo produção com cap de 10s (variável aplicada).
- [x] Usar `npm run test:sequential` para reduzir flakiness de RPC.
- [x] Documentar passos e comandos PowerShell para replicação local.

---

Arquivo gerado automaticamente em: docs/PRODUCTION-TESTING.md
