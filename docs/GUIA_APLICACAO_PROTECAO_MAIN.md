# Guia: Aplicação da Proteção da Branch Main

## Status Atual

- ✅ Scripts prontos: `config-branch-protection.mjs`
- ✅ Documentação completa: `docs/branches/protecao-main.md`
- ✅ NPM scripts configurados: `branch:protect` e `branch:protect:check`
- ❌ **AÇÃO PENDENTE**: Aplicar no repositório GitHub

## Pré-requisitos

### 1. Token de Acesso do GitHub

Você precisa de um **Personal Access Token (PAT)** com permissões administrativas no repositório.

#### Opção A: GitHub CLI (Recomendado)

```bash
# Instalar GitHub CLI se não tiver
# Windows: winget install --id GitHub.cli
# OU baixar de: https://cli.github.com/

# Autenticar
gh auth login

# Verificar autenticação
gh auth status
```

#### Opção B: Personal Access Token

1. Acesse: <https://github.com/settings/tokens>
2. Clique "Generate new token (classic)"
3. Selecione escopo: `repo` (acesso completo aos repositórios)
4. Copie o token gerado

### 2. Configurar Variáveis de Ambiente

```bash
# Definir token como variável de ambiente
export GITHUB_TOKEN=seu_token_aqui
# OU
export GH_TOKEN=seu_token_aqui

# Para Windows PowerShell:
$env:GITHUB_TOKEN="seu_token_aqui"
```

## Contexts Obrigatórios Identificados

Baseado nos workflows do GitHub Actions, os contexts que devem ser obrigatórios são:

- `ci` - Workflow principal (build, test, lint, coverage)
- `compliance` - Verificações de conformidade
- `license-gate` - Auditoria de licenças

## Aplicação da Proteção

### Passo 1: Verificar Status Atual

```bash
# Verificar se já existe proteção configurada
npm run branch:protect:check
```

### Passo 2: Aplicar Proteção

```bash
# Aplicar proteção da branch main
npm run branch:protect
```

### Passo 3: Validar Configuração

Após aplicar, verifique no GitHub:

1. Acesse: <https://github.com/italo-c-lopes/oraculo/settings/branches>
2. Selecione branch `main`
3. Verifique se as regras estão aplicadas:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators
   - ✅ Restrict pushes that create matching branches
   - ✅ Allow force pushes: ❌ (desmarcado)
   - ✅ Allow deletions: ❌ (desmarcado)

## Configuração Esperada

```yaml
# Status checks obrigatórios
required_status_checks:
  strict: true
  contexts:
    - ci
    - compliance
    - license-gate

# Pull request reviews
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_last_push_approval: true

# Restrições
restrictions:
  enforce_admins: true
  allow_force_pushes: false
  allow_deletions: false

# Merge options
allow_merge_commits: true
allow_squash_merge: true
allow_rebase_merge: false
delete_branch_on_merge: true
```

## Troubleshooting

### Erro: "GITHUB_TOKEN/GH_TOKEN não definido"

- Configure o token conforme seção "Pré-requisitos"

### Erro: "HTTP 403" ou "HTTP 404"

- Verifique se o token tem permissões administrativas
- Para repositórios privados: pode precisar de GitHub Pro/Team

### Erro: "Repository not found"

- Verifique se o remote `origin` está correto
- Execute: `git remote -v`

## Validação Final

Após aplicar a proteção:

1. **Teste com PR**: Crie um PR de teste para validar que:
   - Push direto na `main` é bloqueado
   - PR requer revisão obrigatória
   - Todos os status checks são necessários

2. **Verificar CI**: Confirme que os workflows estão sendo executados nos PRs

## Próximos Passos

Após aplicar a proteção da branch main, as próximas prioridades são:

1. ✅ Aplicar proteção da branch main (esta tarefa)
2. Geração de mapa de reversão para moves aplicados
3. Versão de schema nos relatórios JSON
4. Pool de workers para paralelizar por arquivo

---

**Data**: Dezembro de 2025
**Status**: Aguardando aplicação da proteção
