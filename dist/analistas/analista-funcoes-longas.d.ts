import type { Ocorrencia } from '@tipos/tipos.js';
import type { NodePath } from '@babel/traverse';
export declare const analistaFuncoesLongas: {
<<<<<<< HEAD
    aplicar: (src: string, relPath: string, ast: NodePath | null, _fullPath?: string) => Ocorrencia[];
    nome: string;
    categoria: string;
    descricao: string;
    limites: {
        linhas: number;
        params: number;
        aninhamento: number;
    };
    test: (relPath: string) => boolean;
    global: false;
};
//# sourceMappingURL=analista-funcoes-longas.d.ts.map
=======
  aplicar: (src: string, relPath: string, ast: NodePath | null, _fullPath?: string) => Ocorrencia[];
  nome: string;
  categoria: string;
  descricao: string;
  limites: {
    linhas: number;
    params: number;
    aninhamento: number;
  };
  test: (relPath: string) => boolean;
  global: false;
};
//# sourceMappingURL=analista-funcoes-longas.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
