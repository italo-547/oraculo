# Roadmap de Iterações Propostas

Este documento consolida a proposta de próximos passos discutida para evoluir o Oráculo.
Mantê-lo atualizado evita perda de contexto entre ciclos.

---

## Checklist Prioritário

1. Testes automatizados mínimos
2. Flag pública para skipExec
3. Poda ainda mais segura (dry-run por padrão)
4. Ajustar priorização (pesos + comando de inspeção)
5. Guardian UX (aceitar baseline e silenciar re-scan redundante)
6. Documentação/guia de operação
7. Métricas e histórico (limpeza e resumo)
8. Hardening de persistência (erros e validação)
9. Plugins / extensões futuras (esqueleto)
10. Refino de logs (limite e agrupamento)

---

## Detalhamento

### 1. Testes Automatizados

- Casos: gerarHashHex fallback; detectarFantasmas (referenciado vs não; limiar de dias); priorização ignora meta no topo.
- Smoke CLI: diagnosticar, podar --force em sandbox.

### 2. Flag skipExec

- Expor `--scan-only` em `diagnosticar`.
- Somente prepara AST e imprime priorização + contagem.

### 3. Poda Segura (Iteração Atual Alvo 1)

- Modo padrão: sempre simulado a menos que `ORACULO_PODAR_CONFIRM=1` ou flag `--confirm`.
- Relatório pré-poda com motivos.
- Suporte `--limite <n>` para aplicar somente aos primeiros n candidatos.
- Persistir snapshot de segurança antes de mover.

### 4. Priorização

- Pesos externos via `ANALISE_PRIORIZACAO_PESOS` (JSON).
- Comando `fila` listando top 20 com score.
- Score zero obrigatório para meta.

### 5. Guardian UX

- Comando `guardian --accept` para aceitar baseline alterado.
- Skip re-scan quando baseline já verificado na mesma execução.
- Mensagem única consolidada: status e ação sugerida.

### 6. Documentação

- Atualizar `README.md` (secções: Segurança da Poda, Priorização, Guardian).
- Registrar mudanças de heurística em `docs/RELATORIO.md`.

### 7. Métricas

- Comando `metricas --resumo` exibindo média móvel e última execução, detectando regressões (>1.5x).
- Limpeza automática de histórico corrompido.

### 8. Persistência

- `salvarEstado` atômico (write + rename).
- validação básica de versão nos estados incrementais.
- Recuperação graciosa com log discreto.

### 9. Plugins

- Interface `PluginOraculo` com hooks opcionais.
- Descoberta via arquivo de configuração (`oraculo.plugins.*`).
- Tolerância a falhas (isolar exceptions de plugin).

### 10. Logs

- Opção global `--no-progress`.
- Progresso detalhado só se `--progress` explicitado.
- Agrupamento de logs repetitivos (ex: diretórios).

---

## Ordem Recomendada

- Iteração 1: (1,2,3)
- Iteração 2: (4,5,6)
- Iteração 3: (7,8)
- Iteração 4: (9,10)

## Detalhamento

### 1. Testes Automatizados

Casos:

- gerarHashHex fallback
- detectarFantasmas (referenciado vs não; limiar de dias)
- priorização ignora meta no topo

Smoke CLI:

- diagnosticar
- podar --force (sandbox)

### 2. Flag skipExec

- Expor `--scan-only` em `diagnosticar`.
- Somente prepara AST e imprime priorização + contagem.

### 3. Poda Segura (Iteração Atual Alvo 1)

- Modo padrão: sempre simulado a menos que `ORACULO_PODAR_CONFIRM=1` ou flag `--confirm`.
- Relatório pré-poda com motivos.
- Suporte `--limite <n>` para aplicar somente aos primeiros n candidatos.
- Persistir snapshot de segurança antes de mover.

### 4. Priorização

- Pesos externos via `ANALISE_PRIORIZACAO_PESOS` (JSON).
- Comando `fila` listando top 20 com score.
- Score zero obrigatório para meta.

### 5. Guardian UX

- Comando `guardian --accept` para aceitar baseline alterado.
- Skip re-scan quando baseline já verificado na mesma execução.
- Mensagem única consolidada: status e ação sugerida.

### 6. Documentação

- Atualizar `README.md` (secções: Segurança da Poda, Priorização, Guardian).
- Registrar mudanças de heurística em `docs/RELATORIO.md`.

### 7. Métricas

- Comando `metricas --resumo` exibindo média móvel e última execução, detectando regressões (>1.5x).
- Limpeza automática de histórico corrompido.

### 8. Persistência

- `salvarEstado` atômico (write + rename).
- Validação básica de versão nos estados incrementais.
- Recuperação graciosa com log discreto.

### 9. Plugins

- Interface `PluginOraculo` com hooks opcionais.
- Descoberta via arquivo de configuração (`oraculo.plugins.*`).
- Tolerância a falhas (isolar exceptions de plugin).

### 10. Logs

- Opção global `--no-progress`.
- Progresso detalhado só se `--progress` explicitado.
- Agrupamento de logs repetitivos (ex: diretórios).
