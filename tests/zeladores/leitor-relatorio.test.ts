// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  lerRelatorioVersionado,
  lerDadosRelatorio,
  verificarSchemaRelatorio,
} from '../../src/zeladores/util/leitor-relatorio.js';
import { lerEstado } from '../../src/zeladores/util/persistencia.js';

// Mock do lerEstado
vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  lerEstado: vi.fn(),
}));

describe('Leitor de Relatórios Versionados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lerRelatorioVersionado', () => {
    it('deve ler relatório versionado válido', async () => {
      const relatorioMock = {
        _schema: {
          versao: '1.0.0',
          criadoEm: '2025-08-28',
          descricao: 'Teste',
          compatibilidade: ['1.0.0'],
          camposObrigatorios: ['_schema', 'dados'],
          camposOpcionais: [],
        },
        dados: { totalArquivos: 10 },
      };

      (lerEstado as any).mockResolvedValue(relatorioMock);

      const resultado = await lerRelatorioVersionado({ caminho: 'teste.json' });

      expect(resultado.sucesso).toBe(true);
      expect(resultado.dados).toEqual(relatorioMock.dados);
      expect(resultado.schema).toEqual(relatorioMock._schema);
      expect(resultado.migrado).toBe(false);
    });

    it('deve migrar relatório legado', async () => {
      const relatorioLegado = {
        totalArquivos: 5,
        ocorrencias: [],
      };

      (lerEstado as any).mockResolvedValue(relatorioLegado);

      const resultado = await lerRelatorioVersionado({
        caminho: 'teste.json',
        validar: false,
        migrar: true,
      });

      expect(resultado.sucesso).toBe(true);
      expect(resultado.dados).toEqual(relatorioLegado);
      expect(resultado.schema).toBeDefined();
      expect(resultado.migrado).toBe(true);
    });

    it('deve falhar ao ler arquivo inexistente', async () => {
      (lerEstado as any).mockResolvedValue(null);

      const resultado = await lerRelatorioVersionado({ caminho: 'inexistente.json' });

      expect(resultado.sucesso).toBe(false);
      expect(resultado.erro).toContain('Arquivo não encontrado');
    });

    it('deve validar schema quando solicitado', async () => {
      const relatorioInvalido = {
        dados: { teste: 'dados' },
        // Falta _schema
      };

      (lerEstado as any).mockResolvedValue(relatorioInvalido);

      const resultado = await lerRelatorioVersionado({
        caminho: 'teste.json',
        validar: true,
      });

      expect(resultado.sucesso).toBe(false);
      expect(resultado.erro).toContain('Schema inválido');
    });

    it('deve pular validação quando desabilitada', async () => {
      const relatorioInvalido = {
        dados: { teste: 'dados' },
      };

      (lerEstado as any).mockResolvedValue(relatorioInvalido);

      const resultado = await lerRelatorioVersionado({
        caminho: 'teste.json',
        validar: false,
      });

      expect(resultado.sucesso).toBe(true);
      expect(resultado.dados).toEqual(relatorioInvalido);
    });
  });

  describe('lerDadosRelatorio', () => {
    it('deve extrair apenas dados do relatório', async () => {
      const relatorioMock = {
        _schema: { versao: '1.0.0' },
        dados: { totalArquivos: 20 },
      };

      (lerEstado as any).mockResolvedValue(relatorioMock);

      const resultado = await lerDadosRelatorio('teste.json');

      expect(resultado.sucesso).toBe(true);
      expect(resultado.dados).toEqual(relatorioMock.dados);
    });
  });

  describe('verificarSchemaRelatorio', () => {
    it('deve confirmar schema válido', async () => {
      const relatorioMock = {
        _schema: {
          versao: '1.0.0',
          criadoEm: '2025-08-28',
          descricao: 'Teste',
          compatibilidade: ['1.0.0'],
          camposObrigatorios: ['_schema', 'dados'],
          camposOpcionais: [],
        },
        dados: { teste: 'ok' },
      };

      (lerEstado as any).mockResolvedValue(relatorioMock);

      const resultado = await verificarSchemaRelatorio('teste.json');

      expect(resultado.valido).toBe(true);
      expect(resultado.versao).toBe('1.0.0');
      expect(resultado.erros).toHaveLength(0);
    });

    it('deve detectar schema inválido', async () => {
      const relatorioInvalido = {
        dados: { teste: 'dados' },
      };

      (lerEstado as any).mockResolvedValue(relatorioInvalido);

      const resultado = await verificarSchemaRelatorio('teste.json');

      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContain('Campo _schema é obrigatório');
    });

    it('deve lidar com erro de leitura', async () => {
      (lerEstado as any).mockRejectedValue(new Error('Erro de leitura'));

      const resultado = await verificarSchemaRelatorio('teste.json');

      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('Erro ao verificar schema');
    });
  });
});
