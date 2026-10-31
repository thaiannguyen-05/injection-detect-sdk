// Ported from plugins/azure/protectedMaterial.ts — NEEDS API KEY. afterRequestHook only.
import { HookEventType, getText, post } from './http';
import type { AzureCreds } from './shieldPrompt';
export async function protectedMaterial(ctx: any, p: { credentials?: { contentSafety: AzureCreds }; apiVersion?: string; timeout?: number }, ev: HookEventType) {
  if (ev === 'beforeRequestHook') return { error: new Error('only afterRequestHook'), verdict: true, data: null };
  const creds = p.credentials?.contentSafety;
  if (!creds?.resourceName) return { error: new Error('resourceName required'), verdict: true, data: null };
  const text = getText(ctx, ev);
  if (!text) return { error: new Error('empty text'), verdict: true, data: null };
  const url = `https://${creds.resourceName}.cognitiveservices.azure.com/contentsafety/text:detectProtectedMaterial?api-version=${p.apiVersion ?? '2024-09-01'}`;
  try {
    const r: any = await post(url, { text }, { 'Ocp-Apim-Subscription-Key': creds.apiKey ?? '' }, p.timeout ?? 5000);
    return { error: null, verdict: !(r.protectedMaterialAnalysis?.detected === true), data: r };
  } catch (e: any) { return { error: e, verdict: true, data: null }; }
}
