> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Decisões e Abordagem: Scanner, Includes/Excludes e Modo JSON

Data: 2025-08-17
Responsável: Equipe Oráculo

## Por que esta abordagem

- Determinismo e estabilidade em CI: consolidamos o modo `--json` com logs silenciados e escaping de Unicode para evitar ruído e inconsistências em consoles (especialmente no Windows).
- Performance e previsibilidade: o scanner limita a travessia a raízes derivadas dos `--include` quando presentes, mantendo `relPath` em POSIX para compatibilidade de matching.
- Política de filtros clara:
  - Include: grupos (AND dentro do grupo; OR entre grupos). Expansão de diretórios sem curingas para cobrir recursivamente (`x/**` e `**/x/**`).
  - Exclude: sempre aplicados; quando o usuário não fornece exclude, aplicamos guard-rails (ex.: `node_modules/**`).
  - Ignorados padrão: aplicados apenas quando não há `--include` ativo.
- Robustez de parsing: timeouts e lazy imports em linguagens não-Babel; `.d.ts` ignorado.

## Problemas enfrentados e meio-termo adotado

- Logs quebrando molduras e JSON: resolvido com silenciamento seletivo em `--json` e uso de molduras via `log.bloco` somente em modo não-JSON.
- Ambiguidade em includes: implementamos semântica de grupos AND/OR e expansão determinística de diretórios sem glob.
- Cross-platform (Windows): normalização de `relPath` para POSIX e escaping de Unicode no `--json` para evitar artefatos.
- Coverage gate por pouco (branches): adicionamos micro-testes focados sem alterar o comportamento dos detectores.

## Limitação conhecida (próximo ajuste)

Hoje, mesmo com `--scan-only` e `--include`, o Oráculo ainda ignora `node_modules` por padrão. O objetivo é permitir inspeções pontuais quando o usuário incluir explicitamente `node_modules` (por exemplo, `--include node_modules/**`) sem desmontar os guard-rails no caso geral.

- Situação atual: o scanner evita descer em `node_modules` a menos que detecte um include explícito de `node_modules` nos padrões. Entretanto, em alguns cenários o guard-rail ainda prevalece durante `--scan-only`.
- Próximo passo: harmonizar a detecção de inclusão explícita de `node_modules` para que `--scan-only` respeite `--include` quando o padrão corresponder a `node_modules`, mantendo exclusão por padrão nos demais casos.

## Impacto em documentação e testes

- Atualizamos testes para cobrir ramos críticos (ex.: require de `.js` em arquivos TS).
- Mantivemos três avisos de ESLint como lembretes de evolução (documentados no código).
- CI: thresholds de cobertura permanecem (Linhas/Decl/Funs ≥ 90%; Ramos ≥ 88%).

## Decisão

- Manter a política atual até o ajuste dirigido de `node_modules` em `--scan-only + --include`.
- Registrar o item no CHECKLIST e priorizar na próxima iteração do scanner.
