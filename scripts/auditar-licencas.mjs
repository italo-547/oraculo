#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Auditoria de licenças de dependências e serviços externos
// - Usa dados de package.json + node_modules/licenses quando possível
// - Lista licenças e destaca potenciais incompatibilidades com MIT (evitar GPL/AGPL/LGPL)
// - Gera um resumo e opcionalmente atualiza THIRD-PARTY-NOTICES.txt via scripts/generate-notices.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

const ROOT = process.cwd();

function execFileAsync(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { shell: false, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout: stdout?.toString() ?? '', stderr: stderr?.toString() ?? '' });
    });
  });
}

function normalizeLicense(lic) {
  if (!lic) return '';
  const s = (typeof lic === 'string' ? lic : lic.type || '').trim();
  return s.replace(/\s+/g, ' ').toUpperCase();
}

function isCopyleftStrong(lic) {
  return /(GPL|AGPL|LGPL)(?!-COMPATIBLE)/i.test(lic);
}

function isPermissive(lic) {
  return /(MIT|BSD|APACHE-2\.0|ISC)/i.test(lic);
}

async function readJSONSafe(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf-8'));
  } catch {
    return null;
  }
}

async function listDependenciesFromPackageJson() {
  const pkg = await readJSONSafe(path.join(ROOT, 'package.json'));
  if (!pkg) return [];
  const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
  return deps;
}

async function collectLicenses(deps) {
  const results = [];
  for (const name of deps) {
    const pkgPath = path.join(ROOT, 'node_modules', name, 'package.json');
    const data = await readJSONSafe(pkgPath);
    if (!data) {
      results.push({ name, version: 'unknown', license: 'UNKNOWN', path: pkgPath, kind: 'npm' });
      continue;
    }
    const license = normalizeLicense(data.license || data.licenses);
    results.push({
      name,
      version: data.version || 'unknown',
      license: license || 'UNKNOWN',
      path: pkgPath,
      kind: 'npm',
    });
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const FAIL_ON_COPYLEFT = args.includes('--fail-on-copyleft');
  console.log('==> Auditoria de licenças (npm)');
  const deps = await listDependenciesFromPackageJson();
  if (!deps.length) {
    console.log('Nenhuma dependência encontrada em package.json.');
  }
  const lic = await collectLicenses(deps);

  let permissive = 0,
    unknown = 0,
    flagged = 0;
  for (const r of lic) {
    const isPerm = isPermissive(r.license);
    const isFlag = isCopyleftStrong(r.license);
    if (isPerm) permissive++;
    else if (isFlag) flagged++;
    else unknown++;
  }

  console.log('Resumo:');
  console.log(`  Total deps: ${lic.length}`);
  console.log(`  Permissivas (MIT/BSD/Apache/ISC): ${permissive}`);
  console.log(`  Potencialmente incompatíveis (GPL/AGPL/LGPL): ${flagged}`);
  console.log(`  Desconhecidas/Outras: ${unknown}`);
  console.log();

  if (flagged) {
    console.log('Atenção: Encontradas licenças potencialmente incompatíveis com MIT:');
    for (const r of lic.filter((x) => isCopyleftStrong(x.license))) {
      console.log(`  - ${r.name}@${r.version} — ${r.license}`);
    }
    console.log();
    if (FAIL_ON_COPYLEFT) {
      console.error('Falha: copyleft detectado e --fail-on-copyleft foi usado.');
      process.exit(2);
    }
  }

  // Opcional: rodar gerador de NOTICES (se existir)
  const noticesScript = path.join(ROOT, 'scripts', 'generate-notices.mjs');
  try {
    await fs.access(noticesScript);
    console.log('==> Gerando THIRD-PARTY-NOTICES.txt (scripts/generate-notices.mjs)');
    await execFileAsync(process.execPath, [noticesScript], { cwd: ROOT });
    console.log('NOTICES gerado/atualizado.');
  } catch {
    console.log('scripts/generate-notices.mjs não encontrado; pulando geração de NOTICES.');
  }

  // Serviços de terceiros: busca heurística em README/CONFIG
  console.log('\n==> Heurística de serviços de terceiros (URLs/domínios conhecidos)');
  const urlsRx =
    /(github|gitlab|vercel|aws|azure|gcp|firebase|sentry|datadog|newrelic|segment|mixpanel|amplitude)\.[a-z]+/gi;
  let mdFiles = [];
  try {
    const { stdout } = await execFileAsync('git', ['ls-files', '*.md'], { cwd: ROOT });
    mdFiles = stdout.split(/\r?\n/).filter(Boolean);
  } catch {}
  let hits = 0;
  for (const rel of mdFiles) {
    try {
      const c = await fs.readFile(path.join(ROOT, rel), 'utf-8');
      const m = c.match(urlsRx);
      if (m && m.length) {
        console.log(`  ${rel}: ${Array.from(new Set(m)).join(', ')}`);
        hits++;
      }
    } catch {}
  }
  if (!hits) console.log('  Nenhuma referência encontrada.');

  // Heurística de termos de licença restritiva e cessão de direitos em código/markdown
  console.log('\n==> Varredura textual por termos de licenças restritivas e cessão de direitos');
  const patterns = [
    { name: 'GPL/AGPL/LGPL', rx: /\b(A?GPL|LGPL)\b/i },
    { name: 'Copyleft', rx: /\bcopyleft\b/i },
    {
      name: 'CLA/cessão',
      rx: /(Contributor License Agreement|CLA|cess[aã]o de direitos|transfer[eê]ncia de direitos|assignment of rights)/i,
    },
    {
      name: 'Proprietary-only',
      rx: /\b(nao autorizado|reservados todos os direitos|all rights reserved)\b/i,
    },
  ];
  // arquivos de texto relevantes
  const { stdout: textList } = await execFileAsync('git', ['ls-files', '*.*']);
  const textFiles = textList
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((f) => /\.(ts|js|json|md|txt|cjs|mjs)$/i.test(f));
  const findings = [];
  for (const rel of textFiles) {
    let content = '';
    try {
      content = await fs.readFile(path.join(ROOT, rel), 'utf-8');
    } catch {
      continue;
    }
    for (const p of patterns) {
      if (p.rx.test(content)) {
        findings.push({ file: rel, term: p.name });
      }
    }
  }
  if (findings.length) {
    console.log('Possíveis ocorrências encontradas (revisar contexto):');
    for (const f of findings) {
      console.log(`  - ${f.file}: ${f.term}`);
    }
  } else {
    console.log('Nenhum termo sensível encontrado.');
  }
}

main().catch((err) => {
  console.error('Erro na auditoria de licenças:', err?.message || err);
  process.exit(1);
});
