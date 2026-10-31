// Generic threshold guard — abstracts Acuvity/Pillar/Javelin/Lasso/Sydelabs/Pangea pattern.
// NEEDS API KEY when calling real vendor; pure when `scores` injected (tests/offline).
// Acuvity scan.ts:197-231, Pillar scanPrompt.ts:53-69, Javelin promptinjectiondetection, Sydelabs PROMPT_INJECT.
type Ev = 'beforeRequestHook' | 'afterRequestHook';
function getText(ctx: any, ev: Ev): string {
  if (ev === 'beforeRequestHook') {
    const j = ctx.request?.json; if (!j) return '';
    if (j.messages?.length) { const l = j.messages[j.messages.length - 1]; return Array.isArray(l.content) ? l.content.map((x: any) => x.text).join('\n') : String(l.content ?? ''); }
    return String(j.prompt ?? j.input ?? '');
  }
  const j = ctx.response?.json; if (!j) return '';
  if (j.choices?.length) { const c = j.choices[0]; return String(c.text ?? c.message?.content?.text ?? c.message?.content ?? ''); }
  return '';
}
export interface ThresholdParams {
  scanners: string[]; // e.g. ['prompt_injection','jailbreak','pii','toxic_language']
  thresholds?: Record<string, number>; // default 0.5
  scores?: Record<string, number>; // offline scores (no API call)
  credentials?: { apiKey?: string };
  endpoint?: string; // vendor scan URL when live
  timeout?: number;
  redactCategories?: string[]; // if set + hit -> transformed instead of block
}
export async function thresholdGuard(ctx: any, p: ThresholdParams, ev: Ev) {
  if (!p.scanners?.length) return { error: { message: 'no scanners' }, verdict: true, data: null };
  try {
    let scores: Record<string, number> = p.scores ?? {};
    if (!p.scores) {
      if (!p.endpoint) throw new Error('endpoint or scores required');
      if (!p.credentials?.apiKey) throw new Error('apiKey required for live vendor call');
      const text = getText(ctx, ev);
      const c = new AbortController(); const t = setTimeout(() => c.abort(), p.timeout ?? 5000);
      try {
        const r = await fetch(p.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.credentials.apiKey}` }, body: JSON.stringify({ text, type: ev === 'beforeRequestHook' ? 'Input' : 'Output', scanners: p.scanners }), signal: c.signal });
        scores = await r.json();
      } finally { clearTimeout(t); }
    }
    const hits: string[] = [];
    for (const s of p.scanners) {
      const th = p.thresholds?.[s] ?? 0.5;
      if ((scores[s] ?? 0) >= th) hits.push(s);
    }
    const redactOnly = hits.length > 0 && p.redactCategories && hits.every((h) => p.redactCategories!.includes(h));
    if (!hits.length) return { error: null, verdict: true, data: { scores, hits } };
    if (redactOnly) return { error: null, verdict: true, transformed: true, transformedData: { request: { json: null }, response: { json: null } }, data: { scores, hits, redacted: true } };
    return { error: null, verdict: false, data: { scores, hits } };
  } catch (e: any) { return { error: e, verdict: false, data: null }; }
}
// Presets mirroring vendors:
export const pillarScanPrompt = (ctx: any, p: { scanners?: string[]; scores?: Record<string, number> }, ev: Ev) =>
  thresholdGuard(ctx, { scanners: p.scanners ?? ['prompt_injection', 'pii', 'secrets', 'toxic_language', 'invisible_characters'], thresholds: { prompt_injection: 0.5 }, scores: p.scores }, ev);
export const acuvityScan = (ctx: any, p: ThresholdParams, ev: Ev) =>
  thresholdGuard(ctx, { thresholds: { prompt_injection: 0.5, jailbreak: 0.5 }, ...p }, ev);
