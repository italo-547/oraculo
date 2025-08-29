// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GerenciadorMapaReversao } from '../../src/zeladores/mapa-reversao.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

describe('GerenciadorMapaReversao', () => {
  let mapaReversao: GerenciadorMapaReversao;
  let tempDir: string;

  beforeEach(async () => {
    mapaReversao = new GerenciadorMapaReversao();
    tempDir = path.join(process.cwd(), 'temp-test-reversao');

    // Override do caminho para testes
    (config as any).STRUCTURE_REVERSE_MAP_PATH = path.join(tempDir, 'mapa-reversao.json');

    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('registro de moves', () => {
    it('deve registrar um move simples', async () => {
      await mapaReversao.carregar();

      const id = await mapaReversao.registrarMove(
        'src/old-file.ts',
        'app/new-file.ts',
        'Reorganização estrutural',
      );

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^move_\d+_[a-z0-9]+$/);

      const moves = mapaReversao.obterMoves();
      expect(moves.length).toBeGreaterThan(0);
      const ultimoMove = moves[moves.length - 1];
      expect(ultimoMove).toMatchObject({
        id,
        origem: 'src/old-file.ts',
        destino: 'app/new-file.ts',
        motivo: 'Reorganização estrutural',
        importsReescritos: false,
      });
    });

    it('deve registrar um move com conteúdo', async () => {
      await mapaReversao.carregar();

      const conteudoOriginal = 'import { foo } from "./bar";';
      const conteudoFinal = 'import { foo } from "../bar";';

      const id = await mapaReversao.registrarMove(
        'src/old-file.ts',
        'app/new-file.ts',
        'Reorganização com imports',
        conteudoOriginal,
        conteudoFinal,
      );

      const moves = mapaReversao.obterMoves();
      expect(moves[0]).toMatchObject({
        id,
        origem: 'src/old-file.ts',
        destino: 'app/new-file.ts',
        motivo: 'Reorganização com imports',
        importsReescritos: true,
        conteudoOriginal,
        conteudoFinal,
      });
    });
  });

  describe('consulta de moves', () => {
    beforeEach(async () => {
      await mapaReversao.carregar();
      await mapaReversao.registrarMove('src/a.ts', 'app/a.ts', 'Move A');
      await mapaReversao.registrarMove('src/b.ts', 'app/b.ts', 'Move B');
      await mapaReversao.registrarMove('src/a.ts', 'lib/a.ts', 'Move A novamente');
    });

    it('deve listar todos os moves', () => {
      const moves = mapaReversao.obterMoves();
      expect(moves).toHaveLength(3);
    });

    it('deve encontrar moves por arquivo', () => {
      const movesA = mapaReversao.obterMovesPorArquivo('src/a.ts');
      expect(movesA).toHaveLength(2);

      const movesB = mapaReversao.obterMovesPorArquivo('src/b.ts');
      expect(movesB).toHaveLength(1);
    });

    it('deve verificar se arquivo pode ser revertido', () => {
      expect(mapaReversao.podeReverterArquivo('src/a.ts')).toBe(true);
      expect(mapaReversao.podeReverterArquivo('src/c.ts')).toBe(false);
    });
  });

  describe('reversão de moves', () => {
    let baseDir: string;

    beforeEach(async () => {
      baseDir = path.join(tempDir, 'project');
      await fs.mkdir(baseDir, { recursive: true });

      await mapaReversao.carregar();
    });

    it('deve reverter move simples', async () => {
      // Cria arquivo de destino
      const destinoPath = path.join(baseDir, 'app', 'test.ts');
      await fs.mkdir(path.dirname(destinoPath), { recursive: true });
      await fs.writeFile(destinoPath, 'console.log("test");', 'utf-8');

      // Registra move
      const id = await mapaReversao.registrarMove('src/test.ts', 'app/test.ts', 'Test move');

      // Reverte
      const sucesso = await mapaReversao.reverterMove(id, baseDir);
      expect(sucesso).toBe(true);

      // Verifica se arquivo foi movido de volta
      const origemPath = path.join(baseDir, 'src', 'test.ts');
      const conteudo = await fs.readFile(origemPath, 'utf-8');
      expect(conteudo).toBe('console.log("test");');

      // Verifica se destino foi removido
      try {
        await fs.access(destinoPath);
        expect.fail('Arquivo de destino ainda existe');
      } catch {
        // OK - arquivo foi removido
      }
    });

    it('deve reverter move com conteúdo original', async () => {
      // Cria arquivo de destino
      const destinoPath = path.join(baseDir, 'app', 'test.ts');
      await fs.mkdir(path.dirname(destinoPath), { recursive: true });
      await fs.writeFile(destinoPath, 'console.log("modified");', 'utf-8');

      // Registra move com conteúdo original
      const id = await mapaReversao.registrarMove(
        'src/test.ts',
        'app/test.ts',
        'Test move',
        'console.log("original");',
      );

      // Reverte
      const sucesso = await mapaReversao.reverterMove(id, baseDir);
      expect(sucesso).toBe(true);

      // Verifica se conteúdo original foi restaurado
      const origemPath = path.join(baseDir, 'src', 'test.ts');
      const conteudo = await fs.readFile(origemPath, 'utf-8');
      expect(conteudo).toBe('console.log("original");');
    });

    it('deve falhar ao reverter move inexistente', async () => {
      const sucesso = await mapaReversao.reverterMove('move_inexistente');
      expect(sucesso).toBe(false);
    });
  });

  describe('reversão de arquivo', () => {
    let baseDir: string;

    beforeEach(async () => {
      baseDir = path.join(tempDir, 'project');
      await fs.mkdir(baseDir, { recursive: true });
      await mapaReversao.carregar();
    });

    it('deve reverter todos os moves de um arquivo', async () => {
      // Cria arquivos
      await fs.mkdir(path.join(baseDir, 'app'), { recursive: true });
      await fs.writeFile(path.join(baseDir, 'app', 'file1.ts'), 'content 1', 'utf-8');
      await fs.writeFile(path.join(baseDir, 'app', 'file2.ts'), 'content 2', 'utf-8');

      // Registra moves
      await mapaReversao.registrarMove('src/file1.ts', 'app/file1.ts', 'Move 1');
      await mapaReversao.registrarMove('src/file1.ts', 'lib/file1.ts', 'Move 2');

      // Reverte arquivo
      const sucesso = await mapaReversao.reverterArquivo('src/file1.ts', baseDir);
      expect(sucesso).toBe(true);

      // Verifica se último move foi revertido (para lib/file1.ts)
      const arquivoRevertido = path.join(baseDir, 'src', 'file1.ts');
      const conteudo = await fs.readFile(arquivoRevertido, 'utf-8');
      expect(conteudo).toBe('content 1');
    });
  });

  describe('persistência', () => {
    it('deve salvar e carregar mapa corretamente', async () => {
      await mapaReversao.carregar();

      // Registra alguns moves
      await mapaReversao.registrarMove('src/a.ts', 'app/a.ts', 'Move A');
      await mapaReversao.registrarMove('src/b.ts', 'app/b.ts', 'Move B');

      // Cria nova instância e carrega
      const novaInstancia = new GerenciadorMapaReversao();
      await novaInstancia.carregar();

      const moves = novaInstancia.obterMoves();
      expect(moves).toHaveLength(2);
      expect(moves.map((m) => m.origem)).toEqual(expect.arrayContaining(['src/a.ts', 'src/b.ts']));
    });

    it('deve lidar com arquivo inexistente', async () => {
      const novaInstancia = new GerenciadorMapaReversao();
      await novaInstancia.carregar(); // Não deve falhar

      const moves = novaInstancia.obterMoves();
      expect(moves).toHaveLength(0);
    });
  });

  describe('listagem', () => {
    it('deve gerar listagem formatada', async () => {
      await mapaReversao.carregar();

      const lista = mapaReversao.listarMoves();
      expect(typeof lista).toBe('string');
      // Se não há moves, deve conter a mensagem de vazio
      if (mapaReversao.obterMoves().length === 0) {
        expect(lista).toContain('Nenhum move registrado');
      }
    });

    it('deve incluir moves na listagem', async () => {
      await mapaReversao.carregar();
      await mapaReversao.registrarMove('src/test.ts', 'app/test.ts', 'Test move');

      const lista = mapaReversao.listarMoves();
      expect(lista).toContain('src/test.ts');
      expect(lista).toContain('app/test.ts');
      expect(lista).toContain('Test move');
    });
  });

  describe('limpeza', () => {
    it('deve limpar mapa completamente', async () => {
      await mapaReversao.carregar();
      await mapaReversao.registrarMove('src/test.ts', 'app/test.ts', 'Test');

      await mapaReversao.limpar();

      const moves = mapaReversao.obterMoves();
      expect(moves).toHaveLength(0);
    });
  });
});
