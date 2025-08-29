# Mapa de Reversão para Moves Aplicados

## Visão Geral

O **Mapa de Reversão** é um sistema que registra automaticamente todos os moves de arquivos realizados pelo Oráculo durante a reorganização estrutural, permitindo reverter essas mudanças quando necessário.

## Como Funciona

### Registro Automático

Quando o Oráculo move arquivos durante uma reorganização estrutural:

1. **Captura o estado original**: Conteúdo do arquivo antes do move
2. **Registra o move**: Origem, destino, motivo e timestamp
3. **Armazena no mapa**: Persistido em `.oraculo/mapa-reversao.json`
4. **Reescreve imports**: Se necessário, registra o conteúdo final

### Estrutura do Mapa

```json
{
  "versao": "1.0.0",
  "moves": [
    {
      "id": "move_1703123456789_abc123def",
      "timestamp": "2025-12-20T10:30:56.789Z",
      "origem": "src/controllers/user.ts",
      "destino": "app/controllers/user.ts",
      "motivo": "Reorganização estrutural",
      "importsReescritos": true,
      "conteudoOriginal": "import { User } from '../models/user';",
      "conteudoFinal": "import { User } from '../../models/user';"
    }
  ],
  "metadata": {
    "totalMoves": 1,
    "ultimoMove": "2025-12-20T10:30:56.789Z",
    "podeReverter": true
  }
}
```

## Comandos Disponíveis

### Listar Moves

```bash
# Lista todos os moves registrados
oraculo reverter listar
```

**Exemplo de saída:**

```text
📋 Mapa de Reversão (3 moves):

move_1703123456789_abc123def:
  📅 20/12/2025 10:30:56
  📁 src/controllers/user.ts → app/controllers/user.ts
  💬 Reorganização estrutural (imports reescritos)

move_1703123456790_def456ghi:
  📅 20/12/2025 10:31:23
  📁 src/services/auth.ts → app/services/auth.ts
  💬 Reorganização estrutural
```

### Reverter Arquivo Específico

```bash
# Reverte todos os moves de um arquivo
oraculo reverter arquivo src/controllers/user.ts
```

### Reverter Move Específico

```bash
# Reverte um move pelo ID
oraculo reverter move move_1703123456789_abc123def
```

### Status do Mapa

```bash
# Mostra estatísticas do mapa
oraculo reverter status
```

**Exemplo de saída:**

```text
📊 Status do Mapa de Reversão
==============================
Total de moves: 3
Último move: 20/12/2025 10:31:23
Arquivo: app/services/auth.ts
Motivo: Reorganização estrutural

💡 Comandos disponíveis:
  oraculo reverter listar    - Lista todos os moves
  oraculo reverter arquivo <arquivo> - Reverte moves de um arquivo
  oraculo reverter move <id> - Reverte move específico
  oraculo reverter limpar --force - Limpa histórico
```

### Limpar Histórico

```bash
# Remove todo o histórico (cuidado!)
oraculo reverter limpar --force
```

## Cenários de Uso

### 1. Reverter Move Acidental

```bash
# Moveu arquivo por engano
oraculo reverter arquivo src/components/button.ts
```

### 2. Testar Reorganização

```bash
# Aplica reorganização
oraculo reestruturar --apply

# Se não gostou, reverte tudo
oraculo reverter listar  # vê IDs
oraculo reverter move <id1>
oraculo reverter move <id2>
```

### 3. Rollback Parcial

```bash
# Reverte apenas arquivos específicos
oraculo reverter arquivo src/controllers/user.ts
oraculo reverter arquivo src/controllers/auth.ts
```

## Funcionalidades Avançadas

### Reversão Inteligente

- **Imports reescritos**: Restaura conteúdo original com imports corrigidos
- **Conteúdo preservado**: Mantém versão exata do arquivo antes do move
- **Ordem cronológica**: Reverte do mais recente para o mais antigo

### Segurança

- **Validação de arquivos**: Verifica se arquivos existem antes de reverter
- **Backup automático**: Conteúdo original sempre preservado
- **Transações**: Cada reversão é atômica

## Limitações

### Não Reverte

- Mudanças manuais no arquivo após o move
- Deletions acidentais do arquivo
- Modificações em outros arquivos que referenciam o movido

### Recomendações

- **Faça backup** antes de grandes reorganizações
- **Teste em branch** para mudanças significativas
- **Revise moves** antes de aplicar em produção

## Configuração

### Caminho do Mapa

Por padrão: `.oraculo/mapa-reversao.json`

Configurar via:

```bash
# Variável de ambiente
export ORACULO_STRUCTURE_REVERSE_MAP_PATH=".oraculo/custom-reversao.json"

# Ou via oraculo.config.json
{
  "STRUCTURE_REVERSE_MAP_PATH": ".oraculo/custom-reversao.json"
}
```

### Limitações de Segurança

O mapa respeita as configurações de segurança:

```json
{
  "SAFE_MODE": true,
  "ALLOW_MUTATE_FS": false
}
```

Quando `SAFE_MODE` ativo, as reversões são simuladas.

## Troubleshooting

### Erro: "Arquivo de destino não encontrado"

**Causa**: Arquivo foi movido ou deletado manualmente
**Solução**: Verifique se arquivo ainda existe no local esperado

### Erro: "Move não encontrado"

**Causa**: ID incorreto ou mapa corrompido
**Solução**: Use `oraculo reverter listar` para ver IDs válidos

### Erro: "Diretório de origem não existe"

**Causa**: Estrutura de diretórios mudou
**Solução**: Crie os diretórios necessários manualmente

## Exemplos Práticos

### Workflow Completo

```bash
# 1. Diagnóstico inicial
oraculo diagnosticar

# 2. Simulação de reorganização
oraculo reestruturar

# 3. Aplicação com registro
oraculo reestruturar --apply

# 4. Verificação
oraculo reverter status

# 5. Rollback se necessário
oraculo reverter arquivo <arquivo-problematico>
```

### Limpeza Periódica

```bash
# Remove moves antigos (opcional)
oraculo reverter limpar --force
```

## Referências

- [Comando Reestruturar](../commands/reestruturar.md)
- [Sistema de Guardian](../features/guardian.md)
- [Configurações de Segurança](../security/safe-mode.md)

---

**Última atualização**: Dezembro de 2025
**Versão**: 1.0.0
