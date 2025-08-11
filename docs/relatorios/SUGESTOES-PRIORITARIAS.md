# Sugestões Prioritárias para Evolução do Projeto Oráculo

> **Contexto:** Projeto ainda não está em produção. Foco em qualidade, base sólida e preparação para uso real.

---

## 1. Documentação
- Atualizar e revisar o `README.md` e `RELATORIO.md`.
- Garantir instruções claras de instalação, uso, testes e contribuição.
- Adicionar comentários e JSDoc em helpers e fluxos complexos.

## 2. Automação e Dev Experience
- Configurar pipeline de CI (ex: GitHub Actions) para rodar testes automaticamente a cada push/PR.
- Garantir linting (ESLint) e formatação (Prettier) automáticos.
- Adicionar hooks de pre-commit (Husky) para impedir commits sem lint/test.

## 3. Cobertura de Integração
- Criar testes de integração ponta-a-ponta rodando a CLI em modo real (com arquivos reais).
- Simular execuções com múltiplos plugins, arquivos e configurações reais.

## 4. Performance e Escalabilidade
- Realizar testes de stress com grandes volumes de arquivos e múltiplos plugins.
- Monitorar possíveis gargalos de I/O e otimizar onde necessário.

## 5. Manutenção e Refatoração
- Revisar se há lógica duplicada fora dos utilitários centralizados.
- Garantir uso consistente de aliases de importação do `tsconfig.json`.
- Remover dependências desnecessárias ou desatualizadas do `package.json`.

## 6. Segurança
- Validar e sanitizar todas as entradas da CLI (caminhos, arquivos, plugins).
- Configurar Dependabot ou Snyk para monitorar vulnerabilidades em dependências.

## 7. Roadmap e Evolução
- Definir próximos recursos e melhorias com base em possíveis demandas futuras.
- Preparar o projeto para receber feedback de usuários assim que for colocado em uso.

---

> **Recomendação:** Priorize documentação e automação antes de expandir funcionalidades. Isso garante base sólida, facilita onboarding e reduz riscos ao entrar em produção.
