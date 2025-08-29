// SPDX-License-Identifier: MIT
/**
 * Sistema de Versionamento de Schema para Relatórios JSON
 *
 * Este módulo gerencia versões de schema para relatórios JSON do Oráculo,
 * garantindo compatibilidade futura e evolução controlada dos formatos.
 */

export interface SchemaMetadata {
  /** Versão do schema (ex: "1.0.0") */
  versao: string;
  /** Data de criação do schema */
  criadoEm: string;
  /** Descrição das mudanças nesta versão */
  descricao: string;
  /** Versões compatíveis para leitura (backward compatibility) */
  compatibilidade: string[];
  /** Campos obrigatórios nesta versão */
  camposObrigatorios: string[];
  /** Campos opcionais nesta versão */
  camposOpcionais: string[];
}

export interface RelatorioComVersao<T = unknown> {
  /** Metadados de versão do schema */
  _schema: SchemaMetadata;
  /** Dados do relatório */
  dados: T;
}

/** Versão atual do schema */
export const VERSAO_ATUAL = '1.0.0';

/** Histórico de versões do schema */
export const HISTORICO_VERSOES: Record<string, SchemaMetadata> = {
  '1.0.0': {
    versao: '1.0.0',
    criadoEm: '2025-08-28',
    descricao: 'Versão inicial com campos básicos de relatório',
    compatibilidade: ['1.0.0'],
    camposObrigatorios: [
      '_schema',
      'dados',
      '_schema.versao',
      '_schema.criadoEm',
      '_schema.descricao',
    ],
    camposOpcionais: [
      '_schema.compatibilidade',
      '_schema.camposObrigatorios',
      '_schema.camposOpcionais',
    ],
  },
};

/**
 * Cria metadados de schema para a versão atual
 */
export function criarSchemaMetadata(
  versao: string = VERSAO_ATUAL,
  descricaoPersonalizada?: string,
): SchemaMetadata {
  const base = HISTORICO_VERSOES[versao];
  if (!base) {
    throw new Error(`Versão de schema desconhecida: ${versao}`);
  }

  return {
    ...base,
    ...(descricaoPersonalizada && { descricao: descricaoPersonalizada }),
  };
}

/**
 * Valida se um relatório tem schema válido
 */
export function validarSchema(relatorio: Record<string, unknown>): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];

  // Verificar estrutura básica
  if (!relatorio || typeof relatorio !== 'object') {
    erros.push('Relatório deve ser um objeto');
    return { valido: false, erros };
  }

  // Verificar presença do schema
  if (!('_schema' in relatorio) || !relatorio._schema) {
    erros.push('Campo _schema é obrigatório');
    return { valido: false, erros };
  }

  const schema = relatorio._schema as Record<string, unknown>;

  // Verificar campos obrigatórios do schema
  const camposObrigatorios = ['versao', 'criadoEm', 'descricao'];
  for (const campo of camposObrigatorios) {
    if (!(campo in schema)) {
      erros.push(`Campo _schema.${campo} é obrigatório`);
    }
  }

  // Verificar se a versão existe no histórico
  if (schema.versao && typeof schema.versao === 'string' && !HISTORICO_VERSOES[schema.versao]) {
    erros.push(`Versão de schema desconhecida: ${schema.versao}`);
  }

  // Verificar presença dos dados
  if (!('dados' in relatorio)) {
    erros.push('Campo dados é obrigatório');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Migra um relatório para a versão atual se necessário
 */
export function migrarParaVersaoAtual<T>(
  relatorio: Record<string, unknown>,
): RelatorioComVersao<T> {
  // Se já tem schema válido, retornar como está
  const validacao = validarSchema(relatorio);
  if (validacao.valido && relatorio._schema) {
    return relatorio as unknown as RelatorioComVersao<T>;
  }

  // Se não tem schema, assumir que é um relatório legado e embrulhar
  if (!('_schema' in relatorio) || !relatorio._schema) {
    return {
      _schema: criarSchemaMetadata(),
      dados: relatorio as unknown as T,
    };
  }

  // Para futuras migrações, implementar lógica aqui
  // Por enquanto, apenas revalidar
  if (!validacao.valido) {
    throw new Error(`Relatório com schema inválido: ${validacao.erros.join(', ')}`);
  }

  return relatorio as unknown as RelatorioComVersao<T>;
}

/**
 * Cria um relatório com versão atual
 */
export function criarRelatorioComVersao<T>(
  dados: T,
  versao: string = VERSAO_ATUAL,
  descricao?: string,
): RelatorioComVersao<T> {
  return {
    _schema: criarSchemaMetadata(versao, descricao),
    dados,
  };
}

/**
 * Extrai apenas os dados de um relatório versionado
 */
export function extrairDados<T>(relatorio: RelatorioComVersao<T>): T {
  return relatorio.dados;
}

/**
 * Verifica se uma versão é compatível com a atual
 */
export function versaoCompativel(versao: string): boolean {
  const metadata = HISTORICO_VERSOES[versao];
  if (!metadata) return false;

  return metadata.compatibilidade.includes(VERSAO_ATUAL);
}
