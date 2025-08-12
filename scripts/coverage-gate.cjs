#!/usr/bin/env node
/*
  Gate simples de cobertura.
  Estratégia: usar summary gerado em coverage/coverage-summary.json.
  Limites default: statements 90, branches 85, functions 90, lines 90.
  Aceita overrides via env: COV_STATEMENTS, COV_BRANCHES, etc.
*/
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error('[coverage-gate] Arquivo coverage-summary.json não encontrado. Rode `npm run coverage` antes.');
  process.exit(2);
}
const json = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
// Vitest usa chave 'total'
const total = json.total;
if (!total) {
  console.error('[coverage-gate] Estrutura inesperada no coverage-summary.json');
  process.exit(2);
}
const min = {
  statements: Number(process.env.COV_STATEMENTS || 90),
  branches: Number(process.env.COV_BRANCHES || 85),
  functions: Number(process.env.COV_FUNCTIONS || 90),
  lines: Number(process.env.COV_LINES || 90)
};
const current = {
  statements: total.statements.pct,
  branches: total.branches.pct,
  functions: total.functions.pct,
  lines: total.lines.pct
};
let ok = true;
for (const k of Object.keys(min)) {
  if (current[k] < min[k]) {
    ok = false;
    console.error(`[coverage-gate] Falha: ${k} ${current[k]}% < limiar ${min[k]}%`);
  } else {
    console.log(`[coverage-gate] OK: ${k} ${current[k]}% >= ${min[k]}%`);
  }
}
if (!ok) process.exit(1);
console.log('[coverage-gate] Sucesso: cobertura dentro dos limites.');
