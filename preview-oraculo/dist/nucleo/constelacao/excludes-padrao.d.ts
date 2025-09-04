/**
 * Configuração centralizada dos padrões de exclusão do Oráculo
 *
 * Esta configuração define os padrões padrão de exclusão usados pelo sistema
 * de análise quando nenhum outro filtro é especificado.
 *
 * Precedência de configuração:
 * 1. Flags --include/--exclude (mais alta prioridade)
 * 2. oraculo.config.json (configuração do projeto)
 * 3. Este arquivo (padrões do sistema)
 * 4. Fallback hardcoded (mais baixa prioridade)
 */
export interface ConfigExcludesPadrao {
  /** Padrões de exclusão padrão do sistema */
  padroesSistema: string[];
  /** Padrões recomendados para projetos Node.js */
  nodeJs: string[];
  /** Padrões recomendados para projetos TypeScript */
  typeScript: string[];
  /** Padrões recomendados para projetos Python */
  python: string[];
  /** Padrões recomendados para projetos Java */
  java: string[];
  /** Padrões recomendados para projetos .NET/C# */
  dotnet: string[];
  /** Padrões para ferramentas de desenvolvimento */
  ferramentasDev: string[];
  /** Padrões para sistemas de controle de versão */
  controleVersao: string[];
  /** Padrões para arquivos temporários e cache */
  temporarios: string[];
  /** Padrões para documentação e assets */
  documentacao: string[];
  /** Metadados da configuração */
  metadata: {
    versao: string;
    ultimaAtualizacao: string;
    descricao: string;
  };
}
/**
 * Configuração padrão dos padrões de exclusão
 *
 * Estes são os padrões recomendados pelo Oráculo para diferentes tipos de projeto.
 * Eles podem ser sobrescritos pelo usuário via oraculo.config.json
 */
export declare const EXCLUDES_PADRAO: ConfigExcludesPadrao;
/**
 * Função para obter os padrões de exclusão recomendados baseado no tipo de projeto
 *
 * @param tipoProjeto Tipo de projeto detectado ou 'generico' para padrões gerais
 * @returns Array de padrões de exclusão recomendados
 */
export declare function getExcludesRecomendados(tipoProjeto?: string): string[];
/**
 * Função para validar se um padrão de exclusão é seguro
 *
 * @param padrao Padrão a ser validado
 * @returns true se o padrão é considerado seguro
 */
export declare function isPadraoExclusaoSeguro(padrao: string): boolean;
/**
 * Função para mesclar configurações de exclusão com precedência
 *
 * Precedência (do mais alto para o mais baixo):
 * 1. Configuração do usuário via oraculo.config.json
 * 2. Padrões recomendados baseados no tipo de projeto
 * 3. Padrões do sistema
 *
 * @param configUsuario Configuração do usuário (pode ser null/undefined)
 * @param tipoProjeto Tipo de projeto para padrões recomendados
 * @returns Array consolidado de padrões de exclusão
 */
export declare function mesclarConfigExcludes(
  configUsuario: string[] | null | undefined,
  tipoProjeto?: string,
): string[];
//# sourceMappingURL=excludes-padrao.d.ts.map
