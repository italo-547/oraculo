import { describe, it, expect } from 'vitest';
import { reescreverImports } from './imports.js';

describe('reescreverImports', () => {
  it('atualiza imports relativos ao mover arquivo para subpasta', () => {
    const conteudo =
      "import x from '../utils/a';\nexport * from '../utils/b';\nconst y = require('../utils/c')";
    const { novoConteudo, reescritos } = reescreverImports(
      conteudo,
      'src/feat/index.ts',
      'src/feat/sub/index.ts',
    );
    expect(reescritos.length).toBe(3);
    expect(novoConteudo).toContain("from '../../utils/a'");
    expect(novoConteudo).toContain("from '../../utils/b'");
    expect(novoConteudo).toContain("require('../../utils/c')");
  });

  it('não altera imports absolutos ou de pacotes', () => {
    const conteudo =
      "import fs from 'node:fs';\nimport x from '@/coisa';\nexport * from '@nucleo/parte';";
    const { novoConteudo, reescritos } = reescreverImports(conteudo, 'src/a.ts', 'src/b/a.ts');
    expect(reescritos.length).toBe(0);
    expect(novoConteudo).toBe(conteudo);
  });
});
