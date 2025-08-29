# Estratégia de Testes - Detector de Arquétipos

Última atualização: 2025-08-28

Este documento descreve a estratégia de testes para o detector de arquétipos, incluindo abordagem de testes, cobertura e cenários críticos.

## Visão Geral

O detector de arquétipos (`detector-arquetipos.ts`) é responsável por identificar padrões estruturais em projetos JavaScript/TypeScript, classificando-os em arquétipos como `api-rest-express`, `fullstack`, `cli-modular`, etc.

## Estratégia de Testes

### 1. Cobertura de Cenários

#### Cenários de Pontuação (`detector-arquetipos.score.test.ts`)

- **Pontuação completa**: Verifica cálculo de score para todos os arquétipos
- **Cenários híbridos**: Testa detecção de estruturas mistas (ex: `api-rest-express` + `fullstack`)
- **Penalizações**: Valida aplicação de penalidades por arquivos proibidos
- **Bônus específicos**: Confirma bônus por dependências e padrões de arquivo

#### Cenários do Detector (`detector-arquetipos.detector.extra.test.ts`)

- **Baseline existente**: Testa prioridade de baseline sobre detecção atual
- **Baseline inexistente**: Verifica criação de baseline quando apropriado
- **Cenários de falha**: Testa tratamento de erros no planejamento de estrutura

### 2. Sinais Avançados

Os testes validam o enriquecimento heurístico através de sinais avançados:

```typescript
interface SinaisProjetoAvancados {
  funcoes: number; // Contagem de funções declaradas
  classes: number; // Contagem de classes
  tipos: string[]; // Tipos/interfaces detectados
  imports: string[]; // Módulos importados
  variaveis: number; // Variáveis globais
  frameworksDetectados: string[]; // Frameworks identificados
  dependencias: string[]; // Dependências do projeto
  scripts: string[]; // Scripts npm
  pastasPadrao: string[]; // Estrutura de pastas
  arquivosPadrao: string[]; // Arquivos de configuração
  arquivosConfig: string[]; // Arquivos de configuração
}
```

### 3. Sistema de Confiança

#### Cálculo de Confiança

```typescript
confidence = Math.min(100, Math.round((score / maxPossible) * 100));
```

#### Ajustes Contextuais

- **Frameworks**: +5% se frameworks detectados
- **TypeScript**: +3% se tipos > 10
- **Estrutura**: +4% se pastas padrão > 3
- **Penalizações**: -10% se arquivos proibidos > 2, -15% se requisitos faltantes > 50%

### 4. Cenários Críticos

#### Cenários Híbridos

- **api-rest-express + fullstack**: Detecta combinação de backend Express + frontend Next.js
- **Sobreposição de características**: Valida quando múltiplos arquétipos compartilham características
- **Sistema de votação**: Prioriza dominante, classifica como misto em empate

#### Cenários de Borda

- **Projetos pequenos**: Ajuste de confiança (+10%) para projetos < 20 arquivos
- **Projetos grandes**: Redução de confiança (-5%) se estrutura não clara em projetos > 500 arquivos
- **Estrutura mínima**: Confirma detecção mesmo com estrutura básica

## Arquétipos Suportados

| Arquétipo           | Descrição              | Peso Base | Características Principais               |
| ------------------- | ---------------------- | --------- | ---------------------------------------- |
| `api-rest-express`  | API REST com Express   | 1.3       | `src/controllers`, `express`, rotas REST |
| `fullstack`         | Next.js fullstack      | 1.4       | `pages`, `api`, `prisma`                 |
| `cli-modular`       | CLI modular            | 1.1       | `src/cli`, estrutura organizada          |
| `electron`          | Aplicação Electron     | 1.2       | `src/main`, estrutura específica         |
| `lib-tsc`           | Biblioteca TypeScript  | 1.0       | `src/index.ts`, estrutura limpa          |
| `monorepo-packages` | Monorepo               | 1.5       | `packages/`, workspaces                  |
| `bot`               | Bot (Discord/Telegram) | 0.9       | Estrutura simples, handlers              |
| `landing-page`      | Página simples         | 1.0       | `pages`, `components`                    |

## Sistema de Configuração

### Configurações Disponíveis

#### Padrão (Recomendado)

```typescript
const CONFIGURACAO_PADRAO = {
  THRESHOLD_CONFIANCA_MINIMA: 30,
  THRESHOLD_DIFERENCA_DOMINANTE: 15,
  PENALIDADE_MISSING_REQUIRED: 20,
  // ... outros parâmetros
};
```

#### Conservadora

- Thresholds mais rigorosos
- Penalidades mais altas
- Menos tolerante a variações

#### Permissiva

- Thresholds mais baixos
- Penalidades reduzidas
- Mais tolerante a estruturas incompletas

### Configuração via Ambiente

```bash
# Usar configuração conservadora
ORACULO_MODO_PONTUACAO=conservador

# Usar configuração permissiva
ORACULO_MODO_PONTUACAO=permissivo

# Usar configuração padrão (padrão)
ORACULO_MODO_PONTUACAO=padrao
```

## Métricas de Qualidade

### Cobertura de Testes

- **Linhas**: 100% (gate obrigatório)
- **Ramos**: 90% (mínimo aceitável)
- **Funções**: 96% (mínimo aceitável)

### Cenários de Teste

- ✅ Pontuação completa por arquétipo
- ✅ Cenários híbridos e mistos
- ✅ Penalizações e bônus
- ✅ Baseline e drift
- ✅ Cenários de erro
- ✅ Configurações alternativas

## Manutenção e Evolução

### Adição de Novos Arquétipos

1. Definir características em `arquetipos-defs.ts`
2. Atualizar pesos base conforme maturidade
3. Adicionar testes específicos
4. Validar contra projetos reais

### Ajuste de Pesos

- Monitorar falsos positivos/negativos
- Ajustar baseado em feedback real
- Manter equilíbrio entre arquétipos
- Documentar mudanças no CHANGELOG

### Monitoramento de Performance

- Tempo de detecção por projeto
- Precisão da classificação
- Taxa de estruturas "desconhecidas"
- Feedback de usuários sobre precisão

## Referências

- [CHECKLIST.md](../CHECKLIST.md) - Status atual do projeto
- [detector-arquetipos.ts](../../src/analistas/detector-arquetipos.ts) - Implementação principal
- [arquetipos-defs.ts](../../src/analistas/arquetipos-defs.ts) - Definições de arquétipos
- [configuracao-pontuacao.ts](../../src/analistas/configuracao-pontuacao.ts) - Configuração de pontuação
