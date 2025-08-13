# Biblioteca de Estruturas Padrão

Este módulo detecta arquétipos estruturais de repositórios e produz aconselhamento + plano de reorganização (futuro `--reorganizar`).

## Arquétipos Suportados

- cli-modular
- landing-page
- api-rest-express
- fullstack
- bot
- electron
- lib-tsc
- monorepo-packages

## Heurísticas

Cada arquétipo define:

- requiredDirs: diretórios obrigatórios
- optionalDirs: diretórios que incrementam o score
- forbiddenDirs: penalizações se presentes
- dependencyHints: dependências que reforçam o arquétipo
- filePresencePatterns: arquivos ou padrões que elevam confiança
- rootFilesAllowed: whitelist de arquivos aceitáveis na raiz

Score = pesoBase*10 + required*15 - missingRequired*20 + optional*5 + dependencyHints*8 + patterns*6 - forbidden\*10  
Confidence = score / maxPossible normalizado para 0-100.

## Saída JSON

Campo `estruturaIdentificada`:

```jsonc
{
  "melhores": [
    {
      "nome": "cli-modular",
      "confidence": 82,
      "score": 143,
      "missingRequired": [],
      "matchedRequired": ["src"],
      "forbiddenPresent": [],
      "anomalias": [{ "path": "script.sh", "motivo": "Arquivo na raiz não permitido" }],
    },
  ],
  "baseline": {
    "arquetipo": "cli-modular",
    "confidence": 82,
    "arquivosRaiz": ["package.json", "tsconfig.json"],
    "timestamp": "2025-08-13T00:00:00.000Z",
  },
}
```

## Baseline Estrutural

Primeira detecção persiste `.oraculo/baseline-estrutura.json`. Em execuções futuras pode ser comparado para detectar derivações.

## Próximos Passos

- Plano de reorganização real (mover arquivos)
- Flag `--reorganizar` com dry-run padrão
- Detecção de múltiplos arquétipos híbridos (atribuir probabilidades)
- Melhorar anomalias (detectar arquivos de código na raiz que deveriam estar em src/)
