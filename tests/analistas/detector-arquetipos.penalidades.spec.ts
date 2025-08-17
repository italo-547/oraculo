import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';
import { ARQUETIPOS } from '../../src/analistas/arquetipos-defs';

describe('detector-arquetipos (penalidades e explicação)', () => {
  for (const def of ARQUETIPOS) {
    it(`deve aplicar penalidades e gerar explicação para arquétipo: ${def.nome}`, async () => {
      // Mock: todos os required ausentes, todos os forbidden presentes
      const arquivos = [
        ...(def.forbiddenDirs || []).map((d) => ({
          relPath: d + '/file.txt',
          ast: undefined,
          fullPath: d + '/file.txt',
          content: '',
        })),
      ];
      const resultado = await detectarArquetipos({ arquivos, baseDir: '.' }, '.');
      expect(resultado.melhores[0]?.nome).toBe(def.nome);
      // Penalidade: score deve ser <= 0
      expect(resultado.melhores[0]?.score).toBeLessThanOrEqual(0);
      // Explicação deve mencionar penalidade ou ausência de required
      if ((def.requiredDirs || []).length > 0) {
        expect(resultado.melhores[0]?.explicacaoSimilaridade).toMatch(
          /ausente|faltante|parcial|personalizada|não permitido|diferença/i,
        );
      }
      // Forbidden presente deve gerar penalidade
      if ((def.forbiddenDirs || []).length > 0) {
        expect(resultado.melhores[0]?.forbiddenPresent.length).toBeGreaterThan(0);
      }
    });
  }
});
