"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regexMatch = regexMatch;
// Ported from orca/gateway/plugins/default/regexMatch.ts — PURE, no key.
const context_1 = require("./context");
async function regexMatch(ctx, p, ev) {
    try {
        if (!p.rule)
            throw new Error('Missing regex pattern');
        const text = (0, context_1.getText)(ctx, ev);
        if (!text)
            throw new Error('Missing text to match');
        const m = new RegExp(p.rule).exec(text);
        const matches = m !== null;
        const verdict = p.not ? !matches : matches;
        return { error: null, verdict, data: { regexPattern: p.rule, not: !!p.not, verdict, matchedText: m?.[0] ?? null, textExcerpt: text.slice(0, 100) } };
    }
    catch (e) {
        return { error: e, verdict: false, data: { explanation: e.message } };
    }
}
