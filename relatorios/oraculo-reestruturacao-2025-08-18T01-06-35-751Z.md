# 🧩 Relatório de Reestruturação Oracular

**Data:** 2025-08-18T01:06:35.752Z  
**Execução:** Simulação  
**Origem do plano:** estrategista  
**Preset:** oraculo  
**Total de movimentos:** 64  
**Conflitos detectados:** 0

---

## Movimentos

| De                                                                                                         | Para                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| .deprecados/exemplos-testes-implementacoes/exemplos-testes-implementacoes/tests/utils/persistencia.spec.ts | src/domains/persistencia/**tests**/persistencia.spec.ts                                         |
| eslint.config.js                                                                                           | src/domains/eslint/config/eslint.config.js                                                      |
| src/analistas/analista-funcoes-longas.test.ts                                                              | src/domains/analista-funcoes-longas/**tests**/analista-funcoes-longas.test.ts                   |
| src/analistas/analista-padroes-uso.test.ts                                                                 | src/domains/analista-padroes-uso/**tests**/analista-padroes-uso.test.ts                         |
| src/analistas/analista-todo-comments.test.ts                                                               | src/domains/analista-todo-comments/**tests**/analista-todo-comments.test.ts                     |
| src/analistas/analistas-contrato.test.ts                                                                   | src/domains/analistas-contrato/**tests**/analistas-contrato.test.ts                             |
| src/analistas/detector-dependencias.test.ts                                                                | src/domains/detector-dependencias/**tests**/detector-dependencias.test.ts                       |
| src/analistas/detector-estrutura.test.ts                                                                   | src/domains/detector-estrutura/**tests**/detector-estrutura.test.ts                             |
| src/analistas/plano-reorganizacao.test.ts                                                                  | src/domains/plano-reorganizacao/**tests**/plano-reorganizacao.test.ts                           |
| src/analistas/ritual-comando.test.ts                                                                       | src/domains/ritual-comando/**tests**/ritual-comando.test.ts                                     |
| src/arquitetos/analista-estrutura.test.ts                                                                  | src/domains/analista-estrutura/**tests**/analista-estrutura.test.ts                             |
| src/arquitetos/diagnostico-projeto.test.ts                                                                 | src/domains/diagnostico-projeto/**tests**/diagnostico-projeto.test.ts                           |
| src/cli/comando-analistas.test.ts                                                                          | src/domains/comando-analistas/**tests**/comando-analistas.test.ts                               |
| src/cli/comando-atualizar.test.ts                                                                          | src/domains/comando-atualizar/**tests**/comando-atualizar.test.ts                               |
| src/cli/comando-diagnosticar-erro-string.test.ts                                                           | src/domains/comando-diagnosticar-erro-string/**tests**/comando-diagnosticar-erro-string.test.ts |
| src/cli/comando-diagnosticar.test.ts                                                                       | src/domains/comando-diagnosticar/**tests**/comando-diagnosticar.test.ts                         |
| src/cli/comando-guardian.test.ts                                                                           | src/domains/comando-guardian/**tests**/comando-guardian.test.ts                                 |
| src/cli/comando-metricas.test.ts                                                                           | src/domains/comando-metricas/**tests**/comando-metricas.test.ts                                 |
| src/cli/comando-perf.test.ts                                                                               | src/domains/comando-perf/**tests**/comando-perf.test.ts                                         |
| src/cli/comando-podar.test.ts                                                                              | src/domains/comando-podar/**tests**/comando-podar.test.ts                                       |
| src/cli/comando-reestruturar.test.ts                                                                       | src/domains/comando-reestruturar/**tests**/comando-reestruturar.test.ts                         |
| src/cli/comandos.test.ts                                                                                   | src/domains/comandos/**tests**/comandos.test.ts                                                 |
| src/cli/e2e-bin.test.ts                                                                                    | src/domains/e2e-bin/**tests**/e2e-bin.test.ts                                                   |
| src/cli/e2e-reestruturar.test.ts                                                                           | src/domains/e2e-reestruturar/**tests**/e2e-reestruturar.test.ts                                 |
| src/guardian/baseline.test.ts                                                                              | src/domains/baseline/**tests**/baseline.test.ts                                                 |
| src/guardian/constantes.test.ts                                                                            | src/domains/constantes/**tests**/constantes.test.ts                                             |
| src/guardian/diff.test.ts                                                                                  | src/domains/diff/**tests**/diff.test.ts                                                         |
| src/guardian/hash.test.ts                                                                                  | src/domains/hash/**tests**/hash.test.ts                                                         |
| src/guardian/registros.test.ts                                                                             | src/domains/registros/**tests**/registros.test.ts                                               |
| src/guardian/sentinela.test.ts                                                                             | src/domains/sentinela/**tests**/sentinela.test.ts                                               |
| src/guardian/verificador.test.ts                                                                           | src/domains/verificador/**tests**/verificador.test.ts                                           |
| src/guardian/vigiaOculto.test.ts                                                                           | src/domains/vigiaoculto/**tests**/vigiaOculto.test.ts                                           |
| src/nucleo/constelacao/cosmos.test.ts                                                                      | src/domains/cosmos/**tests**/cosmos.test.ts                                                     |
| src/nucleo/constelacao/format.test.ts                                                                      | src/domains/format/**tests**/format.test.ts                                                     |
| src/nucleo/constelacao/log.test.ts                                                                         | src/domains/log/**tests**/log.test.ts                                                           |
| src/nucleo/constelacao/seguranca.test.ts                                                                   | src/domains/seguranca/**tests**/seguranca.test.ts                                               |
| src/nucleo/executor.test.ts                                                                                | src/domains/executor/**tests**/executor.test.ts                                                 |
| src/nucleo/inquisidor.test.ts                                                                              | src/domains/inquisidor/**tests**/inquisidor.test.ts                                             |
| src/nucleo/parser-timeout.test.ts                                                                          | src/domains/parser-timeout/**tests**/parser-timeout.test.ts                                     |
| src/nucleo/parser.test.ts                                                                                  | src/domains/parser/**tests**/parser.test.ts                                                     |
| src/nucleo/scanner.test.ts                                                                                 | src/domains/scanner/**tests**/scanner.test.ts                                                   |
| src/relatorios/conselheiro-oracular.test.ts                                                                | src/domains/conselheiro-oracular/**tests**/conselheiro-oracular.test.ts                         |
| src/relatorios/gerador-relatorio.test.ts                                                                   | src/domains/gerador-relatorio/**tests**/gerador-relatorio.test.ts                               |
| src/relatorios/relatorio-estrutura.test.ts                                                                 | src/domains/relatorio-estrutura/**tests**/relatorio-estrutura.test.ts                           |
| src/relatorios/relatorio-padroes-uso.test.ts                                                               | src/domains/relatorio-padroes-uso/**tests**/relatorio-padroes-uso.test.ts                       |
| src/relatorios/relatorio-poda.test.ts                                                                      | src/domains/relatorio-poda/**tests**/relatorio-poda.test.ts                                     |
| src/relatorios/relatorio-zelador-saude.test.ts                                                             | src/domains/relatorio-zelador-saude/**tests**/relatorio-zelador-saude.test.ts                   |
| src/tipos/plano-estrutura.test.ts                                                                          | src/domains/plano-estrutura/**tests**/plano-estrutura.test.ts                                   |
| src/tipos/tipos.test.ts                                                                                    | src/domains/tipos/**tests**/tipos.test.ts                                                       |
| src/zeladores/corretor-estrutura.test.ts                                                                   | src/domains/corretor-estrutura/**tests**/corretor-estrutura.test.ts                             |
| src/zeladores/fantasma.test.ts                                                                             | src/domains/fantasma/**tests**/fantasma.test.ts                                                 |
| src/zeladores/operario-estrutura.test.ts                                                                   | src/domains/operario-estrutura/**tests**/operario-estrutura.test.ts                             |
| src/zeladores/poda.test.ts                                                                                 | src/domains/poda/**tests**/poda.test.ts                                                         |
| src/zeladores/util/estrutura.test.ts                                                                       | src/domains/estrutura/**tests**/estrutura.test.ts                                               |
| src/zeladores/util/helpers-analistas.test.ts                                                               | src/domains/helpers-analistas/**tests**/helpers-analistas.test.ts                               |
| src/zeladores/util/imports.test.ts                                                                         | src/domains/imports/**tests**/imports.test.ts                                                   |
| src/zeladores/util/persistencia.test.ts                                                                    | src/domains/persistencia/**tests**/persistencia.test.ts                                         |
| src/zeladores/util/validacao.test.ts                                                                       | src/domains/validacao/**tests**/validacao.test.ts                                               |
| tests/fixtures/estruturas/api-rest-express/src/controllers/healthController.ts                             | src/domains/health/controllers/healthController.ts                                              |
| tests/fixtures/estruturas/api-rest-express/src/controllers/userController.ts                               | src/domains/user/controllers/userController.ts                                                  |
| tests/fixtures/estruturas/fullstack-hibrido/src/controllers/healthController.ts                            | src/domains/health/controllers/healthController.ts                                              |
| tests/fixtures/estruturas/fullstack-hibrido/src/controllers/userController.ts                              | src/domains/user/controllers/userController.ts                                                  |
| tests/utils/persistencia.spec.ts                                                                           | src/domains/persistencia/**tests**/persistencia.spec.ts                                         |
| vitest.config.ts                                                                                           | src/domains/vitest/config/vitest.config.ts                                                      |
