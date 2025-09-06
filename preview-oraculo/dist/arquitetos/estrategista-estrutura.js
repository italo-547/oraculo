// SPDX-License-Identifier: MIT
import path from 'node:path';
import { carregarConfigEstrategia, destinoPara, deveIgnorar, normalizarRel, } from '@zeladores/util/estrutura.js';
/**
 * Estrategista/Planejador de Estrutura
 *
 * Responsável por: dado o conjunto de arquivos e um catálogo de arquétipos,
 * sugerir um plano de reorganização (mover arquivos) com base em regras de nomeação
 * e diretórios-alvo padronizados. Não aplica mudanças no disco (apenas sugere).
 *
 * Domínio ideal: arquitetos (diagnóstico/planejamento). A execução fica com zeladores.
 */
export async function gerarPlanoEstrategico(contexto, opcoes = {}) {
    const cfg = await carregarConfigEstrategia(contexto.baseDir, opcoes);
    const mover = [];
    const conflitos = [];
    // Estratégia atual: heurística de nomeação + config/preset (sem consultar arquétipos aqui para evitar ciclos)
    const rels = contexto.arquivos.map((f) => normalizarRel(f.relPath));
    for (const rel of rels) {
        if (deveIgnorar(rel, cfg.ignorarPastas))
            continue;
        // Evitar mexer em arquivos fora do escopo de código (por agora)
        if (!rel.endsWith('.ts') && !rel.endsWith('.js'))
            continue;
        // Respeita convenções de ferramentas no root: não mover configs globais
        const base = path.posix.basename(rel);
        if (/^(eslint|vitest)\.config\.[jt]s$/i.test(base))
            continue;
        const res = destinoPara(rel, cfg.raizCodigo, cfg.criarSubpastasPorEntidade, cfg.categoriasMapa);
        if (!res.destinoDir)
            continue;
        // Mantém o mesmo nome do arquivo; apenas move para pasta de destino
        const destino = path.posix.join(res.destinoDir, path.posix.basename(rel));
        // Conflito se já existe arquivo listado ou presente no filesystem
        let destinoExiste = rels.includes(destino);
        if (!destinoExiste) {
            try {
                const abs = path.join(contexto.baseDir, destino.replace(/\\/g, '/'));
                // fs.statSync usado de forma segura; se falhar, considera inexistente
                require('node:fs').statSync(abs);
                destinoExiste = true;
            }
            catch {
                destinoExiste = false;
            }
        }
        if (destinoExiste) {
            conflitos.push({ alvo: destino, motivo: 'destino já existe' });
            continue;
        }
        mover.push({ de: rel, para: destino, motivo: res.motivo });
    }
    // Deduplicação simples
    const seen = new Set();
    const moverFiltrado = mover.filter((m) => {
        const k = `${m.de}→${m.para}`;
        if (seen.has(k))
            return false;
        seen.add(k);
        return true;
    });
    return {
        mover: moverFiltrado,
        conflitos,
        resumo: {
            total: moverFiltrado.length + conflitos.length,
            zonaVerde: moverFiltrado.length,
            bloqueados: conflitos.length,
        },
    };
}
export const EstrategistaEstrutura = {
    nome: 'estrategista-estrutura',
    gerarPlano: gerarPlanoEstrategico,
};
//# sourceMappingURL=estrategista-estrutura.js.map