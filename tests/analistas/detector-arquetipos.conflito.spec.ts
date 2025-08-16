import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';

describe('detector-arquetipos (conflito)', () => {
  it('deve retornar múltiplos candidatos em caso de conflito', async () => {
    const arquivos = [
      { relPath: 'api.js', ast: undefined, fullPath: 'api.js', content: '' },
      { relPath: 'web.tsx', ast: undefined, fullPath: 'web.tsx', content: '' },
      { relPath: 'index.html', ast: undefined, fullPath: 'index.html', content: '' },
    ];
    const resultado = await detectarArquetipos({ arquivos, baseDir: '.' }, '.');
    expect(Array.isArray(resultado.melhores)).toBe(true);
    expect(resultado.melhores.length).toBeGreaterThanOrEqual(1);
  });
});
