> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Guia Completo dos Comandos do Oráculo

## Visão Geral

Este guia documenta todos os comandos principais do Oráculo CLI, suas flags disponíveis e combinações práticas de uso.

## Comando `diagnosticar`

Executa uma análise completa do repositório, identificando problemas estruturais, padrões de código e integridade.

### Flags Disponíveis

| Flag                 | Alias | Descrição                                                    | Padrão  |
| -------------------- | ----- | ------------------------------------------------------------ | ------- |
| `--compact`          | `-c`  | Modo compacto de logs (resumos e menos detalhes)             | `false` |
| `--verbose`          | `-V`  | Modo verboso (mais detalhes nos relatórios)                  | `false` |
| `--listar-analistas` | -     | Lista técnicas/analistas ativos antes da análise             | `false` |
| `--guardian-check`   | `-g`  | Executa verificação de integridade (guardian) no diagnóstico | `false` |
| `--json`             | -     | Saída JSON estruturada (para CI/integrações)                 | `false` |
| `--detalhado`        | -     | Exporta relatório de arquétipos detalhado                    | `false` |
| `--include <padrao>` | -     | Glob pattern a INCLUIR                                       | `[]`    |
| `--exclude <padrao>` | -     | Glob pattern a EXCLUIR adicionalmente                        | `[]`    |

### Combinações Comuns

#### 1. Diagnóstico Básico

````bash
# Diagnóstico completo padrão
oraculo diagnosticar

# Diagnóstico compacto
oraculo diagnosticar --compact

# Diagnóstico verboso com mais detalhes
oraculo diagnosticar --verbose
```bash

#### 2. Com Verificação de Integridade

```bash
# Diagnóstico com verificação do Guardian
oraculo diagnosticar --guardian-check

# Diagnóstico completo com Guardian (modo verboso)
oraculo diagnosticar --guardian-check --verbose
````

#### 3. Filtros de Arquivos

````bash
# Analisar apenas arquivos TypeScript
oraculo diagnosticar --include "src/**/*.ts"

# Excluir arquivos de teste
oraculo diagnosticar --exclude "**/*.test.*"

# Análise focada em diretórios específicos
oraculo diagnosticar --include "src/components/**" --include "src/hooks/**"
```bash

#### 4. Saída Estruturada

```bash
# Saída JSON para CI/CD
oraculo diagnosticar --json

# JSON com filtros específicos
oraculo diagnosticar --json --include "src/**/*.js" --exclude "node_modules/**"
````

#### 5. Listagem de Técnicas

````bash
# Ver técnicas ativas antes da análise
oraculo diagnosticar --listar-analistas

# Listar técnicas em modo compacto
oraculo diagnosticar --listar-analistas --compact
# Diagnóstico completo padrão
```bash

# Diagnóstico compacto
### Cenários de Uso

# Diagnóstico verboso com mais detalhes
#### Desenvolvimento Ativo

```bash
# Verificação rápida durante desenvolvimento
oraculo diagnosticar --compact --include "src/**/*.ts"
````

#### Integração CI/CD

````bash
# Diagnóstico estruturado para pipelines
oraculo diagnosticar --json --guardian-check
```bash

#### Análise Detalhada

# Analisar apenas arquivos TypeScript
```bash
# Análise completa com todos os detalhes
# Excluir arquivos de teste
oraculo diagnosticar --verbose --detalhado --guardian-check
````

# Análise focada em diretórios específicos

---

## Comando `podar`

Remove arquivos órfãos e lixo do repositório, mantendo apenas arquivos referenciados.

### Flags do Podar

| Flag                 | Alias | Descrição                             | Padrão  |
| -------------------- | ----- | ------------------------------------- | ------- |
| `--force`            | `-f`  | Remove arquivos sem confirmação       | `false` |
| `--include <padrao>` | -     | Glob pattern a INCLUIR                | `[]`    |
| `--exclude <padrao>` | -     | Glob pattern a EXCLUIR adicionalmente | `[]`    |

### Uso Básico do Podar

# Ver técnicas ativas antes da análise

#### 1. Análise Apenas (Dry-run)

# Listar técnicas em modo compacto

````bash
# Ver arquivos órfãos sem remover
oraculo podar

# Análise com filtros
oraculo podar --include "src/**" --exclude "test/**"
```bash
# Verificação rápida durante desenvolvimento

#### 2. Remoção Automática

```bash
# Remover arquivos órfãos automaticamente
oraculo podar --force
# Diagnóstico estruturado para pipelines

# Remoção com filtros específicos
oraculo podar --force --include "temp/**" --exclude "logs/**"
````

### Cenários do Podar

# Análise completa com todos os detalhes

#### Limpeza de Desenvolvimento

````bash
# Limpar arquivos temporários
oraculo podar --force --include "temp/**" --include "*.tmp"
```bash

#### Limpeza Segura

```bash
# Ver o que será removido antes
oraculo podar --include "build/**" --exclude "build/index.html"
````

---

## Comando `guardian`

Gerencia e verifica a integridade do ambiente do Oráculo.

### Flags do Guardian

