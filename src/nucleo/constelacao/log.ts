import chalk from 'chalk';
import config from './cosmos.js';

const icons = {
  info: '🥸',
  sucesso: '🥳',
  erro: '😰',
  aviso: '🥹',
  debug: '🥴'
};

function shouldSilence(): boolean {
  return config.REPORT_SILENCE_LOGS === true;
}

function isDebugMode(): boolean {
  return config.DEV_MODE === true || process.env.ORACULO_DEBUG === 'true';
}

function getTimestamp(): string {
  const now = new Date().toLocaleTimeString('pt-BR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return chalk.gray(`[${now}]`);
}

export const log = {
  info(msg: string): void {
    if (!shouldSilence()) {
      console.log(`${getTimestamp()} ${chalk.cyan(icons.info)} ${msg}`);
    }
  },

  sucesso(msg: string): void {
    if (!shouldSilence()) {
      console.log(`${getTimestamp()} ${chalk.green(icons.sucesso)} ${msg}`);
    }
  },

  erro(msg: string): void {
    console.error(`${getTimestamp()} ${chalk.red(icons.erro)} ${msg}`);
  },

  aviso(msg: string): void {
    if (!shouldSilence()) {
      console.log(`${getTimestamp()} ${chalk.yellow(icons.aviso)} ${msg}`);
    }
  },

  debug(msg: string): void {
    if (isDebugMode()) {
      console.log(`${getTimestamp()} ${chalk.magenta(icons.debug)} ${msg}`);
    }
  }
};