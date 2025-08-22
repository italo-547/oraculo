> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Changelog

Todas as mudanças notáveis deste repositório serão documentadas aqui.

## [Unreleased]

### Adicionado
- Filtros dinâmicos `--include`/`--exclude` com suporte a flags repetidas, vírgulas e espaços.
- Harmonização: inclusão explícita de `node_modules` (ex.: `--include node_modules/**`) agora funciona inclusive em `--scan-only`.
- Saída `--json` com logs intermediários silenciados e escape Unicode \uXXXX para estabilidade em Windows/CI.

### Alterado
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
