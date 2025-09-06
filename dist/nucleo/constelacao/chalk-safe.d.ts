export interface StyleFn {
    (s: string): string;
    cyan?: StyleFn;
    green?: StyleFn;
    red?: StyleFn;
    yellow?: StyleFn;
    magenta?: StyleFn;
    bold?: StyleFn;
    gray?: StyleFn;
    dim?: StyleFn;
}
export interface ChalkLike {
    cyan: StyleFn;
    green: StyleFn;
    red: StyleFn;
    yellow: StyleFn;
    magenta: StyleFn;
    bold: StyleFn;
    gray: StyleFn;
    dim: StyleFn;
}
export declare const chalk: ChalkLike;
export default chalk;
//# sourceMappingURL=chalk-safe.d.ts.map