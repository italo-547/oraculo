// SPDX-License-Identifier: MIT
// Gera a pasta preview-oraculo/ contendo build, docs e um package.json de produção
import fs from 'fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'preview-oraculo');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');
const PKG_PATH = path.join(ROOT, 'package.json');

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

async function synthesizeProdPackageJson() {
  const raw = await fs.readFile(PKG_PATH, 'utf-8');
  const pkg = JSON.parse(raw);

  const prod = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    license: pkg.license,
    type: 'module',
    main: './dist/bin/cli.js',
    exports: {
      '.': './dist/bin/cli.js',
    },
    bin: {
      oraculo: './dist/bin/index.js',
    },
    engines: pkg.engines || { node: '>=24.0.4' },
    preferGlobal: true,
    files: ['dist', 'README.md', 'LICENSE*', 'THIRD-PARTY-NOTICES.txt'],
    dependencies: pkg.dependencies || {},
    // scripts mínimos úteis para consumidores testarem localmente o preview
    scripts: {
      start: 'node ./dist/bin/index.js',
      diagnosticar: 'node ./dist/bin/index.js diagnosticar',
    },
    keywords: pkg.keywords || [],
  };

  return prod;
}

function generateRepoArquetipoExample() {
  const now = new Date().toISOString();
  return {
    nome: 'meu-repo-exemplo',
    descricao: 'Arquétipo personalizado de exemplo para um projeto CLI modular',
    arquetipoOficial: 'cli',
    estruturaPersonalizada: {
      diretorios: ['src', 'tests', 'docs', 'dist'],
      arquivosChave: ['package.json', 'tsconfig.json', 'README.md'],
      padroesNomenclatura: {
        comandos: 'src/cli/comando-*.ts',
        analistas: 'src/analistas/*.ts',
      },
    },
    melhoresPraticas: {
      recomendado: [
        'Separar domínios (analistas/arquitetos/zeladores/guardian)',
        'Usar helpers centralizados de persistência',
      ],
      evitar: ['Código não tipado', 'Acesso direto a fs fora dos helpers'],
      notas: ['Ajuste arquetipoOficial conforme o tipo do seu projeto (api, cli, fullstack, etc.)'],
    },
    metadata: {
      criadoEm: now,
      versao: '1.0.0',
      notasUsuario: 'Edite este arquivo para refletir o arquétipo do seu repositório.',
    },
  };
}

async function insertProvenienciaInPreview() {
  try {
    const avisoPath = path.join(ROOT, 'docs', 'partials', 'AVISO-PROVENIENCIA.md');
    const aviso = await fs.readFile(avisoPath, 'utf-8');
    const marker = /Proveni[eê]ncia\s+e\s+Autoria/i;
    async function listMarkdown(dir) {
      const acc = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) acc.push(...(await listMarkdown(p)));
        else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) acc.push(p);
      }
      return acc;
    }
    const mdFiles = await listMarkdown(OUT_DIR);
    for (const f of mdFiles) {
      if (path.basename(f).toLowerCase() === 'preview.md') continue;
      let c = await fs.readFile(f, 'utf-8');
      const head = c.split(/\r?\n/).slice(0, 30).join('\n');
      if (!marker.test(head)) {
        await fs.writeFile(f, `${aviso}\n\n${c.trimStart()}\n`, 'utf-8');
      }
    }
    console.log('[preview] Aviso de proveniência inserido nos .md de preview-oraculo.');
  } catch (e) {
    console.warn('[preview] Aviso de proveniência não inserido:', e?.message || e);
  }
}

async function main() {
  console.log('[preview] buildando projeto...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('[preview] limpando pasta alvo...');
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await ensureDir(OUT_DIR);

  console.log('[preview] copiando dist...');
  if (!(await exists(DIST))) throw new Error('dist não encontrado após o build');
  await copySafe(DIST, path.join(OUT_DIR, 'dist'));

  console.log('[preview] copiando docs (se existir)...');
  if (await exists(DOCS)) {
    await copySafe(DOCS, path.join(OUT_DIR, 'docs'));
  }

  console.log('[preview] copiando arquivos de raiz...');
  const rootFiles = [
    'README.md',
    'LICENSE',
    'LICENSE.md',
    'THIRD-PARTY-NOTICES.txt',
    'oraculo.config.json',
    'oraculo.config.safe.json',
    'tsconfig.json',
    'tsconfig.eslint.json',
    'package-lock.json',
  ];
  for (const f of rootFiles) {
    const src = path.join(ROOT, f);
    if (await exists(src)) {
      await copySafe(src, path.join(OUT_DIR, f));
    }
  }

  console.log('[preview] gerando package.json de produção...');
  const prodPkg = await synthesizeProdPackageJson();
  await fs.writeFile(path.join(OUT_DIR, 'package.json'), JSON.stringify(prodPkg, null, 2), 'utf-8');

  console.log('[preview] gerando oraculo.repo.arquetipo.json (exemplo)...');
  const arq = generateRepoArquetipoExample();
  await fs.writeFile(
    path.join(OUT_DIR, 'oraculo.repo.arquetipo.json'),
    JSON.stringify(arq, null, 2),
    'utf-8',
  );

  await insertProvenienciaInPreview();

  const previewNote = `# Prévia de Publicação (Review)

Este diretório foi gerado pelo script preview para revisão do que seria publicado.

- Conteúdos aqui refletem o estado atual de build (dist/) e documentação (docs/).
- Para testar o CLI no preview: instale dependências (npm ci) e rode "npm start".
- Alterações devem ser feitas na raiz do projeto e o script reexecutado.
- Este arquivo não será incluído em publicação real; serve apenas como aviso/guia de revisão.

Conteúdo adicional incluído:
- oraculo.repo.arquetipo.json (exemplo de arquétipo de repositório para você editar)

Data/Horário de geração: ${new Date().toISOString()}
`;
  await fs.writeFile(path.join(OUT_DIR, 'PREVIEW.md'), previewNote, 'utf-8');

  console.log('[preview] pronto. Veja a pasta preview-oraculo/.');
}

main().catch((e) => {
  console.error('[preview] falhou:', e?.message || e);
  process.exit(1);
});
