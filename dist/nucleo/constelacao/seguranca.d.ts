export declare function sanitizarRelPath(rel: string): string;
export declare function estaDentro(baseDir: string, alvo: string): boolean;
export declare function resolverPluginSeguro(baseDir: string, pluginRel: string): {
    caminho?: string;
    erro?: string;
};
export declare function validarGlobBasico(padrao: string): boolean;
export declare function filtrarGlobSeguros(padroes: string[]): string[];
//# sourceMappingURL=seguranca.d.ts.map