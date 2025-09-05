// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { alinhamentoEstrutural } from '../../src/arquitetos/analista-estrutura.js';
vi.mock('p-limit', () => ({ default: (n: number) => (fn: any) => fn() }));
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({ config: {} }));

describe('alinhamentoEstrutural', () => {
  it('retorna ideal nulo se não houver match', async () => {
    const arquivos = [{ relPath: 'outro/sem-match.ts' }];
    const resultado = await alinhamentoEstrutural(arquivos as any, '/base');
    expect(resultado[0].ideal).toBeNull();
  });

  it('retorna ideal correto para match direto por diretório', async () => {
    const { alinhamentoEstrutural, CAMADAS } = await import(
      '../../src/arquitetos/analista-estrutura.js'
    );
    Object.assign(CAMADAS, { camada1: 'src/camada1' });
    const arquivos = [{ relPath: 'src/camada1/algum-arquivo.ts' }];
    // @ts-ignore
    const resultado = await alinhamentoEstrutural(arquivos, '/base');
    expect(resultado[0].ideal).toBe('src/camada1');
    Object.keys(CAMADAS).forEach((k) => delete CAMADAS[k]);
  });

  it('retorna ideal correto para match por tipo de arquivo', async () => {
    const { alinhamentoEstrutural, CAMADAS } = await import(
      '../../src/arquitetos/analista-estrutura.js'
    );
    Object.assign(CAMADAS, { svc: 'servicos' });
    const arquivos = [{ relPath: 'algum/arquivo.svc.ts' }];
    // @ts-ignore
    const resultado = await alinhamentoEstrutural(arquivos, '/base');
    expect(resultado[0].ideal).toBe('servicos');
    Object.keys(CAMADAS).forEach((k) => delete CAMADAS[k]);
  });

  it('retorna ideal nulo se tipo não está em CAMADAS', async () => {
    const { alinhamentoEstrutural, CAMADAS } = await import(
      '../../src/arquitetos/analista-estrutura.js'
    );
    Object.assign(CAMADAS, { dao: 'data' });
    const arquivos = [{ relPath: 'algum/arquivo.svc.ts' }];
    // @ts-ignore
    const resultado = await alinhamentoEstrutural(arquivos, '/base');
    expect(resultado[0].ideal).toBeNull();
    Object.keys(CAMADAS).forEach((k) => delete CAMADAS[k]);
  });

  it('funciona com múltiplos arquivos e concorrência', async () => {
    const { alinhamentoEstrutural, CAMADAS } = await import(
      '../../src/arquitetos/analista-estrutura.js'
    );
    Object.assign(CAMADAS, { svc: 'servicos', dao: 'data' });
    const arquivos = [
      { relPath: 'src/camada1/arquivo1.svc.ts' },
      { relPath: 'src/camada2/arquivo2.dao.ts' },
      { relPath: 'src/camada3/arquivo3.ctrl.ts' },
    ];
    // @ts-ignore
    const resultado = await alinhamentoEstrutural(arquivos, '/base');
    expect(resultado[0].ideal).toBe('servicos');
    expect(resultado[1].ideal).toBe('data');
    expect(resultado[2].ideal).toBeNull();
    Object.keys(CAMADAS).forEach((k) => delete CAMADAS[k]);
  });
});
