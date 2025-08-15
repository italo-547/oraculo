// Gera THIRD-PARTY-NOTICES.txt a partir das dependências de produção
// Usa license-checker-rseidelsohn via API programática (CJS) a partir de ESM
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exec as _exec, execFile as _execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(_execFile);
const exec = promisify(_exec);

const require = createRequire(import.meta.url);
let licenseChecker = null;
try {
  // Tenta carregar a lib localmente; se não existir, seguimos com fallback
  // eslint-disable-next-line import/no-extraneous-dependencies
  licenseChecker = require('license-checker-rseidelsohn');
} catch {}

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'THIRD-PARTY-NOTICES.txt');

/** Retorna string segura (sem undefined/null) */
function s(v) {
  return v == null ? '' : String(v);
}

/** Normaliza quebras de linha para \n */
function nl(txt) {
  return txt.replace(/\r\n?|\n/g, '\n');
}

/**
 * Monta cabeçalho do arquivo de avisos
 */
function header({ projectName, license }) {
  const now = new Date().toISOString();
  return [
    'THIRD-PARTY NOTICES',
    '====================',
    '',
    `${projectName} — Licença do projeto: ${license}`,
    `Este arquivo lista componentes de terceiros incluídos (produção) e seus respectivos avisos/licenças.`,
    `Gerado em: ${now}`,
    '',
    'Observações:',
    '- Este arquivo é gerado automaticamente; não edite manualmente.',
    '- Para atualizar, execute: npm run licenses:notice',
    '',
  ].join('\n');
}

/**
 * Renderiza um bloco por pacote, incluindo (quando disponível) o conteúdo do arquivo de licença.
 */
async function renderPackageBlock(pkgId, meta) {
  const lines = [];
  lines.push('----------------------------------------------------------------');
  lines.push(`Pacote: ${pkgId}`);
  lines.push(`Licenças: ${s(meta.licenses)}`);
  if (meta.publisher) lines.push(`Publicador: ${s(meta.publisher)}`);
  if (meta.email) lines.push(`Contato: ${s(meta.email)}`);
  if (meta.repository) lines.push(`Repositório: ${s(meta.repository)}`);
  if (meta.path) lines.push(`Caminho: ${s(meta.path)}`);

  // Tenta embutir o conteúdo do arquivo de licença quando existir (útil para Apache-2.0, BSD, etc.)
  if (meta.licenseFile) {
    try {
      const content = await fs.readFile(meta.licenseFile, 'utf-8');
      const trimmed = nl(content).trim();
      if (trimmed) {
        lines.push('');
        lines.push('--- Início do texto de licença ---');
        lines.push(trimmed);
        lines.push('--- Fim do texto de licença ---');
      }
    } catch (err) {
      lines.push('');
      lines.push(`(Aviso) Não foi possível ler o arquivo de licença: ${meta.licenseFile} — ${err.message}`);
    }
  }

  // Inclui NOTICE quando existir (exigido por algumas licenças como Apache-2.0)
  const pkgDir = meta.path;
  if (pkgDir) {
    const candidates = ['NOTICE', 'NOTICE.txt', 'NOTICE.md', 'Notice', 'notice', 'notice.txt'];
    for (const f of candidates) {
      try {
        const noticePath = path.join(pkgDir, f);
        const stat = await fs.stat(noticePath).catch(() => null);
        if (stat && stat.isFile()) {
          const ncontent = nl(await fs.readFile(noticePath, 'utf-8')).trim();
          if (ncontent) {
            lines.push('');
            lines.push('--- Início do NOTICE ---');
            lines.push(ncontent);
            lines.push('--- Fim do NOTICE ---');
          }
          break;
        }
      } catch {}
    }
  }

  lines.push('');
  return lines.join('\n');
}

async function main() {
  const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf-8'));
  const projectName = `${pkg.name}@${pkg.version}`;
  const projectLicense = pkg.license || 'UNSPECIFIED';

  let results = null;
  // 1) Tenta ler JSON pré-gerado
  const cachePath = path.join(ROOT, '.oraculo', 'licenses.json');
  try {
    const buf = await fs.readFile(cachePath, 'utf-8');
    results = JSON.parse(buf);
  } catch {}

  // 2) Tenta via API, se lib disponível
  if (!results && licenseChecker) {
    results = await new Promise((resolve, reject) => {
      licenseChecker.init(
        {
          start: ROOT,
          production: true,
          direct: false,
          relativeLicensePath: true,
          customPath: undefined,
          json: true,
        },
        (err, json) => {
          if (err) reject(err);
          else resolve(json);
        }
      );
    });
  }

  // 3) Fallback: executa npx e captura JSON (tenta execFile, depois exec com shell)
  if (!results) {
    try {
      const { stdout } = await execFile(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
        '--yes',
        'license-checker-rseidelsohn',
        '--production',
        '--json',
      ], { maxBuffer: 10 * 1024 * 1024 });
      results = JSON.parse(stdout);
    } catch {
      const cmd = 'npx --yes license-checker-rseidelsohn --production --json';
      const { stdout } = await exec(cmd, { maxBuffer: 10 * 1024 * 1024, shell: true });
      results = JSON.parse(stdout);
    }
  }

  // Cacheia JSON para futuras execuções sem rede
  try {
    const dir = path.join(ROOT, '.oraculo');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'licenses.json'), JSON.stringify(results, null, 2), 'utf-8');
  } catch {}

  // Ordena por id (nome@versão) e remove o próprio projeto
  const entries = Object.entries(results)
    .filter(([id]) => !id.startsWith(`${pkg.name}@`))
    .sort(([a], [b]) => a.localeCompare(b));

  const parts = [header({ projectName, license: projectLicense })];

  for (const [id, meta] of entries) {
    parts.push(await renderPackageBlock(id, meta));
  }

  const finalTxt = parts.join('\n');
  await fs.writeFile(OUTPUT, finalTxt, 'utf-8');
  console.log(`Gerado ${path.relative(ROOT, OUTPUT)} com ${entries.length} pacotes.`);
}

main().catch((err) => {
  console.error('[generate-notices] Falhou:', err);
  process.exitCode = 1;
});
