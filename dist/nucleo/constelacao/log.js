// SPDX-License-Identifier: MIT
import chalk from './chalk-safe.js';
import { config } from './cosmos.js';
// Exportamos símbolos/emojis em um único objeto para reutilização centralizada.
// Caso o terminal não suporte unicode adequadamente (Windows antigos ou CI sem fontes),
// podemos degradar para alternativas ASCII leves.
const UNICODE_OK = process.env.ORACULO_NO_UNICODE !== '1';
export const LOG_SIMBOLOS = {
    // Ícone de info evitamos emoji para não quebrar em editores/terminais Windows
    info: 'i',
    sucesso: UNICODE_OK ? '🥳' : 'ok',
    erro: UNICODE_OK ? '😰' : 'x',
    // Ícone de aviso também simplificado para ASCII seguro
    aviso: '! ',
    debug: UNICODE_OK ? '🥴' : 'dbg',
    fase: UNICODE_OK ? '🔶' : '::',
    passo: UNICODE_OK ? '▫️' : ' -',
    scan: UNICODE_OK ? '🔍' : 'scan',
    guardian: UNICODE_OK ? '🛡️' : 'guard',
    pasta: UNICODE_OK ? '📂' : 'dir',
};
function shouldSilence() {
    if (process.env.ORACULO_FORCE_SILENT_JSON === '1')
        return true;
    return config.REPORT_SILENCE_LOGS;
}
function shouldSuppressParcial(msg) {
    try {
        // Permite override rápido via variável de ambiente curta ORACULO_SUPPRESS_PARCIAL=1
        if (!config.SUPPRESS_PARCIAL_LOGS && process.env.ORACULO_SUPPRESS_PARCIAL !== '1')
            return false;
        if (!msg || typeof msg !== 'string')
            return false;
        // Suprime quando substring 'parcial' (case-insensitive) aparece em qualquer lugar.
        // Isso cobre 'parcial' e variações como 'parcialmente'.
        return /parcial/i.test(msg);
    }
    catch {
        return false;
    }
}
function isDebugMode() {
    return config.DEV_MODE || process.env.ORACULO_DEBUG === 'true';
}
function getTimestamp() {
    const now = new Date().toLocaleTimeString('pt-BR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    return `[${now}]`;
}
function stripLeadingSimbolos(msg) {
    if (!msg)
        return msg;
    const ansiRegex = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    // Remove ANSI para avaliar início; manteremos saída sem estilos
    let plain = msg.replace(ansiRegex, '');
    // Normaliza quebras e espaços iniciais
    plain = plain.replace(/^\s+/, '');
    // candidatos: símbolos do mapa + extras frequentes usados em mensagens
    const extras = [
        '⚠️',
        '✨',
        '✅',
        '❌',
        '🔒',
        '🛡️',
        '🔍',
        '🔎',
        '📄',
        '📂',
        '🏗️',
        '🧼',
        '📊',
        'ℹ️',
        '▫️',
        '🔶',
        '🥸',
        '🥳',
        '🥹',
        '🥴',
    ];
    const candidatos = Array.from(new Set([...Object.values(LOG_SIMBOLOS), ...extras])).filter(Boolean);
    let mudou = true;
    while (mudou) {
        mudou = false;
        const trimmed = plain.trimStart();
        for (const s of candidatos) {
            if (trimmed.startsWith(s)) {
                plain = trimmed.slice(s.length);
                mudou = true;
                break;
            }
        }
    }
    // Espaços remanescentes após remoção
    return plain.trimStart();
}
function formatarLinha({ nivel, mensagem, sanitize = true }) {
    const ts = getTimestamp();
    const colNivelRaw = nivel.toUpperCase().padEnd(7);
    // Resolver possíveis formas do 'chalk' (função ou objeto mockado com .bold)
    const hasBold = (v) => !!v && typeof v.bold === 'function';
    const resolveStyle = (v) => {
        if (typeof v === 'function')
            return v;
        if (hasBold(v))
            return v.bold;
        return (s) => String(s);
    };
    let cor = (s) => s;
    switch (nivel) {
        case 'info':
            cor = resolveStyle(chalk.cyan);
            break;
        case 'sucesso':
            cor = resolveStyle(chalk.green);
            break;
        case 'erro':
            cor = resolveStyle(chalk.red);
            break;
        case 'aviso':
            cor = resolveStyle(chalk.yellow);
            break;
        case 'debug':
            cor = resolveStyle(chalk.magenta);
            break;
    }
    const boldFn = resolveStyle(chalk.bold);
    const colNivel = boldFn(colNivelRaw);
    const corpo = sanitize ? stripLeadingSimbolos(mensagem) : mensagem;
    // Colorimos mensagens de destaque (erro/aviso/sucesso) para reforçar visibilidade.
    const corpoFmt = nivel === 'info' || nivel === 'debug' ? corpo : cor(corpo);
    const grayFn = typeof chalk.gray === 'function' ? chalk.gray : (s) => String(s);
    const linha = grayFn(ts) + ' ' + colNivel + ' ' + corpoFmt;
    // Centraliza linhas soltas somente com opt-in explícito (ORACULO_CENTER=1)
    if (!process.env.VITEST && process.env.ORACULO_CENTER === '1') {
        try {
            const cols = obterColunasTerm();
            const out = process.stdout && typeof process.stdout.isTTY !== 'undefined'
                ? process.stdout
                : undefined;
            const isTty = !!out && out.isTTY !== false;
            if (isTty && cols && cols > 0) {
                const ANSI_REGEX = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
                const visLen = (s) => (s || '').replace(ANSI_REGEX, '').length;
                const pad = Math.floor(Math.max(0, cols - visLen(linha)) / 2);
                if (pad > 0)
                    return ' '.repeat(pad) + linha;
            }
        }
        catch {
            // Se centralização falhar, retorna linha normal
        }
    }
    return linha;
}
/**
 * Formata um bloco multi-linha com indentação consistente e moldura leve.
 * Útil para seções (fases) ou resumos compactos.
 */
function obterColunasTerm() {
    // Tenta obter largura do terminal de forma segura
    try {
        const out = process.stdout && typeof process.stdout.columns !== 'undefined'
            ? process.stdout
            : undefined;
        const cols = out?.columns;
        if (typeof cols === 'number' && cols > 0)
            return cols;
    }
    catch { }
    // Permite override explícito via env e fallback de variáveis comuns
    const envOverride = Number(process.env.ORACULO_FRAME_MAX_COLS || '0');
    if (Number.isFinite(envOverride) && envOverride > 0)
        return envOverride;
    const envCols = Number(process.env.COLUMNS || process.env.TERM_COLUMNS || '0');
    return Number.isFinite(envCols) && envCols > 0 ? envCols : undefined;
}
function calcularLarguraInterna(titulo, linhas, larguraMax) {
    const ANSI_REGEX = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    const visLen = (s) => (s || '').replace(ANSI_REGEX, '').length;
    // Largura desejada pelo conteúdo, com teto padrão (100) caso não especificado
    const desejada = Math.min(100, Math.max(visLen(titulo) + 4, ...linhas.map((l) => visLen(l) + 4), 20));
    const preferida = typeof larguraMax === 'number' ? Math.max(20, Math.min(larguraMax, 120)) : desejada;
    // Limite superior pela largura do terminal (responsivo)
    const cols = obterColunasTerm();
    const tetoTela = typeof cols === 'number' && cols > 0 ? Math.max(20, Math.min(cols, 120)) : 120;
    const width = Math.max(20, Math.min(preferida, tetoTela));
    const barraLen = Math.max(10, width - 2);
    const maxInner = barraLen - 1;
    return { width, maxInner, visLen, ANSI_REGEX };
}
export function formatarBloco(titulo, linhas, corTitulo = typeof chalk.bold === 'function' ? chalk.bold : (s) => String(s), larguraMax) {
    // Utilitários conscientes de ANSI para medir/compor por largura visível
    const { width, maxInner, visLen, ANSI_REGEX } = calcularLarguraInterna(titulo, linhas, larguraMax);
    const padEndVisible = (s, target) => {
        const diff = target - visLen(s);
        return diff > 0 ? s + ' '.repeat(diff) : s;
    };
    const truncateVisible = (s, max) => {
        if (visLen(s) <= max)
            return s;
        // Preserva sequências ANSI, contando apenas largura visível
        let out = '';
        let count = 0;
        let i = 0;
        while (i < s.length && count < max - 1) {
            const ch = s[i];
            if (ch === '\u001B' || ch === '\u009B') {
                // Copia sequência ANSI inteira
                const m = s.slice(i).match(ANSI_REGEX);
                if (m && m.index === 0) {
                    out += m[0];
                    i += m[0].length;
                    continue;
                }
            }
            out += ch;
            i++;
            count++;
        }
        return out + '…';
    };
    const barra = '─'.repeat(Math.max(10, width - 2));
    const topo = '┌' + barra + '┐';
    const base = '└' + barra + '┘';
    const normalizar = (s) => truncateVisible(s, maxInner);
    const corpo = linhas.map((l) => '│ ' + padEndVisible(normalizar(l), maxInner) + '│').join('\n');
    const headTxt = '│ ' + padEndVisible(normalizar(titulo), maxInner) + '│';
    // Garantir que corTitulo funciona mesmo quando mockado como objeto
    const corTituloFn = typeof corTitulo === 'function' ? corTitulo : (s) => String(s);
    const gray = typeof chalk.gray === 'function' ? chalk.gray : (x) => String(x);
    return [gray(topo), corTituloFn(headTxt), gray(corpo), gray(base)].filter(Boolean).join('\n');
}
// Fallback opcional de moldura ASCII (evita mojibake em redirecionamentos no Windows)
function deveUsarAsciiFrames() {
    return process.env.ORACULO_ASCII_FRAMES === '1';
}
function converterMolduraParaAscii(bloco) {
    return bloco
        .replaceAll('┌', '+')
        .replaceAll('┐', '+')
        .replaceAll('└', '+')
        .replaceAll('┘', '+')
        .replaceAll('─', '-')
        .replaceAll('│', '|');
}
export function fase(titulo) {
    if (shouldSilence())
        return;
    const bold = typeof chalk.bold === 'function' ? chalk.bold : (s) => String(s);
    const cyan = typeof chalk.cyan === 'function' ? chalk.cyan : (s) => String(s);
    console.log(formatarLinha({
        nivel: 'info',
        mensagem: bold(cyan(`${LOG_SIMBOLOS.fase} ${titulo}`)),
        sanitize: false,
    }));
}
export function passo(descricao) {
    if (shouldSilence())
        return;
    console.log(formatarLinha({
        nivel: 'info',
        mensagem: `${LOG_SIMBOLOS.passo} ${descricao}`,
        sanitize: false,
    }));
}
export const log = {
    info(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        console.log(formatarLinha({ nivel: 'info', mensagem: msg }));
    },
    // Variante de INFO que preserva estilos/cores inline (sem sanitização de símbolos),
    // útil para alinhar colunas mantendo números coloridos.
    infoSemSanitizar(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        console.log(formatarLinha({ nivel: 'info', mensagem: msg, sanitize: false }));
    },
    // Mensagem INFO com corpo estilizado (negrito + azul) e sem sanitização,
    // preservando cores dentro do corpo. Útil para títulos curtos e resumos.
    infoDestaque(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        const bold = typeof chalk.bold === 'function' ? chalk.bold : (s) => String(s);
        const cyan = typeof chalk.cyan === 'function' ? chalk.cyan : (s) => String(s);
        console.log(formatarLinha({ nivel: 'info', mensagem: bold(cyan(msg)), sanitize: false }));
    },
    sucesso(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        console.log(formatarLinha({ nivel: 'sucesso', mensagem: msg }));
    },
    erro(msg) {
        console.error(formatarLinha({ nivel: 'erro', mensagem: msg }));
    },
    aviso(msg) {
        if (shouldSilence())
            return;
        if (shouldSuppressParcial(msg))
            return;
        console.log(formatarLinha({ nivel: 'aviso', mensagem: msg }));
    },
    debug(msg) {
        if (isDebugMode()) {
            if (shouldSuppressParcial(msg))
                return;
            console.log(formatarLinha({ nivel: 'debug', mensagem: msg }));
        }
    },
    fase,
    passo,
    bloco: formatarBloco,
    calcularLargura(titulo, linhas, larguraMax) {
        return calcularLarguraInterna(titulo, linhas, larguraMax).width;
    },
    // Imprime um bloco moldurado diretamente (sem prefixo de logger) e com fallback ASCII opcional
    imprimirBloco(titulo, linhas, corTitulo = typeof chalk.bold === 'function' ? chalk.bold : (s) => String(s), larguraMax) {
        if (shouldSilence())
            return;
        // Suprime blocos que contenham a palavra 'parcial' quando configurado
        if (config.SUPPRESS_PARCIAL_LOGS) {
            if (shouldSuppressParcial(titulo))
                return;
            for (const l of linhas)
                if (shouldSuppressParcial(l))
                    return;
        }
        const bloco = formatarBloco(titulo, linhas, corTitulo, larguraMax);
        const out = deveUsarAsciiFrames() ? converterMolduraParaAscii(bloco) : bloco;
        // Centraliza o bloco somente com opt-in explícito (ORACULO_CENTER=1)
        if (!process.env.VITEST && process.env.ORACULO_CENTER === '1') {
            try {
                const lines = out.split('\n');
                if (!lines.length) {
                    console.log(out);
                    return;
                }
                // mede largura visível da moldura (linha do topo)
                const ANSI_REGEX = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
                const visibleLen = (s) => s.replace(ANSI_REGEX, '').length;
                const frameWidth = Math.max(...lines.map((l) => visibleLen(l)));
                const cols = obterColunasTerm() || 0;
                const outStream = process.stdout && typeof process.stdout.isTTY !== 'undefined'
                    ? process.stdout
                    : undefined;
                const isTty = !!outStream && outStream.isTTY !== false;
                if (isTty) {
                    const pad = Math.floor(Math.max(0, cols - frameWidth) / 2);
                    if (pad > 0) {
                        const pref = ' '.repeat(pad);
                        console.log(lines.map((l) => pref + l).join('\n'));
                        return;
                    }
                }
            }
            catch {
                // Se centralização falhar, imprime normalmente
            }
        }
        console.log(out);
    },
    simbolos: LOG_SIMBOLOS,
};
//# sourceMappingURL=log.js.map