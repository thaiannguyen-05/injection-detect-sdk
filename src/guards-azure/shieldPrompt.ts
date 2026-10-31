// Ported from orca/gateway/plugins/azure/shieldPrompt.ts — NEEDS API KEY (resourceName+apiKey).
// beforeRequestHook only. Detects jailbreak + prompt injection.
import { HookEventType, getText, post } from './http';
export interface AzureCreds { resourceName: string; apiKey?: string; azureAuthMode?: string; }
export async function shieldPrompt(ctx: any, p: { credentials?: { contentSafety: AzureCreds }; apiVersion?: string; timeout?: number }, ev: HookEventType) {
  if (ev === 'afterRequestHook') return { error: new Error('Shield Prompt only beforeRequestHook'), verdict: true, data: null };
  const creds = p.credentials?.contentSafety;
  if (!creds?.resourceName) return { error: new Error('resourceName required'), verdict: true, data: null };
  if (!creds.apiKey && !creds.azureAuthMode) return { error: new Error('apiKey or azureAuthMode required'), verdict: true, data: null };
  const msgs = ctx.request?.json?.messages ?? [];
  const systems = msgs.filter((m: any) => m.role === 'system');
  let userPrompt = '';
  let docs: string[] = [];
  if (systems.length) {
    userPrompt = systems.map((m: any) => (Array.isArray(m.content) ? m.content.map((x: any) => x.text).join('\n') : m.content)).join('\n');
    docs = [getText(ctx, ev)];
  } else userPrompt = getText(ctx, ev);
  const url = `https://${creds.resourceName}.cognitiveservices.azure.com/contentsafety/text:shieldPrompt?api-version=${p.apiVersion ?? '2024-09-01'}`;
  const headers: Record<string, string> = { 'Ocp-Apim-Subscription-Key': creds.apiKey ?? '' };
  try {
    const r: any = await post(url, { userPrompt, ...(systems.length ? { documents: docs } : {}) }, headers, p.timeout ?? 5000);
    const upHit = r.userPromptAnalysis?.attackDetected === true;
    const docHit = r.documentsAnalysis?.some((d: any) => d.attackDetected === true);
    return { error: null, verdict: !(upHit || docHit), data: r };
  } catch (e: any) { return { error: e, verdict: true, data: null }; }
}
