import { IntegridadeStatus } from '../tipos/tipos.js';
/**
 * Executa verificação de integridade dos arquivos analisados, comparando com baseline salvo.
 */
export declare function scanSystemIntegrity(fileEntries: any): Promise<{
    status: IntegridadeStatus;
    timestamp: string;
}>;
//# sourceMappingURL=sentinela.d.ts.map