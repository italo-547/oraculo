// SPDX-License-Identifier: MIT
import path from 'node:path';
import { config } from '@nucleo/constelacao/cosmos.js';
/**
 * 📌 Caminho absoluto para o arquivo de baseline principal (usado pelo Sentinela).
 */
// Caminho do baseline: usa o fornecido pela config; fallback para .oraculo/baseline.json se ausente
const STATE_DIR_FALLBACK = config
    .ZELADOR_STATE_DIR ||
    config.ORACULO_STATE_DIR ||
    path.join(process.cwd(), '.oraculo');
const BASELINE_RELATIVE_FALLBACK = path.join(STATE_DIR_FALLBACK, 'baseline.json');
export const BASELINE_PATH = path.resolve(process.cwd(), config.GUARDIAN_BASELINE ||
    BASELINE_RELATIVE_FALLBACK);
/**
 * 📌 Caminho padrão para os registros da Vigia Oculta.
 */
// Caminho de registros: tolera ausência de ZELADOR_STATE_DIR em ambientes de teste/mocks
export const REGISTRO_VIGIA_CAMINHO_PADRAO = path.resolve(STATE_DIR_FALLBACK, 'integridade.json');
/**
 * 🧮 Algoritmo padrão utilizado para hashing de integridade.
 * (BLAKE3 é o padrão universal do Guardian.)
 */
export const ALGORITMO_HASH = 'blake3';
//# sourceMappingURL=constantes.js.map