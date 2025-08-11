import { describe, it, expect } from 'vitest';
import {
  IntegridadeStatus,
  GuardianError,
  OcorrenciaNivel,
  Ocorrencia,
  Tecnica,
  AmbienteExecucao,
  ContextoExecucao,
  TipoProjeto,
  SinaisProjeto,
  DiagnosticoProjeto,
  ResultadoInquisicao,
  ResultadoInquisicaoCompleto,
  ScanOptions,
  InquisicaoOptions,
  Contador,
  Estatisticas,
  ResultadoCorrecao,
  ResultadoPoda,
  ArquivoFantasma,
  Pendencia,
  HistoricoItem,
  RelatorioCompacto,
  ComandoOraculo,
  OrigemArquivo,
  FileEntry,
  FileEntryWithAst,
  FileMap,
  FileMapWithAst,
} from './tipos.js';

describe('tipos.ts', () => {
  it('enum IntegridadeStatus deve conter valores esperados', () => {
    expect(IntegridadeStatus.Criado).toBe('baseline-criado');
    expect(IntegridadeStatus.Aceito).toBe('baseline-aceito');
    expect(IntegridadeStatus.Ok).toBe('ok');
    expect(IntegridadeStatus.AlteracoesDetectadas).toBe('alteracoes-detectadas');
  });

  it('GuardianError deve ser instanciável e conter detalhes', () => {
    const err = new GuardianError('erro');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('GuardianError');
    expect(err.detalhes).toBe('erro');
  });

  it('OcorrenciaNivel aceita valores válidos', () => {
    const nivel: OcorrenciaNivel = 'erro';
    expect(nivel).toBe('erro');
  });

  it('ComandoOraculo aceita valores válidos', () => {
    const cmd: ComandoOraculo = 'diagnosticar';
    expect(cmd).toBe('diagnosticar');
  });

  it('FileEntryWithAst estende FileEntry', () => {
    const entry: FileEntryWithAst = { relPath: 'a', fullPath: 'b', content: 'c', ast: undefined };
    expect(entry.relPath).toBe('a');
    expect(entry.ast).toBeUndefined();
  });

  it('DiagnosticoProjeto estrutura básica', () => {
    const diag: DiagnosticoProjeto = { tipo: 'cli', sinais: ['temCli'], confiabilidade: 1 };
    expect(diag.tipo).toBe('cli');
    expect(diag.sinais).toContain('temCli');
  });
});
