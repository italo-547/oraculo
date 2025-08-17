> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Contribuindo para o Oráculo CLI

Obrigado pelo interesse! Este guia resume expectativas para mudanças de código, testes e documentação.

## Checklist Rápido

- [ ] Seguiu aliases de import (`@nucleo/*`, `@analistas/*`, etc.)
- [ ] Usou helpers `lerEstado` / `salvarEstado` (sem `fs.readFile` direto)
- [ ] Testes: ao menos 1 caso positivo e 1 negativo (ou justificativa)
- [ ] Cobertura não reduziu limiares; se reduziu, explicar no PR
- [ ] Contratos JSON (diagnosticar/guardian) mantidos ou documentados em CHANGELOG / README
- [ ] Logs não verbosos excessivamente (respeitar `--silence`/`--verbose`)
- [ ] Documentação atualizada (`README` ou arquivos em `docs/`)

## Fluxo de Trabalho

1. Fork / branch: `feat/<tema>` ou `fix/<tema>`.
2. Implementação incremental + testes.
3. Rodar local: `npm run check` (lint + typecheck + unit), `npm run test:e2e` se alterar CLI.
4. Atualizar docs afetados (ex: novo campo JSON, nova flag CLI).
5. Abrir PR descrevendo: problema, solução, impacto em usuários, riscos.

## Estilo de Código

- TypeScript ESM puro (sem `require`).
- Tipos compartilhados vivem em `src/tipos/tipos.ts`.
- Preferir funções puras; efeitos (IO) isolados e centralizados.
- Nome de ocorrências: UPPER_SNAKE_CASE descritivo.

## Testes

- Unidades para lógica pura; integração para fluxos (executor/inquisidor/guardian).
- Evitar mocks frágeis — preferir inputs reais pequenos.
- E2E somente para validar contratos binários após build.

## Commits & Mensagens

Formato sugerido (inspirado em Conventional Commits, sem rigidez extrema):
`feat: adicionar analista X` / `fix: corrigir agregação de parseErros` / `docs: atualizar guia de plugins`.

## Uso de Ferramentas de IA

Sugestões de IA (ex: GitHub Copilot) são bem-vindas para acelerar, mas cada trecho deve ser revisado manualmente. Não aceite código que você não compreende. Mencione no PR se um trecho substancial foi assistido por IA.

### Copilot — Bloquear sugestões que correspondem a código público

Para reduzir risco de sugerir trechos idênticos a código público, ative o bloqueio de correspondência:

- No GitHub (conta/org):
  1.  Acesse Settings → GitHub Copilot → Políticas.
  2.  Marque “Block suggestions matching public code”.
  3.  Em organizações, um admin pode impor a política para todos os membros.

- No VS Code:
  1.  Abra Settings (Ctrl+,) → pesquise “Copilot”.
  2.  Habilite “Block Suggestions Matching Public Code”.
  3.  Reinicie a janela do VS Code, se necessário.

Boas práticas adicionais:

- Revise trechos longos ou “bons demais para ser verdade”.
- Rode verificações de licença/terceiros (ex.: `npm run licenses:notice`).
- Se suspeitar de reprodução, reescreva o trecho com sua própria implementação.

## Checklist Final no PR

Copie e marque no corpo do PR:

```text
- [ ] Passou em `npm run check`
- [ ] Cobertura preservada / aumentada
- [ ] Contratos JSON inalterados ou documentados
- [ ] Sem logs de debug sobrando
- [ ] Docs atualizados
```

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob MIT.

---

Obrigado! 💡
