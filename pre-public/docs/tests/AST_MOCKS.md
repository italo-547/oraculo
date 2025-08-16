# Estratégia de Mocks de AST (Draft)

Este documento centralizará padrões para criação e reutilização de mocks AST em testes.

## Objetivos

- Evitar repetição de trechos de código fonte simulados
- Padronizar helpers para gerar AST parcial / NodePath conforme necessário
- Minimizar acoplamento a detalhes internos de Babel

## Padrões Propostos

- Criar helper `criarFonteSimples(...trechos)` reutilizável em `src/zeladores/util/` (ou pasta tests utils)
- Preferir testes de comportamento (ocorrências produzidas) ao invés de asserts diretos de forma do AST
- Introduzir fábrica de nós mínima se necessário (ex: função para gerar função longa sintética)

## Próximos Passos

- [ ] Mapear casos atuais que duplicam strings fonte
- [ ] Extrair helpers para diretório `tests/utils` (não publicado)
- [ ] Documentar naming e convenções de geração (ex: `geraFuncao(nome, linhas, params)`)

> Este arquivo é um rascunho inicial e será expandido quando o item correspondente do checklist for atacado.
