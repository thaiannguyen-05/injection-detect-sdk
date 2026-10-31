"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contains = contains;
// Ported from plugins/default/contains.ts — PURE, output leak check.
const context_1 = require("./context");
async function contains(ctx, p, ev) {
    try {
        const text = (0, context_1.getText)(ctx, ev);
        const found = p.words.filter((w) => text.includes(w));
        const missing = p.words.filter((w) => !text.includes(w));
        const verdict = p.operator === 'any' ? found.length > 0 : p.operator === 'all' ? missing.length === 0 : found.length === 0;
        return { error: null, verdict, data: { foundWords: found, missingWords: missing, operator: p.operator } };
    }
    catch (e) {
        return { error: e, verdict: false, data: { explanation: e.message } };
    }
}
