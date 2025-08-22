// SPDX-License-Identifier: MIT
export interface ResultadoGuardian {
  status: IntegridadeStatus;
  detalhes?: string[];
  baselineModificado?: boolean;
}

export enum IntegridadeStatus {
  Criado = 'baseline-criado',
  Aceito = 'baseline-aceito',
  Ok = 'ok',
  AlteracoesDetectadas = 'alteracoes-detectadas',
}

export class GuardianError extends Error {
  detalhes: unknown;
  constructor(erros: unknown) {
    super('Integridade comprometida — execuções bloqueadas.');
    this.name = 'GuardianError';
    this.detalhes = erros;
  }
}

export type OcorrenciaNivel = 'erro' | 'aviso' | 'info' | 'sucesso';

// Ocorrências Discriminadas
export interface OcorrenciaBase {
  tipo: string;
  mensagem: string;
  nivel?: OcorrenciaNivel;
  relPath?: string;
  linha?: number;
  coluna?: number;
  origem?: string;
  arquivo?: string;
}

export interface OcorrenciaErroAnalista extends OcorrenciaBase {
  tipo: 'ERRO_ANALISTA';
  stack?: string;
}

export interface OcorrenciaComplexidadeFuncao extends OcorrenciaBase {
  tipo: 'FUNCAO_COMPLEXA';
  linhas?: number;
  parametros?: number;
  aninhamento?: number;
  limites?: { maxLinhas?: number; maxParametros?: number; maxAninhamento?: number };
}

export interface OcorrenciaParseErro extends OcorrenciaBase {
  tipo: 'PARSE_ERRO';
  detalhe?: string;
  trecho?: string;
}

// Tipo genérico (fallback/legado) para ocorrência
export interface OcorrenciaGenerica extends OcorrenciaBase {
  [k: string]: unknown;
}

export type Ocorrencia =
  | OcorrenciaErroAnalista
  | OcorrenciaComplexidadeFuncao
  | OcorrenciaParseErro
  | OcorrenciaGenerica; // manter por compatibilidade

// Severidade textual padronizada (complementa um campo numérico opcional)
export type SeveridadeTexto = 'info' | 'aviso' | 'risco' | 'critico';

// Construtor simples para ocorrência garantindo escape básico e campos mínimos.
export function criarOcorrencia<T extends Ocorrencia>(
  base: Pick<T, 'tipo' | 'mensagem'> & Omit<Partial<T>, 'tipo' | 'mensagem'>,
): T {
  const resultado: Ocorrencia = {
    nivel: 'info',
    origem: 'oraculo',
    ...base,
    mensagem: base.mensagem.trim(),
  };
  return resultado as T;
}

// Auxiliares especializados
export function ocorrenciaErroAnalista(data: {
  mensagem: string;
  relPath?: string;
  stack?: string;
  origem?: string;
}): OcorrenciaErroAnalista {
  return criarOcorrencia<OcorrenciaErroAnalista>({ tipo: 'ERRO_ANALISTA', ...data });
}
export function ocorrenciaFuncaoComplexa(data: {
  mensagem: string;
  relPath?: string;
  linhas?: number;
  parametros?: number;
  aninhamento?: number;
  limites?: { maxLinhas?: number; maxParametros?: number; maxAninhamento?: number };
  origem?: string;
}): OcorrenciaComplexidadeFuncao {
  return criarOcorrencia<OcorrenciaComplexidadeFuncao>({ tipo: 'FUNCAO_COMPLEXA', ...data });
}
export function ocorrenciaParseErro(data: {
  mensagem: string;
  relPath?: string;
  detalhe?: string;
  trecho?: string;
  origem?: string;
  linha?: number;
  coluna?: number;
}): OcorrenciaParseErro {
  return criarOcorrencia<OcorrenciaParseErro>({ tipo: 'PARSE_ERRO', nivel: 'erro', ...data });
}

export type TecnicaAplicarResultado = Ocorrencia | Ocorrencia[] | null | undefined;

export interface Tecnica {
  nome?: string;
  global?: boolean;
  test?: (relPath: string) => boolean;
  aplicar: (
    src: string,
    relPath: string,
    ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | null,
    fullPath?: string,
    contexto?: ContextoExecucao,
  ) => TecnicaAplicarResultado | Promise<TecnicaAplicarResultado>;
}

