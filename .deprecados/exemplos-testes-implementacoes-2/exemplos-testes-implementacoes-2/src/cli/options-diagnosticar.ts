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
    flags: '--include <padrao>',
    desc: 'Glob pattern a INCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
    parser: (val: string, prev: string[]) => {
      prev.push(val);
      return prev;
    },
    defaultValue: [] as string[],
  },
  {
    flags: '--exclude <padrao>',
    desc: 'Glob pattern a EXCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
    parser: (val: string, prev: string[]) => {
      prev.push(val);
      return prev;
    },
    defaultValue: [] as string[],
  },
  // Adicione outras opções futuras aqui, seguindo o mesmo padrão.
];
