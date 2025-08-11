import { describe, it, expect } from 'vitest';
import { gerarRelatorioEstrutura, AlinhamentoItem } from './relatorio-estrutura.js';

describe('gerarRelatorioEstrutura', () => {
    it('retorna mensagem de tudo certo se não houver desalinhados', () => {
        const mapa: AlinhamentoItem[] = [
            { arquivo: 'a.ts', atual: 'core', ideal: 'core' },
            { arquivo: 'b.ts', atual: 'infra', ideal: 'infra' },
        ];
        const relatorio = gerarRelatorioEstrutura(mapa);
        expect(relatorio).toMatch(/Tudo está em sua camada ideal/);
        expect(relatorio).toMatch(/# 📦 Estrutura verificada/);
    });

    it('relata arquivos desalinhados corretamente', () => {
        const mapa: AlinhamentoItem[] = [
            { arquivo: 'a.ts', atual: 'core', ideal: 'infra' },
            { arquivo: 'b.ts', atual: 'infra', ideal: 'infra' },
            { arquivo: 'c.ts', atual: 'app', ideal: 'core' },
        ];
        const relatorio = gerarRelatorioEstrutura(mapa);
        expect(relatorio).toMatch(/# 📦 Diagnóstico de Estrutura/);
        expect(relatorio).toMatch(/encontrados 2 arquivo/);
        expect(relatorio).toMatch(/- `a.ts` está em `core`, deveria estar em `infra`/);
        expect(relatorio).toMatch(/- `c.ts` está em `app`, deveria estar em `core`/);
        expect(relatorio).not.toMatch(/b.ts/);
    });
});
