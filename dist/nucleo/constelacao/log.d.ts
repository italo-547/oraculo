import { type StyleFn } from './chalk-safe.js';
export declare const LOG_SIMBOLOS: {
<<<<<<< HEAD
=======
  info: string;
  sucesso: string;
  erro: string;
  aviso: string;
  debug: string;
  fase: string;
  passo: string;
  scan: string;
  guardian: string;
  pasta: string;
};
export declare function formatarBloco(
  titulo: string,
  linhas: string[],
  corTitulo?: StyleFn,
  larguraMax?: number,
): string;
export declare function fase(titulo: string): void;
export declare function passo(descricao: string): void;
export declare const log: {
  info(msg: string): void;
  infoSemSanitizar(msg: string): void;
  infoDestaque(msg: string): void;
  sucesso(msg: string): void;
  erro(msg: string): void;
  aviso(msg: string): void;
  debug(msg: string): void;
  fase: typeof fase;
  passo: typeof passo;
  bloco: typeof formatarBloco;
  calcularLargura(titulo: string, linhas: string[], larguraMax?: number): number;
  imprimirBloco(titulo: string, linhas: string[], corTitulo?: StyleFn, larguraMax?: number): void;
  simbolos: {
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
    info: string;
    sucesso: string;
    erro: string;
    aviso: string;
    debug: string;
    fase: string;
    passo: string;
    scan: string;
    guardian: string;
    pasta: string;
<<<<<<< HEAD
};
export declare function formatarBloco(titulo: string, linhas: string[], corTitulo?: StyleFn, larguraMax?: number): string;
export declare function fase(titulo: string): void;
export declare function passo(descricao: string): void;
export declare const log: {
    info(msg: string): void;
    infoSemSanitizar(msg: string): void;
    infoDestaque(msg: string): void;
    sucesso(msg: string): void;
    erro(msg: string): void;
    aviso(msg: string): void;
    debug(msg: string): void;
    fase: typeof fase;
    passo: typeof passo;
    bloco: typeof formatarBloco;
    calcularLargura(titulo: string, linhas: string[], larguraMax?: number): number;
    imprimirBloco(titulo: string, linhas: string[], corTitulo?: StyleFn, larguraMax?: number): void;
    simbolos: {
        info: string;
        sucesso: string;
        erro: string;
        aviso: string;
        debug: string;
        fase: string;
        passo: string;
        scan: string;
        guardian: string;
        pasta: string;
    };
};
//# sourceMappingURL=log.d.ts.map
=======
  };
};
//# sourceMappingURL=log.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
