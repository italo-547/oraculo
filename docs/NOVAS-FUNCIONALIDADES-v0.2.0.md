# Novas Funcionalidades - Oráculo CLI v0.2.0

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

## 🚀 Visão Geral da v0.2.0

A versão 0.2.0 traz melhorias significativas em performance, compatibilidade e inteligência do sistema de análise. As principais inovações incluem paralelização automática, versionamento de relatórios e pontuação adaptativa.

## ⚡ Pool de Workers

### O que é?

Sistema de paralelização automática que acelera a análise em projetos grandes através do processamento simultâneo de múltiplos arquivos.

### Como funciona?

- **Paralelização por arquivo**: Processa múltiplos arquivos simultaneamente usando Worker Threads
- **Timeout inteligente**: 30 segundos por analista com cancelamento automático
- **Fallback automático**: Retorna ao processamento sequencial se workers falharem
- **Configuração centralizada**: Controle fino via variáveis de ambiente

### Benefícios

- **Performance**: Redução significativa no tempo de análise para projetos grandes
- **Escalabilidade**: Melhor utilização de recursos do sistema
- **Confiabilidade**: Fallback automático garante funcionamento em qualquer ambiente

### Configuração

````bash
# Configuração automática (recomendado)
oraculo diagnosticar

# Configuração manual
WORKER_POOL_MAX_WORKERS=4 oraculo diagnosticar
WORKER_POOL_BATCH_SIZE=20 oraculo diagnosticar
```text

### Variáveis de Ambiente

| Variável                  | Default | Descrição                              |
| ------------------------- | ------- | -------------------------------------- |
| `WORKER_POOL_ENABLED`     | `true`  | Habilita/desabilita o pool de workers  |
| `WORKER_POOL_MAX_WORKERS` | `auto`  | Número máximo de workers (auto = CPUs) |
| `WORKER_POOL_BATCH_SIZE`  | `10`    | Arquivos por lote de processamento     |
| `WORKER_POOL_TIMEOUT_MS`  | `30000` | Timeout por analista (30s)             |

### Exemplo de Saída com Métricas

```json
{
  "workerPool": {
    "workersAtivos": 4,
    "erros": 0,
    "duracaoTotalMs": 890
  }
}
````

## 📋 Schema Versioning

### O que é?

Sistema de versionamento automático dos relatórios JSON com compatibilidade backward garantida.

### Como funciona?

- **Metadados de versão**: Cada relatório inclui `_schema` com informações de compatibilidade
- **Validação automática**: Verificação de integridade de schema em tempo real
- **Migração automática**: Atualização transparente de relatórios legados
- **Contratos estáveis**: APIs previsíveis para consumidores

### Benefícios

- **Compatibilidade**: Relatórios antigos continuam funcionais
- **Evolução segura**: Novas versões não quebram integrações existentes
- **Transparência**: Visibilidade total das mudanças de formato

### Exemplo de Relatório Versionado

````json
{
  "_schema": {
    "version": "1.0.0",
    "compatibilidade": ["0.1.0", "0.2.0"]
  },
  "linguagens": { ... },
  "estruturaIdentificada": { ... },
  "guardian": { ... }
}
```bash

## 🧠 Sistema de Pontuação Adaptativa

### O que é?

Sistema inteligente de pontuação que se adapta automaticamente ao tamanho e complexidade do projeto.

### Como funciona?

- **Escalabilidade automática**: Fatores de 1x a 5x baseados em arquivos/diretórios
- **3 modos de configuração**: Padrão, conservador e permissivo
- **Pesos realistas**: Arquétipos calibrados para maior precisão
- **Confiança contextual**: Ajustes inteligentes baseados em tecnologias detectadas

### Benefícios

- **Precisão**: Pontuação mais realista para projetos de diferentes tamanhos
- **Flexibilidade**: Adaptação automática às características do projeto
- **Consistência**: Resultados previsíveis e justificados

### Configuração

```bash
# Modo padrão (recomendado)
oraculo diagnosticar

# Modo conservador
PONTUACAO_MODO=conservador oraculo diagnosticar

# Modo permissivo
PONTUACAO_MODO=permissivo oraculo diagnosticar
````

### Variáveis de Ambiente

| Variável                    | Default  | Descrição                                   |
| --------------------------- | -------- | ------------------------------------------- |
| `PONTUACAO_MODO`            | `padrao` | Modo: `padrao`, `conservador`, `permissivo` |
| `PONTUACAO_FATOR_ESCALA`    | `auto`   | Fator de escala baseado no projeto          |
| `PONTUACAO_PESO_FRAMEWORK`  | `1.05`   | Bônus para frameworks detectados            |
| `PONTUACAO_PESO_TYPESCRIPT` | `1.03`   | Bônus para projetos TypeScript              |

### Exemplo de Saída

