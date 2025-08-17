> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Pasta `src/analistas`

Este diretório concentra as técnicas de análise ("analistas") executadas pelo Oráculo durante o comando `diagnosticar`.

## O que é um Analista?

- Um analista é uma função (ou objeto com metadados) que inspeciona arquivos e produz ocorrências.
- Implementa o contrato definido em `src/tipos/tipos.ts` (interfaces `Tecnica`/`Analista`).
- Não modifica arquivos (somente leitura). Correções vivem em `src/zeladores/`.

## Analistas atuais (registro)

O registro central fica em `src/analistas/registry.ts`. Hoje inclui:

- `detector-dependencias` — heurísticas de dependências e sinais de stack
- `detector-estrutura` — extração de sinais estruturais globais
- `analista-funcoes-longas` — detecta funções extensas/complexas
- `analista-padroes-uso` — padrões de uso agregados do código
- `ritual-comando` — boas práticas para comandos (ex.: handlers nomeados)
- `todo-comments` — marca e agrega comentários TODO pendentes

Observação: a detecção de arquétipos (biblioteca de estruturas) é orquestrada pelo CLI via `detector-arquetipos.ts` e não faz parte do array de técnicas, pois consolida sinais de múltiplos arquivos e gera `planoSugestao`.

## Arquivos típicos nesta pasta

- `*-test.ts` e `*.extra.test.ts`: testes do analista (contrato, branches e exemplos extra)
- `registry.ts`: ponto único de registro das técnicas executadas
- `plano-reorganizacao.ts`: geração de plano a partir de um arquétipo (módulo compartilhado usado por `detector-arquetipos`)

## Convenções e boas práticas

- ESM puro (imports/exports), sem `require`.
- Tipos importados de `src/tipos/tipos.ts`; evite duplicar contratos.
- Preferir funções puras; efeitos colaterais devem ser documentados e isolados.
- Logs: use o `log` central. Para molduras, gere o bloco com `log.bloco`/`imprimirBloco` (não prefixe com `log.info`).
- Persistência: nunca use `fs.*` direto — utilize `lerEstado`/`salvarEstado` de `src/zeladores/util/persistencia.ts`.

## Executando e listando analistas

- Listar catálogo atual e exportar documentação:
  - `node dist/cli.js analistas --json`
  - `node dist/cli.js analistas --doc docs/ANALISTAS.md`
- Para depuração rápida durante o diagnóstico:
  - `node dist/cli.js diagnosticar --listar-analistas`

## Evolução

- Novos analistas devem ser adicionados ao `registroAnalistas` e cobertos por ao menos dois testes (`.test.ts` e `.extra.test.ts`).
- Caso precise de execução global (sem por-arquivo), avalie marcar o analista como global e validar o contrato no `executor`.
- Se um analista crescer muito, extraia helpers em `src/zeladores/util/` para reuso e testabilidade.
