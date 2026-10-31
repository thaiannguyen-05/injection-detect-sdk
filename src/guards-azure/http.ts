// Shared post/getText for azure + external — trimmed from plugins/utils.ts
export type HookEventType = 'beforeRequestHook' | 'afterRequestHook';
export async function post<T = any>(url: string, data: any, headers: Record<string, string> = {}, timeout = 5000): Promise<T> {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data), signal: c.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return (await r.json()) as T;
  } finally { clearTimeout(t); }
}
export function getText(ctx: any, ev: HookEventType): string {
  if (ev === 'beforeRequestHook') {
    const j = ctx.request?.json; if (!j) return '';
    if (j.messages?.length) { const l = j.messages[j.messages.length - 1]; return Array.isArray(l.content) ? l.content.map((x: any) => x.text).join('\n') : String(l.content ?? ''); }
    return String(j.prompt ?? j.input ?? '');
  }
  const j = ctx.response?.json; if (!j) return '';
  if (j.choices?.length) { const c = j.choices[0]; return String(c.text ?? c.message?.content?.text ?? c.message?.content ?? ''); }
  return '';
}
