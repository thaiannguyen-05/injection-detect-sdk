// Ported from plugins/default/validUrls.ts — PURE (fetch HEAD / DoH).
import { HookEventType, PluginContext, getText } from './context';
async function checkUrl(u: string): Promise<boolean> {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 3000);
    const r = await fetch(u, { method: 'HEAD', signal: c.signal }); clearTimeout(t); return r.ok;
  } catch { return false; }
}
export async function validUrls(ctx: PluginContext, p: { onlyDNS?: boolean; not?: boolean }, ev: HookEventType) {
  try {
    const text = getText(ctx, ev);
    const urls = text.match(/https?:\/\/[^\s,"'{}\[\]]+/g) ?? [];
    if (!urls.length) return { error: null, verdict: false, data: { urls: [] } };
    const results = await Promise.all(urls.map(async (u) => ({ url: u, isValid: await checkUrl(u) })));
    const allValid = results.every((r) => r.isValid);
    return { error: null, verdict: p.not ? !allValid : allValid, data: { results } };
  } catch (e: any) { return { error: e, verdict: false, data: { explanation: e.message } }; }
}
