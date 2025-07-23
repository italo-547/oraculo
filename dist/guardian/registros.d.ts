/**
 * Salva os hashes dos arquivos fornecidos em um arquivo de integridade.
 *
 * @param fileEntries Lista de arquivos com conteúdo
 * @param destino Caminho de destino do JSON de integridade (opcional)
 */
export declare function salvarRegistros(fileEntries: any, destino?: string): Promise<void>;
/**
 * Carrega os registros de integridade persistidos. Retorna lista vazia se não existir.
 *
 * @param caminho Caminho para o arquivo de registros (padrão: ./estado/integridade.json)
 */
export declare function carregarRegistros(caminho?: string): Promise<any>;
//# sourceMappingURL=registros.d.ts.map