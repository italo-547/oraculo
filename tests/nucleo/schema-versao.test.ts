// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach } from 'vitest';
import {
  criarSchemaMetadata,
  validarSchema,
  migrarParaVersaoAtual,
  criarRelatorioComVersao,
  extrairDados,
  versaoCompativel,
  VERSAO_ATUAL,
  HISTORICO_VERSOES,
} from '../../src/nucleo/schema-versao.js';

describe('Sistema de Versionamento de Schema', () => {
  describe('criarSchemaMetadata', () => {
    it('deve criar metadados com versão atual', () => {
      const metadata = criarSchemaMetadata();

      expect(metadata.versao).toBe(VERSAO_ATUAL);
      expect(metadata.criadoEm).toBe('2025-08-28');
      expect(metadata.descricao).toBe('Versão inicial com campos básicos de relatório');
      expect(metadata.compatibilidade).toContain(VERSAO_ATUAL);
      expect(metadata.camposObrigatorios).toContain('_schema.versao');
      expect(metadata.camposOpcionais).toContain('_schema.compatibilidade');
    });

    it('deve criar metadados com versão específica', () => {
      const metadata = criarSchemaMetadata('1.0.0');

      expect(metadata.versao).toBe('1.0.0');
      expect(metadata.criadoEm).toBe('2025-08-28');
    });

    it('deve aceitar descrição personalizada', () => {
      const descricao = 'Relatório de teste personalizado';
      const metadata = criarSchemaMetadata('1.0.0', descricao);

      expect(metadata.descricao).toBe(descricao);
    });

    it('deve lançar erro para versão desconhecida', () => {
      expect(() => criarSchemaMetadata('9.9.9')).toThrow('Versão de schema desconhecida: 9.9.9');
    });
  });

  describe('validarSchema', () => {
    it('deve validar relatório com schema correto', () => {
      const relatorio = {
        _schema: criarSchemaMetadata(),
        dados: { teste: 'dados' },
      };

      const validacao = validarSchema(relatorio);

      expect(validacao.valido).toBe(true);
      expect(validacao.erros).toHaveLength(0);
    });

    it('deve rejeitar relatório sem schema', () => {
      const relatorio = { dados: { teste: 'dados' } };

      const validacao = validarSchema(relatorio);

      expect(validacao.valido).toBe(false);
      expect(validacao.erros).toContain('Campo _schema é obrigatório');
    });

    it('deve rejeitar relatório sem dados', () => {
      const relatorio = {
        _schema: criarSchemaMetadata(),
      };

      const validacao = validarSchema(relatorio);

      expect(validacao.valido).toBe(false);
      expect(validacao.erros).toContain('Campo dados é obrigatório');
    });

    it('deve rejeitar schema com versão desconhecida', () => {
      const relatorio = {
        _schema: { ...criarSchemaMetadata(), versao: '9.9.9' },
        dados: { teste: 'dados' },
      };

      const validacao = validarSchema(relatorio);

      expect(validacao.valido).toBe(false);
      expect(validacao.erros).toContain('Versão de schema desconhecida: 9.9.9');
    });
  });

  describe('migrarParaVersaoAtual', () => {
    it('deve retornar relatório já versionado sem mudanças', () => {
      const relatorioOriginal = {
        _schema: criarSchemaMetadata(),
        dados: { teste: 'dados' },
      };

      const migrado = migrarParaVersaoAtual(relatorioOriginal);

      expect(migrado).toEqual(relatorioOriginal);
    });

    it('deve migrar relatório legado para versão atual', () => {
      const relatorioLegado = {
        totalArquivos: 100,
        ocorrencias: [],
        timestamp: Date.now(),
      };

      const migrado = migrarParaVersaoAtual(relatorioLegado);

      expect(migrado._schema).toBeDefined();
      expect(migrado._schema.versao).toBe(VERSAO_ATUAL);
      expect(migrado.dados).toEqual(relatorioLegado);
    });
  });

  describe('criarRelatorioComVersao', () => {
    it('deve criar relatório versionado com dados', () => {
      const dados = { totalArquivos: 50, status: 'ok' };

      const relatorio = criarRelatorioComVersao(dados);

      expect(relatorio._schema.versao).toBe(VERSAO_ATUAL);
      expect(relatorio.dados).toEqual(dados);
    });

    it('deve aceitar versão específica', () => {
      const dados = { teste: 'dados' };

      const relatorio = criarRelatorioComVersao(dados, '1.0.0');

      expect(relatorio._schema.versao).toBe('1.0.0');
    });

    it('deve aceitar descrição personalizada', () => {
      const dados = { teste: 'dados' };
      const descricao = 'Relatório personalizado';

      const relatorio = criarRelatorioComVersao(dados, '1.0.0', descricao);

      expect(relatorio._schema.descricao).toBe(descricao);
    });
  });

  describe('extrairDados', () => {
    it('deve extrair dados de relatório versionado', () => {
      const dadosOriginais = { totalArquivos: 25 };
      const relatorio = criarRelatorioComVersao(dadosOriginais);

      const dadosExtraidos = extrairDados(relatorio);

      expect(dadosExtraidos).toEqual(dadosOriginais);
    });
  });

  describe('versaoCompativel', () => {
    it('deve confirmar compatibilidade da versão atual', () => {
      const compativel = versaoCompativel(VERSAO_ATUAL);

      expect(compativel).toBe(true);
    });

    it('deve rejeitar versão desconhecida', () => {
      const compativel = versaoCompativel('9.9.9');

      expect(compativel).toBe(false);
    });
  });

  describe('HISTORICO_VERSOES', () => {
    it('deve conter versão atual', () => {
      expect(HISTORICO_VERSOES).toHaveProperty(VERSAO_ATUAL);
    });

    it('deve ter estrutura correta para cada versão', () => {
      Object.values(HISTORICO_VERSOES).forEach((metadata) => {
        expect(metadata).toHaveProperty('versao');
        expect(metadata).toHaveProperty('criadoEm');
        expect(metadata).toHaveProperty('descricao');
        expect(metadata).toHaveProperty('compatibilidade');
        expect(metadata).toHaveProperty('camposObrigatorios');
        expect(metadata).toHaveProperty('camposOpcionais');
      });
    });
  });
});
