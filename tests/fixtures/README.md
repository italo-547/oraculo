# Fixtures de Teste

Esta pasta contém arquivos sintéticos usados exclusivamente em testes:

Estrutura:

```text
fixtures/
  plugins/      # Plugins de exemplo usados em testes de carregamento/corretor
  arquivos/     # Arquivos genéricos (file1.ts, file2.ts) usados em testes de parsing/estado
```

Regras:

- Não referenciar fixtures em código de produção (apenas testes).
- Manter conteúdo mínimo e explícito (evitar lógica complexa).
- Se um fixture crescer demais, considerar gerar dinamicamente dentro do teste.
- Evitar sobrescrever fixtures entre testes (criar cópias temporárias se precisar mutar).

Adicionando novos fixtures:

1. Criar subpasta se houver nova categoria (ex: `fixtures/kotlin/`).
2. Explicar objetivo no topo do arquivo ou em README local.
3. Manter nomes autoexplicativos.

Remoção de lixo: fixtures não usados podem ser removidos após verificação de ausência de referências (grep no repositório).
