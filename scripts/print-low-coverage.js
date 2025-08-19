// quick helper to print lowest coverage files
const fs = require('fs');
const path = require('path');
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'coverage', 'coverage-final.json'), 'utf8'),
);
const rows = Object.entries(data).map(([f, m]) => ({
  file: f,
  stmts: m.s.pct,
  branches: m.b.pct,
  funcs: m.f.pct,
  lines: m.l.pct,
}));
const srcRows = rows.filter((r) => r.file.includes(path.sep + 'src' + path.sep));
srcRows.sort((a, b) => a.branches - b.branches || a.stmts - b.stmts);
console.log(srcRows.slice(0, 25));
