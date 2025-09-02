> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Guia: Configurar o Oráculo no seu ambiente (evitar bloqueios por timeout e adaptação)

Objetivo: passos práticos para desenvolver e rodar o Oráculo em workspaces diversos sem ser travado por timeouts, guardian ou diferenças de plataforma.

Checklist rápido

- [ ] Ajustar timeout por analista (dev / CI) via variável de ambiente ou `oraculo.config.json`.
- [ ] Usar flags não-destrutivas em runs iniciais (`--scan-only`, `--json`).
- [ ] Configurar Guardian para modo permissivo durante onboarding (aceitar baseline, ou desabilitar enforcement temporariamente).
- [ ] Validar execução de testes longos com `npm run test:sequential` ou ajustar `VITEST_TEST_TIMEOUT_MS`.

1. Valores e variáveis importantes

Timeout por analista (padrão):

Variável de ambiente (PowerShell):

````powershell
$env:ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS = '60000' # 60s para dev
```text

Alternativa em `oraculo.config.json`:

```json
{
  "ANALISE_TIMEOUT_POR_ANALISTA_MS": 60000
}
````

- Desabilitar o timeout (para debug local pesado):

````powershell
$env:ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS = '0'
```powershell

- Worker pool (reduz tempo e evita timeouts locais): ajustar conforme CPU/Core

```powershell
$env:WORKER_POOL_MAX_WORKERS = '4'
$env:WORKER_POOL_BATCH_SIZE = '10'
````

## 2) Recomendações por ambiente

### Desenvolvimento local (iterativo)

- Timeout: 60000 a 120000 ms
- Use: `oraculo diagnosticar --scan-only --json` para uma primeira avaliação rápida
- Para runs completos: `oraculo diagnosticar --metricas --incremental`

### CI (rápido e previsível)

- Timeout: 30000 ms
- Use flags: `--scan-only` em checks rápidos, `--json` para saída estruturada
- Habilite `package-lock.json` (já rastreado) para `npm ci` determinístico

## 3) Guardian: evitar bloqueios durante onboarding

Situação comum: ao rodar `guardian` pela primeira vez o processo cria um baseline e exige aceitação.

Aceitar baseline manualmente (se confiar no estado atual):

````powershell
node ./dist/bin/index.js guardian --aceitar
# ou
oraculo guardian --aceitar
```text

Tornar o Guardian permissivo temporariamente via config (arquivo `oraculo.config.json`):

```json
{
  "GUARDIAN_ENFORCE_PROTECTION": false,
  "GUARDIAN_ALLOW_ADDS": true,
  "GUARDIAN_ALLOW_DELS": true,
  "GUARDIAN_ALLOW_CHG": true
}
````

Observação: prefira `--aceitar` para workflow humano; alterar enforcement é útil em CI temporariamente.

## 4) Evitar falsos positivos por EOL/BOM/platforma

Estratégia de curto prazo: normalizar EOL e remover BOM quando estiver testando. Use `ORACULO_ANALISE_NORMALIZAR=true` (sugestão operacional; o projeto recomenda implementar normalização no guardian — veja `docs/features/timeout-analista.md` para contexto).

Exemplo (PowerShell):

````powershell
$env:ORACULO_ANALISE_NORMALIZAR = 'true'
```powershell

Se o repositório for usado em Windows e Linux por times diferentes, defina timeout maiores e use `--scan-only` para consistência.

## 5) Testes longos e Vitest

Para runs de testes grandes prefira `npm run test:sequential` (executa subpastas uma a uma e evita timeouts e RPC errors do Vitest).

Ajuste `VITEST_TEST_TIMEOUT_MS` quando necessário:

```powershell
$env:VITEST_TEST_TIMEOUT_MS = '300000' # 5 minutos
npm run test:sequential
````

## 6) Limpeza / resets úteis

Limpar histórico que pode causar flakiness:

````powershell
rm -Force -Recurse .oraculo\historico-metricas
```powershell

Recriar baseline se o Guardian ficar em estado inconsistente:

```powershell
node ./dist/bin/index.js guardian --aceitar
````

## 7) Flags e modos úteis do CLI

- `--scan-only` — varredura sem técnicas mutáveis (use para análise inicial)
- `--json` — saída estruturada para CI
- `--incremental` / `--no-incremental` — controle de análise incremental
- `--metricas` — coleta de métricas (pode ser desabilitada para runs rápidos)

## 8) Troubleshooting rápido

- Problema: runs travando no mesmo arquivo → Aumentar timeout ou desabilitar analista específico (rodar `--scan-only` e investigar).
- Problema: Guardian rejeita PRs por remoções esperadas → `oraculo guardian --aceitar` ou ajustar `GUARDIAN_ALLOW_*` temporariamente.
- Problema: Vitest RPC timeout → usar `npm run test:sequential` e aumentar `VITEST_TEST_TIMEOUT_MS`.

## 9) Boas práticas

- Para projetos grandes, comece com `--scan-only` e depois execute `diagnosticar` completo em uma máquina de CI com workers configurados.
- Não mantenha `.oraculo/` versionado; limpe/ignore artefatos temporários antes de commits de integração.
- Documente no `README.md` do projeto local quaisquer ajustes de timeout feitos para o onboarding do time.

## 10) Próximo passo recomendado (para o repositório)

- Planejar melhoria do `guardian` (normalização, snapshot detalhado, rename detection) — breve roadmap já registrado em `docs/CHECKLIST.md`.

---

Se quiser, aplico este guia em `docs/` (arquivo criado) e gero um pequeno checklist de tarefas (issues/PR) para implementar as melhorias no `guardian` em Outubro/Novembro.
