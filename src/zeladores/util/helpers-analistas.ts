// Helpers utilitários para analistas

/**
 * Incrementa um contador de ocorrências por chave.
 */
export function incrementar(contador: Record<string, number>, chave: string): void {
  contador[chave] = (contador[chave] ?? 0) + 1;
}

/**
 * Garante que sempre retorna array vazio se valor for null/undefined.
 */
export function garantirArray<T>(valor: T[] | null | undefined): T[] {
  return Array.isArray(valor) ? valor : [];
}
