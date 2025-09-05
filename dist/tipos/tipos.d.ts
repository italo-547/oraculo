export interface ResultadoGuardian {
<<<<<<< HEAD
    status: IntegridadeStatus;
    detalhes?: string[];
    baselineModificado?: boolean;
}
export declare enum IntegridadeStatus {
    Criado = "baseline-criado",
    Aceito = "baseline-aceito",
    Ok = "ok",
    AlteracoesDetectadas = "alteracoes-detectadas"
}
export declare class GuardianError extends Error {
    detalhes: unknown;
    constructor(erros: unknown);
}
export type OcorrenciaNivel = 'erro' | 'aviso' | 'info' | 'sucesso';
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
    limites?: {
        maxLinhas?: number;
        maxParametros?: number;
        maxAninhamento?: number;
    };
}
export interface OcorrenciaParseErro extends OcorrenciaBase {
    tipo: 'PARSE_ERRO';
    detalhe?: string;
    trecho?: string;
}
export interface OcorrenciaGenerica extends OcorrenciaBase {
    [k: string]: unknown;
}
export type Ocorrencia = OcorrenciaErroAnalista | OcorrenciaComplexidadeFuncao | OcorrenciaParseErro | OcorrenciaGenerica;
export type SeveridadeTexto = 'info' | 'aviso' | 'risco' | 'critico';
export declare function criarOcorrencia<T extends Ocorrencia>(base: Pick<T, 'tipo' | 'mensagem'> & Omit<Partial<T>, 'tipo' | 'mensagem'>): T;
export declare function ocorrenciaErroAnalista(data: {
    mensagem: string;
    relPath?: string;
    stack?: string;
    origem?: string;
}): OcorrenciaErroAnalista;
export declare function ocorrenciaFuncaoComplexa(data: {
    mensagem: string;
    relPath?: string;
    linhas?: number;
    parametros?: number;
    aninhamento?: number;
    limites?: {
        maxLinhas?: number;
        maxParametros?: number;
        maxAninhamento?: number;
    };
    origem?: string;
}): OcorrenciaComplexidadeFuncao;
export declare function ocorrenciaParseErro(data: {
    mensagem: string;
    relPath?: string;
    detalhe?: string;
    trecho?: string;
    origem?: string;
    linha?: number;
    coluna?: number;
}): OcorrenciaParseErro;
export type TecnicaAplicarResultado = Ocorrencia | Ocorrencia[] | null | undefined;
export interface Tecnica {
    nome?: string;
    global?: boolean;
    test?: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string, ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | null, fullPath?: string, contexto?: ContextoExecucao) => TecnicaAplicarResultado | Promise<TecnicaAplicarResultado>;
}
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
=======
  status: IntegridadeStatus;
  detalhes?: string[];
  baselineModificado?: boolean;
}
export declare enum IntegridadeStatus {
  Criado = 'baseline-criado',
  Aceito = 'baseline-aceito',
  Ok = 'ok',
  AlteracoesDetectadas = 'alteracoes-detectadas',
}
export declare class GuardianError extends Error {
  detalhes: unknown;
  constructor(erros: unknown);
}
export type OcorrenciaNivel = 'erro' | 'aviso' | 'info' | 'sucesso';
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
  limites?: {
    maxLinhas?: number;
    maxParametros?: number;
    maxAninhamento?: number;
  };
}
export interface OcorrenciaParseErro extends OcorrenciaBase {
  tipo: 'PARSE_ERRO';
  detalhe?: string;
  trecho?: string;
}
export interface OcorrenciaGenerica extends OcorrenciaBase {
  [k: string]: unknown;
}
export type Ocorrencia =
  | OcorrenciaErroAnalista
  | OcorrenciaComplexidadeFuncao
  | OcorrenciaParseErro
  | OcorrenciaGenerica;
