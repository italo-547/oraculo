export interface PlanoMoverItem {
    de: string;
    para: string;
    motivo?: string;
}
export interface PlanoConflito {
    alvo: string;
    motivo: string;
}
export interface PlanoResumo {
    total: number;
    zonaVerde: number;
    bloqueados: number;
}
export interface PlanoSugestaoEstrutura {
    mover: PlanoMoverItem[];
    conflitos?: PlanoConflito[];
    resumo?: PlanoResumo;
}
//# sourceMappingURL=plano-estrutura.d.ts.map