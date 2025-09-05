# Oráculo CLI

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

[![CI](https://github.com/comode-547/oraculo/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/comode-547/oraculo/actions/workflows/ci.yml)
[![Build](https://github.com/comode-547/oraculo/actions/workflows/build.yml/badge.svg?branch=develop)](https://github.com/comode-547/oraculo/actions/workflows/build.yml)
[![Monitor Deps](https://github.com/comode-547/oraculo/actions/workflows/monitor-deps.yml/badge.svg?branch=develop)](https://github.com/comode-547/oraculo/actions/workflows/monitor-deps.yml)
[![Compliance](https://github.com/comode-547/oraculo/actions/workflows/compliance.yml/badge.svg?branch=develop)](https://github.com/comode-547/oraculo/actions/workflows/compliance.yml)
[![License Gate](https://github.com/comode-547/oraculo/actions/workflows/license-gate.yml/badge.svg?branch=develop)](https://github.com/comode-547/oraculo/actions/workflows/license-gate.yml)

![Node](https://img.shields.io/badge/node-%3E%3D24.x-339933?logo=node.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Último commit](https://img.shields.io/github/last-commit/comode-547/oraculo)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/comode-547/oraculo/dev/typescript?label=TypeScript)](https://github.com/comode-547/oraculo/blob/main/package.json)
[![ESLint](https://img.shields.io/github/package-json/dependency-version/comode-547/oraculo/dev/eslint?label=ESLint)](https://github.com/comode-547/oraculo/blob/main/package.json)
[![Prettier](https://img.shields.io/github/package-json/dependency-version/comode-547/oraculo/dev/prettier?label=Prettier)](https://github.com/comode-547/oraculo/blob/main/package.json)

Oráculo é uma CLI modular para analisar, diagnosticar e manter projetos (JavaScript/TypeScript e multi-stack leve), oferecendo diagnósticos estruturais, verificação de integridade (Guardian), sugestão de reorganização e métricas — tudo com contratos JSON consumíveis por CI.

> Nota temporária (set/2025): o gate de cobertura está em ajuste. Execute os testes normalmente e, se quiser checar a cobertura local, rode “npm run coverage:fast” (somente medição) ou “npm run coverage:enforce” (mede e aplica gate). Se o gate falhar, consulte o relatório em “coverage/” para detalhes e siga incrementando testes.

> Observação importante: muitos problemas já foram mapeados no projeto, mas ainda não conseguimos corrigir todos por enquanto — estamos trabalhando nas correções e muitas delas serão aplicadas em breve. Se você puder ajudar a localizar problemas ou fornecer feedback, será ótimo: abra issues, comente nas existentes ou envie um PR com indicações do que encontrou.

## ✨ Principais Capacidades

- Diagnóstico de padrões & estrutura (`diagnosticar`)
- Verificação de integridade via hashes (`guardian`)
- Sugestão de reorganização segura (`planoSugestao`)
- Poda de arquivos órfãos (`podar`)
- Relatórios & métricas agregadas (`metricas`)
- **Pool de Workers**: Paralelização automática por arquivo para projetos grandes
- **Schema Versioning**: Versionamento automático de relatórios JSON com compatibilidade backward
- **Pontuação Adaptativa**: Sistema inteligente de pontuação baseado no tamanho do projeto
- Extensível com analistas / plugins (ESM)

## 🚀 Novas Funcionalidades (v0.2.0)

### Pool de Workers

Sistema de paralelização automática que acelera a análise em projetos grandes:

````bash
# Paralelização automática ativada por padrão
oraculo diagnosticar

# Configuração manual (se necessário)
WORKER_POOL_MAX_WORKERS=4 oraculo diagnosticar
```text

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
````

**Benefícios:**

- **Compatibilidade garantida**: Relatórios legados continuam funcionais
- **Migração automática**: Atualização transparente de formatos antigos
- **Validação robusta**: Verificação automática de integridade de schema
- **Contratos estáveis**: APIs previsíveis para consumidores

### Sistema de Pontuação Adaptativa

Pontuação inteligente que se adapta ao tamanho do projeto:

````bash
# Pontuação automática baseada no tamanho do projeto
oraculo diagnosticar --json
```bash

**Recursos:**

- **Escalabilidade automática**: Fatores de 1x a 5x baseados em arquivos/diretórios
- **3 modos de configuração**: Padrão, conservador e permissivo
- **Pesos realistas**: Arquétipos calibrados para maior precisão
- **Confiança contextual**: Ajustes inteligentes (+5% frameworks, +3% TypeScript)

![CI](https://github.com/italo-547/oraculo/actions/workflows/ci.yml/badge.svg?branch=develop)
![Build](https://github.com/italo-547/oraculo/actions/workflows/build.yml/badge.svg?branch=develop)
![Monitor Deps](https://github.com/italo-547/oraculo/actions/workflows/monitor-deps.yml/badge.svg?branch=develop)
![Compliance](https://github.com/italo-547/oraculo/actions/workflows/compliance.yml/badge.svg?branch=develop)
![License Gate](https://github.com/italo-547/oraculo/actions/workflows/license-gate.yml/badge.svg?branch=develop)
# Exclusão automática de node_modules, dist, coverage, etc.
oraculo diagnosticar  # ~70% menos arquivos escaneados
![Último commit](https://img.shields.io/github/last-commit/italo-547/oraculo)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/italo-547/oraculo/dev/typescript?label=TypeScript)](https://github.com/italo-547/oraculo/blob/main/package.json)
[![ESLint](https://img.shields.io/github/package-json/dependency-version/italo-547/oraculo/dev/eslint?label=ESLint)](https://github.com/italo-547/oraculo/blob/main/package.json)
[![Prettier](https://img.shields.io/github/package-json/dependency-version/italo-547/oraculo/dev/prettier?label=Prettier)](https://github.com/italo-547/oraculo/blob/main/package.json)
- **Performance**: Redução de ~70% nos arquivos processados
- **Compatibilidade**: Filtros explícitos continuam funcionando
- **Segurança**: Prevenção de análise acidental de dependências

## 📦 Instalação

````bash
git clone https://github.com/mocoto-dev/oraculo.git
cd oraculo
npm install
```bash
git clone https://github.com/italo-547/oraculo.git
## 🖥️ Uso Rápido

```bash
npm run build
node dist/bin/index.js diagnosticar --json
node dist/bin/index.js guardian --diff --json
````

Instalação global opcional:

````bash
npm install -g .
oraculo diagnosticar
```powershell

Durante testes (`process.env.VITEST`) a CLI não chama `process.exit`, permitindo inspeção controlada.

## Testes locais

Para rodar a suíte de testes localmente:

- Instale dependências: `npm install`
- Formate e execute o linter antes de rodar os testes:

  ```powershell
  npm run format:fix; npm run lint
````

- Execute a suíte completa:

  ```powershell
  npm test
  ```

Variáveis úteis:

- `VITEST_TEST_TIMEOUT_MS` — timeout global (ms) para testes; útil para E2E longos.
- `REPORT_EXPORT_ENABLED` — permita testes que exportam relatórios.
- `REPORT_OUTPUT_DIR` — diretório de saída de relatórios.

Se a suíte falhar por causa de timeouts em workers, tente reproduzir um arquivo de teste isolado com `npx vitest run <arquivo>` ou reduzir o paralelismo na execução.

## Nota sobre um timeout intermitente

Há um problema intermitente observado durante execuções completas de teste onde o runner emite
`Error: [vitest-worker]: Timeout calling "onTaskUpdate"` mesmo com testes marcados como passed. Veja
`docs/TESTING-VITEST-TIMEOUT.md` para o histórico, mitigações adotadas e um script local (`npm run test:sequential`) para contornar.

### Flags Globais

Você pode usar as flags globais em qualquer comando para controlar o nível de logs e exportação de relatórios:

| Flag          | Descrição                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------- |
| `--silence`   | Silencia todos os logs de informação e aviso (sobrepõe `--verbose`)                       |
| `--verbose`   | Exibe logs detalhados de cada arquivo e técnica analisada (ignorado se `--silence` ativo) |
| `--export`    | Gera arquivos de relatório detalhados (JSON e Markdown)                                   |
| `--debug`     | Ativa modo de desenvolvimento (logs detalhados de debug)                                  |
| `--dev`       | Alias legado para `--debug` (deprecado)                                                   |
| `--scan-only` | Executa somente varredura e priorização, sem aplicar técnicas                             |
| `--json`      | (diagnosticar/guardian) Saída estruturada JSON para uso em CI                             |

#### Exemplos de uso

`````bash
# Diagnóstico limpo (padrão)
oraculo diagnosticar

# Diagnóstico detalhado (verbose)
oraculo diagnosticar --verbose

# Diagnóstico totalmente silencioso
oraculo diagnosticar --silence

# Exportar relatórios detalhados
oraculo diagnosticar --export

# Combinar flags (silence sempre sobrepõe verbose)
oraculo diagnosticar --export --verbose --silence
```powershell

### Plugins & Extensões

Guia completo: consulte seção de Plugins & Extensões acima.

Persistência sempre via helpers `lerEstado` / `salvarEstado` (ver seção de Scripts e Tooling abaixo).

### Instalação global (opcional)

Se quiser rodar o comando `oraculo` diretamente no terminal, instale globalmente:

````bash
npm install -g .
```bash

Assim, basta rodar:

```bash
oraculo <comando>
`````

### Principais Comandos

| Comando        | Descrição                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `diagnosticar` | Análise completa (arquitetura, padrões, estrutura, guardian opcional). Suporta filtros `--include` e `--exclude` para glob patterns pontuais |
| `guardian`     | Cria/atualiza/verifica baseline de integridade                                                                                               |
| `podar`        | Lista ou remove (seguro) arquivos órfãos                                                                                                     |
| `metricas`     | Histórico agregado de métricas internas                                                                                                      |
| `analistas`    | Lista analistas registrados; suporta `--json`, `--output <arquivo>` e `--doc <arquivo>` para exportar catálogo                               |
| `reestruturar` | (experimental) Aplicar plano de reorganização                                                                                                |

Lista completa: `node dist/bin/index.js --help`.

## 🧪 Qualidade & Política de Testes

Cobertura mínima (gate em CI): Statements/Lines 95%, Branches 90%, Functions 96%. Detalhes na seção de Qualidade e Testes abaixo.

Rodar testes: `npm test` | Cobertura: `npx vitest run --coverage` (ou `npm run coverage:enforce` no CI).

### Estratégia de Testes

1. Unidade: funções puras e helpers (preferir sem efeitos colaterais)
2. Integração: fluxo entre inquisidor / executor / analistas
3. Segurança: caminhos de falha e validações (plugins, glob, path)
4. Branch coverage: cenários alternativos (flags `--json`, erros agregados, diffs, fallback de hash)
5. E2E: execução real pós-build (contrato de CLI e códigos de saída)

### Variáveis de Ambiente (Parsing & Falhas)

| Variável                     | Default | Efeito                                                                     |
| ---------------------------- | ------- | -------------------------------------------------------------------------- |
| `PARSE_ERRO_AGRUPAR`         | `true`  | Agrupa múltiplos erros de parsing por arquivo após limite                  |
| `PARSE_ERRO_MAX_POR_ARQUIVO` | `1`     | Qtde máxima antes de condensar em ocorrência agregada                      |
| `PARSE_ERRO_FALHA`           | `false` | Se `true`, presença de parsing errors (após agregação) falha o diagnóstico |

### Variáveis de Ambiente (Pool de Workers)

| Variável                  | Default | Efeito                                                        |
| ------------------------- | ------- | ------------------------------------------------------------- |
| `WORKER_POOL_ENABLED`     | `true`  | Habilita/desabilita o pool de workers                         |
| `WORKER_POOL_MAX_WORKERS` | `auto`  | Número máximo de workers (auto = baseado em CPUs disponíveis) |
| `WORKER_POOL_BATCH_SIZE`  | `10`    | Arquivos processados por worker antes de enviar próximo lote  |
| `WORKER_POOL_TIMEOUT_MS`  | `30000` | Timeout por analista em milissegundos (30s)                   |

### Variáveis de Ambiente (Pontuação Adaptativa)

| Variável                    | Default  | Efeito                                                   |
| --------------------------- | -------- | -------------------------------------------------------- |
| `PONTUACAO_MODO`            | `padrao` | Modo de pontuação: `padrao`, `conservador`, `permissivo` |
| `PONTUACAO_FATOR_ESCALA`    | `auto`   | Fator de escala baseado no tamanho do projeto            |
| `PONTUACAO_PESO_FRAMEWORK`  | `1.05`   | Bônus para projetos com frameworks detectados            |
| `PONTUACAO_PESO_TYPESCRIPT` | `1.03`   | Bônus para projetos TypeScript                           |

### Dicas de Encoding no Windows

Alguns consoles no Windows podem distorcer bordas/acentos quando você redireciona a saída para arquivo.

- Para forçar molduras ASCII (sem caracteres box-drawing), use a variável de ambiente:
  - PowerShell (escopo da linha):

    ```powershell
    $env:ORACULO_ASCII_FRAMES = '1'; oraculo diagnosticar > out.txt
    ```

  - CMD clássico:

    ```bat
    set ORACULO_ASCII_FRAMES=1 && oraculo diagnosticar > out.txt
    ```

- Alternativamente, ajuste a sessão para UTF-8 (pode variar por ambiente):
  - PowerShell:

    ```powershell
    $OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
    ```

  - Prompt de Comando (CMD):

    ```bat
    chcp 65001
    ```

Observação:

- A saída JSON em `--json` já aplica escape `\uXXXX` para caracteres fora do ASCII básico, mitigando problemas ao consumir via pipelines.
- As molduras de seções (headers e tabelas) usam um formatador consciente de ANSI e largura visível e são impressas diretamente (sem prefixos) para preservar bordas. Para forcing ASCII, use `ORACULO_ASCII_FRAMES=1`.

### Métricas Internas (Execução)

Quando `--metricas` (default habilitado) está ativo, o comando `diagnosticar --json` inclui agora dois níveis:

1. Bloco `metricas` original (detalhado por execução) — preservado.
2. Bloco `metricas` agregado simplificado (no root) com razões e top analistas.

Exemplo (trecho simplificado):

````jsonc
{
  "metricas": {
    "totalArquivos": 123,
    "tempoParsingMs": 420,
    "tempoAnaliseMs": 1337,
    "cacheAstHits": 80,
    "cacheAstMiss": 43,
    "workerPool": {
      "workersAtivos": 4,
      "erros": 0,
      "duracaoTotalMs": 890
    },
    "schemaVersion": "1.0.0",
    "pontuacaoAdaptativa": {
      "fatorEscala": 2.5,
      "modo": "padrao",
      "bonusFramework": 1.05
    },
    "analistas": [
      { "nome": "funcoes-longas", "duracaoMs": 12.3, "ocorrencias": 5, "global": false }
    ]
  },
  "linguagens": { ... },
  "estruturaIdentificada": { ... },
  "guardianCacheDiffHits": 4,
  "metricas": {
    "totalArquivos": 123,
    "tempoAnaliseMs": 1337,
    "tempoParsingMs": 420,
    "parsingSobreAnalisePct": 31.42,
    "topAnalistas": [
      { "nome": "funcoes-longas", "duracaoMs": 12.3, "ocorrencias": 5 }
    ]
  }
}
```bash

**Novas métricas incluídas na v0.2.0:**

- `workerPool`: Estatísticas detalhadas do pool de workers (workers ativos, erros, duração total)
- `schemaVersion`: Versão do schema usado no relatório para compatibilidade
- `pontuacaoAdaptativa`: Fatores aplicados na pontuação inteligente do projeto

O campo `parsingSobreAnalisePct` é derivado (parsing/analise \* 100) e `topAnalistas` limita a 5.

Use `oraculo metricas --json` para histórico agregado e `--export` para salvar snapshot completo (auditorias de performance). A persistência agora fica em `.oraculo/historico-metricas/metricas-historico.json` (ignorado no Git). Em execuções legacy, se esse diretório ainda não existir mas o arquivo antigo `.oraculo/metricas-historico.json` existir, ele será usado automaticamente via fallback de migração. Para limpar todo o histórico basta remover a pasta:

```bash
rm -rf .oraculo/historico-metricas
````

Ou no Windows PowerShell:

````powershell
Remove-Item -Recurse -Force .oraculo/historico-metricas
```bash

Pode ser adicionado um script npm (`cleanup:metricas`) futuramente se desejado.

Contrato JSON (`diagnosticar --json`) inclui `parseErros.totalOriginais` e `parseErros.agregados` para transparência.

Blocos adicionais:

- `linguagens`: resumo das extensões analisadas ordenadas por frequência.
- `guardianCacheDiffHits`: número de hits do cache de diff intra-processo (otimização Guardian).
- `estruturaIdentificada.melhores[].confidence` e deltas agora apresentados internamente com formatação padronizada (ex: `+92.0%`).

```jsonc
{
  "linguagens": {
    "total": 230,
    "extensoes": { "ts": 120, "js": 40, "kt": 5, "java": 3, "xml": 2 },
  },
}
````

Isso facilita métricas de adoção multi-stack e priorização de analistas dedicados.

### Filtros Pontuais de Arquivos (`--include` / `--exclude`)

Use para um diagnóstico focado (investigar somente uma pasta, ou incluir node_modules pontualmente, ou excluir arquivos de teste). Ambos aceitam:

- Múltiplas ocorrências da mesma flag (`--include a --include b`)
- Lista separada por vírgula e/ou espaços (`--include "a,b,c"` ou `--include "a b c"`)
- Separação por espaços dentro do valor (`--exclude "dist/** docs/**"`)
  Espaços e vírgulas são normalizados e duplicados removidos. Padrões são globs micromatch.

Regras de precedência:

1. Se `--include` estiver presente e não vazio: somente arquivos que casem pelo menos um pattern listado serão considerados (ignora os ignores padrão; ex.: permite inspecionar `node_modules`).
2. Em seguida aplica-se `--exclude` (remove qualquer arquivo que casar com algum pattern extra).
3. Se `--include` não for usado: usa ignores padrão e depois aplica `--exclude`.

Exemplos:

````bash
# Incluir apenas arquivos TypeScript e package.json
oraculo diagnosticar --include "src/**/*.ts,package.json"

# Inspecionar apenas node_modules (bypass do ignore padrão) para auditoria pontual
oraculo diagnosticar --include "node_modules/**"

# Incluir somente código de produção e excluir testes
oraculo diagnosticar --include "src/**" --exclude "**/*.test.ts,**/*.spec.ts"

# Múltiplas ocorrências equivalentes a lista combinada
oraculo diagnosticar --include src/core/** --include src/guardian/** --exclude "**/*.test.ts"

# Excluir diretórios de documentação e arquivos de build extras
oraculo diagnosticar --exclude "docs/**,dist/**"

# Combinação: focar em duas pastas específicas e ainda excluir mocks
oraculo diagnosticar --include "src/core/**,src/guardian/**" --exclude "**/mocks/**"
```powershell

Boas práticas:

- Evite listas muito grandes de globs: separe investigações em execuções menores.
- Use `--json` junto quando integrar em scripts (a saída filtrada reduz ruído e volume de dados). Em `--json`, logs intermediários são silenciados e apenas o objeto final é impresso.
- Para auditorias de dependências, combine com flags silenciosas: `oraculo diagnosticar --include "node_modules/**" --silence --json`.

Notas:

- Suporta repetir a flag e listas com vírgulas e/ou espaços; padrões duplicados são normalizados.
- `node_modules` é ignorado por padrão, mas passa a ser analisado quando você o inclui explicitamente via `--include`.
- Para ver a consolidação dos padrões aplicados, use `--verbose` (fora de `--json`).

Observação importante: os analistas respeitam o conjunto de arquivos já filtrado pelo scanner/CLI. Não há mais limitação rígida a `src/`; o escopo é totalmente controlado por `--include`/`--exclude`.

Se precisar resetar filtros programaticamente, não passe as flags (elas não persistem em config).

### Exit Codes

| Flag                             | Descrição                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `-s, --silence`                  | Silencia todos os logs de informação e aviso (sobrepõe `--verbose`)                       |
| `-v, --verbose`                  | Exibe logs detalhados de cada arquivo e técnica analisada (ignorado se `--silence` ativo) |
| `-e, --export`                   | Gera arquivos de relatório detalhados (JSON e Markdown)                                   |
| `--debug`                        | Ativa modo de desenvolvimento (logs detalhados de debug)                                  |
| `-d, --dev`                      | Alias legado para `--debug` (deprecado)                                                   |
| `--scan-only`                    | Executa somente varredura e priorização, sem aplicar técnicas                             |
| `--json`                         | (diagnosticar/guardian) Saída estruturada JSON para uso em CI                             |
| `--log-estruturado`              | Ativa logging estruturado JSON (experimental)                                             |
| `--incremental/--no-incremental` | Liga/desliga análise incremental (experimental)                                           |
| `--metricas/--no-metricas`       | Liga/desliga métricas de análise (experimental)                                           |

| Comando        | Descrição                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `diagnosticar` | Análise completa (arquitetura, padrões, estrutura, guardian opcional). Suporta filtros `--include` e `--exclude` para glob patterns pontuais |
| `guardian`     | Cria/atualiza/verifica baseline de integridade                                                                                               |
| `podar`        | Lista ou remove (seguro) arquivos órfãos                                                                                                     |
| `metricas`     | Histórico agregado de métricas internas                                                                                                      |
| `analistas`    | Lista analistas registrados; suporta `--json`, `--output <arquivo>` e `--doc <arquivo>` para exportar catálogo                               |
| `reestruturar` | (experimental) Aplicar plano de reorganização                                                                                                |
| `perf`         | Baseline e comparação de performance sintética (subcomandos `baseline` e `compare`)                                                          |

zeladores/ # Correções e manutenção
guardian/ # Verificações e baseline
relatorios/ # Geração de relatórios
Limitações atuais:

- Suporta repetir a flag (`--include a --include b`) e listas por vírgula/espaços; padrões duplicados são normalizados.
- Listagem explícita de filtros aplicados aparece em `--verbose` (fora de `--json`).
- Mesmo com `--scan-only` e `--include`, `node_modules` pode ser ignorado em alguns cenários por guard-rails. Ver detalhes e próximos passos em `docs/DECISOES-ABORDAGEM-SCAN-FILTROS.md`.
  plugins/ # Plugins de teste carregados em cenários controlados

## 🧭 Comandos e Flags Detalhadas

Esta seção lista as opções implementadas por comando (além das flags globais).

### diagnosticar

- `-c, --compact` Modo compacto de logs (resumos e menos detalhes)
- `-V, --verbose` Modo verboso (além do global, prioriza detalhes do comando)
- `--listar-analistas` Lista técnicas/analistas ativos antes da análise
- `-g, --guardian-check` Executa verificação de integridade (Guardian) durante o diagnóstico
- `--json` Saída JSON estruturada (silencia logs intermediários e imprime apenas JSON final)
- `--include <padrao>` Glob(s) a incluir; pode repetir a flag, aceitar vírgulas/espaços
- `--exclude <padrao>` Glob(s) a excluir; pode repetir a flag, aceitar vírgulas/espaços

Exemplos rápidos:

  ```powershell
  # Diagnóstico padrão
  node dist/bin/index.js diagnosticar

  # Diagnóstico com Guardian e export de relatórios
  node dist/bin/index.js diagnosticar --guardian-check --export

  # JSON para CI, com filtros pontuais
  node dist/bin/index.js diagnosticar --json --include "src/**" --exclude "**/*.test.ts"
````

### guardian

- `-a, --accept-baseline` Aceita o baseline atual como o novo baseline
- `-d, --diff` Mostra diferenças entre o estado atual e o baseline
- `--full-scan` Ignora padrões de ignore para verificação pontual (não persiste baseline)
- `--json` Saída estruturada em JSON

Exemplos:

`````powershell
# Verificar integridade
node dist/bin/index.js guardian

# Mostrar diferenças
node dist/bin/index.js guardian --diff

# Aceitar baseline (não permitido com --full-scan)
node dist/bin/index.js guardian --accept-baseline
````powershell

### reestruturar (experimental)

- `-a, --auto` Aplica correções automaticamente sem confirmação (CUIDADO!)
- `--aplicar` Alias para `--auto` (deprecado futuramente)
- `--somente-plano` Exibe apenas o plano sugerido e sai (dry-run)
- `--domains` Organiza por `domains/<entidade>/<categoria>s`
- `--flat` Organiza por `src/<categoria>s`
- `--prefer-estrategista` Força uso do estrategista (ignora plano de arquétipos)
- `--preset <nome>` Preset de estrutura (`oraculo|node-community|ts-lib`)
- `--categoria <pair>` Overrides `chave=valor` (pode repetir)

Exemplos:

```powershell
# Somente gerar o plano (dry-run)
node dist/bin/index.js reestruturar --somente-plano

# Aplicar automaticamente usando preset padrão (oraculo)
node dist/bin/index.js reestruturar --auto
`````

### podar

- `-f, --force` Remove arquivos sem confirmação
- `--include <padrao>` Globs a incluir (repita ou use vírgulas/espaços)
- `--exclude <padrao>` Globs a excluir (repita ou use vírgulas/espaços)

Exemplos:

````powershell
node dist/bin/index.js diagnosticar --export; node dist/bin/index.js podar

# Remoção direta (cuidado)
node dist/bin/index.js podar --force
```powershell

### analistas

- `-j, --json` Saída em JSON
- `-o, --output <arquivo>` Exporta JSON com catálogo de analistas
- `-d, --doc <arquivo>` Gera documentação Markdown dos analistas

Exemplos:

```powershell
## 🔌 Domínios
node dist/bin/index.js analistas

# Exportar doc
node dist/bin/index.js analistas --doc docs/ANALISTAS.md
````

### perf

Comando para baseline e comparação de performance sintética.

Opções (aplicáveis ao grupo `perf`):

- `-d, --dir <dir>` Diretório de snapshots (default configurado no runtime)
- `-j, --json` Saída JSON
- `-l, --limite <n>` Limite de regressão em % (padrão 30)

Subcomandos:

- `perf baseline` Gera novo snapshot usando as últimas métricas conhecidas
- `perf compare` Compara dois últimos snapshots e sinaliza regressão

Exemplos:

````powershell
<<<<<<< HEAD
node dist/cli.js perf baseline --dir docs/perf

# Comparar (gate de regressão)
node dist/cli.js perf compare --dir docs/perf --json
=======
node dist/bin/index.js perf baseline --dir docs/perf

# Comparar (gate de regressão)
node dist/bin/index.js perf compare --dir docs/perf --json
>>>>>>> develop
```text

- Analistas: identificam padrões, estruturas e potenciais problemas (somente leitura)
- Arquitetos: consolidam diagnósticos de alto nível
- Zeladores: aplicam correções (ex: poda, reestruturação)
- Guardian: verifica integridade (hashes, baseline, diffs)
- Relatórios: geração de artefatos (Markdown / JSON)

## 🔬 Analistas (resumo)

- detector-dependencias — heurísticas de dependências e sinais de stack
- detector-estrutura — extração de sinais estruturais globais
- analista-funcoes-longas — funções extensas/complexas
- analista-padroes-uso — padrões de uso agregados do código
- ritual-comando — boas práticas de comandos (handlers nomeados)
- todo-comments — comentários TODO pendentes (agregado por arquivo)

Catálogo completo e detalhes: veja `src/analistas/README.md`.
Para gerar um documento estático do catálogo: `oraculo analistas --doc docs/ANALISTAS.md`.

## 🤝 Contribuir

Leia `CONTRIBUTING.md` e consulte a seção de Scripts e Tooling abaixo.

## 🧭 Roadmap & Checklist

`docs/CHECKLIST.md` mantém backlog vivo. Este README não replica listas para evitar divergência.

## � Camadas de Teste

Resumo rápido na seção de Qualidade e Testes abaixo.

## 📑 Agregação de PARSE_ERRO

Para evitar ruído excessivo:

- Por padrão (`PARSE_ERRO_AGRUPAR=true`) múltiplos erros de parsing no mesmo arquivo são consolidados.
- Limite de ocorrências individuais antes de agrupar: `PARSE_ERRO_MAX_POR_ARQUIVO` (default: 1).
- A contagem total original é preservada em `parseErros.totalOriginais` (modo `diagnosticar --json`).
- Campo `agregados` indica quantos foram suprimidos por agrupamento.
- Ajuste via config/env: `PARSE_ERRO_AGRUPAR=false` para listar todos; aumentar `PARSE_ERRO_MAX_POR_ARQUIVO` para tolerar mais entradas antes de condensar.
- Para tornar parsing errors blockers, defina `PARSE_ERRO_FALHA=true` (gate útil em pipelines mais rigorosos).

## 🛡️ Segurança (Plugins & Caminhos)

Medidas atuais:

- Whitelist de extensões para carregamento de plugins (`.js`, `.mjs`, `.cjs`, `.ts`) — evita execução de binários ou formatos arbitrários.
- Sanitização de paths relativos removendo sequências de escape (`../`, `~`) fora da raiz do projeto.
- Validação defensiva de globs: limita número de `**` e padrões potencialmente explosivos (mitiga varreduras custosas).
- Baseline Guardian não pode ser aceita em modo `--full-scan` (evita “fotografar” estado potencialmente inseguro / bypass de ignore temporário).
- Fallback determinístico de hash se algoritmos criptográficos indisponíveis (garante integridade mínima para diff).

Expectativas para contribuições:

- Qualquer novo ponto de carregamento dinâmico deve validar extensão e residir dentro da raiz do repo.
- Evitar `eval` / `Function` dinâmica; se inevitável, justificar em PR.
- Acesso a FS sempre via helpers centralizados (`lerEstado` / `salvarEstado`).

Próximos reforços (sugeridos):

- Lista de blocklist para nomes de plugins comuns maliciosos
- Métrica de tempo por plugin para detectar outliers de performance
- Flag de modo estrito que falha em qualquer plugin com erro

## 📜 Guardian JSON (Resumo)

Quando executado com `--json`, o comando `guardian` retorna objeto com:

```json
{
  "status": "ok" | "baseline-criado" | "baseline-aceito" | "alteracoes-detectadas" | "erro",
  "diff": {
    "adicionados": [],
    "alterados": [],
    "removidos": []
  },
  "politicas": {
    "permiteAdds": true,
    "permiteChanges": true,
    "permiteDeletes": true
  },
  "baselinePath": "./.oraculo/baseline.json",
  "fullScan": false
}
````

Notas:

- Em `fullScan=true` não é permitido aceitar baseline.
- Em caso de erro estrutural/hard (ex: IO), `status: "erro"` e processo sai com código != 0.

---

## 🔐 Pipeline Local vs CI

Para garantir que o que passa localmente também passe no GitHub Actions (Linux):

| Etapa          | Local (VSCode / Git)             | CI (Actions)                          | Observações                                  |
| -------------- | -------------------------------- | ------------------------------------- | -------------------------------------------- |
| Formatação     | Prettier on save / `lint-staged` | `npm run format` (fail on diff)       | Pre-commit impede commit fora do padrão      |
| Lint           | ESLint (formatOnSave fixAll)     | `npm run lint` (warnings permitidos)  | Ajuste regras conforme maturidade            |
| Typecheck      | `npm run typecheck`              | `npm run typecheck`                   | Sem diferenças                               |
| Testes unidade | `npm run test:unit`              | `npm run test:unit` dentro de `check` | E2E separados para velocidade                |
| Testes E2E     | `npm run test:e2e`               | Job dedicado pós build                | Usa binário dist real                        |
| Cobertura      | Opcional local                   | `npm run coverage` + gate             | Gate falha se limiar abaixo                  |
| Segurança deps | `npm audit` (manual)             | `npm run security:deps` (não falha)   | Falhas críticas podem virar hard fail depois |
| Build artefato | `npm run build`                  | Artifact `dist` publicado             | Útil para inspeção / releases                |

### Husky & lint-staged

Hooks configurados:

- `pre-commit`: roda `lint-staged` aplicando Prettier e ESLint somente nos arquivos staged.

Se precisar pular (não recomendado):

````bash
HUSKY=0 git commit -m "chore: bypass hook"
```bash

### Scripts Principais

```bash
npm run check:style   # lint + prettier check + typecheck
npm run check         # estilo + testes de unidade
npm run test:e2e      # apenas E2E
````

### Variáveis Úteis

- `PARSE_ERRO_FALHA=true` pode ser usado para fazer parse errors agregados falharem o diagnóstico.

---

## 🛡️ Licença e Terceiros

Distribuído sob a licença MIT. Uso comercial, fork, modificação e redistribuição são permitidos.

Avisos de terceiros: este projeto inclui dependências open source cujas licenças e, quando aplicável, textos de licença completos são listados em `THIRD-PARTY-NOTICES.txt` (EN) e `AVISOS-DE-TERCEIROS.pt-BR.txt` (cabeçalho em pt-BR; textos legais mantidos no idioma original).

Como atualizar o arquivo de avisos:

````bash
# Gera/atualiza a versão padrão (EN)
npm run licenses:notice

# Gera/atualiza a versão com cabeçalho em português
npm run licenses:notice:pt-br
```bash

Isso gera/atualiza os arquivos com base nas dependências de produção instaladas.

### Por que MIT?

- Reduz fricção de adoção em empresas (compliance já conhece o texto padrão)
- Maximiza probabilidade de contribuições externas (licença reconhecida e permissiva)
- Evita ambiguidade de termos subjetivos como “uso comercial” / “revenda”
- Simplifica packaging em registries, distros e automações (SPDX: MIT)
- Permite que qualquer pessoa experimente, derive e integre sem negociar exceções
- Foco do projeto é impacto e comunidade, não captura de valor via restrição

Se surgir necessidade futura de oferecer extras proprietários, dá para fazer via modelo open-core sem alterar o core livre.

## 🙏 Agradecimentos

Este projeto se apoia em software livre mantido por uma comunidade incrível.

- Avisos e licenças de terceiros: consulte `THIRD-PARTY-NOTICES.txt` (EN) e `AVISOS-DE-TERCEIROS.pt-BR.txt` (cabeçalho em pt-BR).
- Os textos legais das licenças são reproduzidos no idioma original para preservar a validade jurídica.
- A todas as pessoas mantenedoras e contribuidoras de OSS: obrigado pelo trabalho e pela distribuição aberta que torna este projeto possível.

## 🚀 Performance

Snapshots sintéticos: `npm run perf:baseline` (consulte seção de Performance acima).

---

## 🔗 Documentação Adicional

- Guardian: `docs/guardian.md`
- Arquétipos & Reestruturação: consulte `docs/GUIA_REESTRUTURAR.md`
- Plugins: consulte seção de Plugins & Extensões acima
- Tooling & Qualidade: consulte seção de Scripts e Tooling abaixo
- Performance: consulte seção de Performance acima
- **Novas Funcionalidades v0.2.0**: `docs/NOVAS-FUNCIONALIDADES-v0.2.0.md`
- Checklist / Roadmap Ativo: `docs/CHECKLIST.md`
- Camadas de Teste: consulte seção de Qualidade e Testes abaixo
- Analistas (técnicas): `src/analistas/README.md`
- Catálogo de Analistas (gerado): `docs/ANALISTAS.md`
- Relatório de Progresso: `docs/relatorios/RELATORIO.md`
- Monitor de Dependências: `docs/MONITOR_DEPENDENCIAS.md`
- Especificações: `docs/specs/ESPECIFICACOES.md`

---

Autor: Italo C Lopes — Licença MIT
````
