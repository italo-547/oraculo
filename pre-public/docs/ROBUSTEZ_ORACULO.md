Roadmap de Robustez e Arquitetura Oráculo CLI

1. Interface Analista Unificada

- Introduzir interface Analista (nome, aplicar, test, metadados) e builder criarAnalista.
- Benefício: padroniza assinatura, facilita registro e introspecção.

2. Registro Central de Analistas

- Arquivo registry que agrega todos analistas com lazy import opcional.
- Permite habilitar/filtrar por categoria e sempreAtivo.

3. Cache de AST

- Map<relPath, {mtime, hashConteudo, ast}> para reutilizar parse entre analistas.
- Invalidação por mtime/hash.

4. Externalização de Limites

- Mover limites hardcoded (linhas, params, nesting) para config (ex: config.analise.limites.funcoes).
- Possibilita ajuste via arquivo config.json ou flags.

5. Isolamento de Erros

- Wrapper executor analistaTry(aplicar) captura exceções e gera Ocorrencia tipo ERRO_ANALISTA.
- Evita interrupção da pipeline.

6. Estrutura de Logging Estruturado

- Emissão de eventos {fase, analista, tempoMs, ocorrencias} em canal único.
- Futuro: exportar JSONL para auditoria.

7. Métricas e Performance

- Medir tempo por analista e total de parsing vs. análise.
- Reportar top N analistas mais lentos.

8. Incrementalidade

- Persistir hash/ocorrencias por arquivo; reprocessar somente alterados.
- Flag --full para forçar limpeza.

9. Sandbox de Plugins

- Execução de analistas externos em worker thread com tempo limite.
- Serializar dados essenciais (src, relPath, limites) e recolher ocorrencias.

10. Tipagem Fortalecida

- Tipos discriminados para Ocorrencia (tipo -> payload específico opcional).
- Geradores especializados: criarOcorrenciaComplexidade, etc.

11. Catalogo / Doc Automática

- Gerar tabela markdown de analistas (nome, categoria, descricao, limites) em docs/ANALISTAS.md.

12. API Pública Estável

- Exportar pacote "@oraculo/analise" com Analista, registrarAnalista, executarAnalise.

13. Config Dinâmico

- Merge de config default + config.json + flags CLI + env.
- Validar e emitir diff de overrides.

14. Estratégia de Erros AST

- Reclassificar erros de parsing (syntax) em ocorrencia PARSE_ERRO com trecho.

15. Pool de Workers (Escalabilidade)

- Paralelizar analistas que não dependem de ordem sobre diferentes arquivos.

16. Estratégia de Prioridade de Arquivos

- Analisar primeiro arquivos alterados recentes (git diff) e críticos (ex: cli.ts, executor).

17. Hash de Conteúdo Eficiente

- Substituir hashing manual por incremental (xxhash64).

18. Snapshot de Relatórios

- Armazenar versões anteriores e diff gerado quando variam.

19. Linter Interno de Analistas

- Validar que cada analista tem pelo menos um teste .test.ts e um .extra ou .edge.

20. Testes de Contrato

- Conjunto de testes que carregam todos analistas registrados e validam shape.

21. Tolerância a Falhas

- Tempo limite configurável por analista (default 2s) com cancelamento.

22. CLI UX

- Comando `oraculo analistas --listar` exibindo catálogo com limites atuais.

23. Registro de Versões

- Incluir versão do schema de ocorrência e analista na saída de relatórios JSON.

24. Modo Dev Interativo

- Watch + reexec analistas afetados ao salvar arquivo.

25. Segurança Básica

- Sanitização de caminhos e prevenção de path traversal em plugins externos.

Ordem de Implementação Recomendada (Fases):
Fase 1: (1,2,4,5) - Fundacional
Fase 2: (3,7,8,10) - Eficiência + Tipagem
Fase 3: (6,11,13,14) - Observabilidade + Config
Fase 4: (9,15,16,21) - Escalabilidade + Resiliência
Fase 5: (12,17,18,19,20,22,23,24,25) - Consolidação

Estado Atual:

- Concluídos:
  - (1) Interface Analista + builder
  - (2) Registro central
  - (3) Cache AST em memória
  - (4) Limites externalizados
  - (5) Isolamento de erros (ERRO_ANALISTA)
  - (6) Logging estruturado (eventos JSON opcionais)
  - (7) Métricas de performance (tempo por analista, parsing vs análise, cache hits/miss)
  - (8) Incrementalidade persistente (hash de conteúdo + reutilização de ocorrências)
  - (11) Doc automática (--doc)
  - (17) Hash de Conteúdo Eficiente (xxhash64 com fallback sha1)

- Em Progresso / Próximos Passos Detalhados:
  - (8) Evolução: granularidade por analista/config, limpeza seletiva e estatísticas de reaproveitamento persistidas.
  - (7) Evolução: persistir histórico de métricas e diffs entre execuções.
  - (13) Config Dinâmico (merge multi-fontes) – próximo alvo recomendado.
  - (10) Tipagem fortalecida de ocorrências (discriminated unions).
  - (14) Reclassificação de erros AST em PARSE_ERRO.

Histórico recente:

- Adicionada criação recursiva de diretórios em persistência.
- Incremental desabilitado por padrão para evitar interferência em testes; habilitado explicitamente onde necessário.
- Introduzido xxhash64 para acelerar comparação de conteúdo.

Este arquivo deve ser atualizado a cada avanço de fase.
