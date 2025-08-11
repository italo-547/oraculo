import { describe, it, expect, vi, afterEach } from 'vitest';

describe('detectorDependencias', () => {
    afterEach(() => {
        vi.resetModules();
    });

    it('detecta dependências de import e require', async () => {
        const traverseMock = vi.fn((node, visitors) => {
            visitors.ImportDeclaration({ node: { source: { value: './modA' } } });
            visitors.CallExpression({ node: { callee: { type: 'Identifier', name: 'require' }, arguments: [{ type: 'StringLiteral', value: 'modB' }] } });
        });
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: traverseMock }));
        await vi.doMock('node:path', () => {
            const mockPath = {
                normalize: (p: string) => p.replace(/\\/g, '/').replace(/\/\.(?=\/|$)/g, ''),
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias, grafoDependencias } = await import('./detector-dependencias.js');
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = detectorDependencias.aplicar('', 'src/teste.js', fakeAst as any, '', undefined);
        expect(Array.isArray(ocorrencias)).toBe(true);
        expect(grafoDependencias.get('src/teste.js')).toEqual(new Set(['src/modA', 'modB']));
    });

    it('normaliza caminhos relativos e absolutos', async () => {
        const traverseMock = vi.fn((node, visitors) => {
            visitors.ImportDeclaration({ node: { source: { value: '../foo/bar' } } });
            visitors.ImportDeclaration({ node: { source: { value: 'lib-externa' } } });
        });
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: traverseMock }));
        await vi.doMock('node:path', () => {
            // Simula normalização real de path, resolvendo '..' e './'
            const normalize = (input: string) => {
                const parts = input.replace(/\\/g, '/').split('/');
                const stack = [];
                for (const part of parts) {
                    if (part === '' || part === '.') continue;
                    if (part === '..') stack.pop();
                    else stack.push(part);
                }
                return stack.join('/');
            };
            const mockPath = {
                normalize,
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias, grafoDependencias } = await import('./detector-dependencias.js');
        const fakeAst = { node: { type: 'File' } };
        detectorDependencias.aplicar('', 'src/dir/teste.js', fakeAst as any, '', undefined);
        expect(grafoDependencias.get('src/dir/teste.js')).toEqual(new Set(['src/foo/bar', 'lib-externa']));
    });

    it('não duplica dependências no grafo', async () => {
        const traverseMock = vi.fn((node, visitors) => {
            visitors.ImportDeclaration({ node: { source: { value: './modA' } } });
            visitors.ImportDeclaration({ node: { source: { value: './modA' } } });
        });
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: traverseMock }));
        await vi.doMock('node:path', () => {
            const mockPath = {
                normalize: (p: string) => p.replace(/\\/g, '/').replace(/\/\.(?=\/|$)/g, ''),
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias, grafoDependencias } = await import('./detector-dependencias.js');
        const fakeAst = { node: { type: 'File' } };
        detectorDependencias.aplicar('', 'src/teste.js', fakeAst as any, '', undefined);
        expect(grafoDependencias.get('src/teste.js')).toEqual(new Set(['src/modA']));
    });

    it('retorna [] se ast não for fornecido', async () => {
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: vi.fn() }));
        await vi.doMock('node:path', () => {
            const mockPath = {
                normalize: (p: string) => p.replace(/\\/g, '/').replace(/\/\.(?=\/|$)/g, ''),
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias } = await import('./detector-dependencias.js');
        expect(detectorDependencias.aplicar('', 'src/teste.js', null, '', undefined)).toEqual([]);
    });

    it('test cobre .js, .ts e outros', async () => {
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: vi.fn() }));
        await vi.doMock('node:path', () => {
            const mockPath = {
                normalize: (p: string) => p.replace(/\\/g, '/').replace(/\/\.(?=\/|$)/g, ''),
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias } = await import('./detector-dependencias.js');
        expect(detectorDependencias.test('foo.ts')).toBe(true);
        expect(detectorDependencias.test('foo.js')).toBe(true);
        expect(detectorDependencias.test('foo.jsx')).toBe(false);
        expect(detectorDependencias.test('foo.txt')).toBe(false);
    });

    it('ignora nodes sem ImportDeclaration/CallExpression', async () => {
        const traverseMock = vi.fn();
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: traverseMock }));
        await vi.doMock('node:path', () => {
            const normalize = (input: string) => {
                const parts = input.replace(/\\/g, '/').split('/');
                const stack = [];
                for (const part of parts) {
                    if (part === '' || part === '.') continue;
                    if (part === '..') stack.pop();
                    else stack.push(part);
                }
                return stack.join('/');
            };
            const mockPath = {
                normalize,
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias, grafoDependencias } = await import('./detector-dependencias.js');
        const fakeAst = { node: { type: 'File' } };
        detectorDependencias.aplicar('', 'src/teste.js', fakeAst as any, '', undefined);
        expect(grafoDependencias.get('src/teste.js')).toBeUndefined();
    });

    it('suporta múltiplos requires e imports misturados', async () => {
        const traverseMock = vi.fn((node, visitors) => {
            visitors.ImportDeclaration({ node: { source: { value: './modA' } } });
            visitors.CallExpression({ node: { callee: { type: 'Identifier', name: 'require' }, arguments: [{ type: 'StringLiteral', value: './modB' }] } });
            visitors.CallExpression({ node: { callee: { type: 'Identifier', name: 'require' }, arguments: [{ type: 'StringLiteral', value: 'libC' }] } });
        });
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: traverseMock }));
        await vi.doMock('node:path', () => {
            const mockPath = {
                normalize: (p: string) => p.replace(/\\/g, '/').replace(/\/\.(?=\/|$)/g, ''),
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias, grafoDependencias } = await import('./detector-dependencias.js');
        const fakeAst = { node: { type: 'File' } };
        detectorDependencias.aplicar('', 'src/dir/teste.js', fakeAst as any, '', undefined);
        expect(grafoDependencias.get('src/dir/teste.js')).toEqual(new Set(['src/dir/modA', 'src/dir/modB', 'libC']));
    });

    it('não adiciona require inválido', async () => {
        const traverseMock = vi.fn((node, visitors) => {
            visitors.CallExpression({ node: { callee: { type: 'Identifier', name: 'require' }, arguments: [{ type: 'NotString', value: 123 }] } });
        });
        await vi.doMock('../nucleo/constelacao/traverse.js', () => ({ traverse: traverseMock }));
        await vi.doMock('node:path', () => {
            const normalize = (input: string) => {
                const parts = input.replace(/\\/g, '/').split('/');
                const stack = [];
                for (const part of parts) {
                    if (part === '' || part === '.') continue;
                    if (part === '..') stack.pop();
                    else stack.push(part);
                }
                return stack.join('/');
            };
            const mockPath = {
                normalize,
                join: (...args: string[]) => args.join('/'),
                dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
            };
            return { ...mockPath, default: mockPath };
        });
        const { detectorDependencias, grafoDependencias } = await import('./detector-dependencias.js');
        const fakeAst = { node: { type: 'File' } };
        detectorDependencias.aplicar('', 'src/teste.js', fakeAst as any, '', undefined);
        expect(grafoDependencias.get('src/teste.js')).toBeUndefined();
    });
});

// Os testes serão reescritos usando vi.doMock e importação dinâmica para garantir isolamento total.
