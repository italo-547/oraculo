import chalk from 'chalk';
import { config } from './cosmos.js';

// Exportamos símbolos/emojis em um único objeto para reutilização centralizada.
// Caso o terminal não suporte unicode adequadamente (win legados ou CI sem fontes),
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

function shouldSilence(): boolean {
  if (process.env.ORACULO_FORCE_SILENT_JSON === '1') return true;
  return config.REPORT_SILENCE_LOGS;
}

function isDebugMode(): boolean {
  return config.DEV_MODE || process.env.ORACULO_DEBUG === 'true';
}

function getTimestamp(): string {
  const now = new Date().toLocaleTimeString('pt-BR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `[${now}]`;
}

type Nivel = 'info' | 'sucesso' | 'erro' | 'aviso' | 'debug';

interface FormatOptions {
  nivel: Nivel;
  mensagem: string;
  // quando true (padrão), remove símbolos/emojis iniciais redundantes na mensagem
  sanitize?: boolean;
}

function stripLeadingSimbolos(msg: string): string {
  if (!msg) return msg;
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
  const candidatos = Array.from(new Set([...Object.values(LOG_SIMBOLOS), ...extras])).filter(
    Boolean,
  ) as string[];
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

function formatarLinha({ nivel, mensagem, sanitize = true }: FormatOptions): string {
  const ts = getTimestamp();
  const colNivelRaw = nivel.toUpperCase().padEnd(7);
  let cor: (s: string) => string = (s) => s;
  switch (nivel) {
    case 'info':
      cor = chalk.cyan;
      break;
    case 'sucesso':
      cor = chalk.green;
      break;
    case 'erro':
      cor = chalk.red;
      break;
    case 'aviso':
      cor = chalk.yellow;
      break;
    case 'debug':
      cor = chalk.magenta;
      break;
  }
  const colNivel = chalk.bold(cor(colNivelRaw));
  const corpo = sanitize ? stripLeadingSimbolos(mensagem) : mensagem;
  // Colorimos mensagens de destaque (erro/aviso/sucesso) para reforçar visibilidade.
  const corpoFmt = nivel === 'info' || nivel === 'debug' ? corpo : cor(corpo);
  return chalk.gray(ts) + ' ' + colNivel + ' ' + corpoFmt;
}

/**
 * Formata um bloco multi-linha com indentação consistente e moldura leve.
 * Útil para seções (fases) ou resumos compactos.
 */
export function formatarBloco(
  titulo: string,
  linhas: string[],
  corTitulo: (s: string) => string = chalk.bold,
): string {
  const width = Math.min(100, Math.max(titulo.length + 4, ...linhas.map((l) => l.length + 4), 20));
  const barra = '─'.repeat(Math.max(10, width - 2));
  const topo = '┌' + barra + '┐';
  const base = '└' + barra + '┘';
  const corpo = linhas.map((l) => '│ ' + l.padEnd(barra.length - 1, ' ') + '│').join('\n');
  const headTxt = '│ ' + titulo.padEnd(barra.length - 1, ' ') + '│';
  return [chalk.gray(topo), corTitulo(headTxt), chalk.gray(corpo), chalk.gray(base)]
    .filter(Boolean)
    .join('\n');
}

export function fase(titulo: string) {
  if (shouldSilence()) return;
  console.log(
    formatarLinha({
      nivel: 'info',
      mensagem: chalk.bold(`${LOG_SIMBOLOS.fase} ${titulo}`),
      sanitize: false,
    }),
  );
}

export function passo(descricao: string) {
  if (shouldSilence()) return;
  console.log(
    formatarLinha({
      nivel: 'info',
      mensagem: `${LOG_SIMBOLOS.passo} ${descricao}`,
      sanitize: false,
    }),
  );
}

export const log = {
  info(msg: string): void {
    if (shouldSilence()) return;
    console.log(formatarLinha({ nivel: 'info', mensagem: msg }));
  },

  sucesso(msg: string): void {
    if (shouldSilence()) return;
    console.log(formatarLinha({ nivel: 'sucesso', mensagem: msg }));
  },

  erro(msg: string): void {
    console.error(formatarLinha({ nivel: 'erro', mensagem: msg }));
  },

  aviso(msg: string): void {
    if (shouldSilence()) return;
    console.log(formatarLinha({ nivel: 'aviso', mensagem: msg }));
  },

  debug(msg: string): void {
    if (isDebugMode()) {
      console.log(formatarLinha({ nivel: 'debug', mensagem: msg }));
    }
  },
  fase,
  passo,
  bloco: formatarBloco,
  simbolos: LOG_SIMBOLOS,
};
