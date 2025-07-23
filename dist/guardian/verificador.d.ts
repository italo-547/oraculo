/**
 * Compara os arquivos atuais com os registros de integridade salvos e detecta divergências.
 *
 * @param fileEntries Arquivos atuais lidos do sistema
 * @param registrosSalvos Registros prévios salvos (hashes de referência)
 * @returns Resultado contendo lista de arquivos corrompidos e total verificado
 */
export declare function verificarRegistros(fileEntries: any, registrosSalvos: any): Promise<{
    corrompidos: any[];
    verificados: any;
}>;
//# sourceMappingURL=verificador.d.ts.map