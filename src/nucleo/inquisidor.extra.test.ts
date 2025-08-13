import { describe, it, expect, vi, beforeEach } from 'vitest';

// Esses testes extras visam aumentar cobertura de ramos do onProgress e do preparo de AST inválido.

describe('inquisidor extra', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('onProgress aciona logs para diretorio, erro e fallback aviso', async () => {
    const info = vi.fn();
    const erro = vi.fn();
    const sucesso = vi.fn();
    const aviso = vi.fn();

    // Mock scanner que dispara vários eventos no onProgress
    vi.doMock('./scanner.js', () => ({
      scanRepository: vi.fn(async (_base: string, opts: any) => {
        opts.onProgress?.(JSON.stringify({ tipo: 'diretorio', caminho: 'src', acao: 'ler' }));
        opts.onProgress?.(
          JSON.stringify({ tipo: 'erro', caminho: 'bad.ts', acao: 'ler', mensagem: 'boom' }),
        );
        opts.onProgress?.('⚠️ aviso legado'); // força fallback
        return {
          'file1.ts': { relPath: 'file1.ts', content: 'conteudo', fullPath: undefined },
        };
      }),
    }));

    // Parser simples válido
    vi.doMock('./parser.js', () => ({
      decifrarSintaxe: vi.fn(async () => ({ node: {}, parent: {} })),
    }));

    vi.doMock('./executor.js', () => ({
      executarInquisicao: vi.fn(async () => ({ totalArquivos: 1, ocorrencias: [] })),
    }));

    vi.doMock('./constelacao/log.js', () => ({
      log: { info, erro, sucesso, aviso },
    }));

    vi.doMock('./constelacao/cosmos.js', () => ({
      config: { SCANNER_EXTENSOES_COM_AST: ['.ts'] },
    }));

    // Demais analistas mockados (não usados diretamente aqui)
    vi.doMock('../analistas/detector-estrutura.js', () => ({ detectorEstrutura: vi.fn() }));
    vi.doMock('../analistas/detector-dependencias.js', () => ({ detectorDependencias: vi.fn() }));
    vi.doMock('../analistas/analista-funcoes-longas.js', () => ({
      analistaFuncoesLongas: vi.fn(),
    }));
    vi.doMock('../analistas/analista-padroes-uso.js', () => ({ analistaPadroesUso: vi.fn() }));
    vi.doMock('../analistas/ritual-comando.js', () => ({ ritualComando: vi.fn() }));

    const { iniciarInquisicao } = await import('./inquisidor.js');
    await iniciarInquisicao('/fake', { includeContent: true, incluirMetadados: true });

    expect(info).toHaveBeenCalledWith(expect.stringContaining('Diretórios escaneados'));
    expect(erro).toHaveBeenCalledWith(expect.stringContaining('Erro ao'));
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
    expect(sucesso).toHaveBeenCalled();
  });

  it('prepararComAst deixa ast undefined quando decifrarSintaxe retorna forma inválida', async () => {
    vi.doMock('./scanner.js', () => ({
      scanRepository: vi.fn(async () => ({
        'file1.ts': { relPath: 'file1.ts', content: 'conteudo', fullPath: undefined },
      })),
    }));

    vi.doMock('./parser.js', () => ({
      // Retorna objeto sem node/parent válidos
      decifrarSintaxe: vi.fn(async () => ({})),
    }));

    vi.doMock('./executor.js', () => ({
      executarInquisicao: vi.fn(async () => ({ totalArquivos: 1, ocorrencias: [] })),
    }));

    vi.doMock('./constelacao/log.js', () => ({
      log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
    }));

    vi.doMock('./constelacao/cosmos.js', () => ({
      config: { SCANNER_EXTENSOES_COM_AST: ['.ts'] },
    }));

    // Analistas mocks
    vi.doMock('../analistas/detector-estrutura.js', () => ({ detectorEstrutura: vi.fn() }));
    vi.doMock('../analistas/detector-dependencias.js', () => ({ detectorDependencias: vi.fn() }));
    vi.doMock('../analistas/analista-funcoes-longas.js', () => ({
      analistaFuncoesLongas: vi.fn(),
    }));
    vi.doMock('../analistas/analista-padroes-uso.js', () => ({ analistaPadroesUso: vi.fn() }));
    vi.doMock('../analistas/ritual-comando.js', () => ({ ritualComando: vi.fn() }));

    const { prepararComAst } = await import('./inquisidor.js');
    const entries = [{ relPath: 'file1.ts', content: 'conteudo', fullPath: undefined }];
    const result = await prepararComAst(entries as any, '/fake');
    expect(result[0].ast).toBeUndefined();
  });
});
