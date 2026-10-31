// Ported from orca/gateway/src/middlewares/hooks/index.ts (HookSpan + HooksManager)
// Dependency on `plugins` map injected via constructor — no hono.
import { Check, EventType, GuardrailCheckResult, HookObject, HookResult, HookSpanContext, HookType, PluginHandler } from './hooksTypes';

function extractRequestText(p: any): string {
  if (p?.prompt) return Array.isArray(p.prompt) ? p.prompt.join('\n') : p.prompt;
  if (p?.messages?.length) {
    const last = p.messages[p.messages.length - 1];
    if (Array.isArray(last.content)) return last.content.map((c: any) => c.text ?? '').join('\n');
    return last.content ?? '';
  }
  if (p?.input) return Array.isArray(p.input) ? p.input.join('\n') : p.input;
  return '';
}
function extractResponseText(r: any): string {
  if (r?.choices?.length) {
    const c = r.choices[0];
    if (c.text) return c.text;
    if (c?.message?.content) return typeof c.message.content === 'string' ? c.message.content : c.message.content.text ?? '';
  }
  return '';
}

export class HookSpan {
  context: HookSpanContext;
  beforeRequestHooks: HookObject[]; afterRequestHooks: HookObject[];
  results: { before: HookResult[]; after: HookResult[] } = { before: [], after: [] };
  readonly id = Math.random().toString(36).slice(2);
  constructor(params: any, provider: string, before: HookObject[], after: HookObject[], requestType: string, headers: Record<string, string> = {}) {
    const text = extractRequestText(params);
    this.context = {
      request: { json: params, text, isStreamingRequest: false, isTransformed: false, headers },
      response: { json: {}, text: '', statusCode: null, isTransformed: false },
      provider, requestType,
    };
    this.beforeRequestHooks = before.map((h) => ({ ...h, eventType: 'beforeRequestHook' as const }));
    this.afterRequestHooks = after.map((h) => ({ ...h, eventType: 'afterRequestHook' as const }));
  }
  setResponse(json: any, status: number) {
    this.context.response = { json, text: extractResponseText(json), statusCode: status, isTransformed: false };
  }
}

export class HooksManager {
  constructor(private registry: Record<string, Record<string, PluginHandler>> = {}) {}
  private async runCheck(ctx: HookSpanContext, check: Check, event: EventType): Promise<GuardrailCheckResult> {
    const t0 = Date.now();
    const [ns, fn] = check.id.split('.');
    try {
      const handler = this.registry[ns]?.[fn];
      if (!handler) throw new Error(`unknown check ${check.id}`);
      const r = await handler(ctx as any, check.parameters, event);
      return { verdict: r.verdict, data: r.data ?? null, id: check.id, error: r.error, execution_time: Date.now() - t0, created_at: new Date(), transformed: r.transformed, transformedData: r.transformedData, fail_on_error: (check.parameters as any)?.failOnError ?? false };
    } catch (e: any) {
      return { verdict: false, error: { message: e?.message ?? 'check error' }, data: null, id: check.id, execution_time: Date.now() - t0, created_at: new Date() };
    }
  }
  private async runHook(span: HookSpan, hook: HookObject): Promise<HookResult> {
    const t0 = Date.now();
    const event = hook.eventType;
    const checks = (hook.checks ?? []).filter((c) => c.is_enabled !== false);
    const results: GuardrailCheckResult[] = [];
    if (hook.sequential) {
      for (const c of checks) results.push(await this.runCheck(span.context, c, event));
    } else {
      const rs = await Promise.all(checks.map((c) => this.runCheck(span.context, c, event)));
      results.push(...rs);
    }
    const verdict = results.every((r) => r.verdict || (r.error && !r.fail_on_error));
    const deny = !!hook.deny && !verdict;
    const out: HookResult = { verdict, id: hook.id, checks: results, deny, async: !!hook.async, type: hook.type ?? HookType.GUARDRAIL, transformed: results.some((r) => r.transformed) };
    (event === 'beforeRequestHook' ? span.results.before : span.results.after).push(out);
    return out;
  }
  /** Returns {results, shouldDeny} — mirrors gateway executeHooks. */
  async executeHooks(span: HookSpan, events: EventType[]): Promise<{ results: HookResult[]; shouldDeny: boolean }> {
    const hooks = [
      ...(events.includes('beforeRequestHook' as EventType) ? span.beforeRequestHooks.filter((h) => !h.async) : []),
      ...(events.includes('afterRequestHook' as EventType) ? span.afterRequestHooks.filter((h) => !h.async) : []),
    ];
    if (!hooks.length) return { results: [], shouldDeny: false };
    const results = await Promise.all(hooks.map((h) => this.runHook(span, h)));
    const shouldDeny = results.some((r, i) => !r.verdict && hooks[i].deny && !r.skipped);
    return { results, shouldDeny };
  }
}

/** Ported from handlerUtils.convertHooksShorthand — input/output_guardrails -> hooks. */
export function convertHooksShorthand(hooksArr: any[], type: string, hookType: HookType): HookObject[] {
  return hooksArr.map((hook: any, idx: number) => {
    const o: any = { type: hookType, id: `${type}_guardrail_${idx}` };
    for (const k of ['deny', 'async', 'id', 'type', 'sequential']) if (k in hook) { o[k] = hook[k]; delete hook[k]; }
    o.checks = Object.keys(hook).map((key) => ({ id: key.includes('.') ? key : `default.${key}`, parameters: hook[key] }));
    return o as HookObject;
  });
}
