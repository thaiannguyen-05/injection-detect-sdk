"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HooksManager = exports.HookSpan = void 0;
exports.convertHooksShorthand = convertHooksShorthand;
// Ported from orca/gateway/src/middlewares/hooks/index.ts (HookSpan + HooksManager)
// Dependency on `plugins` map injected via constructor — no hono.
const hooksTypes_1 = require("./hooksTypes");
function extractRequestText(p) {
    if (p?.prompt)
        return Array.isArray(p.prompt) ? p.prompt.join('\n') : p.prompt;
    if (p?.messages?.length) {
        const last = p.messages[p.messages.length - 1];
        if (Array.isArray(last.content))
            return last.content.map((c) => c.text ?? '').join('\n');
        return last.content ?? '';
    }
    if (p?.input)
        return Array.isArray(p.input) ? p.input.join('\n') : p.input;
    return '';
}
function extractResponseText(r) {
    if (r?.choices?.length) {
        const c = r.choices[0];
        if (c.text)
            return c.text;
        if (c?.message?.content)
            return typeof c.message.content === 'string' ? c.message.content : c.message.content.text ?? '';
    }
    return '';
}
class HookSpan {
    context;
    beforeRequestHooks;
    afterRequestHooks;
    results = { before: [], after: [] };
    id = Math.random().toString(36).slice(2);
    constructor(params, provider, before, after, requestType, headers = {}) {
        const text = extractRequestText(params);
        this.context = {
            request: { json: params, text, isStreamingRequest: false, isTransformed: false, headers },
            response: { json: {}, text: '', statusCode: null, isTransformed: false },
            provider, requestType,
        };
        this.beforeRequestHooks = before.map((h) => ({ ...h, eventType: 'beforeRequestHook' }));
        this.afterRequestHooks = after.map((h) => ({ ...h, eventType: 'afterRequestHook' }));
    }
    setResponse(json, status) {
        this.context.response = { json, text: extractResponseText(json), statusCode: status, isTransformed: false };
    }
}
exports.HookSpan = HookSpan;
class HooksManager {
    registry;
    constructor(registry = {}) {
        this.registry = registry;
    }
    async runCheck(ctx, check, event) {
        const t0 = Date.now();
        const [ns, fn] = check.id.split('.');
        try {
            const handler = this.registry[ns]?.[fn];
            if (!handler)
                throw new Error(`unknown check ${check.id}`);
            const r = await handler(ctx, check.parameters, event);
            return { verdict: r.verdict, data: r.data ?? null, id: check.id, error: r.error, execution_time: Date.now() - t0, created_at: new Date(), transformed: r.transformed, transformedData: r.transformedData, fail_on_error: check.parameters?.failOnError ?? false };
        }
        catch (e) {
            return { verdict: false, error: { message: e?.message ?? 'check error' }, data: null, id: check.id, execution_time: Date.now() - t0, created_at: new Date() };
        }
    }
    async runHook(span, hook) {
        const t0 = Date.now();
        const event = hook.eventType;
        const checks = (hook.checks ?? []).filter((c) => c.is_enabled !== false);
        const results = [];
        if (hook.sequential) {
            for (const c of checks)
                results.push(await this.runCheck(span.context, c, event));
        }
        else {
            const rs = await Promise.all(checks.map((c) => this.runCheck(span.context, c, event)));
            results.push(...rs);
        }
        const verdict = results.every((r) => r.verdict || (r.error && !r.fail_on_error));
        const deny = !!hook.deny && !verdict;
        const out = { verdict, id: hook.id, checks: results, deny, async: !!hook.async, type: hook.type ?? hooksTypes_1.HookType.GUARDRAIL, transformed: results.some((r) => r.transformed) };
        (event === 'beforeRequestHook' ? span.results.before : span.results.after).push(out);
        return out;
    }
    /** Returns {results, shouldDeny} — mirrors gateway executeHooks. */
    async executeHooks(span, events) {
        const hooks = [
            ...(events.includes('beforeRequestHook') ? span.beforeRequestHooks.filter((h) => !h.async) : []),
            ...(events.includes('afterRequestHook') ? span.afterRequestHooks.filter((h) => !h.async) : []),
        ];
        if (!hooks.length)
            return { results: [], shouldDeny: false };
        const results = await Promise.all(hooks.map((h) => this.runHook(span, h)));
        const shouldDeny = results.some((r, i) => !r.verdict && hooks[i].deny && !r.skipped);
        return { results, shouldDeny };
    }
}
exports.HooksManager = HooksManager;
/** Ported from handlerUtils.convertHooksShorthand — input/output_guardrails -> hooks. */
function convertHooksShorthand(hooksArr, type, hookType) {
    return hooksArr.map((hook, idx) => {
        const o = { type: hookType, id: `${type}_guardrail_${idx}` };
        for (const k of ['deny', 'async', 'id', 'type', 'sequential'])
            if (k in hook) {
                o[k] = hook[k];
                delete hook[k];
            }
        o.checks = Object.keys(hook).map((key) => ({ id: key.includes('.') ? key : `default.${key}`, parameters: hook[key] }));
        return o;
    });
}
