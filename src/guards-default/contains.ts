// Ported from plugins/default/contains.ts — PURE, output leak check.
import { HookEventType, PluginContext, getText } from './context';
export async function contains(ctx: PluginContext, p: { words: string[]; operator: 'any' | 'all' | 'none' }, ev: HookEventType) {
  try {
    const text = getText(ctx, ev);
    const found = p.words.filter((w) => text.includes(w));
    const missing = p.words.filter((w) => !text.includes(w));
    const verdict = p.operator === 'any' ? found.length > 0 : p.operator === 'all' ? missing.length === 0 : found.length === 0;
    return { error: null, verdict, data: { foundWords: found, missingWords: missing, operator: p.operator } };
  } catch (e: any) { return { error: e, verdict: false, data: { explanation: e.message } }; }
}
