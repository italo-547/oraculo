import { type ExecSyncOptions } from 'node:child_process';
export declare function executarShellSeguro(cmd: string, opts?: ExecSyncOptions): string | Buffer<ArrayBufferLike>;
export declare function executarShellSeguroAsync(cmd: string, opts?: ExecSyncOptions): Promise<string | Buffer<ArrayBufferLike>>;
//# sourceMappingURL=exec-safe.d.ts.map