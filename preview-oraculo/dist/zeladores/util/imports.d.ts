export interface ImportReescrito {
  from: string;
  to: string;
}
export declare function reescreverImports(
  conteudo: string,
  arquivoDe: string,
  arquivoPara: string,
): {
  novoConteudo: string;
  reescritos: ImportReescrito[];
};
//# sourceMappingURL=imports.d.ts.map
