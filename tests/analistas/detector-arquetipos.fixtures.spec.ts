import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';
import { prepararComAst } from '../../src/nucleo/inquisidor';
import path from 'node:path';
import fs from 'node:fs/promises';

const baseDir = path.resolve('tests/fixtures/estruturas');

async function mockFilesFromFixture(fixtureName: string) {
  const dir = path.join(baseDir, fixtureName);
  async function walk(
    current: string,
    relBase = '',
  ): Promise<{ fullPath: string; relPath: string; content: string | null }[]> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    const files: { fullPath: string; relPath: string; content: string | null }[] = [];
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relPath = path.join(relBase, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        files.push(...(await walk(fullPath, relPath)));
      } else {
        files.push({ fullPath, relPath, content: null });
      }
    }
    return files;
  }
  return await walk(dir);
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
        // Valida que o principal está em melhores[0]
        expect(caso.esperado).toContain(resultado.melhores[0].nome);
        // Valida que o outro candidato potencial aparece na explicação
        const explicacao = resultado.melhores[0].explicacaoSimilaridade || '';
        const outros = caso.esperado.filter((n) => n !== resultado.melhores[0].nome);
        for (const outro of outros) {
          expect(explicacao).toMatch(
            new RegExp(`Outros candidatos potenciais detectados:.*${outro}`),
          );
        }
      } else {
        expect(resultado.melhores[0].nome).toBe(caso.esperado);
      }
    });
  }
});
// ...existing code from exemplos-testes-implementacoes/tests/analistas/detector-arquetipos.fixtures.spec.ts...
