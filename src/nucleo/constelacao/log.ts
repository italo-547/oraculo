import chalk from 'chalk';
import { config } from './cosmos.js';

const icons = {
  info: '🥸',
  sucesso: '🥳',
  erro: '😰',
  aviso: '🥹',
  debug: '🥴',
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
}

function formatarLinha({ nivel, mensagem }: FormatOptions): string {
  const ts = getTimestamp();
  const colIcon = icons[nivel];
  const colNivel = nivel.toUpperCase().padEnd(7);
  let cor = (s: string) => s;
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
  return chalk.gray(ts) + ' ' + cor(colIcon) + ' ' + chalk.bold(colNivel) + ' ' + mensagem;
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
};
