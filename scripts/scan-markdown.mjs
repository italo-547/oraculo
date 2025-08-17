#!/usr/bin/env node
// Varredura de Markdown sem depender de Bash (cross-plataforma)
// - Lista .md (via git ls-files *.md; fallback para varredura FS)
// - Procura padrões de risco de autoria/licença
// - Verifica presença do aviso de "Proveniência e Autoria" nas primeiras 30 linhas

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();

function execFileAsync(cmd, args, opts) {
   return new Promise((resolve, reject) => {
      execFile(cmd, args, { shell: false, ...opts }, (err, stdout, stderr) => {
         if (err) return reject(Object.assign(err, { stdout, stderr }));
         resolve({ stdout: stdout?.toString() ?? '', stderr: stderr?.toString() ?? '' });
      });
   });
}

async function listMarkdownViaGit() {
   try {
      const { stdout } = await execFileAsync('git', ['ls-files', '*.md'], { cwd: ROOT });
      return stdout
         .split(/\r?\n/)
         .map(s => s.trim())
         .filter(Boolean)
         .map(p => path.resolve(ROOT, p));
   } catch {
      return [];
   }
}

async function listMarkdownViaFS() {
   const ignoreDirs = new Set(['node_modules', 'dist', 'coverage', 'pre-public', '.git']);
   const results = [];
   async function walk(dir) {
      let entries;
      try {
         entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
         return;
      }
      for (const ent of entries) {
         const full = path.join(dir, ent.name);
         if (ent.isDirectory()) {
            if (ignoreDirs.has(ent.name)) continue;
            // Evitar node_modules dentro de fixtures
            if (full.includes(path.join('tests', 'fixtures')) && ent.name === 'node_modules') continue;
            await walk(full);
         } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) {
            results.push(full);
         }
      }
   }
   await walk(ROOT);
   return results.sort();
}

function mkRegex() {
   // Similar ao PATTERN do script bash, com alternativas de acentos
   return new RegExp(
      [
         '\\bGPL\\b',
         '\\bAGPL\\b',
         '\\bLGPL\\b',
         'Creative\\s+Commons',
         '\\bCC-BY\\b',
         'Stack\\s*Overflow',
         'stackoverflow\\.com',
         'All\\s+rights\\s+reserved',
         'cess(?:ã|a)o\\s+de\\s+direitos',
         'transfer(?:ê|e)ncia\\s+de\\s+direitos',
         '\\bassign\\b',
         '\\bcession\\b',
      ].join('|'),
      'i'
   );
}

function hasProvenienciaHeader(headContent) {
   return /Proveni[eê]ncia\s+e\s+Autoria/i.test(headContent);
}

async function main() {
   console.log('==> Listando Markdown (*.md) via git (fallback: FS)');
   let arquivos = await listMarkdownViaGit();
   if (!arquivos.length) arquivos = await listMarkdownViaFS();
   for (const f of arquivos) console.log(path.relative(ROOT, f));
   console.log();

   console.log('==> Procurando padrões de risco de autoria/licença em .md');
   const riscRx = mkRegex();
   let riscos = 0;
   for (const f of arquivos) {
      const rel = path.relative(ROOT, f).replace(/\\/g, '/');
      if (
         rel.startsWith('pre-public/') ||
         rel.startsWith('.abandonados/') ||
         rel.startsWith('.deprecados/') ||
         rel.startsWith('relatorios/')
      ) continue;
      let conteudo;
      try { conteudo = await fs.readFile(f, 'utf-8'); } catch { continue; }
      if (riscRx.test(conteudo)) {
         console.log(`RISCO: ${rel}`);
         riscos++;
      }
   }
   if (!riscos) console.log('Nenhum padrão de risco encontrado.');
   console.log();

   console.log('==> Verificando presença do aviso de Proveniência e Autoria (primeiras 30 linhas)');
   let missing = 0;
   for (const f of arquivos) {
      const rel = path.relative(ROOT, f).replace(/\\/g, '/');
      if (
         rel.startsWith('pre-public/') ||
         rel.startsWith('.abandonados/') ||
         rel.startsWith('.deprecados/') ||
         rel.startsWith('relatorios/')
      ) continue;
      let conteudo;
      try { conteudo = await fs.readFile(f, 'utf-8'); } catch { continue; }
      const head = conteudo.split(/\r?\n/).slice(0, 30).join('\n');
      if (!hasProvenienciaHeader(head)) {
         console.log(`FALTA AVISO: ${rel}`);
         missing++;
      }
   }

   if (missing) {
      console.log('\nAlguns arquivos .md não possuem o aviso de proveniência/autoria (use scripts/add-disclaimer-md.js).');
      process.exitCode = 1;
   } else {
      console.log('\nOK: Varredura básica concluída.');
   }
}

main().catch((err) => {
   console.error('Erro ao varrer Markdown:', err?.message || err);
   process.exit(1);
});
