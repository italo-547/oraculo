// SPDX-License-Identifier: MIT
/**
 * Utilitários para trabalhar com relatórios JSON versionados
 */
import { lerEstado } from './persistencia.js';
import { validarSchema, migrarParaVersaoAtual } from '@nucleo/schema-versao.js';
/**
 * Lê um relatório JSON versionado do disco
 */
export async function lerRelatorioVersionado(options) {
    const { caminho, validar = true, migrar = false } = options;
    try {
        // Ler arquivo
        const conteudo = await lerEstado(caminho);
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
<<<<<<< HEAD
        if (!conteudo._schema || !conteudo.dados) {
=======
        if ((!conteudo._schema || !conteudo.dados)) {
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
            if (migrar) {
                relatorioFinal = migrarParaVersaoAtual(conteudo);
                migrado = true;
            }
            else if (!validar) {
                // modo permissivo: aceitar o conteúdo legado sem migrar
                relatorioFinal = conteudo;
                migrado = false;
            }
            else {
                return {
                    sucesso: false,
                    erro: 'Relatório em formato antigo (sem _schema); habilite migrar para atualizá-lo explicitamente.',
                };
            }
        }
        // Extrair dados: se for relatório versionado, retornamos apenas `dados`.
        // Se for formato legado (sem _schema), retornamos o objeto inteiro.
        let dados;
<<<<<<< HEAD
        const relObj = relatorioFinal;
        if ('_schema' in relObj && relObj._schema) {
            dados = relObj.dados;
=======
        if ('_schema' in relatorioFinal && relatorioFinal._schema) {
            dados = relatorioFinal.dados;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
        }
        else {
            dados = relatorioFinal;
        }
        return {
            sucesso: true,
            dados,
<<<<<<< HEAD
            schema: relObj._schema || undefined,
=======
            schema: relatorioFinal._schema,
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
            migrado,
        };
    }
    catch (error) {
        return {
            sucesso: false,
            erro: `Erro ao ler relatório: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Lê apenas os dados de um relatório, ignorando metadados de versão
 */
export async function lerDadosRelatorio(caminho) {
    // Para obtenção superficial de dados, permitimos migração automática aqui
    const resultado = await lerRelatorioVersionado({ caminho, validar: false, migrar: true });
    return {
        sucesso: resultado.sucesso,
        dados: resultado.dados,
        erro: resultado.erro,
    };
}
/**
 * Verifica se um relatório tem schema válido
 */
export async function verificarSchemaRelatorio(caminho) {
    try {
        const conteudo = await lerEstado(caminho);
        if (!conteudo) {
            return {
                valido: false,
                erros: ['Arquivo não encontrado ou vazio'],
            };
        }
        const validacao = validarSchema(conteudo);
        return {
            valido: validacao.valido,
            versao: conteudo._schema?.versao,
            erros: validacao.erros,
        };
    }
    catch (error) {
        return {
            valido: false,
            erro: `Erro ao verificar schema: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
//# sourceMappingURL=leitor-relatorio.js.map