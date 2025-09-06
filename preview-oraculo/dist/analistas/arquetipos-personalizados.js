// SPDX-License-Identifier: MIT
/**
 * Sistema de Arquétipos Personalizados do Oráculo
 *
 * Permite que usuários criem arquétipos personalizados para seus projetos,
 * mantendo compatibilidade com arquétipos oficiais e oferecendo sugestões
 * de melhores práticas baseadas na personalização do usuário.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ARQUETIPOS } from '@analistas/arquetipos-defs.js';
import { log } from '@nucleo/constelacao/log.js';
import { lerEstado, salvarEstado } from '@zeladores/util/persistencia.js';
const ARQUETIPO_PERSONALIZADO_FILENAME = 'oraculo.repo.arquetipo.json';
/**
 * Carrega o arquétipo personalizado do projeto atual
 */
export async function carregarArquetipoPersonalizado(baseDir = process.cwd()) {
    const arquivoArquetipo = path.join(baseDir, ARQUETIPO_PERSONALIZADO_FILENAME);
    try {
        const arquetipo = await lerEstado(arquivoArquetipo, null);
        // Validação básica
        if (!arquetipo || !arquetipo.nome || !arquetipo.arquetipoOficial) {
            log.aviso(`⚠️ Arquétipo personalizado inválido em ${arquivoArquetipo}: nome ou arquetipoOficial ausente`);
            return null;
        }
        return arquetipo;
    }
    catch {
        // Arquivo não existe ou é inválido - isso é normal
        return null;
    }
}
/**
 * Salva um arquétipo personalizado
 */
export async function salvarArquetipoPersonalizado(arquetipo, baseDir = process.cwd()) {
    const arquetipoCompleto = {
        ...arquetipo,
        metadata: {
            criadoEm: new Date().toISOString(),
            versao: '1.0.0',
            notasUsuario: undefined,
        },
    };
    const arquivoArquetipo = path.join(baseDir, ARQUETIPO_PERSONALIZADO_FILENAME);
    await salvarEstado(arquivoArquetipo, arquetipoCompleto);
    log.sucesso(`✅ Arquétipo personalizado salvo em ${arquivoArquetipo}`);
}
/**
 * Verifica se existe um arquétipo personalizado
 */
