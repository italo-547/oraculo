#!/usr/bin/env bash
set -euo pipefail

echo "==> Listando Markdown (*.md) rastreados pelo git"
git ls-files '*.md' | sort || true
echo

echo "==> Procurando padrões de risco de autoria/licença em .md"
# Ajuste os termos conforme necessário
PATTERN='(\\bGPL\\b|\\bAGPL\\b|\\bLGPL\\b|Creative Commons|\\bCC-BY\\b|Stack Overflow|stackoverflow\\.com|All rights reserved|cess(ã|a)o de direitos|transfer(ê|e)ncia de direitos|assign|cession)'
grep -RniE --exclude-dir=node_modules --exclude-dir=dist --include='*.md' "$PATTERN" . || true
echo

echo "==> Verificando presença do aviso de Proveniência e Autoria (primeiras 30 linhas)"
MISSING=0
while IFS= read -r f; do
  head -n 30 "$f" | grep -qiE 'Proveni(e|ê)ncia e Autoria' || {
    echo "FALTA AVISO: $f"
    MISSING=1
  }
done < <(git ls-files '*.md' | sort)

if [ $MISSING -ne 0 ]; then
  echo
  echo "Alguns arquivos .md não possuem o aviso de proveniência/autoria (considere usar scripts/add-disclaimer-md.js)."
  exit 2
fi

echo
echo "OK: Varredura básica concluída."