#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const COVERAGE_PATH = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');
const TOP = 60;
const EXCLUDE_PATH = path.resolve(process.cwd(), 'scripts', 'coverage-exclude.json');

function pct(covered, total) {
  if (total === 0) return 100;
  return (covered / total) * 100;
}

async function main() {
  try {
    const raw = await fs.readFile(COVERAGE_PATH, 'utf8');
    const data = JSON.parse(raw);

    // load exclude patterns if present
    let excludePatterns = [];
    try {
      const rawEx = await fs.readFile(EXCLUDE_PATH, 'utf8');
      excludePatterns = JSON.parse(rawEx);
    } catch {}

    const rows = [];
    for (const filePath of Object.keys(data)) {
      const rel = filePath.replace(/\\/g, '/');
      if (matchesAnyPattern(rel, excludePatterns)) continue;
      const entry = data[filePath];
      // prefer lines, fall back to statements
      const linesObj = entry.l || entry.s || {};
      const totalLines = Object.keys(linesObj).length;
      const coveredLines = Object.keys(linesObj).filter((k) => Number(linesObj[k]) > 0).length;
      const linePct = totalLines === 0 ? 100 : pct(coveredLines, totalLines);

      const stmObj = entry.s || {};
      const totalStmts = Object.keys(stmObj).length;
      const coveredStmts = Object.keys(stmObj).filter((k) => Number(stmObj[k]) > 0).length;
      const stmtPct = totalStmts === 0 ? 100 : pct(coveredStmts, totalStmts);

      rows.push({
        filePath,
        totalLines,
        coveredLines,
        linePct: Number(linePct.toFixed(2)),
        totalStmts,
        coveredStmts,
        stmtPct: Number(stmtPct.toFixed(2)),
      });
    }

    // sort by pct asc, then by totalLines desc (high impact files first)
    rows.sort((a, b) => a.linePct - b.linePct || b.totalLines - a.totalLines);

    console.log(
      '# Prioridade para aumentar cobertura: arquivos com menores % de linhas (impacto alto primeiro)',
    );
    console.log(
      '# Format: pct_lines | total_lines | covered | pct_stmts | total_stmts | covered | path',
    );
    console.log();

    const list = rows.slice(0, TOP);
    for (const r of list) {
      console.log(
        `${String(r.linePct).padStart(6)}% | ${String(r.totalLines).padStart(6)} | ${String(r.coveredLines).padStart(6)} | ${String(r.stmtPct).padStart(6)}% | ${String(r.totalStmts).padStart(6)} | ${String(r.coveredStmts).padStart(6)} | ${r.filePath}`,
      );
    }

    console.log();
    console.log('# Sugestões automáticas de exclusão (candidatos):');
    const suggestions = [];
    for (const r of rows) {
      const p = r.filePath.replace(/\\/g, '/');
      if (
        p.includes('/scripts/') ||
        p.includes('/docs/') ||
        p.includes('/preview-oraculo/') ||
        p.includes('/temp-fantasma/') ||
        p.endsWith('.md')
      ) {
        suggestions.push(p);
      }
    }
    const uniq = Array.from(new Set(suggestions)).slice(0, 100);
    if (uniq.length === 0) console.log('Nenhum candidato óbvio de exclusão encontrado.');
    else uniq.forEach((s) => console.log('- ' + s));

    process.exit(0);
  } catch (err) {
    console.error(
      'Falha ao ler/parsar coverage-final.json:',
      err && err.message ? err.message : err,
    );
    process.exit(2);
  }
}

main();

function matchesAnyPattern(filePath, patterns) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) return false;
  for (const p of patterns) {
    const pat = p.replace(/\\/g, '/');
    if (pat === filePath) return true;
    if (pat.endsWith('/**')) {
      const base = pat.slice(0, -3);
      if (filePath.startsWith(base)) return true;
    }
    if (pat.startsWith('**/')) {
      const suffix = pat.slice(3);
      if (filePath.endsWith(suffix)) return true;
    }
    if (pat.includes('*')) {
      const regex = new RegExp('^' + pat.split('*').map(escapeRegExp).join('.*') + '$');
      if (regex.test(filePath)) return true;
    }
    if (filePath.includes(pat.replace(/\*\*/g, '').replace(/\*/g, ''))) return true;
  }
  return false;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\\\]/g, '\\$&');
}
