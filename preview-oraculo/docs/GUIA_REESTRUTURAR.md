# Guia de Flags do Comando Reestruturar

## Visão Geral

O comando `reestruturar` do Oráculo permite reorganizar a estrutura de arquivos do projeto aplicando correções estruturais e otimizações. Este guia documenta todas as combinações possíveis de flags e seus comportamentos.

## Flags Disponíveis

### Flags de Execução

| Flag | Alias | Descrição | Padrão |
|------|-------|-----------|---------|
| `--auto` | `-a` | Aplica correções automaticamente sem confirmação | `false` |
| `--aplicar` | - | Alias de `--auto` (deprecated futuramente) | `false` |
| `--somente-plano` | - | Exibe apenas o plano sugerido (dry-run) | `false` |

### Flags de Estrutura

| Flag | Descrição | Valores | Padrão |
|------|-----------|---------|---------|
| `--domains` | Organiza por `domains/<entidade>/<categoria>s` | `boolean` | `false` |
| `--flat` | Organiza por `src/<categoria>s` (sem domains) | `boolean` | `false` |
| `--preset <nome>` | Preset de estrutura | `oraculo`, `node-community`, `ts-lib` | `oraculo` |
| `--prefer-estrategista` | Força uso do estrategista (ignora plano de arquétipos) | `boolean` | `false` |
| `--categoria <pair>` | Override de categoria (formato: `chave=valor`) | `string[]` | `[]` |

### Flags de Filtro

| Flag | Descrição | Exemplo |
|------|-----------|---------|
| `--include <padrao>` | Glob pattern a INCLUIR | `--include "src/**/*.ts"` |
| `--exclude <padrao>` | Glob pattern a EXCLUIR adicionalmente | `--exclude "test/**"` |

## Combinações Comuns

### 1. Análise Apenas (Dry-run)

```bash
# Ver apenas o plano sem aplicar mudanças
oraculo reestruturar --somente-plano

# Ver plano com filtros específicos
oraculo reestruturar --somente-plano --include "src/**/*.ts" --exclude "test/**"
```

### 2. Aplicação Automática

```bash
# Aplicar automaticamente sem confirmação
oraculo reestruturar --auto

# Aplicar com filtros
oraculo reestruturar --auto --include "src/**/*.js" --exclude "node_modules/**"
```

### 3. Estrutura Personalizada

```bash
# Usar estrutura flat (src/<categoria>s)
oraculo reestruturar --flat --auto

# Usar estrutura por domains
oraculo reestruturar --domains --auto

# Usar preset específico
oraculo reestruturar --preset node-community --auto

# Sobrescrever categorias
oraculo reestruturar --categoria "controller=handlers" --categoria "model=entities" --auto
```

### 4. Estratégia de Planejamento

```bash
# Forçar uso do estrategista
oraculo reestruturar --prefer-estrategista --auto

# Combinar com estrutura específica
oraculo reestruturar --prefer-estrategista --domains --preset ts-lib --auto
```

## Combinações Avançadas

### Filtros e Estrutura

```bash
# Reestruturar apenas arquivos TypeScript em estrutura flat
oraculo reestruturar --flat --include "src/**/*.ts" --exclude "test/**" --auto

# Reestruturar por domains apenas arquivos de uma entidade específica
oraculo reestruturar --domains --include "src/user/**" --include "src/auth/**" --auto

# Excluir arquivos de configuração durante reestruturação
oraculo reestruturar --exclude "config/**" --exclude "*.config.js" --auto
```

### Dry-run com Filtros Avançados

```bash
# Ver plano apenas para arquivos modificados recentemente
oraculo reestruturar --somente-plano --include "**/*.ts" --exclude "**/node_modules/**"

# Análise focada em diretórios específicos
oraculo reestruturar --somente-plano --include "src/components/**" --include "src/hooks/**"
```

### Personalização Completa

```bash
# Reestruturação completa com todas as personalizações
oraculo reestruturar \
  --domains \
  --preset oraculo \
  --categoria "service=services" \
  --categoria "util=utils" \
  --include "src/**" \
  --exclude "src/legacy/**" \
  --exclude "**/*.test.ts" \
  --prefer-estrategista \
  --auto
```

## Comportamentos Especiais

### Prioridades e Conflitos

1. **Estrutura**: `--domains` tem prioridade sobre `--flat`
2. **Execução**: `--auto` e `--aplicar` são equivalentes
3. **Filtros**: `--include` tem prioridade sobre `--exclude` e ignores padrão
4. **Preset**: Valores padrão podem ser sobrescritos por `--categoria`

### Filtros Glob

Os padrões de filtro suportam:

- `**/*.ts` - Todos os arquivos TypeScript recursivamente
- `src/**` - Todo o diretório src recursivamente
- `*.config.js` - Arquivos de configuração na raiz
- `test/**` - Todo o diretório de testes

### Múltiplos Valores

```bash
# Múltiplos includes/excludes (pode repetir a flag)
oraculo reestruturar --include "src/**" --include "lib/**" --exclude "test/**" --exclude "docs/**"

# Ou usar vírgulas/espaços
oraculo reestruturar --include "src/**,lib/**" --exclude "test/** docs/**"
```

## Cenários de Uso

### Desenvolvimento Ativo

```bash
# Reestruturação rápida durante desenvolvimento
oraculo reestruturar --auto --include "src/**/*.ts" --exclude "**/*.test.ts"
```

### Refatoração Controlada

```bash
# Ver o plano antes de aplicar
oraculo reestruturar --somente-plano --domains --preset ts-lib
oraculo reestruturar --domains --preset ts-lib --auto  # Após aprovação
```

### Limpeza de Código Legado

```bash
# Reestruturar apenas código novo, ignorando legado
oraculo reestruturar --auto --exclude "src/legacy/**" --exclude "**/*.old.*"
```

### Migração de Estrutura

```bash
# Migrar de estrutura flat para domains
oraculo reestruturar --domains --categoria "controller=handlers" --auto
```

## Notas Importantes

- ⚠️ **Cuidado**: A flag `--auto` aplica mudanças automaticamente sem confirmação
- 📁 **node_modules**: É ignorado por padrão, mas pode ser incluído explicitamente
- 🔄 **Dry-run**: Use `--somente-plano` para visualizar mudanças antes de aplicar
- 📊 **Relatórios**: Relatórios são gerados automaticamente quando `--export` está habilitado
- 🎯 **Filtros**: Combinam com filtros globais definidos em `oraculo.config.json`

## Exemplos Práticos

### Projeto React/TypeScript

```bash
# Reestruturar componentes e hooks, ignorando testes
oraculo reestruturar --domains --include "src/components/**" --include "src/hooks/**" --exclude "**/*.test.*" --auto
```

### API Node.js

```bash
# Reestruturar rotas e middlewares
oraculo reestruturar --flat --categoria "route=routes" --categoria "middleware=middlewares" --include "src/**/*.js" --auto
```

### Biblioteca TypeScript

```bash
# Usar preset específico para bibliotecas
oraculo reestruturar --preset ts-lib --prefer-estrategista --exclude "examples/**" --auto
```

---

## Última atualização

28 de agosto de 2025
