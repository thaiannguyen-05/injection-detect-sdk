import { EventType, HookObject, HookResult, HookSpanContext, HookType, PluginHandler } from './hooksTypes';
export declare class HookSpan {
    context: HookSpanContext;
    beforeRequestHooks: HookObject[];
    afterRequestHooks: HookObject[];
    results: {
        before: HookResult[];
        after: HookResult[];
    };
    readonly id: string;
    constructor(params: any, provider: string, before: HookObject[], after: HookObject[], requestType: string, headers?: Record<string, string>);
    setResponse(json: any, status: number): void;
}
export declare class HooksManager {
    private registry;
    constructor(registry?: Record<string, Record<string, PluginHandler>>);
    private runCheck;
    private runHook;
    /** Returns {results, shouldDeny} — mirrors gateway executeHooks. */
    executeHooks(span: HookSpan, events: EventType[]): Promise<{
        results: HookResult[];
        shouldDeny: boolean;
    }>;
}
/** Ported from handlerUtils.convertHooksShorthand — input/output_guardrails -> hooks. */
export declare function convertHooksShorthand(hooksArr: any[], type: string, hookType: HookType): HookObject[];
