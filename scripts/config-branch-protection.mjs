#!/usr/bin/env node
/*
SPDX-License-Identifier: MIT

Configura e valida proteção da branch via GitHub API usando gh-cli.
- Requer: GitHub CLI (gh) autenticado; permissões de admin.
- Uso:
  node scripts/config-branch-protection.mjs check
  node scripts/config-branch-protection.mjs apply

Ambiente:
  GH_OWNER, GH_REPO (opcional; caso não informados, tenta inferir via git remote)
  BRANCH_NAME (default: main)
  BP_REQUIRED_CONTEXTS (ex.: "CI Principal,license-gate,coverage:gate,perf:gate,compliance")
  BP_RESTRICT_USERS (lista separada por vírgula) (opcional)
  BP_RESTRICT_TEAMS (lista separada por vírgula) (opcional)
*/

import { execSync } from 'node:child_process';
import https from 'node:https';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', ...opts }).trim();
}

function hasGh() {
  try {
    sh('gh --version');
    return true;
  } catch {
    return false;
  }
}

function apiRequest(method, path, body) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN/GH_TOKEN não definido e gh-cli indisponível. Configure auth.');
  }
  const opts = {
    method,
    hostname: 'api.github.com',
    path,
    headers: {
      'User-Agent': 'oraculo-branch-protection-script',
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          const msg = `HTTP ${res.statusCode}: ${data}`;
          reject(new Error(msg));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function inferRepo() {
  try {
    const url = sh('git config --get remote.origin.url');
    // supports https and ssh
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    const https = url.match(/https:\/\/github\.com\/(.+?)\/(.+?)(\.git)?$/);
    if (https) return { owner: https[1], repo: https[2] };
    const ssh = url.match(/git@github\.com:(.+?)\/(.+?)(\.git)?$/);
    if (ssh) return { owner: ssh[1], repo: ssh[2] };
  } catch {}
  return null;
}

function parseCSV(envName) {
  const v = process.env[envName];
  if (!v) return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const inferred = inferRepo();
const owner = process.env.GH_OWNER || inferred?.owner;
const repo = process.env.GH_REPO || inferred?.repo;
const branch = process.env.BRANCH_NAME || 'main';

if (!owner || !repo) {
  console.error(
    'Erro: impossível determinar owner/repo. Defina GH_OWNER e GH_REPO ou configure remote.origin.url',
  );
  process.exit(2);
}

const requiredContexts = parseCSV('BP_REQUIRED_CONTEXTS');
const restrictUsers = parseCSV('BP_RESTRICT_USERS');
const restrictTeams = parseCSV('BP_RESTRICT_TEAMS');

function getProtection() {
  const path = `/repos/${owner}/${repo}/branches/${branch}/protection`;
  try {
    if (hasGh()) {
      const json = sh(`gh api -H \"Accept: application/vnd.github+json\" ${JSON.stringify(path)}`);
      return JSON.parse(json);
    } else {
      return apiRequest('GET', path)
        .then((txt) => JSON.parse(txt))
        .catch((e) => {
          if (String(e).includes('404')) return null;
          throw e;
        });
    }
  } catch (e) {
    if (String(e).includes('404')) return null; // sem proteção
    throw e;
  }
}

function desiredPayload() {
  const payload = {
    required_status_checks: {
      strict: true,
      contexts: requiredContexts,
    },
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_last_push_approval: true,
    },
    restrictions: null, // default sem restrição explícita
    required_linear_history: true,
    allow_force_pushes: false,
    allow_deletions: false,
  };
  if (restrictUsers.length || restrictTeams.length) {
    payload.restrictions = {
      users: restrictUsers,
      teams: restrictTeams,
      apps: [],
    };
  }
  return payload;
}

async function applyProtection() {
  const path = `/repos/${owner}/${repo}/branches/${branch}/protection`;
  const body = JSON.stringify(desiredPayload());
  const dir = mkdtempSync(join(tmpdir(), 'oraculo-bp-'));
  const file = join(dir, 'body.json');
  writeFileSync(file, body, 'utf8');
  // Usa --input para evitar problemas de aspas em shells diferentes
  if (hasGh()) {
    sh(
      `gh api -X PUT -H \"Accept: application/vnd.github+json\" ${JSON.stringify(path)} --input ${JSON.stringify(file)}`,
    );
  } else {
    await apiRequest('PUT', path, body);
  }
}

async function setMergeRules() {
  // Desabilita merge commit e rebase; habilita squash; delete head branches
  const path = `/repos/${owner}/${repo}`;
  const body = JSON.stringify({
    allow_squash_merge: true,
    allow_merge_commit: false,
    allow_rebase_merge: false,
    delete_branch_on_merge: true,
    squash_merge_commit_title: 'PR_TITLE',
    squash_merge_commit_message: 'PR_BODY',
  });
  const dir = mkdtempSync(join(tmpdir(), 'oraculo-bp-'));
  const file = join(dir, 'repo.json');
  writeFileSync(file, body, 'utf8');
  if (hasGh()) {
    sh(
      `gh api -X PATCH -H \"Accept: application/vnd.github+json\" ${JSON.stringify(path)} --input ${JSON.stringify(file)}`,
    );
  } else {
    await apiRequest('PATCH', path, body);
  }
}

function diffProtection(current) {
  const desired = desiredPayload();
  const diffs = [];
  if (!current) {
    diffs.push('Proteção inexistente.');
    return diffs;
  }
  const curChecks = current.required_status_checks?.contexts ?? [];
  const curStrict = !!current.required_status_checks?.strict;
  if (!curStrict) diffs.push('required_status_checks.strict != true');
  const missing = desired.required_status_checks.contexts.filter((c) => !curChecks.includes(c));
  if (missing.length) diffs.push(`Contexts ausentes: ${missing.join(', ')}`);
  if (!current.enforce_admins?.enabled) diffs.push('enforce_admins != true');
  const pr = current.required_pull_request_reviews;
  if (!pr) diffs.push('required_pull_request_reviews ausente');
  else {
    if ((pr.required_approving_review_count ?? 0) < 1)
      diffs.push('required_approving_review_count < 1');
    if (!pr.dismiss_stale_reviews) diffs.push('dismiss_stale_reviews != true');
    if (!pr.require_last_push_approval) diffs.push('require_last_push_approval != true');
  }
  if (!current.required_linear_history?.enabled) diffs.push('required_linear_history != true');
  if (current.allow_force_pushes?.enabled) diffs.push('allow_force_pushes deve ser false');
  if (current.allow_deletions?.enabled) diffs.push('allow_deletions deve ser false');

  // Restrições: só cobramos se desejadas
  const wantRestrict = !!desired.restrictions;
  const hasRestrict = !!current.restrictions;
  if (wantRestrict && !hasRestrict) diffs.push('restrictions ausentes');
  if (wantRestrict && hasRestrict) {
    const curUsers = (current.restrictions.users || []).map((u) => u.login).sort();
    const curTeams = (current.restrictions.teams || []).map((t) => t.slug).sort();
    const wantUsers = restrictUsers.slice().sort();
    const wantTeams = restrictTeams.slice().sort();
    if (JSON.stringify(curUsers) !== JSON.stringify(wantUsers))
      diffs.push('restrictions.users divergem');
    if (JSON.stringify(curTeams) !== JSON.stringify(wantTeams))
      diffs.push('restrictions.teams divergem');
  }
  return diffs;
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd || !['check', 'apply'].includes(cmd)) {
    console.error('Uso: node scripts/config-branch-protection.mjs <check|apply>');
    process.exit(2);
  }

  const maybe = getProtection();
  const current = typeof maybe?.then === 'function' ? await maybe : maybe;

  if (cmd === 'check') {
    const diffs = diffProtection(current);
    if (!current) console.log('[!] Sem proteção configurada para', branch);
    if (diffs.length) {
      console.log('Diferenças encontradas:');
      for (const d of diffs) console.log('- ' + d);
      process.exit(1);
    }
    console.log('Proteção da branch em conformidade.');
    // Validar regras de merge
    // Não há endpoint simples para ler todas as flags de merge via gh aqui; mantemos aplicação separada.
    process.exit(0);
  }

  if (cmd === 'apply') {
    let bpError = null;
    try {
      await applyProtection();
      console.log('Proteção de branch aplicada em', `${owner}/${repo}#${branch}`);
    } catch (e) {
      bpError = e;
      const msg = e?.message || String(e);
      console.error('Aviso: falha ao aplicar proteção da branch:', msg);
    }
    try {
      await setMergeRules();
      console.log('Regras de merge configuradas para', `${owner}/${repo}`);
    } catch (e) {
      console.error('Aviso: falha ao configurar regras de merge:', e?.message || String(e));
    }
    if (bpError) {
      console.error('Proteção não aplicada. Veja avisos acima.');
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error('Erro:', e.message || e);
  process.exit(1);
});
// Ajuda contextual quando a API retorna 404 em repositórios privados
process.on('exit', (code) => {
  if (code !== 0) {
    const msg = typeof globalThis?.lastErrorMessage === 'string' ? globalThis.lastErrorMessage : '';
    const fromStderr = (typeof msg === 'string' && msg) || '';
    const any = fromStderr || '';
    const hinted404 = any.includes('HTTP 404');
    const hinted403Pro = any.includes('HTTP 403') || any.includes('Upgrade to GitHub Pro');
    if (hinted404) {
      console.error(
        '[dica] 404 ao acessar endpoint de proteção normalmente indica token sem acesso de admin ao repo privado.',
      );
      console.error(
        '[dica] Gere um Fine-grained PAT com acesso ao repositório específico e permissão: Repository permissions → Administration: Read and write.',
      );
      console.error(
        '[dica] Alternativamente, instale e autentique o GitHub CLI (gh auth login) com um usuário admin do repositório e reexecute o script.',
      );
    }
    if (hinted403Pro) {
      console.error(
        '[dica] 403 com mensagem "Upgrade to GitHub Pro" indica limitação do plano para proteção de branch em repositórios privados.',
      );
      console.error(
        '[dica] Soluções: (a) tornar o repositório público, (b) fazer upgrade para GitHub Pro/Team, ou (c) manter apenas regras de merge (squash-only) enquanto isso.',
      );
    }
  }
});
