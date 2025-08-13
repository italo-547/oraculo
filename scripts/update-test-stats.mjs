#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const statsPath = path.join(root, '.oraculo', 'test-stats.json');
const badgePath = path.join(root, '.oraculo', 'badge-test-stats.json');
await fs.mkdir(path.dirname(statsPath), { recursive: true });

function cor(percent) {
    if (percent >= 95) return 'brightgreen';
    if (percent >= 85) return 'green';
    if (percent >= 70) return 'yellow';
    return 'red';
}

let existing = { total_runs: 0, passed_runs: 0, failed_runs: 0, last_status: 'unknown', last_commit: '', last_duration_ms: 0 };
try {
    const raw = await fs.readFile(statsPath, 'utf-8');
    existing = JSON.parse(raw);
} catch { }

// Vitest JSON reporter output (last run)
let vitestJson = null;
try {
    const raw = await fs.readFile(path.join(root, '.oraculo', 'last-test-report.json'), 'utf-8');
    vitestJson = JSON.parse(raw);
} catch { }

const started = process.env.TEST_STARTED_AT ? Number(process.env.TEST_STARTED_AT) : Date.now();
const duration = Date.now() - started;

// Determine status: if vitestJson has failed tests or process arg indicates failure
let failed = false;
let totalTests = 0;
if (vitestJson && vitestJson.testResults) {
    for (const file of vitestJson.testResults) {
        totalTests += file.assertionResults?.length || 0;
        if (file.status === 'failed') failed = true;
        if (file.assertionResults?.some(a => a.status === 'failed')) failed = true;
    }
}

existing.total_runs += 1;
if (failed) existing.failed_runs += 1; else existing.passed_runs += 1;
existing.last_status = failed ? 'failed' : 'passed';
existing.last_commit = process.env.GITHUB_SHA || '';
existing.last_duration_ms = duration;
existing.total_tests_last = totalTests;

await fs.writeFile(statsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');

const successRate = existing.total_runs ? (existing.passed_runs / existing.total_runs) * 100 : 0;
const badge = {
    schemaVersion: 1,
    label: 'testes',
    message: `${existing.passed_runs}✔ / ${existing.failed_runs}✖ (${successRate.toFixed(1)}%)`,
    color: cor(successRate),
};
await fs.writeFile(badgePath, JSON.stringify(badge, null, 2) + '\n', 'utf-8');

console.log('[update-test-stats] Badge atualizado:', badge.message);
