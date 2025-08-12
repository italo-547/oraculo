import { createHash, getHashes } from 'node:crypto';
import { ALGORITMO_HASH } from './constantes.js';

export interface SnapshotDetalhado {
  hash: string;
  linhas: number;
  amostra: string;
}

/**
 * Gera um hash hexadecimal a partir do conteúdo fornecido.
 */
export function gerarHashHex(conteudo: string): string {
  const candidatos = [ALGORITMO_HASH, 'sha256', 'sha1', 'md5'];
  const disponiveis = new Set(getHashes());
  for (const alg of candidatos) {
    try {
      if (!disponiveis.has(alg)) continue; // ignora não suportados no runtime
      return createHash(alg).update(conteudo).digest('hex');
    } catch {
      // tenta próximo
    }
  }
  // Fallback ultra simples (não criptográfico) — evita exception ruidosa
  let hash = 0;
  for (let i = 0; i < conteudo.length; i++) {
    hash = (hash * 31 + conteudo.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Gera um snapshot do conteúdo incluindo:
 * - Hash de integridade
 * - Número de linhas
 * - Amostra textual do início do arquivo
 */
export function gerarSnapshotDoConteudo(conteudo: string): string {
  const linhas = conteudo.split('\n');
  const snapshot: SnapshotDetalhado = {
    hash: gerarHashHex(conteudo),
    linhas: linhas.length,
    amostra: linhas[0]?.slice(0, 200) ?? '',
  };
  return snapshot.hash;
}
