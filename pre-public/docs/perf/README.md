# Baseline de Performance

Gera dataset sintético (mix de arquivos pequenos, médios e grandes) e coleta métricas estruturadas.

## Executar

```bash
npm run perf:baseline
```

Cria snapshots em `docs/perf/baseline-*.json`.

## Campos

- tipo, timestamp, node, commit
- dataset: contagem e tamanhos
- metricas: tempos de parsing e análise, cache, analistas
- analistasResumo: nome, duração, ocorrências
- duracaoScriptMs

## Próximos Passos

- Comparação entre snapshots
- Gate de regressão (ex: +30% parsing)
- Export Markdown consolidado
