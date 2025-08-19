> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Proteção da branch main

Este guia define as regras de proteção para a branch `main` e como aplicá-las/validá-las via GitHub UI e via script (gh-cli) incluído no repositório.

## Política requerida

- Revisões obrigatórias: mínimo 1 aprovador; invalidar aprovações ao receber novos commits; exigir aprovação do último push.
- Checks obrigatórios: build/testes e gates (ex.: CI Principal, license-gate, coverage:gate, perf:gate, compliance). A lista exata de contexts pode variar por workflow; veja a seção de configuração abaixo.
- Branch atualizada: exigir que o PR esteja atualizado com a base antes do merge (strict=true nos status checks).
- Histórico linear: exigir histórico linear.
- Modo de merge: apenas squash; desabilitar merge commit e rebase; deletar branch no merge.
- Bloqueios adicionais: proibir force push e proibir deleção da branch.
- Administradores: regras se aplicam também a administradores.

Observação: para “proibir push direto à main”, o caminho mais seguro é restringir quem pode fazer push diretamente. Como a lista de usuários/equipes varia, o script aceita variáveis de ambiente para especificar `users` e `teams` caso a política exija essa restrição explícita.

## Como aplicar via UI (atalho)

1. Settings → Branches → Branch protection rules → Add rule.
2. Branch name pattern: `main`.
3. Marcar:
   - Require a pull request before merging (1 approval, dismiss stale reviews, require last push approval).
   - Require status checks to pass before merging (marcar “Require branches to be up to date before merging” e selecionar os checks obrigatórios).
   - Require linear history.
   - Do not allow bypassing the above settings.
   - Include administrators.
   - Restrict who can push to matching branches (opcional; definir times/usuários se aplicável).
   - Lock branch: desmarcado.
   - Allow force pushes: desmarcado.
   - Allow deletions: desmarcado.
4. Em Settings → General → Pull Requests:
   - Permitir apenas “Allow squash merging”. Desmarcar “Merge commit” e “Rebase and merge”. Marcar “Automatically delete head branches”.

## Script (gh-cli) para verificar/aplicar

Existe um script Node que usa `gh api` para configurar e validar a proteção:

- Arquivo: `scripts/config-branch-protection.mjs`
- Requisitos: GitHub CLI (`gh`) instalado e autenticado (`gh auth status`).
- Variáveis de ambiente:
  - `GH_OWNER` e `GH_REPO` (se omitidos, o script tenta inferir via `git config --get remote.origin.url`).
  - `BRANCH_NAME` (default: `main`).
  - `BP_REQUIRED_CONTEXTS` (lista separada por vírgula com os nomes/contexts de checks obrigatórios; ex.: `CI Principal,license-gate,coverage:gate,perf:gate,compliance`).
  - `BP_RESTRICT_USERS` (separado por vírgula) e `BP_RESTRICT_TEAMS` (separado por vírgula) para ativar restrição de push; se ambos vazios, nenhuma restrição explícita é aplicada.

Comandos prontos (via npm scripts):

```powershell
# Validar as regras atuais
npm run branch:protect:check

# Aplicar/atualizar as regras
$env:BP_REQUIRED_CONTEXTS = "CI Principal,license-gate"; npm run branch:protect
```

Saídas e códigos de retorno:

- `check` retorna 0 quando as regras batem com a política e 1 quando há divergências.
- `apply` retorna 0 quando aplicado com sucesso e >0 em erros.

## Notas operacionais

- Rodar em ambientes com permissão de manutenção/admin do repositório.
- Para contexts de checks, confirme no histórico de PRs quais nomes aparecem na aba “Checks”. O nome é sensível e precisa coincidir.
- Caso a organização exija restrição de push, defina `BP_RESTRICT_USERS`/`BP_RESTRICT_TEAMS` (listas) antes de aplicar.
