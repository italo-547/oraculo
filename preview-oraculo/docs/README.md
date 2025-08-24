> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Organização da pasta docs

Sugestão de estrutura para documentação e histórico do projeto:

- `docs/relatorios/`: Relatórios gerados automaticamente ou manualmente.
- `docs/historico/`: Decisões arquiteturais, changelogs, e histórico de refatorações.
- `docs/specs/`: Especificações técnicas, padrões de API, contratos e exemplos de uso.
- `docs/CHECKLIST.md`: Checklist de melhorias, pendências e histórico de ajustes.
- `docs/MONITOR_DEPENDENCIAS.md`: Guia para monitoramento e atualização de dependências.
  (Relatórios principais vivem em `docs/relatorios/`.)

Adapte e expanda conforme o crescimento do projeto.

## Referências úteis

- Guardian: `docs/guardian.md`
- Relatórios: `docs/relatorios/RELATORIO.md`
- Estruturas/Arquétipos: `docs/estruturas/README.md`
- Decisões do scanner e filtros: `docs/DECISOES-ABORDAGEM-SCAN-FILTROS.md`

## Nova organização (resumo)

Criamos uma organização mais navegável para a documentação. Abaixo os diretórios principais:

- `docs/guides/` — guias práticos e operacionais (desenvolvimento, tooling, monitoramento de dependências).
- `docs/policies/` — políticas de proveniência, licenciamento e diretrizes legais/éticos.
- `docs/roadmap/` — roadmap e histórico consolidado (roadmaps, decisões de alto nível).
- `docs/estruturas/`, `docs/specs/`, `docs/relatorios/`, `docs/tests/` — mantidos nas áreas especializadas.

## Referências rápidas

- Guia de desenvolvimento: `docs/guides/development.md`
- Tooling e políticas de qualidade: `docs/guides/tooling.md`
- Monitoramento de dependências: `docs/guides/monitor-deps.md`
- Política de proveniência: `docs/policies/proveniencia.md`

## Observações

- Documentos históricos/obsoletos foram removidos para reduzir ruído. O planejamento ativo permanece em `docs/CHECKLIST.md`.
- Nota: `node_modules` é ignorado por padrão, mas ao incluir explicitamente via `--include` (ex.: `--include node_modules/**`) o scanner passa a considerar esse diretório, inclusive em `--scan-only`.

Adapte e expanda conforme o crescimento do projeto.
