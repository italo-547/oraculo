import type { Node } from '@babel/types'

/** Representa um arquivo escaneado */
export type FileEntry = {
  fullPath: string
  relPath: string
  content: string | null
  origem?: 'local' | 'remoto' | 'gerado'
  ultimaModificacao?: number
}

/** Representa um arquivo com AST associada */
export type FileEntryWithAst<N extends Node = Node> = FileEntry & {
  ast: N | null
}

/** Mapeamento por caminho relativo */
export type FileMap = Record<string, FileEntry>
export type FileMapWithAst<N extends Node = Node> = Record<string, FileEntryWithAst<N>>

/** Severidade do diagnóstico */
export type OcorrenciaTipo = 'erro' | 'aviso' | 'info' | 'sucesso'

/** Resultado de uma análise/técnica aplicada */
export type Ocorrencia = {
  tipo: OcorrenciaTipo
  severidade?: number
  arquivo: string
  mensagem: string
  resolucao?: string
  linha?: number
  coluna?: number
  trecho?: string
  origem?: string
}

/** Resultado possível de uma técnica */
export type TecnicaAplicarResultado = Ocorrencia | Ocorrencia[] | null | undefined

/** Contexto extra para execução de técnicas */
export type ContextoExecucao = {
  baseDir: string
  arquivos: FileEntryWithAst[]
  ambiente?: Record<string, unknown>
}

/** Técnica de análise (ou ritual 👻) */
export type Tecnica = {
  test: (relPath: string) => boolean
  aplicar: (
    src: string,
    relPath: string,
    ast: Node | null,
    contexto?: ContextoExecucao
  ) => TecnicaAplicarResultado
}

/** Categorias reconhecidas pelo Oráculo */
export type TipoProjeto =
  | 'desconhecido'
  | 'landing'
  | 'api'
  | 'lib'
  | 'cli'
  | 'fullstack'
  | 'monorepo'

/** Sinais mágicos usados para diagnosticar um projeto */
export type SinaisProjeto = {
  temPages?: boolean
  temComponents?: boolean
  temControllers?: boolean
  temApi?: boolean
  temExpress?: boolean
  temSrc?: boolean
  temCli?: boolean
  temPrisma?: boolean
  temPackages?: boolean
}

/** Diagnóstico final de um projeto */
export type DiagnosticoProjeto = {
  tipo: TipoProjeto
  sinais: Array<keyof SinaisProjeto>
  confiabilidade: number
}

/** Opções para escaneamento */
export type ScanOptions = {
  includeContent?: boolean
  includeAst?: boolean
}

/** Opções para execução da inquisição */
export type InquisicaoOptions = {
  includeContent?: boolean
  incluirMetadados?: boolean
}

/** Resultado consolidado de uma inquisição */
export type ResultadoInquisicao = {
  totalArquivos: number
  ocorrencias: Ocorrencia[]
  arquivosAnalisados: string[]
  timestamp: number
  duracaoMs: number
}