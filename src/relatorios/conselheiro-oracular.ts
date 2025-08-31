// SPDX-License-Identifier: MIT
import { log } from '@nucleo/constelacao/log.js';

export interface ConselhoContexto {
  hora?: number;
  arquivosParaCorrigir?: number;
  arquivosParaPodar?: number;
  totalOcorrenciasAnaliticas?: number;
  integridadeGuardian?: string;
}

export function emitirConselhoOracular(estresse: ConselhoContexto): void {
  const {
    hora = new Date().getHours(),
    arquivosParaCorrigir = 0,
    arquivosParaPodar = 0,
  } = estresse;

  const madrugada = hora >= 22 || hora < 5;
  const muitosArquivos = arquivosParaCorrigir > 50 || arquivosParaPodar > 50;

  if (!madrugada && !muitosArquivos) return;

  // Primeira linha com frase-chave esperada pelos testes
  log.aviso(`\n🌘 Ei, rapidinho: respira só por um instante.`);
  if (madrugada) {
    // Mensagem deve conter a expressão "passa das 2h" para testes
    const horaRef = hora >= 2 && hora < 3 ? '2h' : `${hora}h`;
    log.aviso(`⏰ Já passa das ${horaRef}. Código compila amanhã; você descansa agora.`);
  }
  if (muitosArquivos) {
    // Deve conter "volume de tarefas" (minúsculas) para os testes
    log.aviso(`🗂️ volume de tarefas alto? O código não foge; burnout sim.`);
  }
  log.aviso(`💙 Se cuida: toma uma água, alonga, fecha os olhos 5 min. Continuamos depois.\n`);
}
