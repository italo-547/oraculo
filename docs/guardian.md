# Guardian – Verificação de Integridade

O Guardian protege a integridade do repositório através de um snapshot (baseline) de hashes de conteúdo.

## Conceitos

- Baseline: arquivo JSON (`.oraculo/baseline.json`) com mapa `relPath -> hash`.
- Diff: comparação do estado atual com a baseline classificando arquivos em adicionados, alterados ou removidos.
- Políticas: flags `GUARDIAN_ALLOW_ADDS|CHG|DELS` controlam tolerância a mudanças.
- Ignorados: padrões que não entram no snapshot para reduzir ruído.

## Padrões Ignorados (default)

```text
node_modules/**
.oraculo/**
dist/**
coverage/**
build/**
*.log
*.lock
package-lock.json
yarn.lock
pnpm-lock.yaml
.git/**
```

Motivação: evitar arquivos voláteis, enormes ou gerados, tornando o diff significativo.

## Fluxo Básico

1. Executar `oraculo guardian --diff` (ou `--aceitar` para criar/atualizar baseline).
2. Sem baseline existente: é criada automaticamente (status `baseline-criado`).
3. Com baseline: diferenças não permitidas geram `GuardianError` e exit code != 0.

## Flags CLI (planejado / atual)

- `--aceitar`: força aceitar snapshot atual como nova baseline.
- `--full-scan`: executa varredura ignorando GUARDIAN_IGNORE_PATTERNS. Uso: inspeção pontual. Não é permitido aceitar baseline com esta flag.
- `--json`: emite saída estruturada (status, diffs agregados, contagens) para pipelines CI.

## Status Possíveis

- `baseline-criado`: primeira geração.
- `baseline-aceito`: atualização manual.
- `ok`: nenhum diff proibido.
- `alteracoes-detectadas`: diferenças presentes (quando apenas consulta diff).

## Boas Práticas

- Aceite baseline somente quando o estado do repo estiver limpo e revisado.
- Evite commits mistos (mudança de código + aceitação de baseline) sem descrição clara.
- Não inclua artefatos gerados permanentes (ajuste GUARDIAN_IGNORE_PATTERNS se necessário).

## Ajustando Padrões

Via config (arquivo/env/CLI) sobrescreva `GUARDIAN_IGNORE_PATTERNS`. Exemplo em `oraculo.config.json`:

```json
{
  "GUARDIAN_IGNORE_PATTERNS": ["node_modules/**", "dist/**", "coverage/**", "scripts/**"]
}
```

## Troubleshooting

- Muitos diffs inesperados: verifique se build gerou arquivos dentro de áreas não ignoradas.
- Hash alterando sem mudança visível: cheque fim de linha, formatação automática ou geração de timestamp.
- Baseline corrompida: apague `.oraculo/baseline.json` e reaceite.

## Futuro

- Modo leitura incremental.
- Agrupamento de mudanças por diretório.
- Relatório Markdown de diffs.
- Export explícito de contrato de saída (documentação README).
