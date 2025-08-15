import fs from 'fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'pre-public');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function copySafe(src, dest) {
    await fs.cp(src, dest, { recursive: true, force: true });
}

async function exists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('[pre-public] buildando projeto...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('[pre-public] limpando pasta alvo...');
    await fs.rm(OUT_DIR, { recursive: true, force: true });
    await ensureDir(OUT_DIR);

    console.log('[pre-public] copiando dist...');
    if (!(await exists(DIST))) throw new Error('dist não encontrado após o build');
    await copySafe(DIST, path.join(OUT_DIR, 'dist'));

    console.log('[pre-public] copiando docs (se existir)...');
    if (await exists(DOCS)) {
        await copySafe(DOCS, path.join(OUT_DIR, 'docs'));
    }

    console.log('[pre-public] copiando arquivos de raiz...');
    const rootFiles = ['README.md', 'LICENSE', 'THIRD-PARTY-NOTICES.txt'];
    for (const f of rootFiles) {
        const src = path.join(ROOT, f);
        if (await exists(src)) {
            await copySafe(src, path.join(OUT_DIR, f));
        }
    }

    console.log('[pre-public] pronto. Veja a pasta pre-public/.');
}

main().catch((e) => {
    console.error('[pre-public] falhou:', e?.message || e);
    process.exit(1);
});
