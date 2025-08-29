> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Política de Proteção da Branch Main

Última atualização: 2025-08-28

Este documento descreve a política de proteção da branch `main`, regras obrigatórias e procedimentos para aplicação.

## Visão Geral

A branch `main` é protegida para garantir qualidade e estabilidade do código. Todas as mudanças devem passar por revisão via Pull Request (PR) na branch `develop`.

## Regras de Proteção Ativas

### Requisitos Obrigatórios

#### 1. Pull Request Obrigatório

- ✅ **Ativado**: Todas as mudanças devem ser via PR
- ✅ **Revisão obrigatória**: Pelo menos 1 aprovação antes do merge
- ✅ **CI/CD obrigatório**: Todos os checks devem passar

#### 2. Checks de Status Obrigatórios

- ✅ **CI Workflow**: `ci.yml` deve passar
- ✅ **Build**: Compilação TypeScript sem erros
- ✅ **Lint**: ESLint sem warnings/errores
- ✅ **Testes**: Cobertura mínima mantida
- ✅ **Licença**: Compliance de licenças

#### 3. Restrições de Push

- ❌ **Bloqueado**: Push direto na `main` (apenas admins)
- ❌ **Bloqueado**: Forçar push (force push)
- ❌ **Bloqueado**: Exclusão da branch

#### 4. Merge Restrictions

- ✅ **Squash obrigatório**: Commits devem ser agrupados
- ✅ **Merge commit**: Deve incluir mensagem descritiva
- ✅ **Branch atualizada**: Deve estar atualizada com `main`

## Configuração Atual

### Parâmetros Ativos

```yaml
# Configuração aplicada via GitHub Settings
required_status_checks:
  strict: true # Branch deve estar atualizada
  contexts:
    - ci # Workflow CI obrigatório
    - build # Build obrigatório
    - lint # Lint obrigatório
    - test-coverage # Cobertura obrigatória
    - license-gate # Licença obrigatória

required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: false
  dismissal_restrictions: []

restrictions:
  enforce_admins: true # Aplicar mesmo para admins
  allow_force_pushes: false # Bloquear force push
  allow_deletions: false # Bloquear exclusão

allow_merge_commits: true # Permitir merge commits
allow_squash_merge: true # Permitir squash
allow_rebase_merge: false # Bloquear rebase
```

## Fluxo de Trabalho

### Para Contribuidores

#### 1. Desenvolvimento

```bash
# Trabalhar sempre na branch develop
git checkout develop
git pull origin develop

# Criar branch de feature
git checkout -b feature/nome-da-feature
```

#### 2. Commits

```bash
# Commits seguindo convenção
git commit -m "feat: adicionar nova funcionalidade"
git commit -m "fix: corrigir bug no detector"
git commit -m "docs: atualizar documentação"
```

#### 3. Pull Request

```bash
# Push da branch
git push origin feature/nome-da-feature

# Criar PR no GitHub
# - Base: main
# - Compare: feature/nome-da-feature
# - Descrição detalhada das mudanças
# - Referência a issues se aplicável
```

### Para Revisores

#### Checklist de Revisão

- [ ] **Código**: Funcionalidade implementada corretamente
- [ ] **Testes**: Cobertura adequada e testes passando
- [ ] **Documentação**: README/docs atualizados se necessário
- [ ] **Lint**: Sem erros de linting
- [ ] **Tipos**: TypeScript sem erros
- [ ] **Performance**: Sem regressões óbvias
- [ ] **Segurança**: Sem vulnerabilidades introduzidas

## Scripts de Automação

### Verificação de Status

```bash
# Verificar status da proteção
npm run branch:protect:check
```

### Aplicação da Proteção

```bash
# Aplicar proteção (requer permissões admin)
npm run branch:protect
```

### Pré-requisitos para Scripts

```bash
# Variáveis de ambiente necessárias
export GITHUB_TOKEN=your_github_token
# OU
export GH_TOKEN=your_github_token

# OU instalar GitHub CLI
gh auth login
```

## Cenários de Exceção

### Releases de Emergência

1. **Justificativa**: Deve ser documentada na issue
2. **Aprovação**: Pelo menos 2 maintainers
3. **Rollback**: Plano de rollback preparado
4. **Monitoramento**: Acompanhamento pós-release

### Hotfixes Críticos

1. **Branch**: `hotfix/nome-do-fix`
2. **Testes**: Cobertura completa do fix
3. **Revisão**: Prioridade alta (mesmo dia)
4. **Documentação**: Issue detalhada com impacto

## Monitoramento e Alertas

### Métricas a Monitorar

- **Taxa de rejeição de PRs**: Deve ser < 10%
- **Tempo médio de revisão**: Deve ser < 24h
- **Tempo para merge**: Deve ser < 48h
- **Falhas de CI**: Devem ser investigadas imediatamente

### Alertas Automáticos

- PR aberto há > 3 dias sem atividade
- PR com CI falhando há > 24h
- Branch `main` sem commits há > 1 semana

## Troubleshooting

### Problemas Comuns

#### 1. CI Falhando

```bash
# Verificar logs detalhados
npm run test
npm run lint
npm run build
```

#### 2. Conflitos de Merge

```bash
# Atualizar branch com main
git checkout feature/sua-branch
git fetch origin
git rebase origin/main
```

#### 3. Permissões Insuficientes

- Solicitar acesso de maintainer
- Ou trabalhar via fork + PR

### Contatos de Suporte

- **Mantenedor Principal**: @italo-c-lopes
- **Issues**: Criar issue com label `branch-protection`
- **Discussões**: GitHub Discussions

## Referências

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [CHECKLIST.md](../CHECKLIST.md) - Status do projeto
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Guia de contribuição