export async function existeArquetipoPersonalizado(baseDir = process.cwd()) {
    const arquivoArquetipo = path.join(baseDir, ARQUETIPO_PERSONALIZADO_FILENAME);
    try {
        await fs.access(arquivoArquetipo);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Obtém o arquétipo oficial base para um arquétipo personalizado
 */
export function obterArquetipoOficial(arquetipoPersonalizado) {
    return ARQUETIPOS.find((arq) => arq.nome === arquetipoPersonalizado.arquetipoOficial) || null;
}
/**
 * Gera sugestões de criação de arquétipo personalizado quando projeto é desconhecido
 */
export function gerarSugestaoArquetipoPersonalizado(projetoDesconhecido) {
    const sugestao = `
🌟 Projeto personalizado detectado: "${projetoDesconhecido.nome}"

O Oráculo identificou uma estrutura de projeto que não corresponde a arquétipos oficiais,
mas você pode criar um arquétipo personalizado para receber sugestões otimizadas!

📁 Estrutura detectada:
${projetoDesconhecido.estruturaDetectada.map((dir) => `  • ${dir}`).join('\n')}

📄 Arquivos na raiz:
${projetoDesconhecido.arquivosRaiz
        .slice(0, 5)
        .map((file) => `  • ${file}`)
        .join('\n')}
${projetoDesconhecido.arquivosRaiz.length > 5 ? `  • ... e mais ${projetoDesconhecido.arquivosRaiz.length - 5} arquivos` : ''}

💡 Para criar seu arquétipo personalizado, execute:
   oraculo diagnosticar --criar-arquetipo

Isso criará um arquivo 'oraculo.repo.arquetipo.json' com base na estrutura atual,
que o Oráculo usará para oferecer sugestões personalizadas mantendo as melhores práticas.
`;
    return sugestao;
}
/**
 * Cria um template de arquétipo personalizado baseado na estrutura atual do projeto
 */
export function criarTemplateArquetipoPersonalizado(nomeProjeto, estruturaDetectada, arquivosRaiz, arquetipoSugerido = 'generico') {
    // Tenta inferir o tipo de projeto baseado na estrutura
    let arquetipoOficial = arquetipoSugerido;
    if (estruturaDetectada.some((dir) => dir.includes('commands') || dir.includes('events'))) {
        arquetipoOficial = 'bot';
    }
    else if (estruturaDetectada.some((dir) => dir.includes('controllers') || dir.includes('routes'))) {
        arquetipoOficial = 'api-rest-express';
    }
    else if (estruturaDetectada.some((dir) => dir.includes('pages') && dir.includes('api'))) {
        arquetipoOficial = 'fullstack';
    }
    else if (estruturaDetectada.some((dir) => dir.includes('cli'))) {
        arquetipoOficial = 'cli-modular';
    }
    // Identifica diretórios principais (não muito profundos)
    const diretoriosPrincipais = estruturaDetectada
        .filter((dir) => !dir.includes('/') || dir.split('/').length <= 2)
        .filter((dir) => !dir.startsWith('node_modules') && !dir.startsWith('.git'));
    // Identifica arquivos-chave na raiz
    const arquivosChave = arquivosRaiz
        .filter((file) => ['package.json', 'tsconfig.json', 'README.md', '.env.example'].includes(file) ||
        file.endsWith('.ts') ||
        file.endsWith('.js'))
        .slice(0, 5);
    return {
        nome: nomeProjeto,
        descricao: `Projeto personalizado: ${nomeProjeto}`,
        arquetipoOficial,
        estruturaPersonalizada: {
            diretorios: diretoriosPrincipais,
            arquivosChave,
            padroesNomenclatura: {
                // Padrões comuns baseados na estrutura detectada
                ...(estruturaDetectada.some((d) => d.includes('components')) && {
                    components: '*-component.*',
                }),
                ...(estruturaDetectada.some((d) => d.includes('utils')) && { utils: '*-util.*' }),
                ...(estruturaDetectada.some((d) => d.includes('test')) && { tests: '*.test.*' }),
            },
        },
        melhoresPraticas: {
            recomendado: ['src/', 'tests/', 'docs/', 'README.md', '.env.example'],
            evitar: ['temp/', 'cache/', '*.log'],
            notas: [
                'Mantenha código fonte organizado em src/',
                'Separe testes em pasta dedicada',
                'Documente APIs e funcionalidades importantes',
            ],
        },
    };
}
/**
 * Valida um arquétipo personalizado
 */
export function validarArquetipoPersonalizado(arquetipo) {
    const erros = [];
    if (!arquetipo.nome || typeof arquetipo.nome !== 'string') {
        erros.push('Nome do projeto é obrigatório');
    }
    if (!arquetipo.arquetipoOficial || typeof arquetipo.arquetipoOficial !== 'string') {
        erros.push('Arquétipo oficial base é obrigatório');
    }
    else {
        // Verifica se o arquétipo oficial existe
        const arquetipoOficial = ARQUETIPOS.find((arq) => arq.nome === arquetipo.arquetipoOficial);
        if (!arquetipoOficial) {
            erros.push(`Arquétipo oficial '${arquetipo.arquetipoOficial}' não encontrado. Use: ${ARQUETIPOS.map((a) => a.nome).join(', ')}`);
        }
    }
    if (!arquetipo.estruturaPersonalizada) {
        erros.push('Estrutura personalizada é obrigatória');
    }
    else {
        if (!Array.isArray(arquetipo.estruturaPersonalizada.diretorios)) {
            erros.push('Diretórios devem ser um array');
        }
        if (!Array.isArray(arquetipo.estruturaPersonalizada.arquivosChave)) {
            erros.push('Arquivos-chave devem ser um array');
        }
    }
    return {
        valido: erros.length === 0,
        erros,
    };
}
/**
 * Lista todos os arquétipos oficiais disponíveis
 */
export function listarArquetiposOficiais() {
    return ARQUETIPOS;
}
/**
 * Integra arquétipo personalizado com oficial para sugestões
 */
export function integrarArquetipos(personalizado, oficial) {
    return {
        ...oficial,
        nome: personalizado.nome,
        descricao: personalizado.descricao || oficial.descricao,
        requiredDirs: personalizado.estruturaPersonalizada.diretorios,
        optionalDirs: oficial.optionalDirs,
        rootFilesAllowed: personalizado.estruturaPersonalizada.arquivosChave,
        // Mantém outras propriedades do oficial como base
        forbiddenDirs: oficial.forbiddenDirs,
        dependencyHints: oficial.dependencyHints,
        filePresencePatterns: oficial.filePresencePatterns,
        pesoBase: oficial.pesoBase,
    };
}
//# sourceMappingURL=arquetipos-personalizados.js.map