import type { MoveReversao } from '@tipos/tipos.js';
export declare class GerenciadorMapaReversao {
    private mapa;
    constructor();
    /**
     * Carrega o mapa de reversão do disco
     */
    carregar(): Promise<void>;
    /**
     * Salva o mapa de reversão no disco
     */
    salvar(): Promise<void>;
    /**
     * Registra um novo move no mapa de reversão
     */
    registrarMove(origem: string, destino: string, motivo: string, conteudoOriginal?: string, conteudoFinal?: string, skipSalvar?: boolean): Promise<string>;
    /**
     * Remove um move do mapa de reversão
     */
    removerMove(id: string): Promise<boolean>;
    /**
     * Obtém todos os moves registrados
     */
    obterMoves(): MoveReversao[];
    /**
     * Obtém moves por arquivo
     */
    obterMovesPorArquivo(arquivo: string): MoveReversao[];
    /**
     * Verifica se um arquivo pode ser revertido
     */
    podeReverterArquivo(arquivo: string): boolean;
    /**
     * Reverte um move específico
     */
    reverterMove(id: string, baseDir?: string): Promise<boolean>;
    /**
     * Reverte todos os moves de um arquivo
     */
    reverterArquivo(arquivo: string, baseDir?: string): Promise<boolean>;
    /**
     * Lista moves em formato legível
     */
    listarMoves(): string;
    /**
     * Limpa o mapa de reversão
     */
    limpar(): Promise<void>;
}
export declare const mapaReversao: GerenciadorMapaReversao;
//# sourceMappingURL=mapa-reversao.d.ts.map