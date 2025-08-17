# Organização da pasta docs

Sugestão de estrutura para documentação e histórico do projeto:

- `docs/relatorios/`: Relatórios gerados automaticamente ou manualmente.
- `docs/historico/`: Decisões arquiteturais, changelogs, e histórico de refatorações.
- `docs/specs/`: Especificações técnicas, padrões de API, contratos e exemplos de uso.
- `docs/CHECKLIST.md`: Checklist de melhorias, pendências e histórico de ajustes.
- `docs/MONITOR_DEPENDENCIAS.md`: Guia para monitoramento e atualização de dependências.
- `docs/RELATORIO.md`: Relatório principal do projeto (pode ser movido para `relatorios/` se preferir).

Adapte e expanda conforme o crescimento do projeto.

## Referências úteis

- Guardian: `docs/guardian.md`
- Relatórios: `docs/relatorios/RELATORIO.md`
- Estruturas/Arquétipos: `docs/estruturas/README.md`
- Decisões do scanner e filtros: `docs/DECISOES-ABORDAGEM-SCAN-FILTROS.md`

> Nota:
> Mesmo com `--scan-only` e `--include`, `node_modules` pode ser ignorado em alguns cenários. Isso está documentado na decisão acima e registrado como ajuste futuro no `docs/CHECKLIST.md`.
