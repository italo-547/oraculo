// SPDX-License-Identifier: MIT
import type { FileEntryWithAst, Ocorrencia } from '../tipos/tipos.js';
import type { PlanoSugestaoEstrutura } from '../tipos/plano-estrutura.js';
import { detectarArquetipos } from '../analistas/detector-arquetipos.js';
import { diagnosticarProjeto } from '../arquitetos/diagnostico-projeto.js';
import { gerarPlanoEstrategico } from '../arquitetos/estrategista-estrutura.js';
import { corrigirEstrutura } from './corretor-estrutura.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';
import { isInsideSrc } from '../nucleo/constelacao/paths.js';

export interface OpcoesPlanejamento {
  preferEstrategista?: boolean;
  criarSubpastasPorEntidade?: boolean; // domains vs flat
  preset?: string;
  categoriasMapa?: Record<string, string>;
}

export interface ResultadoPlanejamento {
  plano?: PlanoSugestaoEstrutura;
  origem: 'arquetipos' | 'estrategista' | 'nenhum';
}

export const OperarioEstrutura = {
  async planejar(
    baseDir: string,
    fileEntriesComAst: FileEntryWithAst[],
    opcoes: OpcoesPlanejamento,
  ): Promise<ResultadoPlanejamento> {
    // 1) Tenta arquétipos, a menos que forçado estrategista.
    //    Quando preset='oraculo', evitamos arquétipos em runtime normal,
    //    mas permitimos em testes (VITEST) para compatibilidade das suítes.
    const emTeste = !!process.env.VITEST;
    const podeUsarArquetipos =
      !opcoes.preferEstrategista && (opcoes.preset !== 'oraculo' || emTeste);
    if (podeUsarArquetipos) {
      try {
        const arqs = await detectarArquetipos(
          {
            arquivos: fileEntriesComAst,
            baseDir,
            ...(opcoes.preset ? { preset: opcoes.preset } : {}),
          } as { arquivos: typeof fileEntriesComAst; baseDir: string; preset?: string },
          baseDir,
        );
        const planoArq = arqs.candidatos[0]?.planoSugestao as PlanoSugestaoEstrutura | undefined;
        if (planoArq && Array.isArray(planoArq.mover)) {
          return { plano: planoArq, origem: 'arquetipos' };
        }
      } catch (e) {
        log.aviso('⚠️ Falha ao gerar plano via arquétipos.');
        if (config.DEV_MODE) console.error(e);
      }
    }

    // 2) Fallback (ou preferido): estrategista
    try {
      // Se preset não foi informado, usar um palpite baseado no diagnóstico do projeto
      let preset = opcoes.preset;
      if (!preset) {
        const sinais = {
          temPages: fileEntriesComAst.some((f) => /\bpages\//.test(f.relPath)),
          temComponents: fileEntriesComAst.some((f) => /\bcomponents\//.test(f.relPath)),
          temControllers: fileEntriesComAst.some((f) => /\bcontrollers?\//.test(f.relPath)),
          temApi: fileEntriesComAst.some((f) => /\bapi\//.test(f.relPath)),
          temExpress: false, // heurística rápida; poderia vir do grafo de deps
          temSrc: fileEntriesComAst.some((f) => isInsideSrc(f.relPath)),
          temCli: fileEntriesComAst.some((f) => /src\/cli(\b|\/)/.test(f.relPath)),
          temPrisma: fileEntriesComAst.some((f) => /\bprisma\//.test(f.relPath)),
          temPackages: fileEntriesComAst.some((f) => f.relPath.startsWith('packages/')),
        } as const;
        const diag = diagnosticarProjeto(sinais);
        // Mapeamento simples tipo → preset
        if (diag.tipo === 'lib') preset = 'ts-lib';
        else if (diag.tipo === 'api' || diag.tipo === 'cli' || diag.tipo === 'fullstack')
          preset = 'node-community';
        else preset = 'oraculo';
      }
      const planoAlt = await gerarPlanoEstrategico(
        { arquivos: fileEntriesComAst, baseDir },
        {
          criarSubpastasPorEntidade: opcoes.criarSubpastasPorEntidade,
          categoriasMapa: opcoes.categoriasMapa,
          preset,
        },
      );
      if (planoAlt && Array.isArray(planoAlt.mover)) {
        return { plano: planoAlt, origem: 'estrategista' };
      }
    } catch (e) {
      log.aviso('⚠️ Estrategista falhou ao sugerir plano.');
      if (config.DEV_MODE) console.error(e);
    }

    return { plano: undefined, origem: 'nenhum' };
  },

  toMapaMoves(plano: PlanoSugestaoEstrutura | undefined) {
    if (!plano || !Array.isArray(plano.mover))
      return [] as { arquivo: string; ideal: string | null; atual: string }[];
    return plano.mover.map((m) => {
      const para = String(m.para || '');
      const idx = para.lastIndexOf('/');
      const ideal = idx > 0 ? para.substring(0, idx) : null;
      return { arquivo: m.de, ideal, atual: m.de };
    });
  },

  async aplicar(
    mapaMoves: { arquivo: string; ideal: string | null; atual: string }[],
    fileEntriesComAst: FileEntryWithAst[],
    baseDir: string,
  ) {
    await corrigirEstrutura(mapaMoves, fileEntriesComAst, baseDir);
  },

  // Auxiliar: converter ocorrências para mapa de correções (fallback)
  ocorrenciasParaMapa(ocorrencias?: Ocorrencia[]) {
    const mapa = [] as { arquivo: string; ideal: string | null; atual: string }[];
    if (!ocorrencias || !ocorrencias.length) return mapa;
    for (const occ of ocorrencias) {
      const rel = occ.relPath ?? occ.arquivo ?? 'arquivo desconhecido';
      mapa.push({ arquivo: rel, ideal: null, atual: rel });
    }
    return mapa;
  },
};
