> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.


# Guia de Desenvolvimento

## Requisitos

- Node.js >= 24.x
- npm

## Setup

1. Instale deps: `npm ci` (ou `npm install`)
2. Construa: `npm run build`
3. Testes: `npm test`

## Fluxo de trabalho

- Branches: `feat/*`, `fix/*`.
- Rodar `npm run check` antes de abrir PR.
- Em alterações na CLI, rode `npm run test:e2e`.

## Estilo e padrões

- TypeScript ESM; aliases conforme `tsconfig.json`.
- Persistência via helpers `lerEstado`/`salvarEstado`.
- Em `--json`, silenciar logs e emitir apenas JSON.

## Dicas

- Em Windows PowerShell, use `;` para encadear comandos.
- Evite `fs.readFile/writeFile` direto fora de utilitários.
- Testes: cubra caminhos felizes e 1-2 bordas.

