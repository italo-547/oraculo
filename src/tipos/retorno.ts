import type { NodePath } from '@babel/types';

//
// 📂 Fundamentos de Arquivos
//

export type OrigemArquivo = 'local' | 'remoto' | 'gerado';

/** Representa um arquivo escaneado (com ou sem AST) */
export interface FileEntry {
  fullPath: string;
  relPath: string;
  content: string | null;
  origem?: OrigemArquivo;
  ultimaModificacao?: number;
}

/** Representa um arquivo com AST associada */
export interface FileEntryWithAst<N extends NodePath = NodePath> extends FileEntry {
  ast: NodePath | null;
}

/** Mapeamentos rápidos por caminho */
export type FileMap = Record<string, FileEntry>;
export type FileMapWithAst<N extends NodePath = NodePath> = Record<string, FileEntryWithAst<N>>;


//
// 📂 Tipagens de Análise
//

export type OcorrenciaNivel = 'erro' | 'aviso' | 'info' | 'sucesso';

export interface Ocorrencia {
  tipo: string;
  nivel: OcorrenciaNivel;
  mensagem: string;
  relPath: string;
  linha: number;
  // Extras
  coluna: number;
  trecho: string;
  origem: string;
  resolucao: string;
  severidade: number;
}

export type TecnicaAplicarResultado = Ocorrencia | Ocorrencia[] | null | undefined;

export interface AmbienteExecucao {
  arquivosValidosSet: Set<string>;
  guardian: unknown;
}

export interface ContextoExecucao {
  baseDir: string;
  arquivos: FileEntryWithAst[];
  ambiente?: AmbienteExecucao;
}

export interface Tecnica {
  nome: string;
  test?: (relPath: string) => boolean;
  global?: boolean;
  aplicar: (
    src: string,
    relPath: string,
    ast: NodePath | null,
    fullPath?: string,
    contexto?: ContextoExecucao
  ) => TecnicaAplicarResultado | Promise<TecnicaAplicarResultado>;
}


//
// 📂 Diagnóstico de Projeto
//

export type TipoProjeto =
  | 'desconhecido'
  | 'landing'
  | 'api'
  | 'lib'
  | 'cli'
  | 'fullstack'
  | 'monorepo';

export interface SinaisProjeto {
  temPages: boolean;
  temComponents: boolean;
  temControllers: boolean;
  temApi: boolean;
  temExpress: boolean;
  temSrc: boolean;
  temCli: boolean;
  temPrisma: boolean;
  temPackages: boolean;
}

export interface DiagnosticoProjeto {
  tipo: TipoProjeto;
  sinais: Array<keyof SinaisProjeto>;
  confiabilidade: number;
}


//
// 📂 Execução e Resultados
//

export interface ResultadoInquisicao {
  totalArquivos: number;
  ocorrencias: Ocorrencia[];
  arquivosAnalisados: string[];
  timestamp: number;
  duracaoMs: number;
}

export interface ResultadoInquisicaoCompleto extends ResultadoInquisicao {
  arquivosAnalisados: string; // representado como string única
  fileEntries: FileEntryWithAst[];
  guardian: unknown;
}


//
// 📂 Escaneamento
//

export interface ScanOptions {
  includeContent: boolean;
  includeAst: boolean;
}

export interface InquisicaoOptions {
  includeContent: boolean;
  incluirMetadados: boolean;
}


//
// 📂 Poda e Zeladoria
//

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
// 📂 Padrões e Métricas
//

export type Contador = Record<string, number>;

export interface Estatisticas {
  requires: Contador;
  consts: Contador;
  exports: Contador;
}