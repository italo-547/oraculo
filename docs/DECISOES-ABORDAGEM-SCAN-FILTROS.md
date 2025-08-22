> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Decisões e Abordagem: Scanner, Includes/Excludes e Modo JSON

Data: 2025-08-22
Responsável: Equipe Oráculo

## Por que esta abordagem

- Determinismo e estabilidade em CI: consolidamos o modo `--json` com logs silenciados e escaping de Unicode para evitar ruído e inconsistências em consoles (especialmente no Windows).
- Performance e previsibilidade: o scanner limita a travessia a raízes derivadas dos `--include` quando presentes, mantendo `relPath` em POSIX para compatibilidade de matching.
- Política de filtros clara:
  - Include: grupos (AND dentro do grupo; OR entre grupos). Expansão de diretórios sem curingas para cobrir recursivamente (`x/**` e `**/x/**`). Padrões com sufixo `/**` também são tratados por prefixo.
  - Exclude: sempre aplicados; quando o usuário não fornece exclude, aplicamos guard-rails (ex.: `node_modules/**`).
  - Ignorados padrão: aplicados apenas quando não há `--include` ativo.
- Robustez de parsing: timeouts e lazy imports em linguagens não-Babel; `.d.ts` ignorado.

## Problemas enfrentados e meio-termo adotado

- Logs quebrando molduras e JSON: resolvido com silenciamento seletivo em `--json` e uso de molduras via `log.bloco` somente em modo não-JSON.
- Ambiguidade em includes: implementamos semântica de grupos AND/OR e expansão determinística de diretórios sem glob.
- Cross-platform (Windows): normalização de `relPath` para POSIX e escaping de Unicode no `--json` para evitar artefatos.
- Coverage gate por pouco (branches): adicionamos micro-testes focados sem alterar o comportamento dos detectores.

## Harmonização de `node_modules`

O comportamento foi harmonizado: ao fornecer `--include` que corresponda a `node_modules` (ex.: `--include node_modules/**`), o scanner inclui os arquivos desse diretório mesmo em `--scan-only`, mantendo a exclusão por padrão quando não houver `--include`.

- Include/Exclude: precedência mantém-se — include limita escopo, exclude filtra em seguida.
- Normalização cross-platform: `relPath` é tratado em POSIX internamente; padrões são normalizados.
- JSON mode: logs intermediários ficam silenciados; apenas o objeto final é impresso.

## Impacto em documentação e testes

- Atualizamos testes para cobrir ramos críticos (ex.: require de `.js` em arquivos TS).
- Mantivemos três avisos de ESLint como lembretes de evolução (documentados no código).
- CI: thresholds de cobertura elevados (Linhas/Decl ≥ 95%; Funções ≥ 96%; Ramos ≥ 90%).

## Decisão

- Manter a política atual até o ajuste dirigido de `node_modules` em `--scan-only + --include`.
- Registrar o item no CHECKLIST e priorizar na próxima iteração do scanner.
