// InjectionSDK — single entry for TS/JS. Wraps core + 3 guard families.
import { HooksManager, HookSpan, convertHooksShorthand } from './core/hooks';
import { HookType } from './core/hooksTypes';
import { isValidCustomHost, validateRequestHeaders } from './core/requestValidator';
import { regexMatch, contains, containsCode } from './guards-default/index';
import { shieldPrompt, contentSafety, protectedMaterial } from './guards-azure/index';
import { thresholdGuard } from './guards-external/index';
import type { SDKConfig } from './config';

export type RequestType = 'chatComplete' | 'complete' | 'messages' | 'embed';
export interface ScanResult { verdict: boolean; shouldDeny: boolean; results: any[]; transformed: boolean }

export class InjectionSDK {
  private mgr: HooksManager;
  constructor(private cfg: SDKConfig = {}) {
    this.mgr = new HooksManager({
      default: { regexMatch: regexMatch as any, contains: contains as any, containsCode: containsCode as any },
      azure: { shieldPrompt: shieldPrompt as any, contentSafety: contentSafety as any, protectedMaterial: protectedMaterial as any },
      external: { thresholdGuard: thresholdGuard as any },
    });
  }

  /** Node 2 PURE */
  validateHost(host: string): boolean {
    return isValidCustomHost(host, new Set(this.cfg.trustedHosts ?? ['localhost', '127.0.0.1', '::1', 'host.docker.internal']));
  }
  validateHeaders(h: Record<string, string>) { return validateRequestHeaders(h); }

  private deny() { return this.cfg.denyOnInjection ?? true; }

  private beforeHooks() {
    const arr: any[] = [];
    // inputRegex = blocklist: match -> injection -> verdict false. Hence not:true (invert).
    for (const rule of this.cfg.inputRegex ?? [])
      arr.push({ 'default.regexMatch': { rule, not: true }, deny: this.deny() });
    if (this.cfg.azure)
      arr.push({ 'azure.shieldPrompt': { credentials: { contentSafety: this.cfg.azure } }, deny: this.deny() });
    if (this.cfg.external)
      arr.push({ 'external.thresholdGuard': { scanners: this.cfg.external.inputScanners ?? ['prompt_injection', 'jailbreak'], thresholds: this.cfg.external.thresholds, endpoint: this.cfg.external.endpoint, credentials: { apiKey: this.cfg.external.apiKey }, timeout: this.cfg.external.timeout, scores: this.cfg.externalScores }, deny: this.deny() });
    return convertHooksShorthand(arr, 'input', HookType.GUARDRAIL);
  }

  private afterHooks() {
    const arr: any[] = [];
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
    return convertHooksShorthand(arr, 'output', HookType.GUARDRAIL);
  }

  /** Node 3: scan input (beforeRequestHook). params = {messages|prompt|input} */
  async scanInput(params: any, requestType: RequestType = 'chatComplete', headers: Record<string, string> = {}): Promise<ScanResult> {
    const span = new HookSpan(params, this.cfg.provider ?? 'sdk', this.beforeHooks(), [], requestType, headers);
    const { results, shouldDeny } = await this.mgr.executeHooks(span, ['beforeRequestHook']);
    return { verdict: results.every((r) => r.verdict), shouldDeny, results, transformed: results.some((r) => r.transformed) };
  }

  /** Node 5: scan output (afterRequestHook). */
  async scanOutput(reqParams: any, resJson: any, requestType: RequestType = 'chatComplete'): Promise<ScanResult> {
    const span = new HookSpan(reqParams, this.cfg.provider ?? 'sdk', [], this.afterHooks(), requestType);
    span.setResponse(resJson, 200);
    const { results, shouldDeny } = await this.mgr.executeHooks(span, ['afterRequestHook']);
    return { verdict: results.every((r) => r.verdict), shouldDeny, results, transformed: results.some((r) => r.transformed) };
  }

  /** Full req+res cycle. */
  async scan(reqParams: any, resJson: any, requestType: RequestType = 'chatComplete'): Promise<{ input: ScanResult; output: ScanResult }> {
    return { input: await this.scanInput(reqParams, requestType), output: await this.scanOutput(reqParams, resJson, requestType) };
  }
}
