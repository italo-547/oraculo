/**
 * Lê e desserializa um arquivo JSON de estado.
 * Fallback: retorna [] para compatibilidade com formas antigas ou objeto vazio quando apropriado.
 */
export declare function lerEstado<T = unknown>(caminho: string, padrao?: T): Promise<T>;
/** Escrita atômica com permissões restritas e fsync. */
export declare function salvarEstado<T = unknown>(caminho: string, dados: T): Promise<void>;
export declare function lerArquivoTexto(caminho: string): Promise<string>;
/** Escrita atômica: grava em tmp e renomeia. */
export declare function salvarEstadoAtomico<T = unknown>(caminho: string, dados: T): Promise<void>;
<<<<<<< HEAD
//# sourceMappingURL=persistencia.d.ts.map
=======
//# sourceMappingURL=persistencia.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
