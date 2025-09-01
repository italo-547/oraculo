#!/usr/bin/env node
// Arquivo movido para legacy. Use ferramentas oficiais de cobertura e relatórios do projeto.
const path = require('node:path');
const { spawn } = require('node:child_process');
const target = path.join(__dirname, '..', 'print-low-coverage.cjs');
const child = spawn(process.execPath, [target, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
