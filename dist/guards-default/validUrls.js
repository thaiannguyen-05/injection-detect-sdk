"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validUrls = validUrls;
// Ported from plugins/default/validUrls.ts — PURE (fetch HEAD / DoH).
const context_1 = require("./context");
async function checkUrl(u) {
    try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 3000);
        const r = await fetch(u, { method: 'HEAD', signal: c.signal });
        clearTimeout(t);
        return r.ok;
    }
    catch {
        return false;
    }
}
async function validUrls(ctx, p, ev) {
    try {
        const text = (0, context_1.getText)(ctx, ev);
        const urls = text.match(/https?:\/\/[^\s,"'{}\[\]]+/g) ?? [];
        if (!urls.length)
            return { error: null, verdict: false, data: { urls: [] } };
        const results = await Promise.all(urls.map(async (u) => ({ url: u, isValid: await checkUrl(u) })));
        const allValid = results.every((r) => r.isValid);
        return { error: null, verdict: p.not ? !allValid : allValid, data: { results } };
    }
    catch (e) {
        return { error: e, verdict: false, data: { explanation: e.message } };
    }
}
