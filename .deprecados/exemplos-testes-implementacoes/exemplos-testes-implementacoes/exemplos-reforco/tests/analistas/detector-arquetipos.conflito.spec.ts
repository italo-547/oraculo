import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';
import path from 'node:path';

describe('detector-arquetipos - conflito de confiança', () => {
  it('relata conflito quando scores de candidatos são próximos', async () => {
    const baseDir = path.resolve('tests/fixtures/estruturas/conflito-de-confianca');
    const arquivos = [
      { relPath: 'index.js', conteudo: '' },
      { relPath: 'app.ts', conteudo: '' },
      { relPath: 'main.py', conteudo: '' },
    ];
    const resultado = await detectarArquetipos({ arquivos, baseDir }, baseDir);
    expect(resultado.melhores.length).toBeGreaterThan(1);
    const scores = resultado.melhores.map((a) => a.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    expect(maxScore - minScore).toBeLessThan(0.1 * maxScore);
  });
});
