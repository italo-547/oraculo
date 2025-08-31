#!/usr/bin/env node
// Wrapper que executa o dist/cli.js usando o loader ESM que resolve aliases @ -> dist/
// Isso evita problemas de resolução quando o usuário invoca via npx oraculo
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const loaderPath = path.resolve(path.dirname(process.argv[1]), '..', 'node.loader.mjs');
const loaderUrl = pathToFileURL(loaderPath).toString();

// Reconstroi args: passar o loader e executar dist/cli.js
const nodeArgs = ['--loader', loaderUrl, path.join('dist', 'cli.js'), ...process.argv.slice(2)];

const res = spawnSync(process.execPath, nodeArgs, { stdio: 'inherit' });
if (res.error) {
  console.error('Erro ao executar oraculo:', res.error.message);
  process.exit(1);
}
process.exit(res.status ?? 0);
