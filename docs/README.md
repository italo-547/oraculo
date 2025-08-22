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

### Arquivo legado

- Documentos históricos/obsoletos foram movidos para `docs/legado/`. Os arquivos originais mantêm apenas um stub de redirecionamento. Planejamento ativo: `docs/CHECKLIST.md`.

Nota: `node_modules` é ignorado por padrão, mas ao incluir explicitamente via `--include` (ex.: `--include node_modules/**`) o scanner passa a considerar esse diretório, inclusive em `--scan-only`. Os analistas seguem o conjunto de arquivos já filtrado pelo scanner/CLI.
