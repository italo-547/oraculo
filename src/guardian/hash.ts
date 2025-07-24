import { createHash } from 'node:crypto';
import { ALGORITMO_HASH } from './constantes';
/**
 * Gera um hash hexadecimal a partir do conteúdo fornecido.
 */
export function gerarHashHex(conteudo) {
    return createHash(ALGORITMO_HASH).update(conteudo).digest('hex');
}
/**
 * Gera um snapshot do conteúdo incluindo:
 * - Hash de integridade
 * - Número de linhas
 * - Amostra textual do início do arquivo
 */
export function gerarSnapshotDoConteudo(conteudo) {
    const linhas = conteudo.split('\n');
    return {
        hash: gerarHashHex(conteudo),
        linhas: linhas.length,
        amostra: linhas[0]?.slice(0, 200) ?? ''
    };
}
