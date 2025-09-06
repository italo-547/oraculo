# Oráculo CLI

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

[![CI](https://github.com/italo-547/oraculo/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/italo-547/oraculo/actions/workflows/ci.yml)
[![Build](https://github.com/italo-547/oraculo/actions/workflows/build.yml/badge.svg?branch=develop)](https://github.com/italo-547/oraculo/actions/workflows/build.yml)
[![Monitor Deps](https://github.com/italo-547/oraculo/actions/workflows/monitor-deps.yml/badge.svg?branch=develop)](https://github.com/italo-547/oraculo/actions/workflows/monitor-deps.yml)
[![Compliance](https://github.com/italo-547/oraculo/actions/workflows/compliance.yml/badge.svg?branch=develop)](https://github.com/italo-547/oraculo/actions/workflows/compliance.yml)
[![License Gate](https://github.com/italo-547/oraculo/actions/workflows/license-gate.yml/badge.svg?branch=develop)](https://github.com/italo-547/oraculo/actions/workflows/license-gate.yml)

---

Oráculo é uma CLI modular para analisar, diagnosticar e manter projetos (JS/TS e multi-stack leve). Entrega diagnósticos estruturais, verificação de integridade (Guardian), sugestão de reorganização e métricas — tudo com contratos JSON para CI.

---

## ✨ Capacidades

- Diagnóstico de padrões & estrutura (`diagnosticar`)
- Verificação de integridade via hashes (`guardian`)
- Sugestão de reorganização segura (`planoSugestao`)
- Poda de arquivos órfãos (`podar`)
- Relatórios & métricas agregadas (`metricas`)
- Pool de Workers (paralelização por arquivo)
- Schema Versioning (compatibilidade backward)
- Pontuação Adaptativa (tamanho do projeto)

---

### 🚀 Novas Funcionalidades (v0.2.0)

### Pool de Workers

Sistema de paralelização automática que acelera a análise em projetos grandes:

```bash
# Paralelização automática ativada por padrão
oraculo diagnosticar

# Configuração manual (se necessário)
WORKER_POOL_MAX_WORKERS=4 oraculo diagnosticar
```

**Características:**

- **Paralelização por arquivo**: Processa múltiplos arquivos simultaneamente
- **Timeout inteligente**: 30s por analista com cancelamento automático
- **Fallback automático**: Retorna ao processamento sequencial se workers falharem
- **Configuração centralizada**: Variáveis de ambiente para controle fino
- **Estatísticas detalhadas**: Métricas de performance do pool

### Schema Versioning

Versionamento automático dos relatórios JSON com compatibilidade backward:

```json
{
  "_schema": {
    "version": "1.0.0",
    "compatibilidade": ["0.1.0", "0.2.0"]
  },
  "linguagens": { ... },
  "estruturaIdentificada": { ... },
  "guardian": { ... }
}
```

**Benefícios:**

- **Compatibilidade garantida**: Relatórios legados continuam funcionais
- **Migração automática**: Atualização transparente de formatos antigos
- **Validação robusta**: Verificação automática de integridade de schema
- **Contratos estáveis**: APIs previsíveis para consumidores

### Sistema de Pontuação Adaptativa

Pontuação inteligente que se adapta ao tamanho do projeto:

```bash
# Pontuação automática baseada no tamanho do projeto
oraculo diagnosticar --json
```

**Recursos:**

- **Escalabilidade automática**: Fatores de 1x a 5x baseados em arquivos/diretórios
- **3 modos de configuração**: Padrão, conservador e permissivo
- **Pesos realistas**: Arquétipos calibrados para maior precisão
- **Confiança contextual**: Ajustes inteligentes (+5% frameworks, +3% TypeScript)

- **Performance**: Redução de ~70% nos arquivos processados
- **Compatibilidade**: Filtros explícitos continuam funcionando
- **Segurança**: Prevenção de análise acidental de dependências

## 📦 Instalação

```bash
git clone https://github.com/italo-547/oraculo.git
cd oraculo
npm install
npm run build
node dist/bin/index.js diagnosticar --json
node dist/bin/index.js guardian --diff --json
```

Instalação global (opcional):

```bash
npm install -g .
oraculo diagnosticar
```

Windows (PowerShell) — exemplo rápido:

```powershell
git clone https://github.com/italo-547/oraculo.git; cd oraculo; npm install; npm run build; node dist/bin/index.js diagnosticar --json
```

---

## 🧪 Testes

```powershell
npm run format:fix; npm run lint; npm run test:sequential
```

Notas e mitigação de timeout (Vitest): `docs/TESTING-VITEST-TIMEOUT.md`.

## 📊 Métricas internas (exemplo)

```jsonc
{
  "metricas": {
    "totalArquivos": 123,
    "tempoAnaliseMs": 1337,
    "workerPool": { "workersAtivos": 4, "erros": 0 },
  },
}
```

## 🔎 Filtros (`--include`/`--exclude`)

```bash
oraculo diagnosticar --include "src/**/*.ts,package.json"
oraculo diagnosticar --exclude "docs/**,dist/**"
```

Regras essenciais:

- `--include` tem precedência sobre `--exclude` e sobre ignores padrão
- `node_modules` é ignorado por padrão; ao incluir explicitamente (ex.: `--include node_modules/**`), será analisado
- Grupos de include: dentro do grupo é AND; entre grupos é OR

## 📚 Comandos

- `diagnosticar` — análise completa (suporta `--include`/`--exclude`)
- `guardian` — baseline e diff de integridade
- `podar` — remoção segura de órfãos
- `metricas` — histórico agregado de métricas
- `analistas` — catálogo de analistas (`--json`, `--doc`)
- `reestruturar` — (experimental) plano de reorganização
- `perf` — snapshots e comparação sintética

## ⚙️ Flags globais

- `--silence`, `--verbose`, `--export`, `--debug`, `--scan-only`, `--json`

## 🧩 Linguagens suportadas (parsing)

- Primário (AST Babel completo): `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`
- Heurístico/leve: `.kt`, `.kts`, `.java`, `.xml`, `.html`, `.htm`, `.css`, `.gradle`, `.gradle.kts`

Notas: analistas que dependem de nós Babel atuam apenas em linguagens suportadas pelo Babel; demais arquivos ficam expostos para analistas específicos.

## 🔐 Segurança (plugins)

- Whitelist de extensões (`.js`, `.mjs`, `.cjs`, `.ts`), sanitização de paths e validação de globs.

## 🧾 Saída JSON (políticas)

- Em `--json`, logs verbosos são silenciados até a emissão do objeto final
- Unicode fora do ASCII básico é escapado como `\uXXXX` (inclui pares substitutos para caracteres fora do BMP)
- Quando o Guardian não é executado, retornos usam status padrão coerente (ex.: `"nao-verificado"`), mantendo o shape estável

## 📜 Saída `guardian --json` (resumo)

```json
{ "status": "ok|baseline-criado|baseline-aceito|alteracoes-detectadas|erro" }
```

## 🔗 Leituras recomendadas

- Guia de comandos: `docs/GUIA_COMANDOS.md`
- Filtros include/exclude: `docs/GUIA_FILTROS_ORACULO.md`
- Configuração local: `docs/CONFIGURAR-ORACULO-LOCAL.md`
- Robustez e operação: `docs/ROBUSTEZ_ORACULO.md`, `docs/RISCO_E_OPERACAO_SEGURO.md`
- Novidades v0.2.0: `docs/NOVAS-FUNCIONALIDADES-v0.2.0.md`

## 📄 Licença

MIT. Avisos de terceiros: `THIRD-PARTY-NOTICES.txt`.
