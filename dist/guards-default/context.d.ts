export type HookEventType = 'beforeRequestHook' | 'afterRequestHook';
export interface PluginContext {
    request: {
        json: any;
    };
    response: {
        json: any;
    };
    requestType?: string;
    [k: string]: any;
}
export declare function getText(ctx: PluginContext, ev: HookEventType): string;
