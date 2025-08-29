#!/usr/bin/env node
// Script de diagnóstico para reproduzir e2e reestruturar (CommonJS)
const { mkdtempSync, writeFileSync, existsSync, mkdirSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync, execSync } = require('child_process');

function garantirBuild() {
  const cliPath = resolve('dist/cli.js');
  if (!existsSync(cliPath)) {
    console.log('dist/cli.js não encontrado, executando build...');
    execSync('npm run build', { stdio: 'inherit' });
  }
  return cliPath;
}

(function main(){
  try {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-move-'));
    console.log('tempDir:', tempDir);

    writeFileSync(
      join(tempDir, 'oraculo.config.json'),
      JSON.stringify({ STRUCTURE_AUTO_FIX: true }, null, 2),
      'utf-8',
    );
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-rewrite', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    mkdirSync(join(tempDir, 'src', 'utils'));
    writeFileSync(join(tempDir, 'src', 'utils', 'a.ts'), 'export const A=1;', 'utf-8');
    writeFileSync(
      join(tempDir, 'src', 'pedido.controller.ts'),
      "import { A } from '../../src/cli/utils/a';\nexport const ctrl=()=>A;\n",
      'utf-8',
    );

    console.log('Arquivos criados. Executando CLI...');
    const proc = spawnSync(process.execPath, [cliPath, 'reestruturar', '--auto', '--domains', '--prefer-estrategista', '--silence'], { cwd: tempDir, encoding: 'utf-8', timeout: 30000 });
    console.log('exitCode:', proc.status);
    console.log('stdout:\n', proc.stdout);
    console.log('stderr:\n', proc.stderr);

    const destino = join(
      tempDir,
      'src',
      'domains',
      'pedido',
      'controllers',
      'pedido.controller.ts',
    );
    console.log('destino exists:', existsSync(destino));
    if (existsSync(destino)) console.log('conteudo destino:\n', readFileSync(destino, 'utf-8'));

    // cleanup
    try { rmSync(tempDir, { recursive: true, force: true }); console.log('temp cleaned'); } catch {}
  } catch (err) {
    console.error('Erro no script debug:', err);
    process.exit(2);
  }
})();
