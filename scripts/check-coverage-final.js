#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const COVERAGE_PATH = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');
const DEFAULT_THRESHOLD = 90; // porcentagem mínima por métrica (fallback)
const EXCLUDE_PATH = path.resolve(process.cwd(), 'scripts', 'coverage-exclude.json');
const CONFIG_PATH = path.resolve(process.cwd(), 'oraculo.config.json');

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

    let totalStatements = 0;
    let coveredStatements = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalLines = 0;
    let coveredLines = 0;

    let consideredFiles = 0;
    for (const filePath of Object.keys(data)) {
      const rel = filePath.replace(/\\/g, '/');
      if (matchesAnyPattern(rel, excludePatterns)) continue;
      const entry = data[filePath];
      consideredFiles++;

      // statements
      if (entry.s && typeof entry.s === 'object') {
        const sKeys = Object.keys(entry.s);
        totalStatements += sKeys.length;
        coveredStatements += sKeys.filter((k) => Number(entry.s[k]) > 0).length;
      }

      // functions
      if (entry.f && typeof entry.f === 'object') {
        const fKeys = Object.keys(entry.f);
        totalFunctions += fKeys.length;
        coveredFunctions += fKeys.filter((k) => Number(entry.f[k]) > 0).length;
      }

      // branches (each value is an array of counts)
      if (entry.b && typeof entry.b === 'object') {
        for (const bkey of Object.keys(entry.b)) {
          const arr = entry.b[bkey];
          if (Array.isArray(arr)) {
            totalBranches += arr.length;
            coveredBranches += arr.filter((n) => Number(n) > 0).length;
          }
        }
      }

      // lines (fall back to statements when missing)
      if (entry.l && typeof entry.l === 'object') {
        const lKeys = Object.keys(entry.l);
        totalLines += lKeys.length;
        coveredLines += lKeys.filter((k) => Number(entry.l[k]) > 0).length;
      } else if (entry.s && typeof entry.s === 'object') {
        const sKeys = Object.keys(entry.s);
        totalLines += sKeys.length;
        coveredLines += sKeys.filter((k) => Number(entry.s[k]) > 0).length;
      }
    }

    const totals = {
      lines: {
        total: totalLines,
        covered: coveredLines,
        pct: Number(pct(coveredLines, totalLines).toFixed(2)),
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        pct: Number(pct(coveredFunctions, totalFunctions).toFixed(2)),
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        pct: Number(pct(coveredBranches, totalBranches).toFixed(2)),
      },
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        pct: Number(pct(coveredStatements, totalStatements).toFixed(2)),
      },
    };

    const resolvedThreshold = await resolveThreshold();

    // Se nada foi considerado (totais zero e nenhum arquivo), é um sinal de coleta incorreta.
    // Falhe com código distinto e mensagem clara para evitar falso positivo de 100%.
    const nothingCounted =
      consideredFiles === 0 ||
      (totals.lines.total === 0 &&
        totals.functions.total === 0 &&
        totals.branches.total === 0 &&
        totals.statements.total === 0);
    if (nothingCounted) {
      console.error(
        'Coverage gate: nenhum arquivo contabilizado. Verifique se a coleta de cobertura foi executada com Vitest e se os padrões include/exclude estão corretos.',
      );
      console.error('Arquivos considerados:', consideredFiles);
      console.error('Padrões de exclusão:', JSON.stringify(excludePatterns));
      console.error(JSON.stringify(totals, null, 2));
      process.exit(3);
    }
    const ok =
      totals.lines.pct >= resolvedThreshold &&
      totals.functions.pct >= resolvedThreshold &&
      totals.branches.pct >= resolvedThreshold &&
      totals.statements.pct >= resolvedThreshold;

    if (!ok) {
      console.error(`Coverage gate failed: thresholds not met (min ${resolvedThreshold}%)`);
      console.error(JSON.stringify(totals, null, 2));
      process.exit(1);
    }

    console.log(`Coverage gate passed (min ${resolvedThreshold}%)`);
    console.log(JSON.stringify(totals, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(
      'Failed to read or parse coverage-final.json:',
      err && err.message ? err.message : err,
    );
    process.exit(2);
  }
}

main();

function matchesAnyPattern(filePath, patterns) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) return false;
  // simple matcher supporting **, * and exact suffix/prefix
  for (const p of patterns) {
    const pat = p.replace(/\\/g, '/');
    if (pat === filePath) return true;
    // handle trailing /**
    if (pat.endsWith('/**')) {
      const base = pat.slice(0, -3);
      if (filePath.startsWith(base)) return true;
    }
    // handle /** prefix
    if (pat.startsWith('**/')) {
      const suffix = pat.slice(3);
      if (filePath.endsWith(suffix)) return true;
    }
    // handle simple glob *.ext or *.ts
    if (pat.startsWith('**/') && pat.includes('*.')) {
      const idx = pat.indexOf('*.');
      const ext = pat.slice(idx + 1); // .ext
      if (filePath.endsWith(ext)) return true;
    }
    // handle contains
    if (pat.startsWith('**') && filePath.includes(pat.replace(/^\*\*/, ''))) return true;
    // handle wildcard * in segment
    if (pat.includes('*')) {
      const regex = new RegExp('^' + pat.split('*').map(escapeRegExp).join('.*') + '$');
      if (regex.test(filePath)) return true;
    }
    // fallback substring
    if (filePath.includes(pat.replace(/\*\*/g, '').replace(/\*/g, ''))) return true;
  }
  return false;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\\\]/g, '\\$&');
}

async function resolveThreshold() {
  // 1) ENV var
  const envVal = Number(process.env.COVERAGE_GATE_PERCENT || '');
  if (Number.isFinite(envVal) && envVal > 0 && envVal <= 100) return Math.floor(envVal);

  // 2) oraculo.config.json (COVERAGE_GATE_PERCENT ou coverageGatePercent)
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    const cfg = JSON.parse(raw);
    const fromCfg = Number(cfg?.COVERAGE_GATE_PERCENT) || Number(cfg?.coverageGatePercent) || null;
    if (Number.isFinite(fromCfg) && fromCfg > 0 && fromCfg <= 100) return Math.floor(fromCfg);
  } catch {}

  // 3) fallback
  return DEFAULT_THRESHOLD;
}
