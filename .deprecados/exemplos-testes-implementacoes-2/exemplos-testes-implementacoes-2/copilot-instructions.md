> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

## Helpers Utilitários e Persistência de Estado

## Helpers Utilitários e Persistência de Estado

(... conteúdo anterior ...)

## Novas Diretrizes (2025-08-16)

### Testes de Fixtures por Arquétipo

- Crie diretórios de fixtures em `tests/fixtures/estruturas/` para testar detecção de arquétipos.
- Adicione casos híbridos e de conflito de confiança.
- Testes devem simular a execução do motor heurístico e validar a identificação correta dos arquétipos.

### Testes de Combinações de Comandos/Options

- Teste todas as principais combinações de comandos e options da CLI.
- Garanta cobertura para casos que quebram ou geram warnings, criando issues para cada falha.
- Use mocks/spies para validar logs e outputs.

### Refatoração do comando-diagnosticar.ts

- Separe options em arquivo dedicado (`src/cli/options-diagnosticar.ts`).
- Modularize fases do comando em funções menores, facilitando manutenção e testes.

### Registro de Datas

- Sempre registre data de finalização ao marcar um item como concluído no `CHECKLIST.md`.
- No `copilot-instructions.md`, registre data da última atualização das diretrizes.

---

**Última atualização das diretrizes: 2025-08-16**

---

(... conteúdo anterior ...)
