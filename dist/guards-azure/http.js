"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = post;
exports.getText = getText;
async function post(url, data, headers = {}, timeout = 5000) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data), signal: c.signal });
        if (!r.ok)
            throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return (await r.json());
    }
    finally {
        clearTimeout(t);
    }
}
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
