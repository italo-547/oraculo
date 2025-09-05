import { FileEntry, IntegridadeStatus } from '@tipos/tipos.js';
<<<<<<< HEAD
export declare function scanSystemIntegrity(fileEntries: FileEntry[], options?: {
    justDiff?: boolean;
    suppressLogs?: boolean;
}): Promise<{
    status: IntegridadeStatus;
    timestamp: string;
    detalhes?: string[];
    baselineModificado?: boolean;
}>;
export declare function acceptNewBaseline(fileEntries: FileEntry[]): Promise<void>;
//# sourceMappingURL=sentinela.d.ts.map
=======
export declare function scanSystemIntegrity(
  fileEntries: FileEntry[],
  options?: {
    justDiff?: boolean;
    suppressLogs?: boolean;
  },
): Promise<{
  status: IntegridadeStatus;
  timestamp: string;
  detalhes?: string[];
  baselineModificado?: boolean;
}>;
export declare function acceptNewBaseline(fileEntries: FileEntry[]): Promise<void>;
//# sourceMappingURL=sentinela.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
