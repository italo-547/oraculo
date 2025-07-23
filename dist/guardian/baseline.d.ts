/**
 * Lê o baseline atual do sistema de integridade.
 * Retorna null se o arquivo não existir ou estiver malformado.
 */
export declare function carregarBaseline(): Promise<any>;
/**
 * Salva um novo baseline de integridade em disco, sobrescrevendo qualquer estado anterior.
 *
 * @param snapshot Mapa de arquivos com seus hashes e algoritmos
 */
export declare function salvarBaseline(snapshot: any): Promise<void>;
//# sourceMappingURL=baseline.d.ts.map