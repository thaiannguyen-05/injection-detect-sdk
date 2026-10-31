"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentSafety = contentSafety;
// Ported from plugins/azure/contentSafety.ts — NEEDS API KEY. before+after.
const http_1 = require("./http");
async function contentSafety(ctx, p, ev) {
    const creds = p.credentials?.contentSafety;
    if (!creds?.resourceName)
        return { error: new Error('resourceName required'), verdict: true, data: null };
    const text = (0, http_1.getText)(ctx, ev);
    if (!text)
        return { error: new Error('empty text'), verdict: true, data: null };
    const base = creds.customHost ?? `https://${creds.resourceName}.cognitiveservices.azure.com`;
    const url = `${base}/contentsafety/text:analyze?api-version=${p.apiVersion ?? '2024-11-01'}`;
    try {
        const r = await (0, http_1.post)(url, { text, categories: p.categories ?? ['Hate', 'SelfHarm', 'Sexual', 'Violence'], blocklistNames: p.blocklistNames ?? [] }, { 'Ocp-Apim-Subscription-Key': creds.apiKey ?? '' }, p.timeout ?? 5000);
        const harmful = r.categoriesAnalysis?.some((c) => c.severity >= (p.severity ?? 2));
        const blockHit = (r.blocklistsMatch?.length ?? 0) > 0;
        return { error: null, verdict: !(harmful || blockHit), data: r };
    }
    catch (e) {
        return { error: e, verdict: true, data: null };
    }
}
