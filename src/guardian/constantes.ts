import path from 'node:path';
import { config } from '../nucleo/constelacao/cosmos.js';
/**
 * 📌 Caminho absoluto para o arquivo de baseline principal (usado pelo Sentinela).
 */
export const BASELINE_PATH = path.resolve(process.cwd(), config.GUARDIAN_BASELINE);
/**
 * 📌 Caminho padrão para os registros da Vigia Oculta.
 */
export const REGISTRO_VIGIA_CAMINHO_PADRAO = path.resolve(config.ZELADOR_STATE_DIR, 'integridade.json');
/**
 * 🧮 Algoritmo padrão utilizado para hashing de integridade.
 * (BLAKE3 é o padrão universal do Guardian.)
 */
export const ALGORITMO_HASH = 'blake3';
