"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shieldPrompt = shieldPrompt;
// Ported from orca/gateway/plugins/azure/shieldPrompt.ts — NEEDS API KEY (resourceName+apiKey).
// beforeRequestHook only. Detects jailbreak + prompt injection.
const http_1 = require("./http");
async function shieldPrompt(ctx, p, ev) {
    if (ev === 'afterRequestHook')
        return { error: new Error('Shield Prompt only beforeRequestHook'), verdict: true, data: null };
    const creds = p.credentials?.contentSafety;
    if (!creds?.resourceName)
        return { error: new Error('resourceName required'), verdict: true, data: null };
    if (!creds.apiKey && !creds.azureAuthMode)
        return { error: new Error('apiKey or azureAuthMode required'), verdict: true, data: null };
    const msgs = ctx.request?.json?.messages ?? [];
    const systems = msgs.filter((m) => m.role === 'system');
    let userPrompt = '';
    let docs = [];
    if (systems.length) {
        userPrompt = systems.map((m) => (Array.isArray(m.content) ? m.content.map((x) => x.text).join('\n') : m.content)).join('\n');
        docs = [(0, http_1.getText)(ctx, ev)];
    }
    else
        userPrompt = (0, http_1.getText)(ctx, ev);
    const url = `https://${creds.resourceName}.cognitiveservices.azure.com/contentsafety/text:shieldPrompt?api-version=${p.apiVersion ?? '2024-09-01'}`;
    const headers = { 'Ocp-Apim-Subscription-Key': creds.apiKey ?? '' };
    try {
        const r = await (0, http_1.post)(url, { userPrompt, ...(systems.length ? { documents: docs } : {}) }, headers, p.timeout ?? 5000);
        const upHit = r.userPromptAnalysis?.attackDetected === true;
        const docHit = r.documentsAnalysis?.some((d) => d.attackDetected === true);
        return { error: null, verdict: !(upHit || docHit), data: r };
    }
    catch (e) {
        return { error: e, verdict: true, data: null };
    }
}
