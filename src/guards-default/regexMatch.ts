// Ported from orca/gateway/plugins/default/regexMatch.ts — PURE, no key.
import { HookEventType, PluginContext, getText } from './context';
export async function regexMatch(ctx: PluginContext, p: { rule: string; not?: boolean }, ev: HookEventType) {
  try {
    if (!p.rule) throw new Error('Missing regex pattern');
    const text = getText(ctx, ev);
    if (!text) throw new Error('Missing text to match');
    const m = new RegExp(p.rule).exec(text);
    const matches = m !== null;
    const verdict = p.not ? !matches : matches;
    return { error: null, verdict, data: { regexPattern: p.rule, not: !!p.not, verdict, matchedText: m?.[0] ?? null, textExcerpt: text.slice(0, 100) } };
  } catch (e: any) { return { error: e, verdict: false, data: { explanation: e.message } }; }
}
