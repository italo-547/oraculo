Oráculo — modo seguro (exemplo)

Este arquivo explica como usar o `oraculo.config.safe.json` exemplo para executar o Oráculo em modo seguro, recomendado para análise de repositórios de terceiros.

Exemplo de uso (PowerShell):

```powershell
# usa as configurações do arquivo de exemplo ao executar (copie para oraculo.config.json ou exporte variáveis de ambiente)
cp oraculo.config.safe.json oraculo.config.json
node ./dist/cli.js diagnosticar --scan-only
```

Para permitir temporariamente execuções de shell (não recomendado sem revisão):

```powershell
$env:ORACULO_ALLOW_EXEC = '1'; node ./dist/cli.js perf baseline
```

Recomenda-se não executar com `ALLOW_PLUGINS` ou `ALLOW_MUTATE_FS` habilitados sem revisão prévia do repositório e/ou execução em container isolado.
