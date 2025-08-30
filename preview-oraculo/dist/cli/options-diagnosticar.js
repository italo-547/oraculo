// SPDX-License-Identifier: MIT
// Opções do comando diagnosticar centralizadas para facilitar manutenção e testes
// Siga o padrão do projeto para adicionar novas opções
export const optionsDiagnosticar = [
    {
        flags: '-c, --compact',
        desc: 'modo compacto de logs (resumos e menos detalhes)',
    },
    {
        flags: '-V, --verbose',
        desc: 'modo verboso (mais detalhes nos relatórios)',
    },
    {
        flags: '--listar-analistas',
        desc: 'lista técnicas/analistas ativos antes da análise',
        defaultValue: false,
    },
    {
        flags: '-g, --guardian-check',
        desc: 'Executa verificação de integridade (guardian) no diagnóstico',
        defaultValue: false,
    },
    {
        flags: '--json',
        desc: 'Saída JSON estruturada (para CI/integracoes)',
        defaultValue: false,
    },
    {
        flags: '--criar-arquetipo',
        desc: 'Cria um arquétipo personalizado baseado na estrutura atual do projeto',
        defaultValue: false,
    },
    {
        flags: '--include <padrao>',
        desc: 'Glob pattern a INCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
        parser: (val, prev) => {
            prev.push(val);
            return prev;
        },
        defaultValue: [],
    },
    {
        flags: '--exclude <padrao>',
        desc: 'Glob pattern a EXCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
        parser: (val, prev) => {
            prev.push(val);
            return prev;
        },
        defaultValue: [],
    },
    // Adicione outras opções futuras aqui, seguindo o mesmo padrão.
];
//# sourceMappingURL=options-diagnosticar.js.map