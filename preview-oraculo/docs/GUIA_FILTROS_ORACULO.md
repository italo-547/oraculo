> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.


# Sistema de Filtros do Oráculo

## Visão Geral

O Oráculo possui um sistema de filtros hierárquico para controlar quais arquivos são incluídos ou excluídos durante a análise. Este sistema permite flexibilidade para diferentes cenários de uso.

## Hierarquia de Precedência

### 1. Flags CLI (Prioridade Máxima)

As flags de linha de comando têm a **prioridade máxima** e sobrescrevem qualquer outra configuração:

```bash
# Exemplo: incluir apenas arquivos TypeScript
oraculo diagnosticar --include "src/**/*.ts"

# Exemplo: excluir arquivos de teste
oraculo diagnosticar --exclude "**/*.test.*"

# Exemplo: combinação de include/exclude
oraculo diagnosticar --include "src/**" --exclude "src/**/*.test.*"
```

### 2. Configuração do Usuário (oraculo.config.json)

A configuração no arquivo `oraculo.config.json` é aplicada quando **não há flags CLI** especificadas:

```json
{
  "INCLUDE_EXCLUDE_RULES": {
    "globalExcludeGlob": [
      "node_modules/**",
      "**/node_modules/**",
      "dist/**",
      "**/dist/**",
      "**/*.log"
    ],
    "defaultExcludes": ["temp/**", "**/*.tmp"]
  }
}
```

**Nota**: `defaultExcludes` é um campo legado. Prefira usar `globalExcludeGlob` para novas configurações.

### 3. Padrões do Sistema (Fallback)

Quando não há configuração do usuário, o Oráculo usa padrões recomendados baseados no tipo de projeto detectado:

- **Node.js**: `node_modules/`, `npm-debug.log*`, `coverage/`, etc.
- **TypeScript**: `dist/`, `*.tsbuildinfo`, etc.
- **Python**: `__pycache__/`, `*.pyc`, etc.
- **Genérico**: Padrões básicos como `**/.git/**`, `**/*.log`, etc.

## Campos de Configuração

### INCLUDE_EXCLUDE_RULES

| Campo               | Tipo       | Descrição                                       |
| ------------------- | ---------- | ----------------------------------------------- |
| `globalIncludeGlob` | `string[]` | Padrões glob para inclusão (usando micromatch)  |
| `globalExcludeGlob` | `string[]` | Padrões glob para exclusão (usando micromatch)  |
| `globalInclude`     | `string[]` | Padrões simples para inclusão (substring match) |
| `globalExclude`     | `string[]` | Padrões simples para exclusão (substring match) |
| `defaultExcludes`   | `string[]` | **Legado** - use `globalExcludeGlob`            |
| `dirRules`          | `object`   | Regras específicas por diretório                |

## Comportamento dos Filtros

### Lógica de Inclusão/Exclusão

1. **Includes ativos**: Quando `--include` é usado, **apenas** arquivos que casam com os padrões de include são analisados
2. **Includes inativos**: Quando não há `--include`, todos os arquivos são candidatos, exceto os excluídos
3. **Excludes sempre aplicados**: Padrões de exclusão são aplicados após os includes

### Grupos de Include

Os padrões `--include` suportam grupos com lógica AND/OR:

```bash
# Grupo único: arquivos devem casar src/ E (.ts OU .tsx)
oraculo diagnosticar --include "src/**/*.ts,src/**/*.tsx"

# Múltiplos grupos: arquivos devem casar (src/ E .ts) OU (tests/ E .test.ts)
oraculo diagnosticar --include "src/**/*.ts" --include "tests/**/*.test.ts"
```

### Expansão Automática

Padrões simples de include são automaticamente expandidos:

```bash
# "src" se expande para "src/**"
# "node_modules" se expande para "node_modules/**"
oraculo diagnosticar --include "src"
```

## Cenários de Uso

### Análise Focada

```bash
# Analisar apenas código fonte
oraculo diagnosticar --include "src/**" --exclude "**/*.test.*"

# Analisar apenas um diretório específico
oraculo diagnosticar --include "packages/api/**"
```

### Análise com Dependências

```bash
# Incluir node_modules (remove automaticamente dos excludes)
oraculo diagnosticar --include "node_modules/**"

# Análise completa incluindo dependências
oraculo diagnosticar --include "src/**" --include "node_modules/**"
```

### Configuração Personalizada

```json
{
  "INCLUDE_EXCLUDE_RULES": {
    "globalExcludeGlob": ["**/node_modules/**", "**/dist/**", "**/*.log", "temp/**", ".cache/**"]
  }
}
```

## Resolução de Conflitos

### Precedência Clara

1. **CLI flags** sempre ganham
2. **Configuração do usuário** é usada quando não há CLI
3. **Padrões do sistema** são o último recurso

### Sincronização Automática

O sistema sincroniza automaticamente:

- `ZELADOR_IGNORE_PATTERNS` (para poda)
- `GUARDIAN_IGNORE_PATTERNS` (para verificação de integridade)

### Campos Legados

- `defaultExcludes` é mantido para compatibilidade
- Será removido na versão 1.0.0
- Use `globalExcludeGlob` para novas configurações

## Debugging

### Ver Filtros Ativos

Use `--verbose` para ver quais filtros estão sendo aplicados:

```bash
oraculo diagnosticar --verbose --include "src/**"
# Mostra: "Filtros ativos: include=[src/**] exclude=[node_modules/**, ...]"
```

### Verificação de Padrões

Para debugar padrões glob, use ferramentas como:

- [micromatch](https://www.npmjs.com/package/micromatch) (biblioteca usada internamente)
- [glob-tester](https://globster.xyz/) (testador online)

## Boas Práticas

1. **Seja específico**: Use padrões o mais específicos possível
2. **Prefira globs**: Use `globalExcludeGlob` em vez de `globalExclude` para mais poder
3. **Teste seus padrões**: Use `--verbose` para verificar se os filtros estão funcionando
4. **Documente**: Comente configurações complexas no `oraculo.config.json`
5. **Versione**: Mantenha configurações de filtro versionadas com o projeto

## Exemplos Avançados

### Monorepo com Múltiplos Pacotes

```json
{
  "INCLUDE_EXCLUDE_RULES": {
    "globalExcludeGlob": ["**/node_modules/**", "**/dist/**", "**/*.log", "packages/**/temp/**"]
  }
}
```

### Projeto com Build Customizado

```bash
# Excluir build artifacts customizados
oraculo diagnosticar --exclude "build/**" --exclude ".tmp/**"
```

### Análise de Testes Apenas

```bash
# Analisar apenas arquivos de teste
oraculo diagnosticar --include "**/*.test.*" --include "**/*.spec.*"
```

