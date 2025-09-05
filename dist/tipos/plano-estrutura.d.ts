export interface PlanoMoverItem {
<<<<<<< HEAD
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
=======
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
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
