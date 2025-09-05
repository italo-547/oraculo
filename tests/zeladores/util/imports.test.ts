// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { reescreverImports } from '../../src/zeladores/util/imports.js';

describe('reescreverImports', () => {
  it('atualiza imports relativos ao mover arquivo para subpasta', () => {
    const conteudo =
      "import x from '../../src/zeladores/utils/a';\nexport * from '../utils/b';\nconst y = require('../utils/c')";
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
    // Agora o reescritor converte aliases '@/...' para relativos quando possível
    expect(reescritos.length).toBe(1);
    // O import '@/coisa' deve virar relativo a partir de 'src/b' -> '../coisa'
    expect(novoConteudo).toContain("from '../coisa'");
    // Imports de pacotes (ex: @nucleo/parte) permanecem intactos
    expect(novoConteudo).toContain('@nucleo/parte');
  });

  it("gera prefixo './' quando relative não inicia com ponto após o move", () => {
    const conteudo =
      "import x from '../../src/zeladores/util/utils/a';\nexport * from './utils/b';\nconst y = require('./utils/c')";
    // mover dentro do mesmo diretório faz o relative ficar 'utils/a' (sem ponto)
    const { novoConteudo, reescritos } = reescreverImports(conteudo, 'src/a.ts', 'src/b.ts');
    expect(reescritos.length).toBe(3);
    expect(novoConteudo).toContain("from './utils/a'");
    expect(novoConteudo).toContain("from './utils/b'");
    expect(novoConteudo).toContain("require('./utils/c')");
  });
});
