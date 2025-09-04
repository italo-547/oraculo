// SPDX-License-Identifier: MIT
/**
 * Utilitários para trabalhar com relatórios JSON versionados
 */

import { lerEstado } from './persistencia.js';
import { validarSchema, migrarParaVersaoAtual } from '@nucleo/schema-versao.js';

type RelatorioGenerico = Record<string, unknown>;
type RelatorioVersionado<T = unknown> = RelatorioGenerico & {
  _schema?: Record<string, unknown>;
  dados?: T;
};

export interface LeitorRelatorioOptions {
  /** Caminho do arquivo do relatório */
  caminho: string;
  /** Se deve validar o schema (padrão: true) */
  validar?: boolean;
  /** Se deve migrar para versão atual se necessário (padrão: false) */
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
  const { caminho, validar = true, migrar = false } = options;

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

    // Migrar se necessário e solicitado.
    // - Se migrar=true: migramos explicitamente.
    // - Se migrar=false e validar=false: aceitamos o conteúdo legado como está (modo permissivo).
    // - Se migrar=false e validar=true: rejeitamos (chamador pediu validação estrita).
    if (!conteudo._schema || !conteudo.dados) {
      if (migrar) {
        relatorioFinal = migrarParaVersaoAtual<unknown>(conteudo) as unknown as Record<
          string,
          unknown
        >;
        migrado = true;
      } else if (!validar) {
        // modo permissivo: aceitar o conteúdo legado sem migrar
        relatorioFinal = conteudo;
        migrado = false;
      } else {
        return {
          sucesso: false,
          erro: 'Relatório em formato antigo (sem _schema); habilite migrar para atualizá-lo explicitamente.',
        };
      }
    }

    // Extrair dados: se for relatório versionado, retornamos apenas `dados`.
    // Se for formato legado (sem _schema), retornamos o objeto inteiro.
    let dados: T;
    const relObj = relatorioFinal as RelatorioVersionado<T>;

    if ('_schema' in relObj && relObj._schema) {
      dados = relObj.dados as T;
    } else {
      dados = relatorioFinal as T;
    }

    return {
      sucesso: true,
      dados,
      schema: (relObj._schema as Record<string, unknown>) || undefined,
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
  // Para obtenção superficial de dados, permitimos migração automática aqui
  const resultado = await lerRelatorioVersionado<T>({ caminho, validar: false, migrar: true });

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
