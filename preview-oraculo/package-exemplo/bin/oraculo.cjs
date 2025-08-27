#!/usr/bin/env node
// Wrapper que executa o CLI gerado em preview-oraculo/dist/cli.js
const { spawn } = require('child_process');
const path = require('path');

const cliPath = path.resolve(__dirname, '..', 'preview-oraculo', 'dist', 'cli.js');
const args = process.argv.slice(2);

const child = spawn(process.execPath, [cliPath, ...args], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code));
