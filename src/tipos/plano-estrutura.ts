// SPDX-License-Identifier: MIT
// Tipos relacionados a plano de reorganização estrutural (extraídos de tipos.ts para reduzir acoplamento)

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
