// quick helper to print lowest coverage files (compute pct from raw maps)
const fs = require('fs');
const path = require('path');
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'coverage', 'coverage-final.json'), 'utf8'),
);

function pctStatements(m) {
  const s = m.s || {};
  const total = Object.keys(s).length;
  if (!total) return 100;
  const covered = Object.values(s).filter((hits) => Number(hits) > 0).length;
  return +((covered * 100) / total).toFixed(2);
}
function pctFunctions(m) {
  const f = m.f || {};
  const total = Object.keys(f).length;
  if (!total) return 100;
  const covered = Object.values(f).filter((hits) => Number(hits) > 0).length;
  return +((covered * 100) / total).toFixed(2);
}
function pctBranches(m) {
  const b = m.b || {};
  const keys = Object.keys(b);
  if (!keys.length) return 100;
  let total = 0;
  let covered = 0;
  for (const k of keys) {
    const arr = Array.isArray(b[k]) ? b[k] : [];
    total += arr.length;
    covered += arr.filter((hits) => Number(hits) > 0).length;
  }
  if (!total) return 100;
  return +((covered * 100) / total).toFixed(2);
}

const rows = Object.entries(data).map(([file, m]) => ({
  file,
  stmts: pctStatements(m),
  branches: pctBranches(m),
  funcs: pctFunctions(m),
}));
const srcRows = rows.filter((r) => r.file.includes(path.sep + 'src' + path.sep));
srcRows.sort((a, b) => a.branches - b.branches || a.stmts - b.stmts);
console.log(srcRows.slice(0, 35));
