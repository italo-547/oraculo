import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';
import path from 'node:path';

describe('detector-arquetipos - estrutura desconhecida', () => {
  it('retorna vazio para estrutura não mapeada', async () => {
    const baseDir = path.resolve('tests/fixtures/estruturas/estrutura-desconhecida');
    const arquivos = [];
    const resultado = await detectarArquetipos({ arquivos, baseDir }, baseDir);
    expect(resultado.melhores).toHaveLength(0);
    expect(resultado.baseline).toBeUndefined();
  });
});
