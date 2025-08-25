import { config } from '../dist/nucleo/constelacao/cosmos.js';
import { log } from '../dist/nucleo/constelacao/log.js';

config.SUPPRESS_PARCIAL_LOGS = true;

log.info('Mensagem normal de info');
log.info('Diretórios escaneados (parcial): 5');
log.infoDestaque('Resumo parcial: várias entradas');
log.debug('Debug parcial teste');
log.sucesso('Operação concluída parcialmente');
log.aviso('Aviso parcial');
console.log('script end');
