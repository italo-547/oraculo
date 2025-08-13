# Arquétipos & Reorganização Automática

Este documento descreve os arquétipos suportados, critérios de detecção, cálculo de confiança e o plano de reorganização sugerido (`planoSugestao`). É o contrato oficial desta funcionalidade.

## Objetivos

- Explicitar sinais de cada arquétipo.
- Padronizar regras de reorganização segura.
- Fornecer base para testes e evolução incremental.

## Conceitos

| Termo              | Definição                                                     |
| ------------------ | ------------------------------------------------------------- |
| Arquétipo          | Padrão estrutural de projeto (ex: `cli-modular`).             |
| Sinais Estruturais | Diretórios obrigatórios, opcionais e proibidos.               |
| Sinais Semânticos  | Dependências e padrões de arquivo que reforçam o arquétipo.   |
| Baseline           | Snapshot inicial persistido da estrutura (detecta drift).     |
| Drift              | Mudança estrutural (novos/removidos, alteração de confiança). |
| planoSugestao      | Ações propostas (ex: mover arquivos soltos para `src/`).      |

## Arquétipos Suportados (Resumo)

cli-modular, landing-page, api-rest-express, fullstack, bot, electron, lib-tsc, monorepo-packages. Ver definições completas em `src/analistas/arquetipos-defs.ts`.

## Heurística de Pontuação

Score = pesoBase*10 + required*15 - missingRequired*20 + optional*5 + dependencyHints*8 + patterns*6 - forbidden\*10  
Confidence = (score / maxPossible) normalizado (0–100, teto 100).

## Campos de Saída (estruturaIdentificada)

```jsonc
{
  "melhores": [
    {
      "nome": "cli-modular",
      "confidence": 82,
      "score": 143,
      "matchedRequired": ["src/cli", "src/nucleo"],
      "missingRequired": [],
      "forbiddenPresent": [],
      "dependencyMatches": ["commander"],
      "filePatternMatches": ["tsconfig.json"],
      "anomalias": [
        { "path": "script.sh", "motivo": "Arquivo na raiz não permitido para este arquétipo" },
      ],
      "planoSugestao": {
        "mover": [
          {
            "de": "fora-do-src.js",
            "para": "src/fora-do-src.js",
            "motivo": "arquivo fonte solto na raiz – consolidar em src/",
          },
        ],
        "conflitos": [],
        "resumo": { "total": 1, "zonaVerde": 1, "bloqueados": 0 },
      },
    },
  ],
  "baseline": {
    "arquetipo": "cli-modular",
    "confidence": 82,
    "arquivosRaiz": ["package.json", "tsconfig.json"],
    "timestamp": "2025-08-13T00:00:00.000Z",
  },
  "drift": {
    "alterouArquetipo": false,
    "anterior": "cli-modular",
    "atual": "cli-modular",
    "deltaConfidence": 0,
    "arquivosRaizNovos": [],
    "arquivosRaizRemovidos": [],
  },
}
```

## Baseline Estrutural

Persistida em `.oraculo/baseline-estrutura.json` na primeira execução. Futuras execuções calculam `drift` comparando raiz.

## Regras de Reorganização (v0)

Foco inicial: mover arquivos de raiz para locais esperados sem sobrescrever nada.

Zona Verde (auto-sugerido):

| Padrão Raiz                                    | Destino           | Motivo                           |
| ---------------------------------------------- | ----------------- | -------------------------------- |
| `*.test.ts` fora de `src/`                     | `src/`            | Centralizar testes.              |
| `script-*.{js,ts}`                             | `src/scripts/`    | Agrupar scripts operacionais.    |
| `*.config.{js,ts,cjs,mjs}` (exceto tsconfig\*) | `config/`         | Unificar configs.                |
| `*.d.ts`                                       | `types/`          | Isolar declarações.              |
| `README-fragment-*.md`                         | `docs/fragments/` | Organizar documentação auxiliar. |

Restrições:

- Não mover `node_modules`, `.git`, `dist`, `coverage`.
- Evitar mover >250 KB (provável arquivo gerado/binário).
- Não gerar plano em `--scan-only`.
- Se destino existe → registrar em `conflitos` (não mover).

Estrutura de `planoSugestao`:

```jsonc
{
  "mover": [{ "de": "a.js", "para": "src/a.js", "motivo": "arquivo fonte solto" }],
  "conflitos": [{ "alvo": "src/a.js", "motivo": "já existe" }],
  "resumo": { "total": 1, "zonaVerde": 1, "bloqueados": 0 },
}
```

## Roadmap Próximo

1. Implementar geração efetiva do plano (mover) – fase atual.
2. Expor `planoSugestao` em `diagnosticar --json`.
3. Novo comando `reestruturar` (dry-run + `--aplicar`).
4. Testes de fixtures para cada arquétipo + cenários de anomalia.
5. Evolução: normalização de nomes de diretórios e merges seguros.

## Testes Sugeridos

- Arquivo `.js` na raiz → plano sugere mover para `src/`.
- Conflito de nome → aparece em `conflitos` e não em `mover`.
- Arquivo grande ignorado.
- Execução com `--scan-only` não produz plano.

## Evolução

Regras começarão conservadoras; expandiremos após métricas. Sempre atualizar este documento ao introduzir nova ação.

---

Histórico de alterações mantido via controle de versão.
