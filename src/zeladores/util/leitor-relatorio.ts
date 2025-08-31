// SPDX-License-Identifier: MIT
/**
 * Utilitários para trabalhar com relatórios JSON versionados
 */

import { lerEstado } from './persistencia.js';
import { validarSchema, migrarParaVersaoAtual } from '@nucleo/schema-versao.js';

export interface LeitorRelatorioOptions {
  /** Caminho do arquivo do relatório */
  caminho: string;
  /** Se deve validar o schema (padrão: true) */
  validar?: boolean;
  /** Se deve migrar para versão atual se necessário (padrão: true) */
  migrar?: boolean;
}

/**
 * Lê um relatório JSON versionado do disco
 */
export async function lerRelatorioVersionado<T = unknown>(
  options: LeitorRelatorioOptions,
): Promise<{
  sucesso: boolean;
  dados?: T;
  schema?: Record<string, unknown>;
  erro?: string;
  migrado?: boolean;
}> {
  const { caminho, validar = true, migrar = true } = options;

  try {
    // Ler arquivo
    const conteudo = await lerEstado<Record<string, unknown>>(caminho);

    if (!conteudo) {
      return {
        sucesso: false,
        erro: 'Arquivo não encontrado ou vazio',
      };
    }

    let relatorioFinal = conteudo;
    let migrado = false;

    // Validar schema se solicitado
    if (validar) {
      const validacao = validarSchema(conteudo);
      if (!validacao.valido) {
        return {
          sucesso: false,
          erro: `Schema inválido: ${validacao.erros.join(', ')}`,
        };
      }
    }

    // Migrar se necessário e solicitado
    if (migrar && (!conteudo._schema || !conteudo.dados)) {
      relatorioFinal = migrarParaVersaoAtual<unknown>(conteudo) as unknown as Record<
        string,
        unknown
      >;
      migrado = true;
    }

    // Extrair dados
    const dados = (relatorioFinal.dados || relatorioFinal) as T;

    return {
      sucesso: true,
      dados,
      schema: relatorioFinal._schema as Record<string, unknown> | undefined,
      migrado,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: `Erro ao ler relatório: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Lê apenas os dados de um relatório, ignorando metadados de versão
 */
export async function lerDadosRelatorio<T = unknown>(
  caminho: string,
): Promise<{
  sucesso: boolean;
  dados?: T;
  erro?: string;
}> {
  const resultado = await lerRelatorioVersionado<T>({
    caminho,
    validar: false,
    migrar: true,
  });

  return {
    sucesso: resultado.sucesso,
    dados: resultado.dados,
    erro: resultado.erro,
  };
}

/**
 * Verifica se um relatório tem schema válido
 */
export async function verificarSchemaRelatorio(caminho: string): Promise<{
  valido: boolean;
  versao?: string;
  erros?: string[];
  erro?: string;
}> {
  try {
    const conteudo = await lerEstado<Record<string, unknown>>(caminho);

    if (!conteudo) {
      return {
        valido: false,
        erros: ['Arquivo não encontrado ou vazio'],
      };
    }

    const validacao = validarSchema(conteudo);

    return {
      valido: validacao.valido,
      versao: (conteudo._schema as Record<string, unknown>)?.versao as string | undefined,
      erros: validacao.erros,
    };
  } catch (error) {
    return {
      valido: false,
      erro: `Erro ao verificar schema: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
