> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Exemplos Locais (Não Versionados)

Este arquivo demonstra estruturas de saída e configs geradas pelo Oráculo que não precisam ir para o controle de versão.
Salve como referência local. A extensão `.example.md` permite manter no repositório apenas como modelo.

## 1. Estrutura de diretório `.oraculo/`

````text
.oraculo/
  baseline.json              # Baseline do Guardian (hashes) – versionar SOMENTE se for política do time
  incremental-analise.json    # Cache incremental (descartável)
  incremental-test.json       # Resultados sintéticos para testes locais
  metricas-historico.json     # Série temporal de execuções (descartável)
```text

Recomendação atual: versionar apenas `baseline.json` (se desejarem travar integridade em CI). Demais ficam ignorados.

## 2. Histórico de Execuções (`hist-*.json`)

Arquivos gerados para inspecionar métricas pontuais de performance / cache.
Padrão: `hist-<timestamp>.json`.

```json
[
  {
    "totalArquivos": 3,
    "tempoParsingMs": 12,
    "tempoAnaliseMs": 42,
    "cacheAstHits": 6,
    "cacheAstMiss": 3,
    "analistas": [
      { "nome": "analista-funcoes-longas", "duracaoMs": 1.23, "ocorrencias": 2, "global": false }
    ],
    "timestamp": 1755000000000
  }
]
```env

Não versionar – ruído e cresce rapidamente.

## 3. Relatórios Exportados (`oraculo-reports/`)

Gerados quando `REPORT_EXPORT_ENABLED` está ativo.

````

oraculo-reports/
oraculo-relatorio-2025-08-12T10-22-11-123Z.md
oraculo-relatorio-2025-08-12T10-22-11-123Z.json
oraculo-scan-2025-08-12T10-05-01-456Z.json

````

Uso: inspecionar offline, anexar em auditorias. Não versionar por serem efêmeros e dependentes do estado do repo.

## 4. Baseline do Guardian

Se o fluxo exigir auditoria reprodutível, manter `./.oraculo/baseline.json` versionado.
Caso contrário, também pode ser ignorado (e recriado em CI). Decisão deve constar em `docs/guardian.md`.

## 5. Variáveis de Execução (Sugestão de `.env.example`)

```env

PARSE_ERRO_AGRUPAR=true
PARSE_ERRO_MAX_POR_ARQUIVO=1
PARSE_ERRO_FALHA=false
LOG_ESTRUTURADO=false
SCAN_ONLY=false
REPORT_EXPORT_ENABLED=false
REPORT_OUTPUT_DIR=oraculo-reports

````

Crie um `.env` local (ignorado) conforme necessidade.

---

Atualize este exemplo conforme novos artefatos temporários surjam.

```

```
