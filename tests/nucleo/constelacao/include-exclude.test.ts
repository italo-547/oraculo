// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { shouldInclude } from '../../src/nucleo/constelacao/include-exclude.js';
import type { Dirent } from 'node:fs';

function fakeDirent(name: string, isDir = false): Dirent {
  return {
    name,
    isDirectory: () => isDir,
    isSymbolicLink: () => false,
  } as unknown as Dirent;
}

describe('shouldInclude helper', () => {
  it('inclui por padrão quando nenhuma regra é fornecida', () => {
    const cfg = {};
    const inc = shouldInclude('src/index.ts', fakeDirent('index.ts'), cfg as any);
    expect(inc).toBe(true);
  });

  it('exclui quando globalExclude casa', () => {
    const cfg = { globalExclude: ['node_modules'] };
    expect(shouldInclude('node_modules/pkg/index.js', fakeDirent('index.js'), cfg as any)).toBe(
      false,
    );
  });

  it('inclui quando globalInclude casa', () => {
    const cfg = { globalInclude: ['src'] };
    expect(shouldInclude('src/app.ts', fakeDirent('app.ts'), cfg as any)).toBe(true);
  });

  it('dirRules: exclude tem precedência', () => {
    const cfg = { dirRules: { 'src/': { exclude: true } } };
    expect(shouldInclude('src/app.ts', fakeDirent('app.ts'), cfg as any)).toBe(false);
  });

  it('dirRules: include verdadeiro', () => {
    const cfg = { dirRules: { 'docs/': { include: true } } };
    expect(shouldInclude('docs/README.md', fakeDirent('README.md'), cfg as any)).toBe(true);
  });

  it('dirRules: patterns aplica include quando substring casa', () => {
    const cfg = { dirRules: { 'src/': { patterns: ['.spec.ts'] } } };
    expect(shouldInclude('src/util/foo.spec.ts', fakeDirent('foo.spec.ts'), cfg as any)).toBe(true);
  });

  it('dirRules: custom decide dinamicamente', () => {
    const cfg = {
      dirRules: {
        'src/': {
          custom: (rel) => rel.endsWith('.ts'),
        },
      },
    };
    expect(shouldInclude('src/a.ts', fakeDirent('a.ts'), cfg as any)).toBe(true);
    expect(shouldInclude('src/a.js', fakeDirent('a.js'), cfg as any)).toBe(true); // sem exclusão padrão
  });
});
