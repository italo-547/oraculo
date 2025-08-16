# Histórico de Decisões e Refatorações

Use este arquivo para registrar decisões arquiteturais, grandes refatorações e mudanças de rumo no projeto.

## 2025-08-12

- Sincronização de `detector-estrutura`: execução agora totalmente síncrona para alinhar com expectativas de testes e simplificar fluxo de diagnóstico.
- Substituição de leitura direta de conteúdo no `scanner` para usar `lerEstado` visando facilitar mocking e manter padrão de persistência.
- Introdução de gating de `process.exit` controlado por `process.env.VITEST` durante testes para evitar término prematuro do runner.
- Atualização de README e RELATORIO com estado atual (304 testes verdes) e roadmap ativo.
- Ajuste de testes do comando diagnosticar removendo dependência de side-effects de saída do processo.

## 2025-08-11

- Refatorações abrangentes nos módulos guardian (hash, baseline, sentinela, diff) para padronizar tipos.
- Expansão de testes cobrindo integração CLI e geração de relatórios.

## Notas Anteriores

- Estrutura modular (analistas / arquitetos / zeladores / guardian) consolidada.
- Persistência centralizada via `lerEstado` / `salvarEstado`.
