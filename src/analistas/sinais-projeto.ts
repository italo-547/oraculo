// SPDX-License-Identifier: MIT
import type { FileEntryWithAst } from '@tipos/tipos.js';
// import path from 'node:path'; // Removido: não utilizado
import type {
  Statement,
  ImportDeclaration,
  VariableDeclaration,
  TSTypeAliasDeclaration,
  TSInterfaceDeclaration,
  TSEnumDeclaration,
  ClassDeclaration,
  Program,
} from '@babel/types';

export interface SinaisProjetoAvancados {
  funcoes: number;
  imports: string[];
  variaveis: number;
  tipos: string[];
  classes: number;
  frameworksDetectados: string[];
  dependencias: string[];
  scripts: string[];
  pastasPadrao: string[];
  arquivosPadrao: string[];
  arquivosConfig: string[];
}

export function extrairSinaisAvancados(
  fileEntries: FileEntryWithAst[],
  packageJson?: Record<string, unknown>,
): SinaisProjetoAvancados {
  // Auxiliar para checar se o nó possui id.name string
  const hasIdName = (node: unknown): node is { id: { name: string } } => {
    return (
      typeof node === 'object' &&
      node !== null &&
      'id' in node &&
      typeof (node as { id?: { name?: unknown } }).id?.name === 'string'
    );
  };
  const sinais: SinaisProjetoAvancados = {
    funcoes: 0,
    imports: [],
    variaveis: 0,
    tipos: [],
    classes: 0,
    frameworksDetectados: [],
    dependencias: [],
    scripts: [],
    pastasPadrao: [],
    arquivosPadrao: [],
    arquivosConfig: [],
  };

  for (const fe of fileEntries) {
    let body: Statement[] = [];
    if (
      fe.ast &&
      fe.ast.node &&
      (fe.ast.node as Program).type === 'Program' &&
      Array.isArray((fe.ast.node as Program).body)
    ) {
      body = (fe.ast.node as Program).body;
    }
    // Funções
    sinais.funcoes += body.filter(
      (n): n is import('@babel/types').FunctionDeclaration => n.type === 'FunctionDeclaration',
    ).length;
    // Imports
    const imports = body.filter((n): n is ImportDeclaration => n.type === 'ImportDeclaration');
    sinais.imports.push(...imports.map((i) => i.source.value));
    // Variáveis
    sinais.variaveis += body.filter(
      (n): n is VariableDeclaration => n.type === 'VariableDeclaration',
    ).length;
    // Tipos (TypeScript)
    sinais.tipos.push(
      ...body
        .filter((n): n is TSTypeAliasDeclaration | TSInterfaceDeclaration | TSEnumDeclaration =>
          ['TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSEnumDeclaration'].includes(
            n.type,
          ),
        )
        .map((n) => (hasIdName(n) ? n.id.name : undefined))
        .filter((v): v is string => typeof v === 'string'),
    );
    // Classes
    sinais.classes += body.filter(
      (n): n is ClassDeclaration => n.type === 'ClassDeclaration',
    ).length;
    // Frameworks por import
    for (const i of imports) {
      if (typeof i.source.value === 'string') {
        if (/express|react|next|electron|discord\.js|telegraf/.test(i.source.value)) {
          sinais.frameworksDetectados.push(i.source.value);
        }
      }
    }
    // Padrões de pastas/arquivos
    const rel = fe.relPath.replace(/\\/g, '/');
    if (/src\/controllers|pages|api|prisma|packages|apps/.test(rel)) {
      sinais.pastasPadrao.push(rel);
    }
    if (/main\.js|index\.ts|bot\.ts|electron\.js/.test(rel)) {
      sinais.arquivosPadrao.push(rel);
    }
    if (/tsconfig\.json|turbo\.json|pnpm-workspace\.yaml/.test(rel)) {
      sinais.arquivosConfig.push(rel);
    }
  }
  // Dependências e scripts do package.json
  if (packageJson) {
    sinais.dependencias.push(...Object.keys(packageJson.dependencies || {}));
    sinais.scripts.push(...Object.keys(packageJson.scripts || {}));
  }
  // Normaliza arrays
  sinais.imports = Array.from(new Set(sinais.imports));
  sinais.frameworksDetectados = Array.from(new Set(sinais.frameworksDetectados));
  sinais.pastasPadrao = Array.from(new Set(sinais.pastasPadrao));
  sinais.arquivosPadrao = Array.from(new Set(sinais.arquivosPadrao));
  sinais.arquivosConfig = Array.from(new Set(sinais.arquivosConfig));
  sinais.tipos = Array.from(new Set(sinais.tipos));
  return sinais;
}
