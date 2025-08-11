# Monitoramento de Dependências

## Recomendações

- **Dependabot**: Configure o GitHub Dependabot para PRs automáticas de atualização de dependências.
- **npm-check-updates**: Use o pacote `npm-check-updates` para verificar e atualizar dependências localmente.
- **Scripts úteis**:

```sh
# Verificar atualizações disponíveis
npx npm-check-updates

# Atualizar package.json para as últimas versões
npx npm-check-updates -u

# Instalar as novas versões
npm install
```

## Sugestão de workflow

- Execute `npx npm-check-updates` antes de cada ciclo de desenvolvimento.
- Revise e aceite PRs do Dependabot regularmente.
- Registre atualizações relevantes no `docs/CHECKLIST.md`.

---
