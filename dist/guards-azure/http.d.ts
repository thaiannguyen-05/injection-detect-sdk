export type HookEventType = 'beforeRequestHook' | 'afterRequestHook';
export declare function post<T = any>(url: string, data: any, headers?: Record<string, string>, timeout?: number): Promise<T>;
export declare function getText(ctx: any, ev: HookEventType): string;