// Tipos para configuração dinâmica de inclusão/exclusão
// Nomes em português (preferidos) com aliases em inglês para compatibilidade de código existente.
export type RegraIncluiExclui = {
  /** força inclusão (true) */
  include?: boolean;
  /** força exclusão (true) */
  exclude?: boolean;
  /** padrões simples (substring) que, se presentes, incluem */
  patterns?: string[];
  /** função personalizada para decidir inclusão */
  custom?: (relPath: string, entry: import('node:fs').Dirent) => boolean;
};

export type ConfigIncluiExclui = {
  /** Inclusões globais por substring (compat) */
  globalInclude?: string[];
  /** Exclusões globais por substring (compat) */
  globalExclude?: string[];
  /** Globs micromatch globais (prioridade: excludeGlob > exclude > includeGlob > include) */
  globalIncludeGlob?: string[];
  /** Globs micromatch globais para exclusão (mais forte) */
  globalExcludeGlob?: string[];
  /** Regras por diretório (chave é prefixo, ex.: "src/") */
  dirRules?: Record<string, RegraIncluiExclui>;
};

// Aliases para manter compatibilidade com nomes anteriores (inglês)
export type IncludeExcludeRule = RegraIncluiExclui;
export type IncludeExcludeConfig = ConfigIncluiExclui;

// Interface futura unificada para analistas (superset de Tecnica)
export interface Analista extends Tecnica {
  nome: string; // obrigatório para identificação
  categoria?: string; // ex: 'complexidade', 'estrutura'
  descricao?: string; // breve resumo exibido em listagens
  limites?: Record<string, number>; // ex: { maxLinhas: 30 }
  sempreAtivo?: boolean; // ignora filtros
}

// Fábrica para criar analista com validação mínima
export function criarAnalista<A extends Analista>(def: A): A {
  if (!def || typeof def !== 'object') throw new Error('Definição de analista inválida');
  if (!def.nome || (/\s/.test(def.nome) === false) === false) {
    // nome pode ter hifens, apenas exige não vazio
  }
  if (typeof def.aplicar !== 'function') throw new Error(`Analista ${def.nome} sem função aplicar`);
  return Object.freeze(def);
}

export interface AmbienteExecucao {
  arquivosValidosSet: Set<string>;
  guardian: unknown;
}

export interface ContextoExecucao {
  baseDir: string;
  arquivos: FileEntryWithAst[];
  ambiente?: AmbienteExecucao;
}

export type TipoProjeto =
  | 'desconhecido'
  | 'landing'
  | 'api'
  | 'lib'
  | 'cli'
  | 'fullstack'
  | 'monorepo';

export interface SinaisProjeto {
  temPages?: boolean;
  temComponents?: boolean;
  temControllers?: boolean;
  temApi?: boolean;
  temExpress?: boolean;
  temSrc?: boolean;
  temCli?: boolean;
  temPrisma?: boolean;
  temPackages?: boolean;
}

export interface DiagnosticoProjeto {
  tipo: TipoProjeto;
  sinais: (keyof SinaisProjeto)[];
  confiabilidade: number;
}

export interface ResultadoInquisicao {
  totalArquivos: number;
  ocorrencias: Ocorrencia[];
  arquivosAnalisados: string[];
  timestamp: number;
  duracaoMs: number;
  /** Métricas detalhadas da execução quando ANALISE_METRICAS_ENABLED. */
  metricas?: MetricaExecucao;
}

export interface MetricaAnalista {
  nome: string;
  duracaoMs: number;
  ocorrencias: number;
  global: boolean;
}

export interface MetricaExecucao {
  totalArquivos: number;
  tempoParsingMs: number;
  tempoAnaliseMs: number;
  cacheAstHits: number;
  cacheAstMiss: number;
  analistas: MetricaAnalista[];
}

export interface ResultadoInquisicaoCompleto extends ResultadoInquisicao {
  arquivosAnalisados: string[];
  fileEntries: FileEntryWithAst[];
  guardian: unknown;
}

