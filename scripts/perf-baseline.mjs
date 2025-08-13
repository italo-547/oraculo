#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsPerfDir = path.join(root, 'docs', 'perf');
await fs.mkdir(docsPerfDir, { recursive: true });

function tempo() { return performance.now(); }

async function coletarArquivos(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const lista = [];
  for (const e of entries) {
    if (e.name.startsWith('.git') || e.name.startsWith('node_modules')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      lista.push(...(await coletarArquivos(full)));
    } else if (e.isFile() && e.name.endsWith('.ts')) {
      const stat = await fs.stat(full);
      lista.push({ rel: path.relative(root, full), size: stat.size });
    }
  }
  return lista;
}

const inicio = tempo();
const arquivos = await coletarArquivos(path.join(root, 'src'));
const mid = tempo();
// Simulação leve de parsing/análise (hashing conteúdo)
let totalBytes = 0;
for (const a of arquivos) {
  const conteudo = await fs.readFile(path.join(root, a.rel), 'utf-8');
  crypto.createHash('sha1').update(conteudo).digest('hex');
  totalBytes += conteudo.length;
}
const fim = tempo();

const snapshot = {
  tipo: 'perf-baseline',
  timestamp: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || null,
  node: process.version,
  dataset: { arquivos: arquivos.length, totalBytes },
  temposMs: {
    scan: +(mid - inicio).toFixed(2),
    analiseSimulada: +(fim - mid).toFixed(2),
    total: +(fim - inicio).toFixed(2)
  },
  host: { plataforma: os.platform(), cpus: os.cpus().length },
  metricsSchemaVersion: 1
};

const filePath = path.join(docsPerfDir, `baseline-${Date.now()}.json`);
await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

// Diff simples com penúltimo snapshot
const arquivosPerf = (await fs.readdir(docsPerfDir)).filter(f => f.startsWith('baseline-') && f.endsWith('.json')).sort();
if (arquivosPerf.length > 1) {
  const anteriorPath = path.join(docsPerfDir, arquivosPerf[arquivosPerf.length - 2]);
  try {
    const anterior = JSON.parse(await fs.readFile(anteriorPath, 'utf-8'));
    const diff = {
      atual: path.basename(filePath),
      anterior: path.basename(anteriorPath),
      variacoes: {
        scanPct: percentual(anterior.temposMs.scan, snapshot.temposMs.scan),
        analiseSimuladaPct: percentual(anterior.temposMs.analiseSimulada, snapshot.temposMs.analiseSimulada),
        totalPct: percentual(anterior.temposMs.total, snapshot.temposMs.total)
      }
    };
    const diffPath = path.join(docsPerfDir, 'ultimo-diff.json');
    await fs.writeFile(diffPath, JSON.stringify(diff, null, 2), 'utf-8');
  } catch {}
}

function percentual(oldV, newV) {
  if (!oldV) return null;
  return +(((newV - oldV) / oldV) * 100).toFixed(2);
}

console.log(`[perf] snapshot salvo em ${path.relative(root, filePath)}`);
