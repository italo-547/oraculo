// SPDX-License-Identifier: MIT
/**
 * Sistema de Versionamento de Schema para Relatórios JSON
 *
 * Este módulo gerencia versões de schema para relatórios JSON do Oráculo,
 * garantindo compatibilidade futura e evolução controlada dos formatos.
 */
/** Versão atual do schema */
export const VERSAO_ATUAL = '1.0.0';
/** Histórico de versões do schema */
export const HISTORICO_VERSOES = {
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
export function criarSchemaMetadata(versao = VERSAO_ATUAL, descricaoPersonalizada) {
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
export function validarSchema(relatorio) {
    const erros = [];
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
    const schema = relatorio._schema;
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
export function migrarParaVersaoAtual(relatorio) {
    // Se já tem schema válido, retornar como está
    const validacao = validarSchema(relatorio);
    if (validacao.valido && relatorio._schema) {
        return relatorio;
    }
    // Se não tem schema, assumir que é um relatório legado e embrulhar
    if (!('_schema' in relatorio) || !relatorio._schema) {
        return {
            _schema: criarSchemaMetadata(),
            dados: relatorio,
        };
    }
    // Para futuras migrações, implementar lógica aqui
    // Por enquanto, apenas revalidar
    if (!validacao.valido) {
        throw new Error(`Relatório com schema inválido: ${validacao.erros.join(', ')}`);
    }
    return relatorio;
}
/**
 * Cria um relatório com versão atual
 */
export function criarRelatorioComVersao(dados, versao = VERSAO_ATUAL, descricao) {
    return {
        _schema: criarSchemaMetadata(versao, descricao),
        dados,
    };
}
/**
 * Extrai apenas os dados de um relatório versionado
 */
export function extrairDados(relatorio) {
    return relatorio.dados;
}
/**
 * Verifica se uma versão é compatível com a atual
 */
export function versaoCompativel(versao) {
    const metadata = HISTORICO_VERSOES[versao];
    if (!metadata)
        return false;
    return metadata.compatibilidade.includes(VERSAO_ATUAL);
}
//# sourceMappingURL=schema-versao.js.map