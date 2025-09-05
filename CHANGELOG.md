> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Changelog

Todas as mudanças notáveis deste repositório serão documentadas aqui.

## [0.2.0] - 2025-08-28

### Adicionado

- **Pool de Workers**: Sistema completo de paralelização por arquivo para melhorar performance em projetos grandes
  - Classe WorkerPool com gerenciamento de workers paralelos
  - Sistema de lotes configurável (batchSize padrão: 10 arquivos por worker)
  - Timeout individual por analista (30s padrão) com cancelamento automático
  - Fallback automático para processamento sequencial quando workers desabilitados
  - Worker executor em JavaScript puro para threads separadas
  - Configuração centralizada via variáveis de ambiente
  - Função de conveniência `processarComWorkers()` para fácil integração
  - Estatísticas detalhadas do pool (workers ativos, erros, duração)
  - Testes completos com 9 cenários cobrindo configuração e processamento

- **Sistema de Schema Versioning**: Versionamento completo dos relatórios JSON
  - Metadados de versão (`_schema`) em todos os relatórios JSON
  - Validação automática de schema com compatibilidade backward
  - Migração automática de relatórios legados
  - Utilitários para leitura de relatórios versionados
  - Integração com `gerador-relatorio.ts` e `relatorio-arquetipos.ts`
  - Testes completos (27 testes passando)

- **Sistema de Pontuação Adaptativa**: Pontuação inteligente baseada no tamanho do projeto
  - Constantes adaptativas baseadas em número de arquivos e diretórios
  - Sistema de fatores escaláveis (1x a 5x) para diferentes tamanhos de projeto
  - Configuração centralizada em `configuracao-pontuacao.ts` com 3 modos
  - Pesos de arquétipo recalibrados para maior realismo
  - Sistema de confiança inteligente com ajustes contextuais

- **Correção Crítica**: Exclusão padrão de `node_modules` no comando `diagnosticar`
  - Aplicação automática de padrões de exclusão padrão quando nenhum filtro é especificado
  - Redução de ~70% nos arquivos escaneados (2111 → 633 arquivos)
  - Manutenção da compatibilidade com filtros explícitos
  - Validação através de testes específicos

### Alterado

- **Correção de Exclusão Padrão**: Comando `diagnosticar` agora aplica corretamente padrões de exclusão padrão (`node_modules/**`, `dist/**`, `coverage/**`, etc.) quando nenhum filtro explícito é fornecido
- **Timeout por Analista**: Implementado timeout individual de 30 segundos por analista com cancelamento automático

### Corrigido

- **Problema de Exclusão**: Correção crítica onde `node_modules` era escaneado mesmo sem filtros explícitos devido a configuração vazia de `CLI_EXCLUDE_PATTERNS`

## [Unreleased]

### Melhorado

- Filtros dinâmicos `--include`/`--exclude` com suporte a flags repetidas, vírgulas e espaços.
- Harmonização: inclusão explícita de `node_modules` (ex.: `--include node_modules/**`) agora funciona inclusive em `--scan-only`.
- Saída `--json` com logs intermediários silenciados e escape Unicode \uXXXX para estabilidade em Windows/CI.

### Refatorado

- Analistas deixam de impor limitação rígida a `src/`; escopo agora é totalmente controlado pelo scanner/CLI via `--include`/`--exclude`.
- `ritual-comando`: reduz ruído — só reporta "padrao-ausente" em arquivos com face de comandos (cli/commands/comandos/bot).
- `todo-comments`: passa a respeitar o escopo do scanner; mantém filtros de testes/specs e extensões.

### Corrigido

- Normalização de caminhos no Windows (POSIX interno) em scanner e matching de padrões.
- Supressão de falsos positivos de parsing em `node_modules` quando não aplicável; políticas alinhadas para evitar inundação de `PARSE_ERRO`.

### Removido

- Hardcodes de escopo (ex.: checks fixos por `src/` e block amplo de `node_modules`) dentro de analistas.

### Interno/Infra

- Documentação atualizada (README principal, docs de decisões, docs/README, src/analistas/README).
- CHECKLIST atualizado com data 2025-08-22 e itens concluídos da harmonização.
- Build/tsc estabilizado; smoke tests leves para `diagnosticar --json` e `--scan-only`.

---

## [0.1.0] - 2025-08-18

### Adicionado

- CLI inicial com comandos: `diagnosticar`, `guardian`, `podar`, `analistas`, `perf`.
- Biblioteca inicial de analistas (padrões de uso, funções longas, TODOs, estrutura, dependências).
- Guardian com baseline e diffs; saída `--json`.

### Infra

- CI: lint, typecheck, testes, cobertura e gates.
- Licenças e avisos de terceiros; scripts utilitários.
