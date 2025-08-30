// SPDX-License-Identifier: MIT
/**
 * Utilitários para trabalhar com relatórios JSON versionados
 */
import { lerEstado } from './persistencia.js';
import { validarSchema, migrarParaVersaoAtual } from '../../nucleo/schema-versao.js';
/**
 * Lê um relatório JSON versionado do disco
 */
export async function lerRelatorioVersionado(options) {
    const { caminho, validar = true, migrar = true } = options;
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
        // Migrar se necessário e solicitado
        if (migrar && (!conteudo._schema || !conteudo.dados)) {
            relatorioFinal = migrarParaVersaoAtual(conteudo);
            migrado = true;
        }
        // Extrair dados
        const dados = (relatorioFinal.dados || relatorioFinal);
        return {
            sucesso: true,
            dados,
            schema: relatorioFinal._schema,
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
    const resultado = await lerRelatorioVersionado({
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