import { log } from '../nucleo/constelacao/log.js';

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

  log.aviso(`\n🌘 Ei, só por um instante…`);
  if (madrugada) {
    log.aviso(`⏰ Já passa das ${hora}h. A cidade repousa… talvez seja hora de você também.`);
  }
  if (muitosArquivos) {
    log.aviso(`🗂️ Esse volume de tarefas pode esperar. O código não foge, mas a saúde sim.`);
  }
  log.aviso(`💙 Cuide-se. Uma pausa, uma água, um respiro — e amanhã seguimos mais leves.\n`);
}
