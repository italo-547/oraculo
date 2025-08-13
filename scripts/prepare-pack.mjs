#!/usr/bin/env node
// Gera pasta dist-pack contendo apenas artefatos necessários para uso runtime do Oráculo
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'dist-pack');

async function main() {
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });
    // Copia dist inteiro
    async function copyDir(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        for (const e of entries) {
            const s = path.join(src, e.name);
            const d = path.join(dest, e.name);
            if (e.isDirectory()) await copyDir(s, d); else if (e.isFile()) await fs.copyFile(s, d);
        }
    }
    await copyDir(dist, path.join(outDir, 'dist'));

    // package minimal
    const pkgRaw = await fs.readFile(path.join(root, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgRaw);
    const minimal = {
        name: pkg.name,
        version: pkg.version,
        type: pkg.type,
        bin: pkg.bin,
        main: pkg.main,
        exports: pkg.exports,
        license: pkg.license,
        description: pkg.description,
        engines: pkg.engines,
        dependencies: pkg.dependencies,
    };
    await fs.writeFile(path.join(outDir, 'package.json'), JSON.stringify(minimal, null, 2));
    // README básico
    await fs.writeFile(path.join(outDir, 'README-runtime.md'), '# Oraculo Runtime\nPacote enxuto para execução do CLI já compilado.');
    console.log('dist-pack gerado em', outDir);
}
main().catch(e => { console.error(e); process.exit(1); });
