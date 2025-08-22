> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Estratégia de Mocks de AST (Draft) — atualizado 2025-08-16

Este documento centralizará padrões para criação e reutilização de mocks AST em testes.

## Objetivos

- Evitar repetição de trechos de código fonte simulados
- Padronizar helpers para gerar AST parcial / NodePath conforme necessário
- Minimizar acoplamento a detalhes internos de Babel

## Padrões Propostos

- Criar helper `criarFonteSimples(...trechos)` reutilizável em `src/zeladores/util/` (ou pasta tests utils)
- Preferir testes de comportamento (ocorrências produzidas) ao invés de asserts diretos de forma do AST
- Introduzir fábrica de nós mínima se necessário (ex: função para gerar função longa sintética)

## Notas práticas (Vitest / Windows)

- Preferir mocks dos helpers de persistência (`lerEstado`/`salvarEstado`) em vez de `fs`, conforme padrão do projeto.
- Quando houver saída JSON em testes, garanta escape unicode (`\uXXXX`) para caracteres fora de ASCII, inclusive pares substitutos (emojis). Há utilitários no comando `diagnosticar` cobrindo esses casos.
- Evitar dependência forte do shape do AST do Babel nos asserts; foque nos efeitos observáveis (ocorrências, métricas, contagens).

## Próximos Passos

- [ ] Mapear casos atuais que duplicam strings fonte
- [ ] Extrair helpers para diretório `tests/utils` (não publicado)
- [ ] Documentar naming e convenções de geração (ex: `geraFuncao(nome, linhas, params)`)

## Referências

- `src/nucleo/parser.ts`, `src/nucleo/constelacao/format.ts`
- `src/analistas/analista-funcoes-longas.ts`
- `tests` sob `src/analistas/` cobrindo visitors e casos-limite

> Este arquivo é um rascunho inicial e será expandido quando o item correspondente do checklist for atacado.
