// Ported from orca/gateway/src/middlewares/hooks/types.ts — no changes except comments.
export interface Check { id: string; parameters: Record<string, any>; is_enabled?: boolean; }
export interface HookObject {
  type: HookType; id: string; checks?: Check[]; async?: boolean;
  sequential?: boolean; deny?: boolean;
  eventType: 'beforeRequestHook' | 'afterRequestHook';
}
export interface HookSpanContext {
  request: { text: string; json: any; isStreamingRequest: boolean; isTransformed: boolean; headers: Record<string, string> };
  response: { text: string; json: any; statusCode: number | null; isTransformed: boolean };
  provider: string; requestType: string; metadata?: Record<string, string>;
}
export interface GuardrailCheckResult {
  verdict: boolean; error?: any; data?: any; id: string;
  transformed?: boolean; execution_time: number; created_at: Date;
  transformedData?: { request: { json: any }; response: { json: any } };
  fail_on_error?: boolean;
}
export interface HookResult {
  verdict: boolean; id: string; checks: GuardrailCheckResult[];
  transformed?: boolean; deny: boolean; async: boolean; type: HookType; skipped?: boolean;
}
export type EventType = 'beforeRequestHook' | 'afterRequestHook';
export enum HookType { GUARDRAIL = 'guardrail', MUTATOR = 'mutator' }
export type PluginContext = Record<string, any> & { requestType?: string };
export type PluginHandler = (
  ctx: PluginContext, params: Record<string, any>, event: EventType
) => Promise<{ verdict: boolean; data?: any; error?: any; transformed?: boolean; transformedData?: any }>;