export type SeveridadeTexto = 'info' | 'aviso' | 'risco' | 'critico';
export declare function criarOcorrencia<T extends Ocorrencia>(
  base: Pick<T, 'tipo' | 'mensagem'> & Omit<Partial<T>, 'tipo' | 'mensagem'>,
): T;
export declare function ocorrenciaErroAnalista(data: {
  mensagem: string;
  relPath?: string;
  stack?: string;
  origem?: string;
}): OcorrenciaErroAnalista;
export declare function ocorrenciaFuncaoComplexa(data: {
  mensagem: string;
  relPath?: string;
  linhas?: number;
  parametros?: number;
  aninhamento?: number;
  limites?: {
    maxLinhas?: number;
    maxParametros?: number;
    maxAninhamento?: number;
  };
  origem?: string;
}): OcorrenciaComplexidadeFuncao;
export declare function ocorrenciaParseErro(data: {
  mensagem: string;
  relPath?: string;
  detalhe?: string;
  trecho?: string;
  origem?: string;
  linha?: number;
  coluna?: number;
}): OcorrenciaParseErro;
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
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
};
export type IncludeExcludeRule = RegraIncluiExclui;
export type IncludeExcludeConfig = ConfigIncluiExclui;
export interface Analista extends Tecnica {
<<<<<<< HEAD
    nome: string;
    categoria?: string;
    descricao?: string;
    limites?: Record<string, number>;
    sempreAtivo?: boolean;
}
export declare function criarAnalista<A extends Analista>(def: A): A;
export interface AmbienteExecucao {
    arquivosValidosSet: Set<string>;
    guardian: unknown;
}
export interface ContextoExecucao {
    baseDir: string;
    arquivos: FileEntryWithAst[];
    ambiente?: AmbienteExecucao;
}
export type TipoProjeto = 'desconhecido' | 'landing' | 'api' | 'lib' | 'cli' | 'fullstack' | 'monorepo';
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
    topAnalistas?: TopAnalista[];
}
export interface TopAnalista {
    nome: string;
    totalMs: number;
    mediaMs: number;
    execucoes: number;
    ocorrencias: number;
}
export interface ResultadoInquisicaoCompleto extends ResultadoInquisicao {
    arquivosAnalisados: string[];
    fileEntries: FileEntryWithAst[];
    guardian: unknown;
}
export interface ArquetipoEstruturaDef {
    nome: string;
    descricao: string;
    requiredDirs?: string[];
    optionalDirs?: string[];
    forbiddenDirs?: string[];
    rootFilesAllowed?: string[];
    dependencyHints?: string[];
    filePresencePatterns?: string[];
    pesoBase?: number;
}
export interface ArquetipoPersonalizado {
    /** Nome personalizado do projeto */
    nome: string;
    /** Descrição do projeto personalizado */
    descricao?: string;
    /** Arquétipo oficial base (ex: 'bot', 'cli', 'api') */
    arquetipoOficial: string;
    /** Estrutura personalizada do projeto */
    estruturaPersonalizada: {
        /** Diretórios principais do projeto */
        diretorios: string[];
        /** Arquivos-chave do projeto */
        arquivosChave: string[];
        /** Padrões de nomenclatura personalizados */
        padroesNomenclatura?: Record<string, string>;
    };
    /** Melhores práticas personalizadas */
    melhoresPraticas?: {
        /** Estruturas recomendadas */
        recomendado?: string[];
        /** Estruturas a evitar */
        evitar?: string[];
        /** Notas sobre organização */
        notas?: string[];
    };
    /** Metadados do arquétipo personalizado */
    metadata?: {
        /** Quando foi criado */
        criadoEm: string;
        /** Versão do formato */
        versao: string;
        /** Notas do usuário */
        notasUsuario?: string;
    };
}
export interface ArquetipoDeteccaoAnomalia {
    path: string;
    motivo: string;
    sugerido?: string;
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
    confidence: number;
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
export type { PlanoSugestaoEstrutura } from './plano-estrutura.js';
export interface SnapshotEstruturaBaseline {
    version: 1;
    timestamp: string;
    arquetipo: string;
    confidence: number;
    arquivosRaiz: string[];
}
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
    skipExec?: boolean;
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
export interface MoveReversao {
    id: string;
    timestamp: string;
    origem: string;
    destino: string;
    motivo: string;
    importsReescritos: boolean;
    conteudoOriginal?: string;
    conteudoFinal?: string;
}
export interface MapaReversao {
    versao: string;
    moves: MoveReversao[];
    metadata: {
        totalMoves: number;
        ultimoMove: string;
        podeReverter: boolean;
    };
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
=======
  nome: string;
  categoria?: string;
  descricao?: string;
  limites?: Record<string, number>;
  sempreAtivo?: boolean;
}
export declare function criarAnalista<A extends Analista>(def: A): A;
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
  topAnalistas?: TopAnalista[];
}
export interface TopAnalista {
  nome: string;
  totalMs: number;
  mediaMs: number;
  execucoes: number;
  ocorrencias: number;
}
export interface ResultadoInquisicaoCompleto extends ResultadoInquisicao {
  arquivosAnalisados: string[];
  fileEntries: FileEntryWithAst[];
  guardian: unknown;
}
export interface ArquetipoEstruturaDef {
  nome: string;
  descricao: string;
  requiredDirs?: string[];
  optionalDirs?: string[];
  forbiddenDirs?: string[];
  rootFilesAllowed?: string[];
  dependencyHints?: string[];
  filePresencePatterns?: string[];
  pesoBase?: number;
}
export interface ArquetipoPersonalizado {
  /** Nome personalizado do projeto */
  nome: string;
  /** Descrição do projeto personalizado */
  descricao?: string;
  /** Arquétipo oficial base (ex: 'bot', 'cli', 'api') */
  arquetipoOficial: string;
  /** Estrutura personalizada do projeto */
  estruturaPersonalizada: {
    /** Diretórios principais do projeto */
    diretorios: string[];
    /** Arquivos-chave do projeto */
    arquivosChave: string[];
    /** Padrões de nomenclatura personalizados */
    padroesNomenclatura?: Record<string, string>;
  };
  /** Melhores práticas personalizadas */
  melhoresPraticas?: {
    /** Estruturas recomendadas */
    recomendado?: string[];
    /** Estruturas a evitar */
    evitar?: string[];
    /** Notas sobre organização */
    notas?: string[];
  };
  /** Metadados do arquétipo personalizado */
  metadata?: {
    /** Quando foi criado */
    criadoEm: string;
    /** Versão do formato */
    versao: string;
    /** Notas do usuário */
    notasUsuario?: string;
  };
}
export interface ArquetipoDeteccaoAnomalia {
  path: string;
  motivo: string;
  sugerido?: string;
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
  confidence: number;
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
export type { PlanoSugestaoEstrutura } from './plano-estrutura.js';
export interface SnapshotEstruturaBaseline {
  version: 1;
  timestamp: string;
  arquetipo: string;
  confidence: number;
  arquivosRaiz: string[];
}
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
  skipExec?: boolean;
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
export interface MoveReversao {
  id: string;
  timestamp: string;
  origem: string;
  destino: string;
  motivo: string;
  importsReescritos: boolean;
  conteudoOriginal?: string;
  conteudoFinal?: string;
}
export interface MapaReversao {
  versao: string;
  moves: MoveReversao[];
  metadata: {
    totalMoves: number;
    ultimoMove: string;
    podeReverter: boolean;
  };
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
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
export type ComandoOraculo = 'diagnosticar' | 'guardian' | 'podar' | 'reestruturar' | 'atualizar';
import type { PlanoSugestaoEstrutura } from './plano-estrutura.js';
export type OrigemArquivo = 'local' | 'remoto' | 'gerado';
export interface FileEntry {
<<<<<<< HEAD
    fullPath: string;
    relPath: string;
    content: string | null;
    origem?: OrigemArquivo;
    ultimaModificacao?: number;
}
export interface FileEntryWithAst extends FileEntry {
    ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | undefined;
=======
  fullPath: string;
  relPath: string;
  content: string | null;
  origem?: OrigemArquivo;
  ultimaModificacao?: number;
}
export interface FileEntryWithAst extends FileEntry {
  ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | undefined;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
export type FileMap = Record<string, FileEntry>;
export type FileMapWithAst = Record<string, FileEntryWithAst>;
export interface ParseErrosJson {
<<<<<<< HEAD
    totalOriginais: number;
    totalExibidos: number;
    agregados: number;
}
export interface EstruturaIdentificadaJson {
    melhores: ResultadoDeteccaoArquetipo[];
    baseline: SnapshotEstruturaBaseline | null;
    drift: ArquetipoDrift;
}
export interface LinguagensJson {
    total: number;
    extensoes: Record<string, number>;
}
export interface SaidaJsonDiagnostico {
    status: 'ok' | 'problemas' | 'erro';
    totalOcorrencias: number;
    guardian: 'verificado' | 'nao-verificado';
    tiposOcorrencias: Record<string, number>;
    parseErros: ParseErrosJson;
    ocorrencias: Ocorrencia[];
    estruturaIdentificada?: EstruturaIdentificadaJson;
    metricas?: MetricaExecucao;
    linguagens: LinguagensJson;
}
//# sourceMappingURL=tipos.d.ts.map
=======
  totalOriginais: number;
  totalExibidos: number;
  agregados: number;
}
export interface EstruturaIdentificadaJson {
  melhores: ResultadoDeteccaoArquetipo[];
  baseline: SnapshotEstruturaBaseline | null;
  drift: ArquetipoDrift;
}
export interface LinguagensJson {
  total: number;
  extensoes: Record<string, number>;
}
export interface SaidaJsonDiagnostico {
  status: 'ok' | 'problemas' | 'erro';
  totalOcorrencias: number;
  guardian: 'verificado' | 'nao-verificado';
  tiposOcorrencias: Record<string, number>;
  parseErros: ParseErrosJson;
  ocorrencias: Ocorrencia[];
  estruturaIdentificada?: EstruturaIdentificadaJson;
  metricas?: MetricaExecucao;
  linguagens: LinguagensJson;
}
//# sourceMappingURL=tipos.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
