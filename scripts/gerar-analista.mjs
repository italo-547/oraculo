#!/usr/bin/env node
// SPDX-License-Identifier: MIT
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function main() {
  const nomeArg = process.argv[2];
  if (!nomeArg) {
    console.error('Uso: npm run gerar:analista <nome-kebab>');
    process.exit(1);
  }
  const baseNome = nomeArg.replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
  if (!baseNome) {
    console.error('Nome inválido após sanitização.');
    process.exit(1);
  }
  const fileName = `analista-${baseNome}.ts`;
  const destino = path.join(root, 'src', 'analistas', fileName);
  try {
    await fs.stat(destino);
    console.error('Arquivo já existe:', fileName);
    process.exit(1);
  } catch {}

  const template = `import type { Analista, TecnicaAplicarResultado } from '../tipos/tipos.js';\nimport { criarOcorrencia } from '../tipos/tipos.js';\n\nexport const analista${camelCase(baseNome)}: Analista = {\n  nome: '${baseNome}',\n  categoria: 'custom',\n  descricao: 'Descrição breve do analista ${baseNome}.',\n  aplicar(src, relPath): TecnicaAplicarResultado {\n    // TODO: implementar lógica\n    // retornar null se nada encontrado\n    if (!src.includes('TODO')) return null;\n    return [\n      criarOcorrencia({\n        tipo: 'EXEMPLO_OCORRENCIA',\n        mensagem: 'Ocorrência de exemplo gerada pelo analista ${baseNome}',\n        nivel: 'aviso',\n        relPath,\n        origem: '${baseNome}'\n      })\n    ];\n  }\n};\n`;

  await fs.writeFile(destino, template, 'utf-8');
  console.log('Criado analista em', path.relative(root, destino));
  console.log('Lembre de registrar no arquivo src/analistas/registry.ts');
}

function camelCase(str) {
  return str
    .split('-')
    .map((s, i) =>
      i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s.charAt(0).toUpperCase() + s.slice(1),
    )
    .join('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
