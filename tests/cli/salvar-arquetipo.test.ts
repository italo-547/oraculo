import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { processarDiagnostico } from '../../src/cli/processamento-diagnostico.js';

describe('diagnosticar --criar-arquetipo --salvar-arquetipo', () => {
  const tmpDir = path.join(process.cwd(), 'tests', 'tmp', 'arq-test');

  beforeEach(() => {
    // garantir pasta limpa
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
    fs.mkdirSync(tmpDir, { recursive: true });
    // criar estrutura mínima
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'tmp-proj' }));
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.writeFileSync(path.join(tmpDir, 'README.md'), 'teste');
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('gera e salva oraculo.repo.arquetipo.json', async () => {
    // Rodar processamento no tmpDir
    const cwd = process.cwd();
    try {
      process.chdir(tmpDir);
      const res = await processarDiagnostico({ criarArquetipo: true, salvarArquetipo: true });
      // arquivo salvo?
      const arquivo = path.join(tmpDir, 'oraculo.repo.arquetipo.json');
      const exists = fs.existsSync(arquivo);
      expect(exists).toBe(true);
      if (exists) {
        const content = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
        expect(content.nome).toBe('tmp-proj');
        expect(content.estruturaPersonalizada).toBeDefined();
      }
    } finally {
      process.chdir(cwd);
    }
  });
});
