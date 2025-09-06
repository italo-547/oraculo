> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Contribuindo para o Oráculo CLI

Obrigado por considerar contribuir — sua vontade de ajudar já é valiosa. Não é preciso ser um mestre do código para participar; procuramos curiosidade, vontade de aprender e colaboração de boa-fé. Eu mesmo estou aprendendo enquanto construo este projeto, e toda ajuda de coração é muito bem-vinda.

Se você está começando, veja a seção "Se estiver aprendendo" mais abaixo com passos práticos.

## Checklist rápido (técnico)

- [ ] Seguiu aliases de import (`@nucleo/*`, `@analistas/*`, etc.)
- [ ] Usou helpers `lerEstado` / `salvarEstado` (não use `fs.readFile` direto fora dos helpers)
- [ ] Testes: incluir ao menos 1 caso positivo e 1 caso de borda/erro, ou documentar a razão
- [ ] Cobertura não reduziu limites do projeto; se reduzir, explique no PR
- [ ] Contratos JSON (diagnosticar/guardian) mantidos ou documentados quando alterados
- [ ] Sem logs de debug sobrando; respeite `--silence`/`--verbose`
- [ ] Documentação atualizada (`README` ou arquivos em `docs/`)

## Fluxo de trabalho (prático)

1. Fork → branch: `feat/<tema>` ou `fix/<tema>`.
2. Implementação incremental + testes (pequenos PRs são melhores).
3. Rodar local: `npm run check` (lint + typecheck + unit). Se alterar CLI: `npm run test:e2e`.
4. Atualizar docs afetados (ex.: flags, JSON, exemplos).
5. Abrir PR explicando problema, solução, impacto e riscos.

Referências rápidas:

- Guia de desenvolvimento: `docs/DESENVOLVIMENTO.md`
- Template de PR: `.github/pull_request_template.md`
- Templates de issues: `.github/ISSUE_TEMPLATE/*`
- Código de Conduta: `CODE_OF_CONDUCT.md`
- Política de Segurança: `SECURITY.md`

## Se estiver aprendendo

Perfeito — saiba que contribuições pequenas têm grande valor. Ideias para começar:

- Procure issues marcadas com `good first issue` ou `help wanted`.
- Abra uma issue para discutir sua ideia antes de começar (dizendo o que pretende alterar).
- Faça PRs pequenos: um conceito por PR ajuda a revisão.
- Peça revisão ou pairing — alguém revisa e orienta nos PRs.
- Não deixe de documentar dúvidas no PR; estamos aqui para ajudar.

Se precisar, mencione no PR que é sua primeira contribuição; vamos priorizar suporte.

## Estilo de código

- TypeScript ESM puro (sem `require`).
- Tipos compartilhados em `src/tipos/tipos.ts`.
- Preferir funções puras; isolar efeitos (IO) em helpers.

## Testes

- Unidades para lógica pura; integração para fluxos.
- Evitar mocks frágeis — prefira fixtures pequenos.
- E2E apenas para validar contratos após build.

## Commits & mensagens

Formato sugerido (Conventional Commits leve): `feat: adicionar analista X` / `fix: corrigir agregação de parseErros` / `docs: atualizar guia`.

## Uso de IA

Sugestões de IA (ex.: Copilot) são bem-vindas como auxílio, mas revise todo o código gerado. Não aceite algo que você não compreende. Se parte importante do PR foi assistida por IA, indique no corpo do PR.

### Recomendações para Copilot

- Ative “Block suggestions matching public code” quando disponível.
- Revise e reescreva trechos que pareçam ter sido copiados de fontes públicas.

## Checklist sugerido para PR

Copie e cole no corpo do PR e marque antes do merge:

```text
- [ ] Passou em `npm run check`
- [ ] Cobertura preservada / aumentada (ou justificativa)
- [ ] Contratos JSON documentados se alterados
- [ ] Sem logs de debug
- [ ] Docs atualizados
```

## Licença

Ao contribuir, você concorda em licenciar sua contribuição sob MIT.

---

Obrigado pela ajuda — sua contribuição importa, seja código, testes, documentação ou revisão. ❤

```

```