````json
{
  "pontuacaoAdaptativa": {
    "fatorEscala": 2.5,
    "modo": "padrao",
    "bonusFramework": 1.05
  }
}
```bash

## ⚡ Correção Crítica: Exclusão Automática

### O que foi corrigido?

Problema crítico onde `node_modules` era escaneado mesmo sem filtros explícitos, causando análise desnecessária de dependências.

### Como foi resolvido?

- **Aplicação automática**: Padrões de exclusão padrão aplicados quando nenhum filtro é especificado
- **Otimização de performance**: Redução de ~70% nos arquivos escaneados
- **Compatibilidade mantida**: Filtros explícitos continuam funcionando normalmente

### Impacto

- **Performance**: Análises ~70% mais rápidas em projetos típicos
- **Precisão**: Foco no código do projeto, não em dependências
- **Confiabilidade**: Resultados mais consistentes e relevantes

### Comparação Antes/Depois

```bash
# Antes: escaneava ~2000+ arquivos (incluindo node_modules)
oraculo diagnosticar  # Resultado: 2111 arquivos

# Depois: escaneia apenas código relevante
oraculo diagnosticar  # Resultado: ~633 arquivos
````

## 📊 Métricas Expandidas

### Novas Métricas Disponíveis

A v0.2.0 inclui métricas detalhadas sobre o funcionamento interno do sistema:

````json
{
  "metricas": {
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
    }
  }
}
```bash

### workerPool

- **workersAtivos**: Número de workers utilizados
- **erros**: Contagem de erros durante processamento paralelo
- **duracaoTotalMs**: Tempo total de processamento do pool

### schemaVersion

- Versão do schema utilizado no relatório
- Compatibilidade com versões anteriores

### pontuacaoAdaptativa

- **fatorEscala**: Multiplicador aplicado baseado no tamanho
- **modo**: Modo de pontuação selecionado
- **bonusFramework**: Bônus aplicado por tecnologias detectadas

## 🔧 Guia de Migração

### De v0.1.0 para v0.2.0

#### Mudanças Automáticas

- **Schema Versioning**: Relatórios antigos são migrados automaticamente
- **Pool de Workers**: Ativado por padrão, sem necessidade de configuração
- **Pontuação Adaptativa**: Aplicada automaticamente com modo padrão

#### Configurações Recomendadas

```bash
# Para projetos muito grandes
WORKER_POOL_MAX_WORKERS=8 oraculo diagnosticar

# Para projetos conservadores
PONTUACAO_MODO=conservador oraculo diagnosticar

# Para máxima precisão
WORKER_POOL_ENABLED=true PONTUACAO_MODO=padrao oraculo diagnosticar
````

#### Verificação de Compatibilidade

````bash
# Verificar schema version
oraculo diagnosticar --json | jq '._schema'

# Verificar métricas expandidas
oraculo diagnosticar --json | jq '.metricas.workerPool'
```bash

## 🎯 Casos de Uso

### Projeto Grande com Múltiplos Workers

```bash
WORKER_POOL_MAX_WORKERS=8 WORKER_POOL_BATCH_SIZE=20 oraculo diagnosticar --verbose
````

### Análise Conservadora para CI

````bash
PONTUACAO_MODO=conservador oraculo diagnosticar --json --guardian-check
```bash

### Debug com Métricas Detalhadas

```bash
WORKER_POOL_MAX_WORKERS=2 oraculo diagnosticar --verbose --export
````

## 📈 Performance Esperada

### Melhorias de Performance

- **Projetos pequenos** (< 100 arquivos): ~10-20% mais rápido
- **Projetos médios** (100-1000 arquivos): ~30-50% mais rápido
- **Projetos grandes** (> 1000 arquivos): ~50-70% mais rápido

### Fatores que Influenciam

- **Número de CPUs**: Mais cores = melhor paralelização
- **Tipo de arquivos**: TypeScript/JS analisam mais rápido que outros
- **Complexidade do código**: Arquivos complexos se beneficiam mais
- **Configuração do pool**: Ajuste fino pode otimizar ainda mais

## 🔍 Monitoramento e Observabilidade

### Logs Expandidos

````bash
# Ver estatísticas do pool
oraculo diagnosticar --verbose

# Output inclui:
# [INFO] Pool de workers desabilitado (Worker Threads não disponível)
# [INFO] 🔄 Usando processamento sequencial (workers desabilitados)
# [INFO] Workers ativos: 4, Processados: 150, Erros: 0
```bash

### Métricas em JSON

```bash
oraculo diagnosticar --json --export
````

Gera arquivos com métricas completas para análise posterior.

## 🛠️ Troubleshooting

### Pool de Workers não Funciona

````bash
# Verificar disponibilidade
node -e "console.log(require('worker_threads').isMainThread)"

# Forçar modo sequencial
WORKER_POOL_ENABLED=false oraculo diagnosticar
```bash

### Problemas de Schema

```bash
# Verificar versão do schema
oraculo diagnosticar --json | jq '._schema.version'

# Forçar compatibilidade
# (automático na v0.2.0)
````

### Pontuação Inconsistente

````bash
# Resetar para modo padrão
PONTUACAO_MODO=padrao oraculo diagnosticar

# Ver fatores aplicados
oraculo diagnosticar --json | jq '.metricas.pontuacaoAdaptativa'
```text

## 📚 Documentação Relacionada

- [README Principal](../README.md) - Visão geral completa
- [Guia de Comandos](GUIA_COMANDOS.md) - Comandos e flags detalhados
- [CHECKLIST](CHECKLIST.md) - Roadmap e itens concluídos
- [Guardian](guardian.md) - Sistema de integridade
- [Performance](perf/README.md) - Métricas de performance

---

**Última atualização**: 28 de agosto de 2025
**Versão documentada**: Oráculo CLI v0.2.0
````