| Flag                | Alias | Descrição                                                   |
| ------------------- | ----- | ----------------------------------------------------------- |
| `--accept-baseline` | `-a`  | Aceita o baseline atual como o novo baseline de integridade |
| `--diff`            | `-d`  | Mostra as diferenças entre o estado atual e o baseline      |
| `--full-scan`       | -     | Executa verificação sem aplicar GUARDIAN_IGNORE_PATTERNS    |
| `--json`            | -     | Saída em JSON estruturado                                   |

### Uso Básico do Guardian

#### 1. Verificação Básica

````bash
# Verificar integridade atual
oraculo guardian

# Verificação em JSON
oraculo guardian --json
```bash

#### 2. Comparação com Baseline

# Limpar arquivos temporários
```bash
# Ver diferenças com o baseline
oraculo guardian --diff

# Diferenças em formato JSON
oraculo guardian --diff --json
````

#### 3. Aceitação de Baseline

````bash
# Aceitar novo baseline
oraculo guardian --accept-baseline

# Aceitar baseline em JSON
oraculo guardian --accept-baseline --json
```bash

#### 4. Verificação Completa

```bash
# Verificação sem filtros de ignorados
oraculo guardian --full-scan

# Verificação completa com diferenças
oraculo guardian --full-scan --diff
````

### Cenários do Guardian

#### Setup Inicial

````bash
# Criar baseline inicial
oraculo guardian
# Aceitar o baseline criado
oraculo guardian --accept-baseline
```bash

#### Verificação de Segurança

```bash
# Verificar integridade antes de commits importantes
oraculo guardian --diff
````

#### Verificação Estruturada

````bash
# Verificação estruturada para pipelines
oraculo guardian --json
```bash

---

## Comandos Combinados

### Fluxos de Trabalho Completos

#### 1. Análise e Limpeza Inicial

```bash
# 1. Diagnóstico completo
oraculo diagnosticar --verbose

# 2. Limpeza de arquivos órfãos
oraculo podar --force

# 3. Verificação de integridade
oraculo guardian
````

#### 2. Preparação para Deploy

````bash
# Diagnóstico estruturado para CI
oraculo diagnosticar --json --guardian-check

# Limpeza automatizada
oraculo podar --force --include "temp/**" --include "dist/**"

# Verificação final
oraculo guardian --diff
```bash

#### 3. Desenvolvimento Ativo

```bash
# Verificação rápida durante desenvolvimento
oraculo diagnosticar --compact --include "src/**/*.ts"

# Limpeza de arquivos temporários
oraculo podar --force --include "*.tmp" --include ".DS_Store"

# Verificação de integridade
oraculo guardian --diff
````

### Scripts de Automação

#### Setup de Projeto

# 1. Diagnóstico completo

````bash
# 2. Limpeza de arquivos órfãos
#!/bin/bash
# setup.sh - Configuração inicial do projeto
# 3. Verificação de integridade

echo "🔍 Executando diagnóstico inicial..."
oraculo diagnosticar --verbose

echo "🧹 Limpando arquivos órfãos..."
oraculo podar --force
# Diagnóstico estruturado para CI

echo "🛡️ Configurando baseline de integridade..."
# Limpeza automatizada
oraculo guardian --accept-baseline

# Verificação final
echo "✅ Setup concluído!"
```text

#### Pipeline CI/CD

```yaml
# Verificação rápida durante desenvolvimento
# .github/workflows/ci.yml
name: CI
# Limpeza de arquivos temporários
on: [push, pull_request]

# Verificação de integridade
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Diagnosticar
        run: npx oraculo diagnosticar --json
      - name: Podar
        run: npx oraculo podar --force
      - name: Guardian
        run: npx oraculo guardian --json
````

---

## Referências Rápidas

### Flags Mais Usadas

| Comando        | Flag                | Uso Comum                      |
| -------------- | ------------------- | ------------------------------ |
| `diagnosticar` | `--json`            | Integração CI/CD               |
| `diagnosticar` | `--verbose`         | Análise detalhada              |
| `diagnosticar` | `--include`         | Foco em diretórios específicos |
| `podar`        | `--force`           | Limpeza automatizada           |
| `podar`        | `--include`         | Filtros de limpeza             |
| `guardian`     | `--diff`            | Verificação de mudanças        |
| `guardian`     | `--accept-baseline` | Aceitar novo estado            |

### Códigos de Saída

| Comando        | Código | Significado              |
| -------------- | ------ | ------------------------ |
| `diagnosticar` | 0      | Sucesso (sem problemas)  |
| `diagnosticar` | 1      | Problemas encontrados    |
| `podar`        | 0      | Sucesso                  |
| `podar`        | 1      | Erro durante execução    |
| `guardian`     | 0      | Integridade OK           |
| `guardian`     | 1      | Problemas de integridade |

### Variáveis de Ambiente

| Variável                    | Comando        | Efeito                      |
| --------------------------- | -------------- | --------------------------- |
| `VITEST`                    | Todos          | Modo de teste (sem exit)    |
| `ORACULO_DETECT_TIMEOUT_MS` | `diagnosticar` | Timeout detecção arquétipos |
| `COMPACT_MODE`              | `diagnosticar` | Modo compacto forçado       |
| `VERBOSE`                   | `diagnosticar` | Modo verboso forçado        |

---

## Última atualização

28 de agosto de 2025
