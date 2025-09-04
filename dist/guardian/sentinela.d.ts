import { FileEntry, IntegridadeStatus } from '@tipos/tipos.js';
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
