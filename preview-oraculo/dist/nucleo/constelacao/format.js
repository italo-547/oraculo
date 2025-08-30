// SPDX-License-Identifier: MIT
/** Utilitários de formatação padronizada para métricas e valores numéricos */
export function formatMs(v) {
    if (v == null || Number.isNaN(v))
        return '-';
    if (v < 1)
        return `${v.toFixed(2)}ms`;
    if (v < 1000)
        return `${v.toFixed(1)}ms`;
    const s = v / 1000;
    if (s < 60)
        return `${s.toFixed(2)}s`;
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${m}m${rest.toFixed(0)}s`;
}
export function formatPct(delta) {
    if (delta == null || !isFinite(delta))
        return '0.0%';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
}
export function formatCount(v) {
    if (v == null || Number.isNaN(v))
        return '0';
    if (v < 1000)
        return `${v}`;
    if (v < 1000000)
        return `${(v / 1000).toFixed(1)}k`;
    return `${(v / 1000000).toFixed(2)}M`;
}
export function formatDiff(a, b) {
    if (a == null || b == null)
        return '-';
    return `${formatMs(a)} => ${formatMs(b)} (${formatPct(((b - a) / (a || 1)) * 100)})`;
}
export function calcPctVar(a, b) {
    if (a == null || b == null || a === 0)
        return 0;
    return ((b - a) / a) * 100;
}
//# sourceMappingURL=format.js.map