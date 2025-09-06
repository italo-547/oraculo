// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { log } from '@nucleo/constelacao/log.js';
import { config } from '@nucleo/constelacao/cosmos.js';
import { lerEstado, salvarEstado } from '@zeladores/util/persistencia.js';
function getMapaPath() {
    return (config && config.STRUCTURE_REVERSE_MAP_PATH) || '.oraculo/mapa-reversao.json';
}
export class GerenciadorMapaReversao {
    mapa;
    constructor() {
        this.mapa = {
            versao: '1.0.0',
            moves: [],
            metadata: {
                totalMoves: 0,
                ultimoMove: '',
                podeReverter: true,
            },
        };
    }
    /**
     * Carrega o mapa de reversão do disco
     */
    async carregar() {
        try {
            const pathMapa = getMapaPath();
            this.mapa = (await lerEstado(pathMapa, null)) ?? {
                versao: '1.0.0',
                moves: [],
                metadata: { totalMoves: 0, ultimoMove: '', podeReverter: true },
            };
            // Validação básica
            if (!this.mapa.moves || !Array.isArray(this.mapa.moves)) {
                throw new Error('Mapa de reversão corrompido');
            }
            log.info(`📋 Mapa de reversão carregado: ${this.mapa.moves.length} moves registrados`);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // Não persistimos automaticamente um mapa vazio ao carregar: evitar efeitos colaterais
                // (ex.: chamada a fs.mkdir) durante operações que apenas consultam o mapa.
                log.info('📋 Nenhum mapa de reversão encontrado, iniciando novo');
            }
            else {
                log.erro(`❌ Erro ao carregar mapa de reversão: ${error.message}`);
                // Reinicia com mapa vazio em caso de erro
                this.mapa = {
                    versao: '1.0.0',
                    moves: [],
                    metadata: {
                        totalMoves: 0,
                        ultimoMove: '',
                        podeReverter: true,
                    },
                };
            }
        }
    }
    /**
     * Salva o mapa de reversão no disco
     */
    async salvar() {
        try {
            const pathMapa = getMapaPath();
            await fs.mkdir(path.dirname(pathMapa), { recursive: true });
            await salvarEstado(pathMapa, this.mapa);
            log.info(`💾 Mapa de reversão salvo: ${this.mapa.moves.length} moves`);
        }
        catch (error) {
            log.erro(`❌ Erro ao salvar mapa de reversão: ${error.message}`);
        }
    }
    /**
     * Registra um novo move no mapa de reversão
     */
    async registrarMove(origem, destino, motivo, conteudoOriginal, conteudoFinal, 
    // quando true, evita persistir o mapa no disco imediatamente (útil para chamadas em massa/tests)
    skipSalvar) {
        const id = `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const move = {
            id,
            timestamp: new Date().toISOString(),
            origem,
            destino,
            motivo,
            // Considera que imports foram reescritos se houver conteúdo original
            // fornecido (testes esperam que passar conteudoOriginal permita restauração)
            importsReescritos: !!conteudoOriginal || (!!conteudoFinal && conteudoOriginal !== conteudoFinal),
            conteudoOriginal,
            conteudoFinal,
        };
        this.mapa.moves.push(move);
        this.mapa.metadata.totalMoves = this.mapa.moves.length;
        this.mapa.metadata.ultimoMove = move.timestamp;
        // Persiste no disco por padrão; caller pode optar por adiar a persistência
        if (!skipSalvar) {
            await this.salvar();
        }
        log.info(`📝 Move registrado: ${origem} → ${destino} (${motivo})`);
        return id;
    }
    /**
     * Remove um move do mapa de reversão
     */
    async removerMove(id) {
        const indice = this.mapa.moves.findIndex((move) => move.id === id);
        if (indice === -1) {
            return false;
        }
        this.mapa.moves.splice(indice, 1);
        this.mapa.metadata.totalMoves = this.mapa.moves.length;
        await this.salvar();
        log.info(`🗑️ Move removido do mapa: ${id}`);
        return true;
    }
    /**
     * Obtém todos os moves registrados
     */
    obterMoves() {
        return [...this.mapa.moves];
    }
    /**
     * Obtém moves por arquivo
     */
    obterMovesPorArquivo(arquivo) {
        return this.mapa.moves.filter((move) => move.origem === arquivo || move.destino === arquivo);
    }
    /**
     * Verifica se um arquivo pode ser revertido
     */
    podeReverterArquivo(arquivo) {
        const moves = this.obterMovesPorArquivo(arquivo);
        return moves.length > 0;
    }
    /**
     * Reverte um move específico
     */
    async reverterMove(id, baseDir = process.cwd()) {
        const move = this.mapa.moves.find((m) => m.id === id);
        if (!move) {
            log.erro(`❌ Move não encontrado: ${id}`);
            return false;
        }
        try {
            // Verifica se o arquivo de destino ainda existe
            const destinoPath = path.join(baseDir, move.destino);
            const origemPath = path.join(baseDir, move.origem);
            try {
                await fs.access(destinoPath);
            }
            catch {
                log.erro(`❌ Arquivo de destino não encontrado: ${move.destino}`);
                return false;
            }
            // Verifica se o diretório de origem existe
            await fs.mkdir(path.dirname(origemPath), { recursive: true });
            // Verifica se já existe arquivo na origem
            try {
                await fs.access(origemPath);
                log.aviso(`⚠️ Arquivo já existe na origem: ${move.origem}`);
                return false;
            }
            catch {
                // OK, origem está livre
            }
            // Move o arquivo de volta
            if (move.importsReescritos && move.conteudoOriginal) {
                // Se os imports foram reescritos, usa o conteúdo original
                await fs.writeFile(origemPath, move.conteudoOriginal, 'utf-8');
                await fs.unlink(destinoPath);
                log.sucesso(`↩️ Arquivo revertido com conteúdo original: ${move.destino} → ${move.origem}`);
            }
            else {
                // Move simples
                await fs.rename(destinoPath, origemPath);
                log.sucesso(`↩️ Arquivo revertido: ${move.destino} → ${move.origem}`);
            }
            // Remove o move do mapa
            await this.removerMove(id);
            return true;
        }
        catch (error) {
            log.erro(`❌ Erro ao reverter move: ${error.message}`);
            return false;
        }
    }
    /**
     * Reverte todos os moves de um arquivo
     */
    async reverterArquivo(arquivo, baseDir = process.cwd()) {
        const moves = this.obterMovesPorArquivo(arquivo);
        if (moves.length === 0) {
            log.aviso(`⚠️ Nenhum move encontrado para: ${arquivo}`);
            return false;
        }
        // Reverte do mais recente para o mais antigo
        const movesOrdenados = moves.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Retorna true se pelo menos um move foi revertido com sucesso
        let revertedCount = 0;
        for (const move of movesOrdenados) {
            const resultado = await this.reverterMove(move.id, baseDir);
            if (resultado)
                revertedCount += 1;
        }
        return revertedCount > 0;
    }
    /**
     * Lista moves em formato legível
     */
    listarMoves() {
        if (this.mapa.moves.length === 0) {
            return '📋 Nenhum move registrado no mapa de reversão.';
        }
        let resultado = `📋 Mapa de Reversão (${this.mapa.moves.length} moves):\n\n`;
        // Ordena por timestamp (mais recente primeiro)
        const movesOrdenados = [...this.mapa.moves].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        for (const move of movesOrdenados) {
            const data = new Date(move.timestamp).toLocaleString('pt-BR');
            const reescritos = move.importsReescritos ? ' (imports reescritos)' : '';
            resultado += `${move.id}:\n`;
            resultado += `  📅 ${data}\n`;
            resultado += `  📁 ${move.origem} → ${move.destino}\n`;
            resultado += `  💬 ${move.motivo}${reescritos}\n\n`;
        }
        return resultado;
    }
    /**
     * Limpa o mapa de reversão
     */
    async limpar() {
        this.mapa.moves = [];
        this.mapa.metadata.totalMoves = 0;
        this.mapa.metadata.ultimoMove = '';
        await this.salvar();
        log.info('🧹 Mapa de reversão limpo');
    }
}
// Instância global
export const mapaReversao = new GerenciadorMapaReversao();
//# sourceMappingURL=mapa-reversao.js.map