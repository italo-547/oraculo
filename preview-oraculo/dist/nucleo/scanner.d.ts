import type { Dirent } from 'node:fs';
import type { FileMap } from '@tipos/tipos.js';
interface ScanOptions {
  includeContent?: boolean;
  filter?: (relPath: string, entry: Dirent) => boolean;
  onProgress?: (msg: string) => void;
}
export declare function scanRepository(baseDir: string, options?: ScanOptions): Promise<FileMap>;
export {};
//# sourceMappingURL=scanner.d.ts.map
