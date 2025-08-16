import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';
import { prepararComAst } from '../../src/nucleo/inquisidor';
import path from 'node:path';
import fs from 'node:fs/promises';

const baseDir = path.resolve('tests/fixtures/estruturas');

async function mockFilesFromFixture(fixtureName: string) {
  const dir = path.join(baseDir, fixtureName);
  const fileList = await fs.readdir(dir);
  // Suponha arquivos mínimos por arquétipo, mock simples:
  return fileList.map((filename) => ({
    relPath: filename,
    conteudo: '', // ou leia o arquivo se quiser testar parsing real
  }));
}

describe('detector-arquetipos (fixtures)', () => {
  const casos = [
    { nome: 'cli-modular', esperado: 'cli-modular' },
    { nome: 'api-rest-express', esperado: 'api-rest-express' },
    { nome: 'fullstack-hibrido', esperado: ['fullstack', 'api-rest-express'] }, // Híbrido
    // Adicione outros arquétipos conforme necessário
  ];

  for (const caso of casos) {
    it(`deve identificar arquétipo: ${caso.nome}`, async () => {
      const arquivos = await mockFilesFromFixture(caso.nome);
      const arquivosComAst = await prepararComAst(arquivos, path.join(baseDir, caso.nome));
      const resultado = await detectarArquetipos(
        { arquivos: arquivosComAst, baseDir: path.join(baseDir, caso.nome) },
        path.join(baseDir, caso.nome),
      );
      if (Array.isArray(caso.esperado)) {
        for (const exp of caso.esperado) {
          expect(resultado.melhores.map((a) => a.nome)).toContain(exp);
        }
      } else {
        expect(resultado.melhores[0].nome).toBe(caso.esperado);
      }
    });
  }
});
