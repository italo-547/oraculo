#!/usr/bin/env node
// Script legado - mantido apenas para referência.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const alvo = path.join(__dirname, '..', 'test-supressao-parcial.mjs');
const child = spawn(process.execPath, [alvo, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
