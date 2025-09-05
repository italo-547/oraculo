import type { Dirent } from 'node:fs';
import type { FileMap } from '@tipos/tipos.js';
interface ScanOptions {
<<<<<<< HEAD
    includeContent?: boolean;
    filter?: (relPath: string, entry: Dirent) => boolean;
    onProgress?: (msg: string) => void;
}
export declare function scanRepository(baseDir: string, options?: ScanOptions): Promise<FileMap>;
export {};
//# sourceMappingURL=scanner.d.ts.map
=======
  includeContent?: boolean;
  filter?: (relPath: string, entry: Dirent) => boolean;
  onProgress?: (msg: string) => void;
}
export declare function scanRepository(baseDir: string, options?: ScanOptions): Promise<FileMap>;
export {};
//# sourceMappingURL=scanner.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
