import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';
import { prepararComAst } from '../../src/nucleo/inquisidor';
import path from 'node:path';
import fs from 'node:fs/promises';

describe('detector-arquetipos - híbridos e conflitos', () => {
  it('detecta candidatos múltiplos em estrutura híbrida', async () => {
    const baseDir = path.resolve('tests/fixtures/estruturas/fullstack-hibrido');
    const fileList = await fs.readdir(baseDir);
    const arquivos = fileList.map((filename) => ({
      relPath: filename,
      conteudo: '',
    }));

    const arquivosComAst = await prepararComAst(arquivos, baseDir);
    const resultado = await detectarArquetipos({ arquivos: arquivosComAst, baseDir }, baseDir);
    expect(resultado.melhores.length).toBeGreaterThan(1);
    expect(resultado.melhores.map((a) => a.nome)).toEqual(
      expect.arrayContaining(['fullstack', 'api-rest-express']),
    );
  });
});
