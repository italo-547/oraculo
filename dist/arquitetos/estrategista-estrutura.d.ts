import type { PlanoSugestaoEstrutura } from '@tipos/plano-estrutura.js';
import type { ContextoExecucao } from '@tipos/tipos.js';
import { OpcoesEstrategista } from '@zeladores/util/estrutura.js';
/**
 * Estrategista/Planejador de Estrutura
 *
 * Responsável por: dado o conjunto de arquivos e um catálogo de arquétipos,
 * sugerir um plano de reorganização (mover arquivos) com base em regras de nomeação
 * e diretórios-alvo padronizados. Não aplica mudanças no disco (apenas sugere).
 *
 * Domínio ideal: arquitetos (diagnóstico/planejamento). A execução fica com zeladores.
 */
<<<<<<< HEAD
export declare function gerarPlanoEstrategico(contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>, opcoes?: OpcoesEstrategista): Promise<PlanoSugestaoEstrutura>;
export declare const EstrategistaEstrutura: {
    nome: string;
    gerarPlano: typeof gerarPlanoEstrategico;
};
//# sourceMappingURL=estrategista-estrutura.d.ts.map
=======
export declare function gerarPlanoEstrategico(
  contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>,
  opcoes?: OpcoesEstrategista,
): Promise<PlanoSugestaoEstrutura>;
export declare const EstrategistaEstrutura: {
  nome: string;
  gerarPlano: typeof gerarPlanoEstrategico;
};
//# sourceMappingURL=estrategista-estrutura.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
