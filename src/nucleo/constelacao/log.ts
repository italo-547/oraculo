import chalk from 'chalk';
import config from './cosmos';
const icons = {
    info: '🥸',
    sucesso: '🥳',
    erro: '😰',
    aviso: '🥹',
    debug: '🥴'
};
function shouldSilence() {
    return config.REPORT_SILENCE_LOGS === true;
}
function isDebugMode() {
    return config.DEV_MODE === true || process.env.ORACULO_DEBUG === 'true';
}
function getTimestamp() {
    const now = new Date().toLocaleTimeString('pt-BR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return chalk.gray(`[${now}]`);
}
export const log = {
    info(msg) {
        if (!shouldSilence()) {
            console.log(`${getTimestamp()} ${chalk.cyan(icons.info)} ${msg}`);
        }
    },
    sucesso(msg) {
        if (!shouldSilence()) {
            console.log(`${getTimestamp()} ${chalk.green(icons.sucesso)} ${msg}`);
        }
    },
    erro(msg) {
        console.error(`${getTimestamp()} ${chalk.red(icons.erro)} ${msg}`);
    },
    aviso(msg) {
        if (!shouldSilence()) {
            console.warn(`${getTimestamp()} ${chalk.yellow(icons.aviso)} ${msg}`);
        }
    },
    debug(msg) {
        if (isDebugMode()) {
            console.log(`${getTimestamp()} ${chalk.magenta(icons.debug)} ${msg}`);
        }
    }
};
export default log;
