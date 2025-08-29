> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

Este diretório armazena artefatos temporários de execuções de testes (snapshots, baselines, relatórios simulados).

Subpastas padronizadas:

- relatorios-test: saída de relatórios gerados por testes da CLI.
- tmp-corretor-destino-existe-test: fixtures temporárias do corretor de estrutura.
- tmp-perf-diff: baselines temporários dos testes de performance/diff.
- tmp-scan-only: saídas temporárias dos testes do scanner.

Estas pastas são ignoradas no .gitignore. Mantemos este README e um .gitkeep para preservar a estrutura.
