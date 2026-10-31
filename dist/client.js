"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectionSDK = void 0;
// InjectionSDK — single entry for TS/JS. Wraps core + 3 guard families.
const hooks_1 = require("./core/hooks");
const hooksTypes_1 = require("./core/hooksTypes");
const requestValidator_1 = require("./core/requestValidator");
const index_1 = require("./guards-default/index");
const index_2 = require("./guards-azure/index");
const index_3 = require("./guards-external/index");
class InjectionSDK {
    cfg;
    mgr;
    constructor(cfg = {}) {
        this.cfg = cfg;
        this.mgr = new hooks_1.HooksManager({
            default: { regexMatch: index_1.regexMatch, contains: index_1.contains, containsCode: index_1.containsCode },
            azure: { shieldPrompt: index_2.shieldPrompt, contentSafety: index_2.contentSafety, protectedMaterial: index_2.protectedMaterial },
            external: { thresholdGuard: index_3.thresholdGuard },
        });
    }
    /** Node 2 PURE */
    validateHost(host) {
        return (0, requestValidator_1.isValidCustomHost)(host, new Set(this.cfg.trustedHosts ?? ['localhost', '127.0.0.1', '::1', 'host.docker.internal']));
    }
    validateHeaders(h) { return (0, requestValidator_1.validateRequestHeaders)(h); }
    deny() { return this.cfg.denyOnInjection ?? true; }
    beforeHooks() {
        const arr = [];
        // inputRegex = blocklist: match -> injection -> verdict false. Hence not:true (invert).
        for (const rule of this.cfg.inputRegex ?? [])
            arr.push({ 'default.regexMatch': { rule, not: true }, deny: this.deny() });
        if (this.cfg.azure)
            arr.push({ 'azure.shieldPrompt': { credentials: { contentSafety: this.cfg.azure } }, deny: this.deny() });
        if (this.cfg.external)
            arr.push({ 'external.thresholdGuard': { scanners: this.cfg.external.inputScanners ?? ['prompt_injection', 'jailbreak'], thresholds: this.cfg.external.thresholds, endpoint: this.cfg.external.endpoint, credentials: { apiKey: this.cfg.external.apiKey }, timeout: this.cfg.external.timeout, scores: this.cfg.externalScores }, deny: this.deny() });
        return (0, hooks_1.convertHooksShorthand)(arr, 'input', hooksTypes_1.HookType.GUARDRAIL);
    }
    afterHooks() {
        const arr = [];
        if (this.cfg.outputBlockedWords?.length)
            arr.push({ 'default.contains': { words: this.cfg.outputBlockedWords, operator: 'none' }, deny: this.deny() });
        for (const f of this.cfg.outputBlockedCodeFormats ?? [])
            arr.push({ 'default.containsCode': { format: f, not: true }, deny: this.deny() });
        if (this.cfg.azure && (this.cfg.azureOutput ?? true)) {
            arr.push({ 'azure.contentSafety': { credentials: { contentSafety: this.cfg.azure } }, deny: this.deny() });
            arr.push({ 'azure.protectedMaterial': { credentials: { contentSafety: this.cfg.azure } }, deny: this.deny() });
        }
        if (this.cfg.external)
            arr.push({ 'external.thresholdGuard': { scanners: this.cfg.external.outputScanners ?? ['pii', 'secrets', 'toxic_language'], thresholds: this.cfg.external.thresholds, endpoint: this.cfg.external.endpoint, credentials: { apiKey: this.cfg.external.apiKey }, timeout: this.cfg.external.timeout, scores: this.cfg.externalScores }, deny: this.deny() });
        return (0, hooks_1.convertHooksShorthand)(arr, 'output', hooksTypes_1.HookType.GUARDRAIL);
    }
    /** Node 3: scan input (beforeRequestHook). params = {messages|prompt|input} */
    async scanInput(params, requestType = 'chatComplete', headers = {}) {
        const span = new hooks_1.HookSpan(params, this.cfg.provider ?? 'sdk', this.beforeHooks(), [], requestType, headers);
        const { results, shouldDeny } = await this.mgr.executeHooks(span, ['beforeRequestHook']);
        return { verdict: results.every((r) => r.verdict), shouldDeny, results, transformed: results.some((r) => r.transformed) };
    }
    /** Node 5: scan output (afterRequestHook). */
    async scanOutput(reqParams, resJson, requestType = 'chatComplete') {
        const span = new hooks_1.HookSpan(reqParams, this.cfg.provider ?? 'sdk', [], this.afterHooks(), requestType);
        span.setResponse(resJson, 200);
        const { results, shouldDeny } = await this.mgr.executeHooks(span, ['afterRequestHook']);
        return { verdict: results.every((r) => r.verdict), shouldDeny, results, transformed: results.some((r) => r.transformed) };
    }
    /** Full req+res cycle. */
    async scan(reqParams, resJson, requestType = 'chatComplete') {
        return { input: await this.scanInput(reqParams, requestType), output: await this.scanOutput(reqParams, resJson, requestType) };
    }
}
exports.InjectionSDK = InjectionSDK;
