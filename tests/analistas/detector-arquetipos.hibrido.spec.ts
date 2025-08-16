import { detectarArquetipos } from '../../src/analistas/detector-arquetipos';
import { prepararComAst } from '../../src/nucleo/inquisidor';
import path from 'node:path';
import fs from 'node:fs/promises';

describe('detector-arquetipos - híbridos e conflitos', () => {
  it('detecta candidato principal e informa potenciais em estrutura híbrida', async () => {
    const baseDir = path.resolve('tests/fixtures/estruturas/fullstack-hibrido');
    const fileList = await fs.readdir(baseDir);
    const arquivos = fileList.map((filename) => ({
      relPath: filename,
      conteudo: '', // mock simples
    }));

    const arquivosComAst = await prepararComAst(arquivos, baseDir);
    const resultado = await detectarArquetipos({ arquivos: arquivosComAst, baseDir }, baseDir);
    // Valida que o principal está em melhores[0]
    expect(['fullstack', 'api-rest-express']).toContain(resultado.melhores[0].nome);
    // Valida que o outro candidato potencial aparece na explicação
    const explicacao = resultado.melhores[0].explicacaoSimilaridade || '';
    expect(explicacao).toMatch(
      /Outros candidatos potenciais detectados: (fullstack|api-rest-express)/,
    );
  });
});
// ...existing code from exemplos-testes-implementacoes/tests/analistas/detector-arquetipos.hibrido.spec.ts...
