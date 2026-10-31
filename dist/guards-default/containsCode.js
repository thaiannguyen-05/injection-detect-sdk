"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsCode = containsCode;
// Ported from plugins/default/containsCode.ts — PURE.
const context_1 = require("./context");
const langMap = { sql: 'SQL', py: 'Python', python: 'Python', ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', java: 'Java', go: 'Go', rs: 'Rust', sh: 'Shell', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown' };
async function containsCode(ctx, p, ev) {
    try {
        if (!p.format)
            throw new Error('Missing format');
        const text = (0, context_1.getText)(ctx, ev);
        const re = /```(\w+)\n[\s\S]*?\n```/g;
        const matches = [...text.matchAll(re)];
        if (!matches.length)
            return { error: null, verdict: !!p.not, data: { searchedFormat: p.format, foundFormats: [] } };
        const found = matches.map((m) => langMap[m[1].toLowerCase()] ?? m[1]);
        const has = found.some((l) => l === p.format);
        return { error: null, verdict: p.not ? !has : has, data: { searchedFormat: p.format, foundFormats: found } };
    }
    catch (e) {
        return { error: e, verdict: false, data: { explanation: e.message } };
    }
}
