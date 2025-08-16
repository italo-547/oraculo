import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';

describe('detector-arquetipos (desconhecido)', () => {
  it('deve retornar "desconhecido" quando não há correspondência', async () => {
    const arquivos = [
      { relPath: 'foo.bar', ast: undefined, fullPath: 'foo.bar', content: '' },
      { relPath: 'sem-arquetipo.txt', ast: undefined, fullPath: 'sem-arquetipo.txt', content: '' },
    ];
    const resultado = await detectarArquetipos({ arquivos, baseDir: '.' }, '.');
    expect(resultado.melhores[0]?.nome).toBe('desconhecido');
  });
});
