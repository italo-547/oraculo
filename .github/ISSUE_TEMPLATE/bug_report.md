> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

---
name: Relatar bug
about: Descreva um problema para ajudarmos a corrigir
title: ''
labels: ''
assignees: ''
---

## Descrição do bug
Explique de forma objetiva o que está acontecendo.

## Passos para reproduzir
Descreva o passo a passo mínimo para reproduzir o problema:
1. Comando executado (inclua flags como `--json`, `--include/--exclude` se usados)
2. Estrutura/projeto alvo (ex.: monorepo, Next.js app/)
3. O que você esperava que acontecesse
4. O que aconteceu de fato

## Comportamento esperado
O que deveria acontecer em condições normais?

## Logs/erros e artefatos
Cole mensagens relevantes ou anexe arquivos, removendo segredos:
- Saída JSON (se usou `--json`), apenas o trecho relevante
- Erros do terminal
- Capturas de tela, se ajudar

## Ambiente
- SO e versão (ex.: Windows 11, Ubuntu 24.04)
- Node.js (node -v) e npm (npm -v)
- Versão do Oráculo CLI (oraculo --version) ou commit
- Shell/terminal (PowerShell, bash, etc.)

## Escopo da análise
- Diretórios/arquivos analisados (ex.: `--include "src/**/*.ts"`)
- Exclusões aplicadas (ex.: `--exclude "docs/**"`)
- `node_modules` estava incluído? (por padrão é ignorado)

## Regressão
Isso funcionava antes? Desde qual versão/commit começou a falhar?

## Workaround conhecido
Existe alguma forma de contornar o problema temporariamente?

## Reprodutor mínimo (opcional, recomendado)
Link de um repositório mínimo ou passos claros que reproduzam o problema.

## Checklist
- [ ] Procurei por issues abertas/fechadas similares
- [ ] Li o README e o `docs/GUIA_COMANDOS.md`
- [ ] Consigo reproduzir em um caso mínimo e previsível
- [ ] Removi segredos/credenciais de logs e anexos
