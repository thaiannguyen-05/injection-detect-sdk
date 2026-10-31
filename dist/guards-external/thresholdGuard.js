"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acuvityScan = exports.pillarScanPrompt = void 0;
exports.thresholdGuard = thresholdGuard;
function getText(ctx, ev) {
    if (ev === 'beforeRequestHook') {
        const j = ctx.request?.json;
        if (!j)
            return '';
        if (j.messages?.length) {
            const l = j.messages[j.messages.length - 1];
            return Array.isArray(l.content) ? l.content.map((x) => x.text).join('\n') : String(l.content ?? '');
        }
        return String(j.prompt ?? j.input ?? '');
    }
    const j = ctx.response?.json;
    if (!j)
        return '';
    if (j.choices?.length) {
        const c = j.choices[0];
        return String(c.text ?? c.message?.content?.text ?? c.message?.content ?? '');
    }
    return '';
}
async function thresholdGuard(ctx, p, ev) {
    if (!p.scanners?.length)
        return { error: { message: 'no scanners' }, verdict: true, data: null };
    try {
        let scores = p.scores ?? {};
        if (!p.scores) {
            if (!p.endpoint)
                throw new Error('endpoint or scores required');
            if (!p.credentials?.apiKey)
                throw new Error('apiKey required for live vendor call');
            const text = getText(ctx, ev);
            const c = new AbortController();
            const t = setTimeout(() => c.abort(), p.timeout ?? 5000);
            try {
                const r = await fetch(p.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.credentials.apiKey}` }, body: JSON.stringify({ text, type: ev === 'beforeRequestHook' ? 'Input' : 'Output', scanners: p.scanners }), signal: c.signal });
                scores = await r.json();
            }
            finally {
                clearTimeout(t);
            }
        }
        const hits = [];
        for (const s of p.scanners) {
            const th = p.thresholds?.[s] ?? 0.5;
            if ((scores[s] ?? 0) >= th)
                hits.push(s);
        }
        const redactOnly = hits.length > 0 && p.redactCategories && hits.every((h) => p.redactCategories.includes(h));
        if (!hits.length)
            return { error: null, verdict: true, data: { scores, hits } };
        if (redactOnly)
            return { error: null, verdict: true, transformed: true, transformedData: { request: { json: null }, response: { json: null } }, data: { scores, hits, redacted: true } };
        return { error: null, verdict: false, data: { scores, hits } };
    }
    catch (e) {
        return { error: e, verdict: false, data: null };
    }
}
// Presets mirroring vendors:
const pillarScanPrompt = (ctx, p, ev) => thresholdGuard(ctx, { scanners: p.scanners ?? ['prompt_injection', 'pii', 'secrets', 'toxic_language', 'invisible_characters'], thresholds: { prompt_injection: 0.5 }, scores: p.scores }, ev);
exports.pillarScanPrompt = pillarScanPrompt;
const acuvityScan = (ctx, p, ev) => thresholdGuard(ctx, { thresholds: { prompt_injection: 0.5, jailbreak: 0.5 }, ...p }, ev);
exports.acuvityScan = acuvityScan;