// Arquétipos de estrutura (biblioteca de estruturas padrão)
export interface ArquetipoEstruturaDef {
  nome: string;
  descricao: string;
  requiredDirs?: string[]; // diretórios obrigatórios (ex: ['src'])
  optionalDirs?: string[]; // diretórios que aumentam score se presentes
  forbiddenDirs?: string[]; // diretórios que penalizam se presentes
  rootFilesAllowed?: string[]; // arquivos permitidos na raiz (ex: package.json, tsconfig.json)
  dependencyHints?: string[]; // dependências cujo presence aumenta score
  filePresencePatterns?: string[]; // padrões glob simples (substring match) que aumentam score
  pesoBase?: number; // peso para desempate
}

export interface ArquetipoDeteccaoAnomalia {
  path: string;
  motivo: string;
  sugerido?: string;
}

export interface ResultadoDeteccaoArquetipo {
  nome: string;
  descricao: string;
  score: number;
  confidence: number; // 0-100
  matchedRequired: string[];
  missingRequired: string[];
  matchedOptional: string[];
  dependencyMatches: string[];
  filePatternMatches: string[];
  forbiddenPresent: string[];
  anomalias: ArquetipoDeteccaoAnomalia[];
  planoSugestao?: PlanoSugestaoEstrutura;
  sugestaoPadronizacao?: string;
  explicacaoSimilaridade?: string;
  candidatoExtra?: string;
}

// Plano de reorganização estrutural sugerido (não executado automaticamente)
// PlanoSugestaoEstrutura movido para './plano-estrutura'
export type { PlanoSugestaoEstrutura } from './plano-estrutura.js';

export interface SnapshotEstruturaBaseline {
  version: 1;
  timestamp: string;
  arquetipo: string;
  confidence: number;
  arquivosRaiz: string[];
}

// Diferença entre baseline e detecção atual de arquétipos
export interface ArquetipoDrift {
  alterouArquetipo: boolean;
  anterior?: string;
  atual?: string;
  deltaConfidence: number;
  arquivosRaizNovos: string[];
  arquivosRaizRemovidos: string[];
}

export interface ScanOptions {
  includeContent?: boolean;
  includeAst?: boolean;
}

export interface InquisicaoOptions {
  includeContent?: boolean;
  incluirMetadados?: boolean;
  skipExec?: boolean; // quando true apenas escaneia e prepara (se solicitado) sem executar analistas
}

export type Contador = Record<string, number>;

export interface Estatisticas {
  requires: Contador;
  consts: Contador;
  exports: Contador;
  vars: Contador;
  lets: Contador;
  evals: Contador;
  withs: Contador;
}

export interface ResultadoCorrecao {
  correcoesAplicadas: number;
}

export interface ResultadoPoda {
  arquivosOrfaos: ArquivoFantasma[];
}

export interface ArquivoFantasma {
  arquivo: string;
  referenciado: boolean;
  diasInativo: number;
}

export interface Pendencia {
  arquivo: string;
  motivo: string;
  detectedAt: number;
  scheduleAt: number;
}

export interface HistoricoItem {
  arquivo: string;
  movidoEm: string;
  motivo: string;
}

export interface RelatorioCompacto {
  resumo: {
    totalArquivos: number;
    totalOcorrencias: number;
    tiposOcorrencias: Record<string, number>;
    arquivosComProblemas: number;
    integridadeGuardian: string;
    baselineModificado: boolean;
    arquivosOrfaosDetectados: number;
  };
  detalhesOcorrencias: {
    filePath?: string;
    tipoOcorrencia?: string;
    mensagem?: string;
    linha?: number;
    coluna?: number;
  }[];
}

export type ComandoOraculo = 'diagnosticar' | 'guardian' | 'podar' | 'reestruturar' | 'atualizar'; //

import type { NodePath } from '@babel/traverse';
import type { PlanoSugestaoEstrutura } from './plano-estrutura.js';

export type OrigemArquivo = 'local' | 'remoto' | 'gerado';

export interface FileEntry {
  fullPath: string;
  relPath: string;
  content: string | null;
  origem?: OrigemArquivo;
  ultimaModificacao?: number;
}

export interface FileEntryWithAst extends FileEntry {
  ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | undefined;
}

export type FileMap = Record<string, FileEntry>;
export type FileMapWithAst = Record<string, FileEntryWithAst>;
