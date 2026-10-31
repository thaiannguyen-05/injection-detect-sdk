"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedMaterial = protectedMaterial;
// Ported from plugins/azure/protectedMaterial.ts — NEEDS API KEY. afterRequestHook only.
const http_1 = require("./http");
async function protectedMaterial(ctx, p, ev) {
    if (ev === 'beforeRequestHook')
        return { error: new Error('only afterRequestHook'), verdict: true, data: null };
    const creds = p.credentials?.contentSafety;
    if (!creds?.resourceName)
        return { error: new Error('resourceName required'), verdict: true, data: null };
    const text = (0, http_1.getText)(ctx, ev);
    if (!text)
        return { error: new Error('empty text'), verdict: true, data: null };
    const url = `https://${creds.resourceName}.cognitiveservices.azure.com/contentsafety/text:detectProtectedMaterial?api-version=${p.apiVersion ?? '2024-09-01'}`;
    try {
        const r = await (0, http_1.post)(url, { text }, { 'Ocp-Apim-Subscription-Key': creds.apiKey ?? '' }, p.timeout ?? 5000);
        return { error: null, verdict: !(r.protectedMaterialAnalysis?.detected === true), data: r };
    }
    catch (e) {
        return { error: e, verdict: true, data: null };
    }
}
