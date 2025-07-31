

//
// 📂 Integridade e Erros
//

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

//
// 📂 Ocorrências e Técnicas
//

export type OcorrenciaNivel = 'erro' | 'aviso' | 'info' | 'sucesso';

export interface Ocorrencia {
  tipo: string;
  nivel?: OcorrenciaNivel;
  mensagem: string;
  relPath?: string;
  linha?: number;
  coluna?: number;
  trecho?: string;
  origem?: string;
  resolucao?: string;
  severidade?: number;
  arquivo?: string;
}

export type TecnicaAplicarResultado = Ocorrencia | Ocorrencia[] | null | undefined;

export interface Tecnica {
  nome?: string;
  global?: boolean;
  test?: (relPath: string) => boolean;
  aplicar: (
    src: string,
    relPath: string,
    ast: NodePath | null,
    fullPath?: string,
    contexto?: ContextoExecucao
  ) => TecnicaAplicarResultado | Promise<TecnicaAplicarResultado>;
}

//
// 📂 Execução e Diagnóstico
//

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
}

export interface ResultadoInquisicaoCompleto extends ResultadoInquisicao {
  arquivosAnalisados: string[];
  fileEntries: FileEntryWithAst[];
  guardian: unknown;
}

//
// 📂 Opções e Métricas
//

export interface ScanOptions {
  includeContent?: boolean;
  includeAst?: boolean;
}

export interface InquisicaoOptions {
  includeContent?: boolean;
  incluirMetadados?: boolean;
}

export type Contador = Record<string, number>;

export interface Estatisticas {
  requires: Contador;
  consts: Contador;
  exports: Contador;
}

//
// 📂 Arquivos e Pendências
//

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

//
// 📂 Relatórios e CLI
//

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

export type ComandoOraculo =
  | 'diagnosticar'
  | 'guardian'
  | 'podar'
  | 'reestruturar'
  | 'atualizar';//

// 📂 AST e Arquivos
import type { Node } from '@babel/types';
import type { NodePath } from '@babel/traverse';

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


